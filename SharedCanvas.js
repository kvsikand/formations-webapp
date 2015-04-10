var SharedCanvas = function(context, width, height, canvas) {
  this.canvas = canvas;
	this.ctx = context;
  this.ctx.font = "18px Arial";
  this.ctx.strokeStyle = 'black';
  this.width = width;
  this.height = height;
  this.valid = false; // when set to false, the canvas will redraw everything
  this.shapes = [];  // the collection of shapes to be drawn
  this.selectionRect = undefined;
  this.dragging = false; // Keep track of when we are dragging
  this.selection = [];
  this.dragoffx = 0; // See mousedown and mousemove events for explanation
  this.dragoffy = 0;
  this.axes = {"x" : new Axis("x", this.width),
               "y" : new Axis("y", this.height)};
  
  var self = this;

  this.interval = 30; //redraw every 30 ms

  canvas.addEventListener('selectstart', function(e) { e.preventDefault(); return false; }, false);

  setInterval(function() { self.draw({}); }, self.interval);


  //has no state
  this.draw = function(args) {
      if(!this.valid) {
  	    this.clear();
        var textOffset = 20;
        if(args != undefined && args.count != undefined) {
          this.ctx.fillStyle="#333333";
          this.ctx.fillText("Count: " + args.count, this.width/2 - this.ctx.measureText("Count: " + args.count).width/2, textOffset);
          textOffset += 20;
        }
        if(args != undefined && args.name != undefined) {
          this.ctx.fillStyle="#333333";
          this.ctx.fillText(args.name, this.width/2 - this.ctx.measureText(args.name).width/2, textOffset);
        }

  	    var shapes = this.shapes;
  	    // draw all shapes
  	    var l = shapes.length;
  	    for (var i = 0; i < l; i++) {
  	      var shape = shapes[i];
  	      // We can skip the drawing of elements that have moved off the screen:
  	      if (shape.x > this.width || shape.y > this.height ||
  	          shape.x + shape.w < 0 || shape.y + shape.h < 0) continue;

  	      shapes[i].draw(this.ctx, this.selection.indexOf(shape) != -1);
        }
        var axes = this.axes;
        //draw grid
        var positions = axes["x"].getPositions();
        axes["x"].draw(this.ctx);
        this.ctx.strokeStyle = '#202020';
        this.ctx.setLineDash([2, 4]);
        for(var i = 0; i < positions.length; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(positions[i], 0);
            this.ctx.lineTo(positions[i], this.height);
            this.ctx.stroke();
            this.ctx.closePath();
        }

        positions = axes["y"].getPositions();
        axes["y"].draw(this.ctx);
        for(var i = 0; i < positions.length; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, positions[i]);
            this.ctx.lineTo(this.width, positions[i]);
            this.ctx.stroke();
            this.ctx.closePath();
        }
        this.ctx.setLineDash([1, 0]);

        if(this.selectionRect) {
          this.ctx.fillStyle="rgba(0, 50, 180, 0.3)";
          this.ctx.strokeStyle="rgba(0, 50, 255, 0.9)";
          this.ctx.fillRect(Math.min(this.selectionRect.x, this.selectionRect.x2), Math.min(this.selectionRect.y,this.selectionRect.y2), Math.abs(this.selectionRect.x-this.selectionRect.x2),Math.abs(this.selectionRect.y-this.selectionRect.y2));
          this.ctx.fillRect(Math.min(this.selectionRect.x, this.selectionRect.x2), Math.min(this.selectionRect.y,this.selectionRect.y2), Math.abs(this.selectionRect.x-this.selectionRect.x2),Math.abs(this.selectionRect.y-this.selectionRect.y2));
        }
        this.valid = true;
      }
  }	 

  this.clear = function() {
   	this.ctx.clearRect(0, 0, this.width, this.height);   
  }

  this.addShape = function(shape) {
    this.shapes.push(shape);
    this.valid = false;
  };

  this.shapeWithID = function(pid) {
    for(var i = 0; i < this.shapes.length; i++) {
      var shape = this.shapes[i];
      if(shape.posID == pid)
        return shape;
    }
  }

  this.updateShapesWithCount = function(index, formationList, count) {
    var formation = formationList[index];
    var prev = formationList[index-1];
    var next = formationList[index+1];
    //just linear interpolation for now.
    for(var i = 0; i < prev.positions.length; i++) {
      var pos1 = prev.positions[i];
      var shape = this.shapeWithID(pos1.posID);
      var id2 = positionIndexForID(next, pos1.posID);
      if(id2 != -1) {
        var pos2 = next.positions[id2];
        shape.x = pos1.x + ((pos2.x - pos1.x) / formation.counts * count);
        shape.y = pos1.y + ((pos2.y - pos1.y) / formation.counts * count);
      }
    }
  }

  this.unmarkAllShapes = function () {
    for (var i =0; i < this.shapes.length; i++) {
      this.shapes[i].marked = false;
    }
  }

  this.markOrAddShapeWithPosition = function(pos, posInfo) {
    var has = -1;
    for (var i =0; i < this.shapes.length; i++) {
      if(this.shapes[i].posID == pos.posID)
      {
        has = i;
        this.shapes[i].marked = true;
      }
    }

    if(has == -1) {
      this.addShape(new Position(pos.x, pos.y, pos.posID, posInfo.color, posInfo.label));
    } else {
      this.shapes[has].x = pos.x;
      this.shapes[has].y = pos.y;
      this.shapes[has].label = posInfo.label;
      this.shapes[has].color = posInfo.color;
    }
  }

  this.removeUnmarkedShapes = function () {
    var unmarked = [];
    for (var i = this.shapes.length-1; i >= 0; i--) {
      if(!this.shapes[i].marked && !this.shapes[i].isStatic) {
       this.shapes.splice(i,1);
      }
    }
  }

  this.addSelectionRect = function(mx, my) {
    this.selectionRect = {"x" : mx, "y" : my, "x2" : mx, "y2": my};
  }

  this.updateSelectionRect = function(mx, my) {
    this.selectionRect.x2 = mx;
    this.selectionRect.y2 = my;
    this.valid = false;
  }

  this.selectFromRect = function () {
    if(this.selectionRect) {
      var minX = Math.min(this.selectionRect.x,this.selectionRect.x2);
      var minY = Math.min(this.selectionRect.y,this.selectionRect.y2);
      var maxX = Math.max(this.selectionRect.x,this.selectionRect.x2)
      var maxY = Math.max(this.selectionRect.y,this.selectionRect.y2)
      for(var i = 0; i < this.shapes.length; i++) {
        var shape = this.shapes[i];
        if(minX < shape.x && shape.x < maxX && minY < shape.y && shape.y < maxY) {
          this.selection.push(shape);
        }
      }
    }
    this.selectionRect = undefined;
    this.valid = false;
  }

  var stylePaddingLeft, stylePaddingTop, styleBorderLeft, styleBorderTop;

  //deal with padding/border issues from cc
  if (document.defaultView && document.defaultView.getComputedStyle) {
    this.stylePaddingLeft = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingLeft'], 10)      || 0;
    this.stylePaddingTop  = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingTop'], 10)       || 0;
    this.styleBorderLeft  = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderLeftWidth'], 10)  || 0;
    this.styleBorderTop   = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderTopWidth'], 10)   || 0;
  }

  //fix for pages with static top or left bar
  var html = document.body.parentNode;
  this.htmlTop = html.offsetTop;
  this.htmlLeft = html.offsetLeft;
  
  // Creates an object with x and y defined, set to the mouse position relative to the state's canvas
  // If you wanna be super-correct this can be tricky, we have to worry about padding and borders
  this.getMouse = function(e) {
    var element = this.canvas, offsetX = 0, offsetY = 0, mx, my;

    // Compute the total offset
    if (element.offsetParent !== undefined) {
      do {
        offsetX += element.offsetLeft;
        offsetY += element.offsetTop;
      } while ((element = element.offsetParent));
    }

    // Add padding and border style widths to offset
    // Also add the <html> offsets in case there's a position:fixed bar
    offsetX += this.stylePaddingLeft + this.styleBorderLeft + this.htmlLeft;
    offsetY += this.stylePaddingTop + this.styleBorderTop + this.htmlTop;

    mx = e.pageX - offsetX;
    my = e.pageY - offsetY;
    
    // We return a simple javascript object (a hash) with x and y defined
    return {x: mx, y: my};
  }
};

if(typeof module !== 'undefined')
  module.exports.SharedCanvas = SharedCanvas;
var CanvasState = function(canvas, sharedCanvas) {
  // **** First some setup! ****
  this.canvas = canvas;
  this.width = canvas.width;
  this.height = canvas.height;
  this.axes = {"x" : new Axis("x", this.width),
               "y" : new Axis("y", this.height)};
  
  this.sharedCanvas = sharedCanvas;

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
  
  this.valid = false; // when set to false, the canvas will redraw everything
  this.shapes = [];  // the collection of shapes to be drawn

  this.dragging = false; // Keep track of when we are dragging

  this.selection = [];
  this.dragoffx = 0; // See mousedown and mousemove events for explanation
  this.dragoffy = 0;
  

  var myState = this;
  
  canvas.addEventListener('selectstart', function(e) { e.preventDefault(); return false; }, false);
     
  this.interval = 30; //redraw every 30 ms

  setInterval(function() { myState.draw(); }, myState.interval);

  this.addShape = function(shape) {
  	this.shapes.push(shape);
  	this.valid = false;
  };

  this.unmarkAllShapes = function () {
   	for (var i =0; i < this.shapes.length; i++) {
   		this.shapes[i].marked = false;
	  }
  }

  this.shapeWithID = function(pid) {
    for(var i = 0; i < this.shapes.length; i++) {
      var shape = this.shapes[i];
      if(shape.posID == pid)
        return shape;
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

  this.draw = function (args) {
      if (!this.valid) {
        if(!args) {
          args = {}
        }
        args.selection = this.selection
        this.sharedCanvas.draw(this.shapes, this.axes, args);
        this.valid = true;
      }
  }

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
}
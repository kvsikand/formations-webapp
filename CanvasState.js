var CanvasState = function(canvas) {
  // **** First some setup! ****
  this.canvas = canvas;
  this.width = canvas.width;
  this.height = canvas.height;
  this.ctx = canvas.getContext('2d');
  // This complicates things a little but but fixes mouse co-ordinate problems
  // when there's a border or padding. See getMouse for more detail
  var stylePaddingLeft, stylePaddingTop, styleBorderLeft, styleBorderTop;
  if (document.defaultView && document.defaultView.getComputedStyle) {
    this.stylePaddingLeft = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingLeft'], 10)      || 0;
    this.stylePaddingTop  = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingTop'], 10)       || 0;
    this.styleBorderLeft  = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderLeftWidth'], 10)  || 0;
    this.styleBorderTop   = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderTopWidth'], 10)   || 0;
  }
  // Some pages have fixed-position bars (like the stumbleupon bar) at the top or left of the page
  // They will mess up mouse coordinates and this fixes that
  var html = document.body.parentNode;
  this.htmlTop = html.offsetTop;
  this.htmlLeft = html.offsetLeft;

  // **** Keep track of state! ****
  
  this.valid = false; // when set to false, the canvas will redraw everything
  this.shapes = [];  // the collection of things to be drawn

  this.dragging = false; // Keep track of when we are dragging
  // the current selected object. In the future we could turn this into an array for multiple selection
  this.selection = null;
  this.dragoffx = 0; // See mousedown and mousemove events for explanation
  this.dragoffy = 0;
  
  // **** Then events! ****
  
  // This is an example of a closure!
  // Right here "this" means the CanvasState. But we are making events on the Canvas itself,
  // and when the events are fired on the canvas the variable "this" is going to mean the canvas!
  // Since we still want to use this particular CanvasState in the events we have to save a reference to it.
  // This is our reference!
  var myState = this;
  
  //fixes a problem where double clicking causes text to get selected on the canvas
  canvas.addEventListener('selectstart', function(e) { e.preventDefault(); return false; }, false);
  
  // **** Options! ****
  
  this.selectionColor = '#CC0000';
  this.selectionWidth = 2;  
  this.interval = 30;
  setInterval(function() { myState.draw(); }, myState.interval);

  this.addShape = function(shape) {
  	this.shapes.push(shape);
  	this.valid = false;
  };

  this.clear = function() {
	this.ctx.clearRect(0, 0, this.width, this.height);
  }

  this.unmarkAllShapes = function () {
   	for (var i =0; i < this.shapes.length; i++) {
   		this.shapes[i].marked = false;
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

  this.draw = function() {
	  // if our state is invalid, redraw and validate!
	  if (!this.valid) {
	    var ctx = this.ctx;
	    var shapes = this.shapes;
	    this.clear();
	    
	    // ** Add stuff you want drawn in the background all the time here **
	    
	    // draw all shapes
	    var l = shapes.length;
	    for (var i = 0; i < l; i++) {
	      var shape = shapes[i];
	      // We can skip the drawing of elements that have moved off the screen:
	      if (shape.x > this.width || shape.y > this.height ||
	          shape.x + shape.w < 0 || shape.y + shape.h < 0) continue;
	      shapes[i].draw(ctx);
	    }
	    
	    // draw selection
	    // right now this is just a stroke along the edge of the selected Shape
	    if (this.selection != null) {
	      ctx.strokeStyle = this.selectionColor;
	      ctx.lineWidth = this.selectionWidth;
	      var mySel = this.selection;
	      ctx.strokeRect(mySel.x,mySel.y,mySel.w,mySel.h);
	    }
	    
	    // ** Add stuff you want drawn on top all the time here **
	    
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
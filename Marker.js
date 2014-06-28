var Marker = function (loc) {
	var SIDE_LENGTH = 10;
  var MARKER_TYPE = 1;
	this.x = loc.x || 0;
  this.y = loc.y || 0;
  this.type = MARKER_TYPE;
  this.isStatic = true;

	// Draws this shape to a given context
	this.draw = function(ctx) {
		ctx.fillStyle = '#202020';
		ctx.strokeStyle = '#202020';
  	ctx.fillRect(this.x - SIDE_LENGTH/2, this.y - SIDE_LENGTH/2, SIDE_LENGTH, SIDE_LENGTH);
  	ctx.setLineDash([2, 4]);
  	ctx.beginPath();
  	ctx.moveTo(this.x, this.y);
  	ctx.lineTo(0, this.y);
  	ctx.moveTo(this.x, this.y);
  	ctx.lineTo(this.x, 0);
  	ctx.moveTo(this.x, this.y);
  	ctx.lineTo(ctx.canvas.width, this.y);
  	ctx.moveTo(this.x, this.y);
  	ctx.lineTo(this.x, ctx.canvas.height);
    ctx.stroke();
  	ctx.closePath();
    ctx.setLineDash([1, 0]);
  };


    this.contains = function(mx, my) {
	  // All we have to do is make sure the Mouse X,Y fall in the area between
	  // the shape's X and (X + Height) and its Y and (Y + Height)
	  return  (this.x - SIDE_LENGTH/2 <= mx) && (this.x + SIDE_LENGTH/2 >= mx) &&
	          (this.y - SIDE_LENGTH/2 <= my) && (this.y + SIDE_LENGTH/2 >= my);
	}
};
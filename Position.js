var Position = function (x, y, pid, col, lbl) {
	var RADIUS = 20;
    var POSITION_TYPE = 0;
	this.x = x || 0;
  	this.y = y || 0;
  	this.posID = pid || 0;
  	this.color = col || '#E55';
  	this.label = lbl || ''+this.posID;
  	this.marked = true;
  	this.type = POSITION_TYPE;
	// Draws this shape to a given context
	this.draw = function(ctx) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, RADIUS, 0, 2 * Math.PI, false);
      ctx.fillStyle = this.color;
      ctx.fill(); 
      ctx.font = "18px Arial";
      ctx.strokeStyle = 'black';
	  ctx.strokeText(this.label, this.x-ctx.measureText(this.label).width/2, this.y+7);
    };


    this.contains = function(mx, my) {
	  // All we have to do is make sure the Mouse X,Y fall in the area between
	  // the shape's X and (X + Height) and its Y and (Y + Height)
	  return  (this.x - RADIUS/2 <= mx) && (this.x + RADIUS/2 >= mx) &&
	          (this.y - RADIUS/2 <= my) && (this.y + RADIUS/2 >= my);
	}
};

var PositionsFromPositions = function(arr) {
	var newArr = [];
	for(var i = 0; i < arr.length; i++) {
		newArr.push(new Position(arr[i].x, arr[i].y, arr[i].posID, arr[i].color));
	}
	return newArr;
}
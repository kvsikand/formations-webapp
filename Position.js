var POSITION_RADIUS = 20;
var POSITION_TYPE = 0;
var Position = function (x, y, pid, col, lbl) {
  this.x = x || 0;
	this.y = y || 0;
	this.posID = pid || 0;
	this.color = col || '#E55';
	this.label = lbl || ''+this.posID;
	this.marked = true;
	this.type = POSITION_TYPE;
  // Draws this shape to a given context
  this.draw = function(ctx, selected) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, POSITION_RADIUS, 0, 2 * Math.PI, false);
    ctx.fillStyle = this.color;
    if(selected) {
      ctx.shadowBlur = 10;
      ctx.shadowColor = "yellow";
    } else {
      ctx.shadowBlur = 0;
    }
    ctx.fill(); 
    ctx.font = "18px Arial";
    ctx.strokeStyle = 'black';
    ctx.strokeText(this.label, this.x-ctx.measureText(this.label).width/2, this.y+7);
    ctx.shadowBlur = 0;

  };


  this.contains = function(mx, my) {
    return  Math.sqrt(Math.pow(this.x-mx,2) + Math.pow(this.y-my,2)) <= POSITION_RADIUS;
	}
};

var PositionsFromPositions = function(arr) {
	var newArr = [];
	for(var i = 0; i < arr.length; i++) {
		newArr.push(new Position(arr[i].x, arr[i].y, arr[i].posID, arr[i].color));
	}
	return newArr;
}


if(typeof module !== 'undefined')
  module.exports.Position = Position;
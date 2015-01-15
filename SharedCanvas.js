var SharedCanvas = function(context, width, height) {
	this.ctx = context;
  this.width = width;
  this.height = height;
  //has no state
  this.draw = function(shapes, count) {
	    this.clear();
      if(count != undefined) {
        this.ctx.fillStyle="#333333";
        this.ctx.fillText("Count: " + count, this.width/2, 20);
      }
	    	    
	    // draw all shapes
	    var l = shapes.length;
	    for (var i = 0; i < l; i++) {
	      var shape = shapes[i];
	      // We can skip the drawing of elements that have moved off the screen:
	      if (shape.x > this.width || shape.y > this.height ||
	          shape.x + shape.w < 0 || shape.y + shape.h < 0) continue;
	      shapes[i].draw(this.ctx);
	    }
  }	 

  this.clear = function() {
   	this.ctx.clearRect(0, 0, this.width, this.height);   
  }


  this.shapeWithID = function(shapes, pid) {
    for(var i = 0; i < shapes.length; i++) {
      var shape = shapes[i];
      if(shape.posID == pid)
        return shape;
    }
  }

  this.updateShapesWithCount = function(index, formationList, count, shapes) {
    var formation = formationList[index];
    var prev = formationList[index-1];
    var next = formationList[index+1];
    //just linear interpolation for now.
    for(var i = 0; i < prev.positions.length; i++) {
      var pos1 = prev.positions[i];
      var shape = this.shapeWithID(shapes, pos1.posID);
      var id2 = positionIndexForID(next, pos1.posID);
      if(id2 != -1) {
        var pos2 = next.positions[id2];
        shape.x = pos1.x + ((pos2.x - pos1.x) / formation.counts * count);
        shape.y = pos1.y + ((pos2.y - pos1.y) / formation.counts * count);
      }
    }
    return shapes;
  }
};

function positionIndexForID(formation, posID) {
	for(var i = 0; i < formation.positions.length; i++) {
		if(formation.positions[i].posID == posID)
			return i;
	}
	return -1;
}

// if(module)
//   module.exports.SharedCanvas = SharedCanvas;
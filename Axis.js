var POSITION_NUMS = [0, 1, 3, 5, 7];

var Axis = function(direction, length) {
	this.numIndex = 0;
	this.length = length;
	this.direction = direction;
	this.positions = [];

	this.draw = function(ctx) {
		ctx.fillStyle="#111111";
		if(this.direction == "x") {
			ctx.fillRect(this.length/2 - 20, 0, 40, 15);
		} else if(this.direction == "y") {
			ctx.fillRect(0, this.length/2 - 20, 15, 40);
		}
	}

	this.contains = function(mx, my) {
		if(this.direction == "x") {
			return my < 15 && Math.abs(mx - this.length/2) < 20;
		} else if(this.direction == "y") {
			return mx < 15 && Math.abs(my - this.length/2) < 20;
		}
	}

	this.cycleNumPositions = function() {
		this.setNumPositions((this.numIndex + 1) % POSITION_NUMS.length);
	}

	this.setNumPositions = function(numIndex) {
		this.numIndex = numIndex;
		var num = POSITION_NUMS[numIndex];
		var increment = this.length / (num+1);
		this.positions = [];
		for(var i = 0; i < num; i++) {
			this.positions[i] = increment * (i+1);
		}
	}

	this.getPositions = function() {
		return this.positions;
	}
}
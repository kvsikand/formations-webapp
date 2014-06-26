app.service('CanvasService', function (FormationService) { 
	var instance = this;
	this.canvasState = null;

	this.updateCanvas = function (index) {
    var formation = FormationService.formationList[index];
    instance.canvasState.unmarkAllShapes();
    if(formation.type == 'formation') {
      for(var i = 0; i < formation.positions.length; i++) {
        var pos = formation.positions[i];
        var posInfo = FormationService.positionInfo[pos.posID];
        instance.canvasState.markOrAddShapeWithPosition(pos, posInfo);
      }
    } else { //its a transition, interpolate positions
      var prev = FormationService.formationList[index-1];
      for(var i = 0; i < prev.positions.length; i++) {
        var pos = prev.positions[i];
        var posInfo = FormationService.positionInfo[pos.posID];
        instance.canvasState.markOrAddShapeWithPosition(pos, posInfo);
      }
    }
    instance.canvasState.removeUnmarkedShapes();
    instance.canvasState.valid = false;
    instance.canvasState.draw();
	};

  this.renderCanvas = function (formation, count) {
    var index = FormationService.selectedIndex;
    var prev = FormationService.formationList[index-1];
    var next = FormationService.formationList[index+1];

    //just linear interpolation for now.
    for(var i = 0; i < prev.positions.length; i++) {
      var pos1 = prev.positions[i];
      var shape = instance.canvasState.shapes[i];
      var id2 = FormationService.positionIndexForID(next,pos1.posID);
      if(id2 != -1) {
        var pos2 = next.positions[id2];
        shape.x = pos1.x + ((pos2.x - pos1.x) / formation.counts * count);
        shape.y = pos1.y + ((pos2.y - pos1.y) / formation.counts * count);
      }
    }
    instance.canvasState.valid = false;
    instance.canvasState.draw();
  }
});


app.controller('ContentController',function($scope, $rootScope, $interval, CanvasService, FormationService) {
	$scope.formationStartTime = null;
  $scope.playing = false;
  $scope.count = 0;
	$scope.initContent = function() {
	  CanvasService.canvasState = new CanvasState(document.getElementById('canvas'));
	};


	$scope.addPosition = function(pos) {
    var posInfo = FormationService.positionInfo[pos.posID];
		CanvasService.canvasState.addShape(new Position(pos.x, pos.y, pos.posID, posInfo.color, posInfo.label));
		FormationService.getSelectedFormation().positions.push(pos);
	};

	$scope.mouseDown = function(event) {
	    var mouse = CanvasService.canvasState.getMouse(event);
	    var mx = mouse.x;
	    var my = mouse.y;
	    var shapes = CanvasService.canvasState.shapes;
	    var l = shapes.length;
	    for (var i = l-1; i >= 0; i--) {
	      if (shapes[i].contains(mx, my)) {
	        var mySel = shapes[i];
	        // Keep track of where in the object we clicked
	        // so we can move it smoothly (see mousemove)
	        CanvasService.canvasState.dragoffx = mx - mySel.x;
	        CanvasService.canvasState.dragoffy = my - mySel.y;
	        CanvasService.canvasState.dragging = true;
	        CanvasService.canvasState.selection = mySel;
	        CanvasService.canvasState.valid = false;
	        return;
	      }
	    }
	    // havent returned means we have failed to select anything.
	    // If there was an object selected, we deselect it
	    if (CanvasService.canvasState.selection) {
	      CanvasService.canvasState.selection = null;
	      CanvasService.canvasState.valid = false; // Need to clear the old selection border
	    }
  	};

  $scope.mouseMove = function(e) {
    if (CanvasService.canvasState.dragging){
      var mouse = CanvasService.canvasState.getMouse(e);
      // We don't want to drag the object by its top-left corner, we want to drag it
      // from where we clicked. Thats why we saved the offset and use it here
      CanvasService.canvasState.selection.x = mouse.x - CanvasService.canvasState.dragoffx;
      CanvasService.canvasState.selection.y = mouse.y - CanvasService.canvasState.dragoffy;   
      CanvasService.canvasState.valid = false; // Something's dragging so we must redraw
    }
  };


  $scope.mouseUp = function(e) {
    CanvasService.canvasState.dragging = false;
    var index = CanvasService.canvasState.shapes.indexOf(CanvasService.canvasState.selection);
    if(CanvasService.canvasState.selection) {
    	FormationService.getSelectedFormation().positions[index].x = CanvasService.canvasState.selection.x;
      FormationService.getSelectedFormation().positions[index].y = CanvasService.canvasState.selection.y;
    }
  };

  // double click for making new shapes
  $scope.doubleClick = function(e) {
    var mouse = CanvasService.canvasState.getMouse(e);
    $scope.addPosition(FormationService.createPosition(mouse));
  };

  $scope.pressPlay = function () {
    $scope.playing = true;
    $scope.formationStartTime = new Date();
    $scope.playingTimer = $interval($scope.updateCanvasFrame,30);
  };

  $scope.pressPause = function () {
    $scope.playing = false;
    $interval.cancel($scope.playingTimer);
  };

  $scope.getValue = function(index) {
  	if(FormationService.selectedIndex > index) {
  		return 100;
  	} else if(FormationService.selectedIndex == index) {
  		return ($scope.count / FormationService.getSelectedFormation().counts)*100;
  	}
  	return 0;
  };

  $scope.getStyle = function(index) {
  	var sum = 0;
  	for(var i = 0; i < FormationService.formationList.length; i ++) {
  		sum += FormationService.formationList[i].counts;
  	}
  	return { width : Math.floor((FormationService.formationList[index].counts / sum) * 100)-1 + '%',
  			 display : 'inline-block' };
  };

  $scope.updateCanvasFrame = function () {
    $scope.count = (new Date() - $scope.formationStartTime)/1000;
    var changed = 0;
    if($scope.count > FormationService.getSelectedFormation().counts) {
      if(FormationService.selectedIndex < FormationService.formationList.length-1)
      {
        $rootScope.selectFormation(FormationService.selectedIndex+1);
        $scope.formationStartTime = new Date();
        $scope.count = 0;
      } else {
        $scope.count = 0;
        $scope.pressPause();
      }
      CanvasService.updateCanvas(FormationService.selectedIndex);
    }

    if(FormationService.getSelectedFormation().type=='transition') {
      CanvasService.renderCanvas(FormationService.getSelectedFormation(),  $scope.count);
    }
  };
});

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

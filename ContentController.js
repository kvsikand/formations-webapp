app.service('CanvasService', function (FormationService) { 
	var instance = this;
  this.markerList = [];
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

  this.addMarker = function(loc) {
    instance.markerList.push(loc);
    instance.canvasState.addShape(new Marker(loc));
  };

  this.addPositionWithInfo = function(posInfo, mouseEvent) {
    var mouse = mouseEvent == null ? { x : 0, y : 0} : instance.canvasState.getMouse(mouseEvent);
    if(FormationService.positionIndexForID(FormationService.getSelectedFormation(),posInfo.posID) == -1) {
      instance.canvasState.addShape(new Position(mouse.x, mouse.y, posInfo.posID, posInfo.color, posInfo.label));
      FormationService.getSelectedFormation().positions.push(FormationService.getPositionWithID(mouse,posInfo.posID));
    }
  };
});


app.controller('ContentController',function($scope, $rootScope, $interval, CanvasService, FormationService) {
	$scope.formationStartTime = null;
  $scope.playing = false;
  $scope.count = 0;
  $scope.showMouseDropdown = false;
	$scope.initContent = function() {
	  CanvasService.canvasState = new CanvasState(document.getElementById('canvas'));
    $rootScope.addFormation();
	};


	$scope.addPosition = function(pos) {
    var posInfo = FormationService.positionInfo[pos.posID];
		CanvasService.canvasState.addShape(new Position(pos.x, pos.y, pos.posID, posInfo.color, posInfo.label));
		FormationService.getSelectedFormation().positions.push(pos);
	};

	$scope.mouseDown = function(event) {
      event.preventDefault();
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

      var form = FormationService.getSelectedFormation();
      if(e.shiftKey && form.type == 'formation') {
        //expensive for now
        for(var i = 0; i < form.positions.length; i++) {
          if(Math.abs(CanvasService.canvasState.selection.x - form.positions[i].x) < 15)
            CanvasService.canvasState.selection.x = form.positions[i].x;
          if(Math.abs(CanvasService.canvasState.selection.y - form.positions[i].y) < 15)
            CanvasService.canvasState.selection.y = form.positions[i].y;
        }
      }

      CanvasService.canvasState.valid = false; // Something's dragging so we must redraw
    }
  };


  $scope.mouseUp = function(e) {
    CanvasService.canvasState.dragging = false;
    if(CanvasService.canvasState.selection && CanvasService.canvasState.selection.type==0) {
      var pid =  CanvasService.canvasState.selection.posID;
      if (FormationService.getSelectedFormation().type=='formation'){
        var index = FormationService.positionIndexForID(FormationService.getSelectedFormation(),pid);
        FormationService.getSelectedFormation().positions[index].x = CanvasService.canvasState.selection.x;
        FormationService.getSelectedFormation().positions[index].y = CanvasService.canvasState.selection.y;
      } else {
        alert("can't change formations within a transition. Create a new formation");
      }
    }
  };

  // double click for making new shapes
  $scope.doubleClick = function(e) {
    var mouse = CanvasService.canvasState.getMouse(e);
    $scope.addPosition(FormationService.createPosition(mouse));
    $scope.closeDropdown();
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

  $scope.getBackgroundStyle = function() {
    if(FormationService.getSelectedFormation())
      if(FormationService.getSelectedFormation().type=='transition') {
        return { background : '#717173' };
      } else {
        return { background : '#DEDFE2' };
      }
  };

  $scope.showDropdown = function (event) {
    event.preventDefault();
    $scope.showMouseDropdown = true;
    $scope.dropdownEvent = event;
  };

  $scope.closeDropdown = function () {
    $scope.showMouseDropdown = false;
    $scope.dropdownEvent = null;
  };

  $scope.shouldShowDropdown = function () {
    return $scope.showMouseDropdown;
  };
  
  $scope.mouseDropdownStyle = function () {
    var pos = {x: -100, y:-100};
    var width = 150;
    if($scope.dropdownEvent) {
      pos.x = $scope.dropdownEvent.offsetX + width/2;
      pos.y = $scope.dropdownEvent.offsetY;
    }
    return { position : 'absolute',
             top : pos.y + 'px',
             left : pos.x + 'px',
             width : width+'px',
             background:'#FAFAFA'
           };
  };

  $scope.addMarker = function () {
    pos = {x:0, y:0};
    if($scope.dropdownEvent) {
      pos.x = $scope.dropdownEvent.offsetX;
      pos.y = $scope.dropdownEvent.offsetY;
    }
    CanvasService.addMarker(pos);
    $scope.closeDropdown();
  };

  $scope.clickedTimeline = function(index) {
    $rootScope.selectFormation(index);
  };
});



app.directive('ngRightClick', function($parse) {
    return function(scope, element, attrs) {
        var fn = $parse(attrs.ngRightClick);
        element.bind('contextmenu', function(event) {
            scope.$apply(function() {
                event.preventDefault();
                fn(scope, {$event:event});
            });
        });
    };
});

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

$(function() {
     $( "#play" ).button({
      text: false,
      icons: {
        primary: "ui-icon-play"
      }
    });
    $( "#pause" ).button({
      text: false,
      icons: {
        primary: "ui-icon-pause"
      }
    });
    $( "button" )
      .button();
})

app.service('CanvasService', function (FormationService) { 
	var instance = this;
  this.markerList = [];
	this.canvasState = null;
  this.sharedCanvas = null;

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
    instance.canvasState.draw({label : formation.label});
	};

  this.renderCanvas = function (count) {
    var index = FormationService.selectedIndex;
    instance.canvasState.shapes = this.sharedCanvas.updateShapesWithCount(index, FormationService.formationList, count, instance.canvasState.shapes);
    instance.canvasState.valid = false;
  }

  this.addMarker = function(loc) {
    instance.markerList.push(loc);
    instance.canvasState.addShape(new Marker(loc));
  };
});


app.controller('ContentController',function($scope, $rootScope, $interval, CanvasService, FormationService, ConfigurationService, ActionService) {
	$scope.formationStartTime = null;
  $scope.playing = false;
  $scope.count = 0;
  $scope.showMouseDropdown = false;
  
	$scope.initContent = function() {
    var canvas = document.getElementById('canvas');
    CanvasService.sharedCanvas = new SharedCanvas(canvas.getContext('2d'), canvas.width, canvas.height)
	  CanvasService.canvasState = new CanvasState(canvas, CanvasService.sharedCanvas);
    $rootScope.addFormation();
    ActionService.undoStack = []; //cant undo the initial action
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
          CanvasService.canvasState.dragging = true;
          CanvasService.canvasState.dragoffx = mx;
          CanvasService.canvasState.dragoffy = my;
          if(event.metaKey || event.ctrlKey) {
            if (CanvasService.canvasState.selection.indexOf(mySel) == -1)
              CanvasService.canvasState.selection.push(mySel);
          } else {
            CanvasService.canvasState.selection = [mySel,];
          }
	        CanvasService.canvasState.valid = false;
	        return;
	      }
	    }
	    // havent returned means we have failed to select anything.
	    // If there was an object selected, we deselect it
	    if (CanvasService.canvasState.selection) {
	      CanvasService.canvasState.selection = [];
	      CanvasService.canvasState.valid = false; // Need to clear the old selection border
	    }
  	};

  $scope.mouseMove = function(e) {
    if (CanvasService.canvasState.dragging){
      var mouse = CanvasService.canvasState.getMouse(e);
      // We don't want to drag the object by its top-left corner, we want to drag it
      // from where we clicked. Thats why we saved the offset and use it here
      var deltaX = mouse.x - CanvasService.canvasState.dragoffx;
      var deltaY = mouse.y - CanvasService.canvasState.dragoffy;
      for(var k=0; k < CanvasService.canvasState.selection.length; k++) {
        selection = CanvasService.canvasState.selection[k];
        selection.x = selection.x + deltaX;
        selection.y = selection.y + deltaY;
      }
      CanvasService.canvasState.dragoffx = mouse.x;
      CanvasService.canvasState.dragoffy = mouse.y;
      var form = FormationService.getSelectedFormation();
      if(e.shiftKey && form.type == 'formation') {
        //expensive for now

        for(var k=0; k < CanvasService.canvasState.selection.length; k++) {
          selection = CanvasService.canvasState.selection[k];
          var minDistX = 100, minDistY = 100;
          var snapX = selection.x, snapY = selection.y;
          for(var i = 0; i < form.positions.length; i++) {
            if(i != k) {
              var distX =Math.abs(selection.x - form.positions[i].x);
              var distY =Math.abs(selection.y - form.positions[i].y);
              if(distX < minDistX && distX < 20) {
                snapX = form.positions[i].x;
                minDistX = distX;
              }
              if(distY < minDistY && distY < 20) {
                snapY = form.positions[i].y;
                minDistX = distY;
              }
            }
          }
          selection.x = snapX;
          selection.y = snapY;
        }
      }

      CanvasService.canvasState.valid = false; // Something's dragging so we must redraw
    }
  };


  $scope.mouseUp = function(e) {
    CanvasService.canvasState.dragging = false;
    if(CanvasService.canvasState.selection.length > 0) {
      if (FormationService.getSelectedFormation().type=='formation'){
        ActionService.addAction(new Action('moveSelection', {"selection":JSON.parse(JSON.stringify(CanvasService.canvasState.selection))}));
      } else {
        alert("Cannot modify positions in a transition, create a new formation");
        CanvasService.canvasState.valid = false; 
        $scope.updateCanvasFrame();
      }
    }
  };

  // double click for making new shapes
  $scope.doubleClick = function(e) {
    var shouldAdd = ConfigurationService.doubleClickAdd;
    if(e.notDblClick != undefined) {
      e = e.event;
      shouldAdd = true;
    }
    if(shouldAdd) {
     var mouse = CanvasService.canvasState.getMouse(e);
     ActionService.addAction(new Action('addPosition',{"mouse":mouse}));
     $scope.closeDropdown();
    }
  };

  $scope.pressPlay = function () {
    $scope.playing = true;
    $scope.formationStartTime = new Date();
    $scope.lastCount=0;
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
    $scope.count = (new Date() - $scope.formationStartTime)/750;
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
      CanvasService.renderCanvas($scope.count);
    }
    if (Math.ceil($scope.count) != $scope.lastCount) {
      $scope.lastCount = Math.max(1,Math.ceil($scope.count));
      CanvasService.canvasState.valid = false;
    }
    CanvasService.canvasState.draw({ count : $scope.lastCount, name : FormationService.getSelectedFormation().name });

  };

  $scope.getBackgroundStyle = function() {
    if(FormationService.getSelectedFormation())
      // if(FormationService.getSelectedFormation().type=='transition') {
      //   return { background : '#717173' };
      // } else {
        return { background : '#DEDFE2' };
      // }
  };

  $scope.showDropdown = function (event) {
    event.preventDefault();
    $scope.showMouseDropdown = true;
    $scope.dropdownEvent = event;
    $scope.dropdownTarget = $scope.getDropdownTarget($scope.dropdownEvent);
  };

  $scope.getDropdownTarget = function(event) {
      var shapes = CanvasService.canvasState.shapes;
      var l = shapes.length;
      for (var i = l-1; i >= 0; i--) {
        var mouse = CanvasService.canvasState.getMouse(event);
        var mx = mouse.x;
        var my = mouse.y;   
        if (shapes[i].contains(mx, my)) {
          return shapes[i].posID;
        }
      }
      return null;
  }

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

  $scope.removePosition = function (index) {
   if(FormationService.getSelectedFormation().type=='formation') {
      ActionService.addAction(new Action('removePosition', {"target" : $scope.dropdownTarget}));
    } else {
      alert("Cannot modify positions in a transition, create a new formation");
    }
    CanvasService.updateCanvas(FormationService.selectedIndex);
    $scope.closeDropdown(); 
  };

  $scope.undo = function () {
    ActionService.undo();
  };

  $scope.redo = function() {
    ActionService.redo();
  };

  $scope.canUndo = function() {
    return ActionService.undoStack.length > 0
  };

  $scope.canRedo = function() {
    return ActionService.redoStack.length > 0
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

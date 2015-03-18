app.controller('PositionsPanelController', function($scope, $rootScope, CanvasService, FormationService, ActionService) {
	$scope.editedItem = null;
	$scope.selectingColor = -1;

	$rootScope.getPositionList = function () {
		return Object.keys(FormationService.positionInfo).map(function(key){
		    return FormationService.positionInfo[key];
		});
	};

	$scope.getStyle = function(index) {
		var style = {};
    	style['background-color']=FormationService.positionInfo[index].color;
    	return style
	};

	$scope.startEditing = function(item){
        item.editing=true;
        $scope.editedItem = item;
    };
        
    $scope.doneEditing = function(item, index){
        item.editing=false;
		FormationService.positionInfo[index].label = item.label;
        $scope.editedItem = null;
        CanvasService.updateCanvas(FormationService.selectedIndex);
    };

    $scope.tappedPosition = function(index, event) {
    	if($scope.selectingColor != index)
	    	$scope.selectingColor = index;
	    else
	    	$scope.selectingColor = -1;
    	event.preventDefault();
    };

    $scope.addExistingPosition = function(index, event) {
    	var posInfo = FormationService.positionInfo[index];
	    var mouse = event == null ? { x : 600/2, y : 280/2  } : CanvasService.canvasState.getMouse(event);
	    if(positionIndexForID(FormationService.getSelectedFormation(), posInfo.posID) == -1) {
	      if(FormationService.getSelectedFormation().type=='formation') {
	        ActionService.addAction(new Action('addExistingPosition',{"mouse":mouse, "posInfo":posInfo}));
	      } else {
	        alert("Cannot modify positions in a transition, create a new formation");
	      }
	    }
 		event.preventDefault();
    };
});


// I invoke the given expression when associated ngRepeat loop
// has finished its first round of rendering.
app.directive(
    "colorpicker",function (CanvasService, FormationService) {
    return {restrict: 'AE',
    	replace: false,
	    link:function(scope,elem,attrs) {
	    	elem.ColorPicker({
			    color: '#0000ff',
			    onShow: function (colpkr) {
			      $(colpkr).fadeIn(500);
			      return false;
			    },
			    onHide: function (colpkr) {
			      $(colpkr).fadeOut(500);
			      scope.pos.color = elem.css('backgroundColor');
			      CanvasService.updateCanvas(FormationService.selectedIndex);
			      return false;
			    },
			    onChange: function (hsb, hex, rgb) {
			      elem.css('backgroundColor', '#' + hex);
			    }
			});
	    }
	};
});

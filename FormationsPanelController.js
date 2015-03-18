var app = angular.module('app', ['jui','ngResource']);

app.service('FormationService', function () { 
	this.formationList = [];
	this.positionInfo = {};
	this.timelineTags = [];
	this.selectedIndex = -1;
	this._positionCounter = 0;
	this.getSelectedFormation = function () {
		return this.formationList[this.selectedIndex];
	}

	this.createPosition = function(mouse) {
		var randColor = 'rgba(' + getRandomInt(0,255) + ',' + getRandomInt(0,255) + ',' + getRandomInt(0,255) + ',.6)';
		var pos = {x: mouse.x, y: mouse.y, posID: this._positionCounter};
		this.positionInfo[this._positionCounter] = {color: randColor, label: this._positionCounter, posID: this._positionCounter};
		this._positionCounter++;
		return pos;
	}

	this.getPositionWithID = function(mouse, posID) { 
		return {x: mouse.x, y:mouse.y, posID: posID};
	}

	this.deleteFormation = function(index) {
		var selected = this.getSelectedFormation();
		var count = 2;
		if(index == this.formationList.length-1) {
			index = index - 1;
		}
		forms = this.formationList.splice(index,count);
		this.selectedIndex = this.formationList.indexOf(selected);
		return forms
	}
});

app.controller('FormationsPanelController', function($scope, $rootScope, CanvasService, FormationService, ActionService) {
	$scope.editedItem = null;
	$scope.mouseDown = false;
	$scope.dragging = -1;
	$scope.startY=0;
	$scope.currY=0;

	$rootScope.getFormationList = function () {
		return FormationService.formationList;
	}

	$rootScope.addFormation = function() {
		ActionService.addAction(new Action('addFormation',{}));
	};

	$rootScope.selectFormation = function (index) {
		if(index != FormationService.selectedIndex) {
			ActionService.addAction(new Action('selectFormation', {"index":index}));
		} else {
			CanvasService.updateCanvas(index);
		}
	};

	$scope.startEditing = function(item){
        item.editing=true;
        $scope.editedItem = item;
    };
        
    $scope.doneEditing = function(item){
        item.editing=false;
        $scope.editedItem = null;
    };

    $scope.startDragging = function (index, event) {
    	$scope.mouseDown = true;
	    event.preventDefault();
	    setTimeout(function () {
	    	if($scope.mouseDown) {
	    		$scope.dragging = index;
		    	$scope.startY = event.pageY;
		    	$scope.currY = event.pageY;
		    	$scope.startCounts = FormationService.formationList[$scope.dragging].counts;
	    	}
	    },400);
    }

    $scope.mouseMove = function(event) {
    	if($scope.dragging != -1)
    	{
	    	$scope.currY = event.pageY;
	    	FormationService.formationList[$scope.dragging].counts = Math.max(0,$scope.startCounts + Math.floor(($scope.currY-$scope.startY)/10));
    	}

    }

    $scope.stopDragging = function (event) {
    	ActionService.addAction(new Action('changeCounts', {"startCounts":$scope.startCounts, "index":$scope.dragging}));
    	$scope.dragging = -1;
    	$scope.currY = 0;
    	$scope.startY = 0;
    	$scope.mouseDown = false;
    };

    $scope.getFormationStyle = function(index) {
    	if(!($scope.dragging == index))	 {
    		height = ((FormationService.formationList[index].counts * 10) + 80) +'px';
    	} else {
    		height = (80+($scope.currY-$scope.startY) + $scope.startCounts * 10) +'px';
    	}

    	var style =  { 
    		margin: '0 20px',
    		height : height};
    	style['line-height']='24px';
    	return style;
    };

    $scope.getClass = function(form) {
    	var cls = '';
    	if(form.type=="formation") cls += " formationEntry";
    	if(form.type=="transition") cls += " transitionEntry";
    	if(form.selected) cls += " selected";
    	return cls;
    };

    $scope.canAddIntermediate = function () {
    	return FormationService.selectedIndex < $scope.getFormationList().length-1;
    }

    $scope.intermediateAddStyle = function () {
    	var y = 23;
    	for(var i = 0; i <= FormationService.selectedIndex; i++) {
    		y += 10;
    		y += parseInt($scope.getFormationStyle(i).height.substring(0,$scope.getFormationStyle(i).height.length-2));
    	}
    	y += 'px';
    	var style = {
    		position: 'absolute',
    		right: '-5px',
    		top: y
    	};
    	return style;
    }

    $scope.addIntermediate  = function() {
    	FormationService.createIntermediateFormation({ action:'none' });
    }

    $scope.deleteFormation = function(index) {
    	ActionService.addAction(new Action('deleteFormation', {"index":index}));
    }
});

app.directive('ngEnter', function() {
        return function(scope, element, attrs) {
            element.bind("keydown keypress", function(event) {
                if(event.which === 13) {
                    scope.$apply(function(){
                        scope.$eval(attrs.ngEnter, {'event': event});
                    });

                    event.preventDefault();
                }
            });
        };
    });
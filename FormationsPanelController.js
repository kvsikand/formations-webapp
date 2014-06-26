var app = angular.module('app', ['jui','ngResource']);

app.service('FormationService', function () { 
	this.formationList = [];
	this.positionInfo =[];
	this.timelineTags = [];
	this.selectedIndex = -1;
	this._positionCounter = 0;
	this.getSelectedFormation = function () {
		return this.formationList[this.selectedIndex];
	}

	this.createPosition = function(mouse) {
		var randColor = 'rgba(' + getRandomInt(0,255) + ',' + getRandomInt(0,255) + ',' + getRandomInt(0,255) + ',.6)';
		var pos = {x: mouse.x, y: mouse.y, posID: this._positionCounter};
		this.positionInfo.push({color: randColor, label: this._positionCounter, posID:this._positionCounter});
		this._positionCounter++;
		return pos;
	}

	this.positionIndexForID = function(formation, posID) {
		for(var i = 0; i < formation.positions.length; i++) {
			if(formation.positions[i].posID == posID)
				return i;
		}
		return -1;
	}
});

app.controller('FormationsPanelController', function($scope, $rootScope, CanvasService, FormationService) {
	$scope.editedItem = null;
	$scope.mouseDown = false;
	$scope.dragging = -1;
	$scope.startY=0;
	$scope.currY=0;

	$rootScope.getFormationList = function () {
		return FormationService.formationList;
	}

	$scope.addFormation = function() {
		var pos = [];
		if(FormationService.formationList.length > 0) {
			pos = PositionsFromPositions(FormationService.formationList[FormationService.formationList.length-1].positions);
			FormationService.formationList.push({name: 'transition ' + (FormationService.formationList.length+1), counts:4, type: 'transition'});
		}
		FormationService.formationList.push({name: 'formation ' + (FormationService.formationList.length+1), positions:pos, counts:4, type: 'formation'});
		$rootScope.selectFormation(FormationService.formationList.length-1);
		
	};

	$rootScope.selectFormation = function (index) {
		if(FormationService.getSelectedFormation())
			FormationService.getSelectedFormation().selected = false;
		FormationService.selectedIndex = index;
		FormationService.getSelectedFormation().selected = true;
		CanvasService.updateCanvas(index);
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
	    	FormationService.formationList[$scope.dragging].counts = $scope.startCounts + Math.floor(($scope.currY-$scope.startY)/20);
    	}

    }

    $scope.stopDragging = function (event) {
    	$scope.dragging = -1;
    	$scope.currY = 0;
    	$scope.startY = 0;
    	$scope.mouseDown = false;
    };

    $scope.getFormationStyle = function(index) {
    	if(!($scope.dragging == index))	 {
    		height = ((FormationService.formationList[index].counts * 20) + 40) +'px';
    	} else {
    		height = (40+($scope.currY-$scope.startY) + $scope.startCounts * 20) +'px';
    	}

    	var style =  { 
    		margin: '0 20px',
    		height : height};
    	style['line-height']='40px';
    	return style;
    };

    $scope.getClass = function(form) {
    	var cls = '';
    	if(form.type=="formation") cls += " formationEntry";
    	if(form.type=="transition") cls += " transitionEntry";
    	if(form.selected) cls += " selected";
    	return cls;
    };
});
var Action = function(type, args) {
	
	this.execute = function(CanvasService, FormationService) {
		if(type == 'addExistingPosition') {
			console.log("adding pos: ", args.posInfo, args.posInfo.posID);
			CanvasService.sharedCanvas.addShape(new Position(args.mouse.x, args.mouse.y, args.posInfo.posID, args.posInfo.color, args.posInfo.label));
        	FormationService.getSelectedFormation().positions.push(FormationService.getPositionWithID(args.mouse,args.posInfo.posID));
		} else if(type == 'addPosition') {
			var pos = FormationService.createPosition(args.mouse);
			args.posID = pos.posID;
			var posInfo = FormationService.positionInfo[pos.posID];
			CanvasService.sharedCanvas.addShape(new Position(pos.x, pos.y, pos.posID, posInfo.color, posInfo.label));
			FormationService.getSelectedFormation().positions.push(pos);
		} else if(type == 'removePosition') {
    	  args.idx = positionIndexForID(FormationService.getSelectedFormation(), args.target);
	      args.pos = FormationService.getSelectedFormation().positions.splice(args.idx,1)[0];
		} else if(type == 'selectFormation') {
			args.lastIndex = FormationService.selectedIndex;
			selectFormation(args.index,CanvasService,FormationService);
		} else if(type == 'addFormation') {
			var pos = [];
			if(FormationService.formationList.length > 0) {
				pos = PositionsFromPositions(FormationService.formationList[FormationService.formationList.length-1].positions);
				FormationService.formationList.push({name: 'transition ' + (FormationService.formationList.length+1), counts:4, type: 'transition', label:''});
			}
			FormationService.formationList.push({name: 'formation ' + (FormationService.formationList.length+1), positions:pos, counts:4, type: 'formation', label:''});
			args.lastIndex = FormationService.selectedIndex;
			selectFormation(FormationService.formationList.length-1,CanvasService,FormationService);
		} else if(type == 'deleteFormation') {
			args.selection = FormationService.selectedIndex;
			args.forms = FormationService.deleteFormation(args.index);
		} else if(type == 'moveSelection') {
			args.oldPositions = [];
			for(var k=0; k < args.selection.length; k++) {
	          var selection = args.selection[k];
	          if(selection && selection.type==0) {
	            var pid = selection.posID;
	            var index = positionIndexForID(FormationService.getSelectedFormation(),pid);
	            args.oldPositions[k] = {"x":FormationService.getSelectedFormation().positions[index].x, "y":FormationService.getSelectedFormation().positions[index].y};
	            FormationService.getSelectedFormation().positions[index].x = selection.x;
	            FormationService.getSelectedFormation().positions[index].y = selection.y;
	          }
	        }
			CanvasService.updateCanvas(FormationService.selectedIndex);
		} else if(type == 'changeCounts') {
			if(args.counts) {
				FormationService.formationList[args.index].counts = args.counts;
			}
			args.counts = FormationService.formationList[args.index].counts;
		}
	}

	//assume the state of the services is EXACTLy correct
	this.undo = function(CanvasService, FormationService) {
		if(type == 'addExistingPosition') {
			CanvasService.sharedCanvas.shapes.pop();
			CanvasService.sharedCanvas.valid = false;
			FormationService.getSelectedFormation().positions.pop();
		} else if(type == 'addPosition') {
			delete FormationService.positionInfo[args.posID];
			FormationService._positionCounter--;
			CanvasService.sharedCanvas.shapes.pop();
			CanvasService.sharedCanvas.valid = false;
			FormationService.getSelectedFormation().positions.pop();
		} else if(type == 'removePosition') {
    	  args.idx = positionIndexForID(FormationService.getSelectedFormation(), args.target);
	      FormationService.getSelectedFormation().positions.splice(args.idx, 0, args.pos);
      	  CanvasService.updateCanvas(FormationService.selectedIndex);
		} else if(type == 'selectFormation') {
			var index = args.lastIndex;
			selectFormation(index,CanvasService,FormationService);
		} else if(type == 'addFormation') {
			var index = args.lastIndex;
			selectFormation(index,CanvasService,FormationService);
			FormationService.formationList.pop();
			FormationService.formationList.pop();
		} else if(type == 'deleteFormation') {
			FormationService.formationList.splice(args.index,0,args.forms[0],args.forms[1]);
			FormationService.selectedIndex = args.selection;
		} else if(type == 'moveSelection') {

			//TODO: REWORK THIS SHIT
			for(var k=0; k < args.selection.length; k++) {
	          var selection = args.selection[k];
	          if(selection && selection.type==0) {
	            var pid = selection.posID;
	            var index = positionIndexForID(FormationService.getSelectedFormation(),pid);
	            args.selection[k].x = FormationService.getSelectedFormation().positions[index].x;
	            args.selection[k].y = FormationService.getSelectedFormation().positions[index].y;
	            FormationService.getSelectedFormation().positions[index].x = args.oldPositions[k].x;
	            FormationService.getSelectedFormation().positions[index].y = args.oldPositions[k].y;

	          }
	        }
			CanvasService.updateCanvas(FormationService.selectedIndex);
      	}else if(type == 'changeCounts') {
			if(args.startCounts) {
				FormationService.formationList[args.index].counts = args.startCounts;
			}
		}
	}
}


this.selectFormation = function(index, CS, FS) {
	if(FS.getSelectedFormation())
		FS.getSelectedFormation().selected = false;
	FS.selectedIndex = index
	FS.getSelectedFormation().selected = true;
	CS.updateCanvas(index);
}

app.service('ActionService', function(CanvasService, FormationService) {
	var instance = this;
	this.undoStack = [];
	this.redoStack = [];

	this.addAction = function(action) {
		instance.redoStack = []; //all future actions no longer apply since you have changed state
		action.execute(CanvasService, FormationService);
		instance.undoStack.push(action);
	}

	this.undo = function() {
		if(this.undoStack.length > 0) {
			var action = instance.undoStack.pop();
			action.undo(CanvasService, FormationService);
			instance.redoStack.push(action);
		}
	}

	this.redo = function() {
		if(this.redoStack.length > 0) {
			var action  = instance.redoStack.pop();
			action.execute(CanvasService, FormationService);
			instance.undoStack.push(action);
		}
	}
});

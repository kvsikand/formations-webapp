var express = require('express');
var app = express();
app.use('/', express.static(__dirname));
var bodyParser = require('body-parser')
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use( bodyParser.urlencoded() );
var sc = require('./SharedCanvas.js');
var SharedCanvas = sc.SharedCanvas;
var pos = require('./Position.js');
var Position = pos.Position;
// var ffmpeg = require('fluent-ffmpeg');
var Canvas = require('canvas');
var Readable = require('stream').Readable;
var util = require('util');
var fs = require('fs');
var sleep = require('sleep');
app.post('/export', function(req, res) {
  var data = req.body
  fs.writeFileSync(__dirname + '/export.json', JSON.stringify(data));
  res.json('OK');
});

app.get('/export', function (req, res) {
  var file = __dirname + '/export.json';
  res.download(file,'formations.json');
});

app.post('/exportVideo', function(req, res) {
  var data = req.body;
  constructCanvasVideo(data);
});


app.get('/exportVideo', function (req, res) {
  var file = __dirname + '/export.mp4';
  res.download(file,'formations.mp4');
});


function constructCanvasVideo(data) {
	var canvas = new Canvas(800,640);
	var ctx = canvas.getContext('2d');
	var sharedCanvas = new SharedCanvas(ctx, 800, 640);
	var frame = 0;
	var selectedIndex = -2;
	var shapes;
	var imageData = [];

	function writeFrame(frame) {
		console.log('at this frame' + frame);
		if(selectedIndex < data.formationList.length-2)
		{
			selectedIndex+=2;
			shapes = getShapesForIndex(data.formationList, data.positionInfo, selectedIndex);
			sharedCanvas.draw(shapes, {selection:[]});
			count = 0;
		} else {
			console.log("finished");
			done = true;
			return;
		}
		var fs = require('fs');
	    var out = fs.createWriteStream(__dirname + '/videoConstruction/formation-'+data.formationList[selectedIndex].name+'('+(frame+1)+')'+'.png')
	    var stream = canvas.pngStream();

		stream.on('data', function(chunk){
		  out.write(chunk);
		});

		stream.on('end', function() {
			setTimeout(writeFrame,0,++frame);
		});
	}
	setTimeout(writeFrame, 0, frame);
}

function getShapesForIndex(formationList, positionInfo, index) 
{
	var shapes = [];
	var formation = formationList[index];
	if(formation.type != 'formation') formation = formationList[index-1];
	for(var i = 0; i < formation.positions.length; i++) {
		var pos = formation.positions[i];
		var posInfo = positionInfo[pos.posID];
		var position = new Position(pos.x, pos.y, pos.posID, posInfo.color, posInfo.label);
		shapes.push(position)
	}
	return shapes;
}

function renderCanvasFrame(canvas, sharedCanvas, shapes, frame) {
	sharedCanvas.clear();
	for(var i = 0; i < shapes.length; i++) {
		shapes[i].draw(sharedCanvas.ctx);
	}

  var fs = require('fs');
  return canvas.toBuffer();
}

app.listen(process.env.PORT || 3000, function() { console.log('listening')});
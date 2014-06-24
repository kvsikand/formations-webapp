var express = require('express');
var app = express();
app.use('/', express.static(__dirname));
var bodyParser = require('body-parser')
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use( bodyParser.urlencoded() );
app.post('/export', function(req, res) {
  var data = req.body
  var fs = require('fs');
  fs.writeFileSync(__dirname + '/export.json', JSON.stringify(data));
  res.json('OK');
});
app.get('/export', function (req, res) {
  var file = __dirname + '/export.json';
  res.download(file,'formations.json');
});

app.listen(process.env.PORT || 3000, function() { console.log('listening')});
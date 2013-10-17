
/**
 * Module dependencies.
 */

var express = require('express'),
	routes = require('./routes'),
	http = require('http'),
	path = require('path'),
	io = require('socket.io').listen(6556),
	mp3 = require('./mp3.js'),
	fs = require('fs'),
	ping = require('./ping.js'),
	aydio = require('./ayd.io.js'),
	FSAutocomplete = require('./fs.autocomplete.js');

var app = express();

var file = '/home/moolen/Downloads/schafe und wölfe - Zeitvertreib feat. Strizi (Frittenbude).mp3';
var buf = fs.readFileSync(file);

console.log(mp3.readSampleRate(buf));
io.set('log level', 1);

io.sockets.on('connection', function (webSocket) {
	
	// init Aydio
	var Aydio = new aydio(webSocket);

	// init Ping
	var Ping = new ping({
		onDeviceChange: function(devices)
		{
			webSocket.emit('onDeviceChange', devices);
			Aydio.updateReciever(devices);
		},
		onEachDevice: function(device)
		{
			webSocket.emit('onEachDevice', device);
		}
	});

	/**
	 * AUDIO SUBMIT 
	 */
	webSocket.on('onAudioSubmit', function (data) {
		console.log('onAudioSubmit triggered: ' + data);
		Aydio.initAudioStream(data);
	});

	/**
	 * CANCEL AUDIO
	 */
	webSocket.on('cancelAudio', function(data){
		console.log('cancelAudioRecieved');
		Aydio.cancelAudioStream(data);
	});

	/**
	 * FS CHANGE
	 */
	webSocket.on('onFSChange', function(data){
		FSAutocomplete(data, webSocket);
	});
});



// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(require('less-middleware')({ src: __dirname + '/public' }));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});


/**
 * Module dependencies.
 */

var express = require('express'),
	routes = require('./routes'),
	account = require('./.account.json'),
	http = require('http'),
	path = require('path'),
	io = require('socket.io').listen(6556),
	mp3 = require('./lib/mp3.js'),
	Spotify = require('./lib/spotify.js'),
	fs = require('fs'),
	ping = require('./lib/ping.js'),
	Aydio = require('./lib/ayd.io.js'),
	FSAutocomplete = require('./lib/fs.autocomplete.js');

var app = express();

var file = '/home/moolen/Downloads/schafe und wölfe - Zeitvertreib feat. Strizi (Frittenbude).mp3';
var buf = fs.readFileSync(file);
console.log(mp3.readSampleRate(buf));

// init Aydio
var aydio = new Aydio();
var spotify = new Spotify();
io.set('log level', 1);

io.sockets.on('connection', function (webSocket) {
	// console.log(aydio.file);

	// init Ping
	var Ping = new ping({
		onDeviceChange: function(devices)
		{
			webSocket.emit('onDeviceChange', devices);
			aydio.updateReciever(devices);
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
		console.log('onAudioSubmit triggered:');
		aydio.initAudioStream(data);
	});

	/**
	 * CANCEL AUDIO
	 */
	webSocket.on('cancelAudio', function(data){
		console.log('cancelAudioRecieved');
		spotify.stopPlayer();
		aydio.cancelAudioStream(data, function(){
			console.log('cancelled audio Stream');
		});
	});

	/**
	* SPOTIFY
	*/
	webSocket.on('SpotifySearch', function(data)
	{
		spotify.search(data, function(tracks)
		{
			webSocket.emit('SpotifySearchReturn', tracks);
		});
	});

	webSocket.on('SpotifyPlaySong', function(data)
	{
		spotify.startPlayer(data, aydio);
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

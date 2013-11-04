
/**
 * Module dependencies.
 */

var express = require('express'),
	routes = require('./routes'),
	http = require('http'),
	path = require('path'),
	streamSocket = require('socket.io-stream'),
	io = require('socket.io').listen(6500),
	Speaker = require('speaker');
	fs = require('fs');

io.set('log level', 1);
audioOptions = {channels: 2, bitDepth: 16, sampleRate: 44100};
var app = express();

// all environments
app.set('port', process.env.PORT || 3001);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser({ keepExtensions: true, uploadDir: "temp" }));
app.use(express.methodOverride());
app.use(app.router);
app.use(require('less-middleware')({ src: __dirname + '/public' }));
app.use(express.static(path.join(__dirname, 'public')));

// connection
io.sockets.on('connection', function(socket){

	var speaker = new Speaker(audioOptions);
	var ts = null;
	// on Stream
	streamSocket(socket).on('onStream', function(stream, data)
	{
		stream.on('data', function(chunk){
			console.log(chunk);
		});
		stream.pipe(speaker);

	});

	streamSocket(socket).on('onCancel', function(stream, data)
	{
		console.log('onCancel');
		//stream.unpipe();
	});

	socket.on('disconnect', function(){
		console.log('disconnnect');
	});
});

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/ping', routes.index);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

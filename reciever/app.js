
/**
 * Module dependencies.
 */

var express = require('express'),
	routes = require('./routes'),
	http = require('http'),
	path = require('path'),
	ss = require('socket.io-stream'),
	io = require('socket.io').listen(6500),
	Speaker = require('speaker');
	fs = require('fs');

	var audioOptions = {channels: 2, bitDepth: 16, sampleRate: 11025};
	var speaker = new Speaker(audioOptions);

var app = express();
var fileInfo;

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
	// on Stream
	ss(socket).on('onStream', function(stream, data){
		console.log(stream);
		console.log(data);
		stream.pipe(speaker);
	});
});

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.post('/', routes.index);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

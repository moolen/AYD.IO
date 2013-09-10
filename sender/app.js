
/**
 * Module dependencies.
 */

var express = require('express'),
	routes = require('./routes'),
	http = require('http'),
	path = require('path'),
	io = require('socket.io').listen(6556),
	sys = require('sys'),
	fs = require('fs'),
	exec = require('child_process').exec,
	_ = require('lodash');

var app = express();

io.sockets.on('connection', function (socket) {
	socket.emit('news', { hello: 'world' });
	// audio submit
	socket.on('onAudioSubmit', function (data) {
		console.log(data);
	});
	// FS change
	socket.on('onFSChange', function(data){

		var pos = data.path.lastIndexOf('/');
		var currentDir = data.path.substr(0, pos + 1);
		var searchString = data.path.substr(pos + 1);

		console.log('current dir: ' + currentDir);
		console.log('search string: ' + searchString);

		fs.readdir(currentDir, function(err, files){
			var dir = [];
			_.each(files, function(file, i){
				console.log('file:' + file);
				var match = new RegExp(searchString);
				var isMatch = match.test(file);
				console.log(isMatch + ' for: ' + file);
				if(isMatch)
				{
					dir.push(file);
				}
			});
			console.log(dir);
			socket.emit('onFSSuggestion', { dir: dir, path: currentDir});
		});
		
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


/**
 * Module dependencies.
 */

var express = require('express'),
	routes = require('./routes'),
	http = require('http'),
	path = require('path'),
	io = require('socket.io').listen(6556),
	ss = require('socket.io-stream'),
	reciever = require('socket.io-client'),
	sys = require('sys'),
	fs = require('fs'),
	ping = require('./ping.js'),
	aydio = require('./ayd.io.js'),
	exec = require('child_process').exec,
	lame = require('lame'),
	//mp3 = require(__dir + 'mp3.js'),
	_ = require('lodash');

var AYDIO = new aydio();
var app = express();
var clientSocket = reciever.connect('http://192.168.1.8:6500');
var audioPipes = { status: '', once: true };

io.sockets.on('connection', function (socket) {
	// init new Ping here.
	var Ping = new ping({
		onDeviceChange: function(devices){
			socket.emit('onDeviceChange', devices);
		}
	});
	/**
	 * ON AUDIO SUBMIT 
	 */
	socket.on('onAudioSubmit', function (data) {
		console.log('onAudioSubmit triggered: ' + data);
		var decoder = lame.Decoder();
		var stream = ss.createStream();
		var fileInfo = "";
		if(audioPipes.status === 'occupied')
		{
			unpipeAudioPipes();
		}
		audioPipes.status = 'occupied';
		if(audioPipes.once){

		}
		//mp3.readMp3Info(data.file, function(fileInfo){
		//	fileInfo = fileInfo;
		//});
		ss(clientSocket).emit('onStream', stream, {name: data, fileInfo: fileInfo});
		audioPipes.fs = fs.createReadStream(data.file);
		audioPipes.decoder = audioPipes.fs.pipe(decoder);
		audioPipes.stream = audioPipes.decoder.pipe(stream);
	});

	/**
	 * ON CANCEL AUDIO
	 */
	socket.on('cancelAudio', function(data){
		console.log('cancelAudio recieved');
		unpipeAudioPipes();
	});

	/**
	 * ON FS CHANGE
	 * @param  {[type]} data [description]
	 * @return {[type]}      [description]
	 */
	socket.on('onFSChange', function(data){

		var pos = data.path.lastIndexOf('/');
		var currentDir = data.path.substr(0, pos + 1);
		var searchString = data.path.substr(pos + 1);

		fs.readdir(currentDir, function(err, files){
			var dir = [];
			var fileList = [];
			_.each(files, function(file, i){

				// matches searchString?
				var match = new RegExp("^" + searchString);
				var isMatch = match.test(file);
				// console.log(isMatch + ' for: ' + file);
				if(isMatch && searchString.length > 1)
				{
					dir.push(file);
				}

				// matches file extension?
				if(file.match(/.mp3/) !== null)
				{
					fileList.push(file);
				}
			});
			//console.log(dir);
			socket.emit('onFSSuggestion', {
				fileList : fileList,
				suggestions: dir,
				currentDir: currentDir,
				searchString: searchString
			});
		});
	});
});

function unpipeAudioPipes()
{
	audioPipes.fs.unpipe();
	audioPipes.decoder.unpipe();
	audioPipes.stream.unpipe();
	audioPipes = { status: '', once: true };
}

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

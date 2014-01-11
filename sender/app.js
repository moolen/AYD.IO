
/**
 * Module dependencies.
 */

var express = require('express'),
	routes = require('./routes'),
	http = require('http'),
	path = require('path'),
	EventEmitter2 = require('eventemitter2').EventEmitter2,
	config = require('./config.json'),
	Ping = require('./lib/ping.js'),
	FSReader = require('./lib/fs.reader.js'),
	socketBindings = require('./lib/bindings.socket.js'),
	Aydio = require('./lib/ayd.io.js');

// i want to store global state for reconnect case
GLOBAL.store = {};
GLOBAL.store.musicDirectory = {};
GLOBAL.store.musicDirectory.path = config.musicDirectory;
GLOBAL.store.musicDirectory.folders = [];
GLOBAL.store.currentFilename = "";
GLOBAL.store.playbackState = {};
GLOBAL.store.playbackVolume = 0;

if(process.env.NODE_ENV !== 'production'){
	require('longjohn');
}

var app = express();

var vent = new EventEmitter2({
	wildcard: true,
	delimiter: ':',
	newListener: false,
	maxListeners: 20
});



var aydio =		new Aydio( vent );
var FSReader =	new FSReader( vent );
var ping =		new Ping( vent );
var bindings =	new socketBindings( vent );

app.configure(function(){
	app.set('port', process.env.PORT || 3000);
	app.set('views', __dirname + '/views');
	app.set('view engine', 'ejs');
	app.use(require('less-middleware')({ src: path.join(__dirname, 'public') }));
	app.use(express.static(__dirname + '/public'));
	app.use(express.favicon());
	app.use(express.logger('dev'));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);
});

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});


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

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.static(__dirname + '/public'));
app.use(app.router);
app.use(require('less-middleware')({ src: __dirname + '/public' }));

console.log(__dirname + '/public');

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

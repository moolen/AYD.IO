
/**
 * Module dependencies.
 */

var express = require('express'),
	routes = require('./routes'),
	http = require('http'),
	config = require('./config.json'),
	FSReader = require('./lib/fs.reader.js'),
	Bindings = require('./lib/bindings.js'),
	EventEmitter2 = require('eventemitter2').EventEmitter2,
	path = require('path');

GLOBAL.store = {};
GLOBAL.store.musicDirectory = {};
GLOBAL.store.musicDirectory.path = config.musicDirectory;
GLOBAL.store.musicDirectory.folders = [];
GLOBAL.store.currentFilename = "";
GLOBAL.store.currentDir = config.musicDirectory;
GLOBAL.store.playbackState = {};
GLOBAL.store.playbackVolume = 0;

var app = express();

require('longjohn');

var vent = new EventEmitter2({
	wildcard: true,
	delimiter: ':',
	newListener: false,
	maxListeners: 20
});

var fsReader = new FSReader( vent );
var bindings = new Bindings( vent );



// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/ping', routes.ping);
app.get('/', routes.index);

// all environments
app.set('port', process.env.PORT || 3011);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser({ keepExtensions: true, uploadDir: "temp" }));
app.use(express.methodOverride());
app.use(app.router);
app.use(require('less-middleware')({ src: __dirname + '/public' }));
app.use(express.static(path.join(__dirname, 'public')));

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

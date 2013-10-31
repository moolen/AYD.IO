module.exports = function(webSocket)
{
	var socketClient = require('socket.io-client'),
		lame = require('lame'),
		streamSocket = require('socket.io-stream'),
		fs = require('fs');

	var self = this;

	// debug
	this.debug = true;
	this.verbose = true;

	this.__instance = this;
	this.recieverList = [];
	this.streamSocketList = [];
	this.webSocket = webSocket;
	this.next = false;
	this.file = false;

	this.updateReciever = function(devices)
	{
		self.recieverList = devices;
	};

	this.cancelAudioStream = function(data, callback)
	{
		if( typeof self.streamSocketList[data.host] === "object" )
		{
			console.log('isObject');
			self.streamSocketList[data.host].fs.unpipe();
			self.streamSocketList[data.host].decoder.unpipe();

			delete self.streamSocketList[data.host];
		}

		if( typeof callback === "function")
		{
			callback();
		}
	};

	this.initFromFS = function(data)
	{
		GLOBAL.store.currentSong = data;
		// create new streamSocket object if not exist
		if( typeof self.streamSocketList[data.host] == "undefined" || self.streamSocketList[data.host].stream === null)
		{
			self.streamSocketList[data.host] = {
				fs : null,
				decoder: null,
				stream: null,
				socket: socketClient.connect(data.host + ':6500')
			};
		}
		else
		{
			// reconnect socket here! (actually not)
			// self.streamSocketList[data.host].socket.socket.connect();
			self.streamSocketList[data.host].decoder.on('end', function(){
				console.log('unpiped now... init again with new data.');
				self.initFromFS(data);
			});
			self.cancelAudioStream(data, function(){
				// call self again // STACKOVERFLOW OMG
				console.log('canceledAudioStream');
				setTimeout(function(){
					self.initFromFS(data);
				}, 1500);
			});
			return;
		}

		// create streams
		self.streamSocketList[data.host].fs = fs.createReadStream(data.file);
		self.streamSocketList[data.host].decoder = lame.Decoder();
		self.streamSocketList[data.host].stream = streamSocket.createStream();
		
		// emit stream via socket
		streamSocket(self.streamSocketList[data.host].socket).emit('onStream', self.streamSocketList[data.host].stream, data);
		
		self.streamSocketList[data.host].socket.on('streamEnd', function(data)
		{
			console.log(data);
			console.log('streamEnd');
			//self.streamSocketList[data.host].socket.disconnect();
			delete self.streamSocketList[data.host];
			// self.initAudioStream(data);

		});

		// pipe it along
		// fs -> decoder -> stream   -  -  -  -  -  -  -  -  -  reciever -> audioOutput -> speaker -> air -> ear :)
		self.streamSocketList[data.host].fs.pipe(self.streamSocketList[data.host].decoder).pipe(self.streamSocketList[data.host].stream);
		
	};

	this.initFromPCM = function(data)
	{
		console.log(data);
		if( typeof self.streamSocketList[data.host] == "undefined" || self.streamSocketList[data.host].stream === null)
		{
			// create
			self.streamSocketList[data.host] = {
				spotify: data.spotifyStream,
				stream: null,
				socket: socketClient.connect(data.host + ':6500')
			};
		}
		else
		{
			// reconnect here!
			self.streamSocketList[data.host].socket.socket.connect();
		}

		// create streams
		self.streamSocketList[data.host].stream = streamSocket.createStream();
		
		// emit stream via socket
		streamSocket(self.streamSocketList[data.host].socket).emit('onStream', self.streamSocketList[data.host].stream, data);
		
		self.streamSocketList[data.host].socket.on('streamEnd', function(data)
		{
			console.log(data);
			console.log('streamEnd');
			self.streamSocketList[data.host].socket.disconnect();
			delete self.streamSocketList[data.host];
			// self.initAudioStream(data);
		});

		// pipe it along
		self.streamSocketList[data.host].spotify.pipe(self.streamSocketList[data.host].stream);
		
	};

	this.initAudioStream = function(data)
	{
		// init FS -> decoder -> ...
		if(typeof data == 'object' && typeof data.file == 'string')
		{
			self.initFromFS(data);
		}
		// directly init from PCM data
		else
		{
			self.initFromPCM(data);
		}

		
	};

	return {
		version: '0.0.2',
		updateReciever: self.updateReciever,
		cancelAudioStream: self.cancelAudioStream,
		initAudioStream: self.initAudioStream,
		getDeviceList: self._devices,
		file: self.file
	};


};
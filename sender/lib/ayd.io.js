module.exports = function(vent)
{
	var socketClient = require('socket.io-client'),
		lame = require('lame'),
		_ = require('lodash'),
		util = require('util'),
		gain = require('./gainStream.js'),
		streamSocket = require('socket.io-stream'),
		fs = require('fs');

	var self = this;

	// debug
	this.debug = false;
	this.verbose = false;

	// instance vars
	this.__instance = this;
	this.recieverList = [];
	this.streamSocketList = [];

	this.next = false;
	this.file = false;

	vent.on('SOCKET:audioSubmit', function(data){
		if(data.host && data.file){
			self.initAudioStream(data);
		}
	});

	vent.on('SOCKET:cancelAudio', function(data){
		self.cancelAudioStream(data);
	});

	vent.on('SOCKET:setRecieverGain', function(data){
		var Host = self.getHostObject(data.ip);
		Host.socket.emit('setGain', data.dB);
	});

	this.getHostObject = function( ip ){
		var host = self.streamSocketList[ip];
		if(host)
		{
			return host;
		}
		else
		{
			console.warn("we dont have "+ip+" in our hostlist");
			return false;
		}
	};

	this.cancelAudioStream = function(data, callback)
	{
		var host = self.getHostObject(data.host);
		if(host.socket)
		{
			host.socket.emit('destroyAudioStream');
		}

		// instead of unpiping try to send ZEROs to the reciever or just do both
		var currentDevice = _.find(GLOBAL.store.devices, function(device){
			return device.ip == data.host;
		});

		if(currentDevice)
		{
			currentDevice.isPlaying = false;
		}

		if( typeof self.streamSocketList[data.host] === "object" )
		{
			console.log('isObject');
			self.streamSocketList[data.host].fs.unpipe();
			self.streamSocketList[data.host].decoder.unpipe();
			//self.streamSocketList[data.host].stream.end();

			delete self.streamSocketList[data.host];
		}

		if( typeof callback === "function")
		{
			callback();
		}
	};

	this.initFromFS = function(data)
	{
		if(GLOBAL.store.devices.length === 0)
		{
			return;
		}

		var currentDevice = _.find(GLOBAL.store.devices, function(device){
			return device.ip === data.host;
		});

		GLOBAL.store.currentSong = data.file;
		currentDevice.isPlaying = true;

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
			// register decoder end callback
			self.streamSocketList[data.host].decoder.on('end', function(){
				console.log('unpiped now... init again with new data.');
				self.initFromFS(data);
			});

			// init end event
			self.cancelAudioStream(data, function(){
				console.log('canceledAudioStream');
				// call myself in a few seconds. should be unpiped then.
				setTimeout(function(){
					self.initFromFS(data);
				}, 600);
			});
			return;
		}

		// create streams
		self.streamSocketList[data.host].fs = fs.createReadStream(data.file);
		self.streamSocketList[data.host].decoder = lame.Decoder();
		self.streamSocketList[data.host].stream = streamSocket.createStream();

		// streamEnd CB (TODO: DO I REALLY NEED THIS?)
		self.streamSocketList[data.host].socket.on('streamEnd', function(data)
		{
			console.log('streamEnd');
			delete self.streamSocketList[data.host];
		});

		// emit stream via socket after we know the format
		self.streamSocketList[data.host].decoder.on('format', function(format){
			vent.emit('AYDIO:MP3Format', format);
			data.format = format;
			streamSocket(self.streamSocketList[data.host].socket).emit('initAudioStream', self.streamSocketList[data.host].stream, data);
		});

		// pipe it along fs -> decoder -> stream socket
		self.streamSocketList[data.host].fs.pipe(self.streamSocketList[data.host].decoder).pipe(self.streamSocketList[data.host].stream, { end: false });
		
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
		version: '0.0.4',
	};

};

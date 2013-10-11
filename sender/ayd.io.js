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

	this.recieverList = [];
	this.streamSocketList = [];
	this.webSocket = webSocket;
	this.next = false;

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

	this.initAudioStream = function(data)
	{
		console.log(data);

		console.log(self.streamSocketList[data.host]);
		console.log(typeof self.streamSocketList[data.host]);

		if( typeof self.streamSocketList[data.host] == "undefined" || self.streamSocketList[data.host].stream == null)
		{
			// create
			self.streamSocketList[data.host] = {
				fs : null,
				decoder: null,
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
		self.streamSocketList[data.host].fs = fs.createReadStream(data.file);
		self.streamSocketList[data.host].decoder = lame.Decoder();
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

		})

		// pipe it along
		// fs -> decoder -> stream   -  -  -  -  -  -  -  -  -  reciever -> audioOutput -> speaker -> air -> ear :)
		self.streamSocketList[data.host].fs.pipe(self.streamSocketList[data.host].decoder).pipe(self.streamSocketList[data.host].stream);
		
	};

	return {
		version: '0.0.1',
		updateReciever: self.updateReciever,
		cancelAudioStream: self.cancelAudioStream,
		initAudioStream: self.initAudioStream,
		getDeviceList: self._devices
	};


};
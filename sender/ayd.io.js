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

		if( typeof self.streamSocketList[data.host] === "undefined" )
		{
			console.log('isUndefined');
			// this is the stream socket obj.
			self.streamSocketList[data.host] = {
				fs : null,
				decoder: null,
				stream: null,
				socket: null,
			};
		}else{
			console.log('isDefined');
		}

		// create streams
		self.streamSocketList[data.host].socket = socketClient.connect(data.host + ':6500');
		self.streamSocketList[data.host].fs = fs.createReadStream(data.file);
		self.streamSocketList[data.host].decoder = lame.Decoder();
		self.streamSocketList[data.host].stream = streamSocket.createStream();
		
		// emit stream via socket
		streamSocket(self.streamSocketList[data.host].socket).emit('onStream', self.streamSocketList[data.host].stream, {name: data});
		
		// experimental unpipe cb
		self.streamSocketList[data.host].stream.on('unpipe', function(src)
		{
			console.log('unpipe stream init');
			//self.streamSocketList[data.host].socket.emit('onCancel', self.streamSocketList[data.host].stream,{foo: 'bar'});
		});

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
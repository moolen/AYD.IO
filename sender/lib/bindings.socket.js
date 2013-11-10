var bindings = function( vent )
{
	var _ = require('lodash'),
	io = require('socket.io').listen(6556);
	io.set('log level', 1);

	io.sockets.on('connection', function (webSocket) {

		//console.log(GLOBAL.store);

		// send initial configuration file to the client
		webSocket.emit('initcfg', { config: GLOBAL.store });

		// handle error
		webSocket.on('error', function(err){
			console.log(err);
		});

		/**
		 * Propagate deviceChange to the client
		 */
		vent.on('PING:DeviceChange', function(devices){
			console.log('device changed');
			webSocket.emit('DeviceChange', devices);
		});

		/**
		 * AUDIO SUBMIT 
		 */
		webSocket.on('audioSubmit', function (data) {
			vent.emit('SOCKET:audioSubmit', data);
			
		});

		/**
		 * setRecieverGain
		 */
		webSocket.on('setRecieverGain', function(data){
			// which reciever? 
			// which socket ?
			// AYDIO handles that
			vent.emit('SOCKET:setRecieverGain', data);
		});

		/**
		 * CANCEL AUDIO
		 */
		webSocket.on('cancelAudio', function(data){
			console.log('cancelAudioRecieved');
			vent.emit('SOCKET:cancelAudio', data);
		});

		webSocket.on('getDirectoryContent', function(data){
			vent.emit('SOCKET:getDirectoryContent', data);
		});

		/**
		 * FS CHANGE
		 */
		webSocket.on('FSChange', function(data){
			vent.emit('SOCKET:FSChange', data, function(FSData){
				webSocket.emit('FSSuggestion', {
					fileList : FSData.fileList,
					suggestions: FSData.suggestions,
					currentDir: FSData.currentDir,
					searchString: FSData.searchString
				});
			});
		});
	});
};

module.exports = bindings;
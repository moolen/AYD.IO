var bindings = function( vent )
{
	var _ = require('lodash'),
	io = require('socket.io').listen(6556);
	io.set('log level', 1);

	io.sockets.on('connection', function (webSocket) {

		/* ---------------------------------------	*/
		/* ------------ EVENTS BINDINGS ----------	*/
		/* ---------------------------------------	*/
		/* Propagate internal events to to socket	*/
		/* --------- and other way round ---------	*/
		/* ---------------------------------------	*/
		/* ---------------------------------------	*/

		// send initial configuration file to the client
		webSocket.emit('initcfg', { config: GLOBAL.store });

		// prevent errors from throwing & logg 'em to the console
		webSocket.on('error', function(err){
			console.log(err);
		});

		/* ---------------------------------------	*/
		/* ------------ DEVICE CHANGE ------------	*/
		/* ---------------------------------------	*/

		/* Propagate deviceChange to the client */
		vent.on('PING:DeviceChange', function(devices){
			console.log('device changed');
			webSocket.emit('DeviceChange', devices);
		});

		/* ---------------------------------------	*/
		/* ---------- FILESYSTEM EVENTS ----------	*/
		/* ---------------------------------------	*/

		/* routes the directoryContent request back to the client */
		vent.on('FSREADER:directoryContent', function(data){
			webSocket.emit('directoryContent', data);
		});

		/* get Directory content */
		webSocket.on('getDirectoryContent', function(data){
			vent.emit('SOCKET:getDirectoryContent', data);
		});

		/* FS CHANGE */
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

		/* ---------------------------------------	*/
		/* -------- AUDIO PLAYBACK EVENTS --------	*/
		/* ---------------------------------------	*/

		/* PLAY AUDIO */
		webSocket.on('audioSubmit', function (data) {
			vent.emit('SOCKET:audioSubmit', data);
		});

		/* CANCEL AUDIO */
		webSocket.on('cancelAudio', function(data){
			console.log('cancelAudioRecieved');
			vent.emit('SOCKET:cancelAudio', data);
		});

		/* MP3 METADATA */
		vent.on('AYDIO:MP3Metadata', function(data){
			webSocket.emit('MP3Metadata', data);
		});

		/* VOLUME CONTROL */
		webSocket.on('setRecieverGain', function(data){
			// which reciever? 
			// which socket ?
			// AYDIO handles that
			vent.emit('SOCKET:setRecieverGain', data);
		});

		/* rewind music */
		webSocket.on('rewindAudio', function(data){
			vent.emit('SOCKET:rewindAudio', data);
		});

	});
};

module.exports = bindings;
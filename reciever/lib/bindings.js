var io = require('socket.io').listen(6500),
	streamSocket = require('socket.io-stream'),
	Speaker = require('./speaker.js');
	//GainModule = require('./gainModule.js');

var streamObject, speaker, audioOptions, gainObject;

module.exports = function( vent )
{
	io.set('log level', 1);

	// connection event
	io.sockets.on('connection', function(socket){

		console.log('connected.');
		
		/**
		 * INITIALIZE THE AUDIO STREAM
		 * @param  {stream object} stream
		 * @param  {object} data   
		 */
		streamSocket(socket).on('initAudioStream', function(stream, data)
		{
			console.log('init Audio stream');
			streamObject = stream;

			audioOptions = {
				channels: data.format.channels,
				bitDepth: data.format.bitDepth,
				sampleRate: data.format.sampleRate,
				vent: vent
			};

			speaker = null;
			speaker = new Speaker(audioOptions);
			
			streamObject.pipe(speaker);
		});

		/**
		 * set the output Gain 
		 * @param  {object} data | e.g.: { dB: -3 }
		 */
		socket.on('setGain', function(dB){
			console.log('setGain @ Reciever');
			vent.emit('SOCKET:setGain', dB);
		});

		/**
		 * destroy the Audio Stream, buffer, gain, Speacker
		 */
		socket.on('destroyAudioStream', function(stream, data)
		{
			console.log('destroyAudioStream');
			if(streamObject || speaker)
			{
				console.log('unpiped.');
				streamObject.unpipe();
				try{
					speaker.end();
					vent.removeAllListeners('SOCKET:setGain');
				}
				catch(e)
				{
					console.log(e);
				}
				
				speaker = null;
			}
		});

		/**
		 * destroy stuff on d/c
		 */
		socket.on('disconnect', function(){
			console.log('disconnnect');
		});
	});
};

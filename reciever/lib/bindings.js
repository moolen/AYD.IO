var io = require('socket.io').listen(6500),
	exec = require('child_process').exec,
	child = undefined,
	streamSocket = require('socket.io-stream'),
	lame = require('lame'),
	Speaker = require('./speaker.js');
	//GainModule = require('./gainModule.js');

var streamObject, speaker, audioOptions, gainObject, decoder;

module.exports = function( vent )
{
	io.set('log level', 1);

	// connection event
	io.sockets.on('connection', function(socket){

		console.log('connected.');
		
		/**
		 * INITIALIZE THE AUDIO STREAM
		 */
		streamSocket(socket).on('initAudioStream', function(stream, data)
		{
			console.log('init Audio stream');
			streamObject = stream;

			audioOptions = {
				channels: data.streams[0].channels || 2,
				bitDepth: data.format.bit_rate / 1000 || 16,
				sampleRate: data.streams[0].sample_rate || 44100,
				vent: vent
			};

			decoder = lame.Decoder();
			speaker = new Speaker(audioOptions);
			
			streamObject.pipe(decoder).pipe(speaker);
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
		 * set the output Gain 
		 * @param  {object} data | e.g.: { dB: -3 }
		 */
		socket.on('setGain', function(level){
			console.log('setGain @ Reciever'+level);
			child = exec('amixer sset PCM '+level * 100 + '%', function(err, stdout, stderr){
				if(err || stderr)
					console.log('could not change output volume:' + err + stderr);
				
			});
			//vent.emit('SOCKET:setGain', dB);
		});
	});
};

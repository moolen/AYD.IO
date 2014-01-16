var io = require('socket.io').listen(6500),
	exec = require('child_process').exec,
	child = null,
	fs = require('fs'),
	probe = require('node-ffprobe'),
	config = require('../config.json'),
	streamSocket = require('socket.io-stream'),
	lame = require('lame'),
	Speaker = require('./speaker.js');
	//GainModule = require('./gainModule.js');

var streamObject, speaker, audioOptions, gainObject, decoder;

module.exports = function( vent )
{
	io.set('log level', 1);

	var self = {
		playing : false
	};

	// connection event
	io.sockets.on('connection', function(socket){

		console.log('connected.');

		// init stuff
		vent.emit('SOCKET:getDirectoryContentINIT', { path: config.musicDirectory });

		vent.off('FSREADER:directoryContentINIT', directoryContentINIT).on('FSREADER:directoryContentINIT', directoryContentINIT);
		function directoryContentINIT(data){
			GLOBAL.store.musicDirectory.folders = data;
			socket.emit('initcfg', { config: GLOBAL.store });
		}
		// DIR CONTENT   SOCKET -> VENT
		socket.on('getDirectoryContent', function(data){
			vent.emit('SOCKET:getDirectoryContent', data);
		});

		// DIR CONTENT   VENT -> SOCKET
		vent.off('FSREADER:directoryContent', directoryContent).on('FSREADER:directoryContent', directoryContent);
		function directoryContent(data){
			console.log("socket emission");
			socket.emit('directoryContent', data);
		}
		/**
		 * INITIALIZE THE AUDIO STREAM
		 */
		streamSocket(socket).on('initAudioStream', initAudioStream);

		/**
		 * destroy the Audio Stream, buffer, gain, Speacker
		 */
		socket.on('destroyAudioStream', destroyAudioStream);
		vent.off('destroyAudioStream', destroyAudioStream).on('destroyAudioStream', destroyAudioStream);
		/**
		 * set the output Gain 
		 * @param  {object} data | e.g.: { dB: -3 }
		 */
		socket.on('setGain', function(level){

			// make it more natural
			level = Math.pow(10, (level / 20));
			console.log('setGain @ Reciever'+level);
			child = exec('amixer sset PCM '+level * 100 + '%', function(err, stdout, stderr){
				if(err || stderr)
					console.log('could not change output volume:' + err + stderr);

			});
			//vent.emit('SOCKET:setGain', dB);
		});

		socket.on('audioSubmit', function(data){
			
			// update global state
			GLOBAL.store.currentSong = data.file;
			GLOBAL.store.currentFilename = data.filename;
			//console.log(data);
			
			var mp3Stream = fs.createReadStream(data.file);
			
			probe(data.file, function(err, probeData){
				if(err)
				{
					console.log(err);
					console.log('do you have ffmpeg installed?');
				}
				//streamSocket(self.streamSocketList[data.host].socket).emit('initAudioStream', self.streamSocketList[data.host].stream, probeData);
				
				// kill old interval
				//clearInterval(self.playbackInterval);

				// setup global state
				// GLOBAL.store.playbackState[data.host] = {
				// 	artist: probeData.metadata.artist,
				// 	album: probeData.metadata.album,
				// 	title: probeData.metadata.title,
				// 	duration: probeData.format.duration,
				// 	currentTime: 0,
				// };
				//if(self.playing)
				//	
				initAudioStream(mp3Stream, probeData);

				// setup new interval
				// self.playbackInterval = setInterval(function(){
				// 		GLOBAL.store.playbackState[data.host].currentTime++;
				// 	}, 1000);

				// kill new intervall in the future
				// setTimeout(function(){
				// 	clearInterval(self.playbackInterval);
				// }, probeData.format.duration * 1000);

				//vent.emit('AYDIO:MP3Metadata', probeData );
			});
		});

		function initAudioStream(stream, data){
			
			var stream = arguments[0],
				data = arguments[1];

			if(!stream && !data){
				console.log(stream, data);
				return;
			}


			if(self.playing){
				//vent.emit('destroyAudioStream');
				//setTimeout(initAudioStream, 200, [stream, data]);
				//return false;
				destroyAudioStream();
			}
			self.playing = true;

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
		}

		function destroyAudioStream(stream, data){
			console.log('destroyAudioStream');
			if(streamObject){
				//console.log('unpiped.');
				streamObject.unpipe();
				if(speaker){
					try{
						speaker.end();
						vent.removeAllListeners('SOCKET:setGain');
					}
					catch(e)
					{
						console.log(e);
					}
				}
				speaker = null;
				self.playing = false;
			}
		}
	});
};
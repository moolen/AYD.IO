/*
 * GET home page.
 */

exports.index = function(req, res){

	console.log("file name", req.files.myFile);
	// libs
	var lame = require('lame');
	var Speaker = require('speaker');
	var fs = require('fs');

	var audioOptions = {channels: 2, bitDepth: 16, sampleRate: 44100};
	var decoder = lame.Decoder();
	var speaker = new Speaker(audioOptions);

	function playSong(file) {
		
		// Read the first file
		var inputStream = fs.createReadStream(file);
		// Pipe the read data into the decoder and then out to the speakers
		inputStream.pipe(decoder).pipe(speaker);
	}

	playSong(req.files.myFile.path);
	res.write(JSON.stringify({'result' : 'yey'}));
	res.end();
};
// libs
var baudio = require('baudio');
var lame = require('lame');
var Speaker = require('speaker');
var async = require('async');
var fs = require('fs');

var audioOptions = {channels: 2, bitDepth: 16, sampleRate: 44100};
var file = './music/lpd.mp3';
var decoder = lame.Decoder();

function playSong(file) {
  var speaker     = new Speaker(audioOptions);
  // Read the first file
  var inputStream = fs.createReadStream(file);
  // Pipe the read data into the decoder and then out to the speakers
  inputStream.pipe(decoder).pipe(speaker);
  speaker.on('flush', function(){
	console.log('done.');
  });
}

playSong(file);
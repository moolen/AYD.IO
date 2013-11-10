var stream = require('stream'),
	//Buffer = require('buffer'),
	Speaker = require('speaker');

var speaker = new Speaker({channels: 2, bitDepth: 16, sampleRate: 44100});

var gainStream = new stream.Transform({ objectMode: true });

var attentuation = (-3 / 20);
var gain = Math.pow(10, attentuation);

gainStream._transform = function(chunk, encoding, done)
{
	var buffer = new Buffer(chunk.length);
	var chunkLength = chunk.length;
	var i = 0;

	while( i < chunkLength - 1 )
	{
		buffer.writeInt16BE( Math.round(chunk.readInt16BE(i) * 0.6) , i );
		i += 1;
	}
	this.push(buffer);
    done();
};

gainStream.on('error', function(err){
	console.log(err);
});

gainStream.on('data', function(chunk){
	//console.log(chunk);
});

gainStream.pipe(speaker);

module.exports = gainStream;
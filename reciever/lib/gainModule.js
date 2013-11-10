var stream = require('stream');

var Gain = function()
{
	var gainStream = new stream.Duplex({ objectMode: true });

	// default gain
	gainStream.gain = 1;

	// set gain 
	gainStream.setGain = function(dB)
	{
		var gain = Math.pow(10, (dB / 20));
		this.gain = gain;
	};

	/**
	 * readable interface
	 */
	gainStream._read = function(length)
	{
		//console.log("length: "+length);
		// return "fffaff";
	};

	/**
	 * writable interface
	 */
	gainStream._write = function(chunk, encoding, done)
	{
		//console.log('transform:' + this.gain);
		// var buffer = new Buffer(chunk.length);
		// var chunkLength = chunk.length;
		// var i = 0;

		// while( i < chunkLength - 1 )
		// {
		// 	buffer.writeInt16BE( Math.round(chunk.readInt16BE(i) * this.gain) , i );
		// 	i += 1;
		// }
		//console.log(chunk);
		this.push(buffer);
		done();
	};

	gainStream.on('read', function(chunk){
		console.log("read event");
	});

	gainStream.on('error', function(err){
		console.log("error event", err);
	});

	gainStream.on('data', function(chunk){
		console.log(chunk);
	});

	return gainStream;

};



module.exports = Gain;
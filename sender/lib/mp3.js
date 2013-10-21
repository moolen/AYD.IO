var mp3Parser = {};

mp3Parser.readSampleRate = function(buffer)
{
    var offset = 0;

    if( buffer.slice(0, 3).toString() === "ID3" )
    {
        // check size of ID3 tag
        var size =  (buffer[9] & 0xFF) | ((buffer[8] & 0xFF) << 7) | ((buffer[7] & 0xFF) << 14) | ((buffer[6] & 0xFF) << 21) + 10;
        var hasExtendedHeader = (buffer[5] & 0x80) !== 0 ? true : false;
        console.log(size);
        console.log(buffer.slice(size, size+24));

    }
};

module.exports = mp3Parser;
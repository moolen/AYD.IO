var stream = require('stream'),
    util = require('util'),
    socketClient = require('socket.io-client'),
    lame = require('lame'),
    streamSocket = require('socket.io-stream'),
    fs = require('fs');

module.exports = function()
{
    var libspotify = require('libspotify');
    var config = require('../.account.json');
    //var Speaker = require('speaker');
    var audioOptions = {channels: 2, bitDepth: 16, sampleRate: 44100};
    var self = this;
    this.currentList = null;
    this.maxTrackCount = config.maxTrackCount || 12;

    this.search = function(data, callback)
    {
        console.log('spotify search');
        if(!self.session)
        {
            self.createSession();
        }
        var search = new libspotify.Search(data);
        search.trackCount = self.maxTrackCount;
        search.execute();
        search.once('ready', function() {
            if(!search.tracks.length) {
                console.error('there is no track to play :[');
                callback({error: 'there is no track to play :['});
            }
            else
            {
                self.currentList = search.tracks;
                callback(search.tracks);
            }
        });
    };

    this.startPlayer = function(data, aydio, callback)
    {
        if(!data.host || !data.id)
        {
            return false;
        }

        if( self.player && self.player.isPlaying )
        {
            self.player.stop();
        }
        
        if(!self.session)
        {
            self.createSession();
        }

        var binaryStream = streamSocket.createStream();
        var clientSocket = socketClient.connect(data.host + ':6500');
        var track = self.currentList[data.id];

        streamSocket(clientSocket).emit('onStream', binaryStream, data);

        //aydio.initAudioStream({ host: data.host, spotifyStream: spotifystream });
        self.player = self.session.getPlayer();
        self.player.load(track);
        self.player.play();
        self.player.pipe(binaryStream);

        console.error('playing track. end in %s', track.humanDuration);

        self.player.once('track-end', function() {
            console.error('track ended');
            if(typeof callback === "function")
            {
                callback();
            }
            self.killSession();
        });
    };

    this.stopPlayer = function()
    {
        console.log('stop Player');
        if(self.player)
        {
            self.killSession();
        }
        
    };

    this.createSession = function()
    {
        console.log('spotify create Session');
        self.session = new libspotify.Session({
            applicationKey: __dirname + '/../spotify_appkey.key'
        });
        self.session.login(config.username, config.password);
        return self;
    };

    this.killSession = function ()
    {
        console.log('kill Session');
        self.player.stop();
        if(self.session)
        {
            self.session.close();
        }
        
        delete self.session;
    };

    return {
        search: this.search,
        stopPlayer : this.stopPlayer,
        startPlayer : this.startPlayer
    };
};
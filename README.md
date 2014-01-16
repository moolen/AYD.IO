# AYD.IO
this is not even alpha.
It is a Airplay(r)(tm)-like Music streaming service using Webtechnology. In particular Websockets are used to stream binary PCM data over the network from a sender app to the reciever app.

## TODO
- [x] support all mp3 samplerates, channels & bitdepth
- [x] make that next & prev button work
- [x] Build a webinterface for the reciever app to fetch a mp3 directly on the reciever.[[link](https://github.com/moolen/AYD.IO/issues/1)]
- [x] Complete the Volume contol feature
- [x] Complete Timeline feature
- [ ] Remove path-input and replace it with a clickable folder structure

## depedencies
### general
[nodeJS](http://nodejs.org/download/), a working nework configuration on your OS. Sender and reciever app have to be in the same subnet.

### reciever app
On Debial based OS (ubuntu/elementary OS): The ALSA backend is selected by default (by the [speaker](https://npmjs.org/package/speaker) module), be sure to have the alsa.h header file in place: `$ sudo apt-get install libasound2-dev`.

### sender app
You need FFMPEG: `sudo apt-get install ffmpeg` or look [here](http://www.ffmpeg.org/download.html).

## installation
clone this repository, install the node modules with `npm install`. 
For spotify support fetch the feature-spotify branch, install [libspotify](https://developer.spotify.com/technologies/libspotify/) **before** you do `npm install`. Further you have to create a .account.json (look at .account.json-sample) inside the **sender** folder  and enter your spotify credentials and get a libspotify application key and save it as spotify-appkey.key inside the **sender** directory.

## fire it up
start the sender and reciever app `cd sender/ && node app.js` and `cd reciever/ && node app.js` and go to `http://localhost:3000`.
Both node processes can run on the same machine or on separate machines which are in the same network. 
click on the Reciever and enter the path to the directory where the .mp3 files is you want to play.

## streaming sources
From Filesystem or via Spotify (you need a Premium Account).

## streaming targets
Stream to anything that can run NodeJS.
Im using it at home with my Raspberry pi via wifi.

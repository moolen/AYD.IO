# AYD.IO
this is not even alpha.

this is a Airplay(r)(tm)-like Music streaming service using Webtechnology. In particular Websockets are used to stream binary PCM data over the network from a sender app to the reciever app.

## installation
clone this repository, install the node modules with `npm install`. 
For spotify support fetch the feature-spotify branch, install [libspotify](https://developer.spotify.com/technologies/libspotify/) **before** you do `npm install`. Further you have to create a .account.json (look at .account.json-sample) inside the **sender** folder  and enter your spotify credentials and get a libspotify application key and save it as spotify-appkey.key inside the **sender** directory.

## fire it up
start the sender and reciever app `cd sender/ && node app.js` and `cd reciever/ && node app.js` and go to http://localhost:3000.
Both node processes can run on the same machine or on separate machines which are in the same network. 
click on the Reciever and enter the path to the directory where the .mp3 files is you want to play. 
Note: only mp3 files with a sample rate of 44.1kHz are played correctly (i am working on that).
Note: After the end of a song the stream socket dies and both processes have to be restarted.


## streaming sources
From Filesystem or via Spotify (you need a Premium Account).

## streaming targets
Stream to anything that can run NodeJS.
Im using it at home with my Raspberry pi via wifi.

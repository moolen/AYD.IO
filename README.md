# AYD.IO
this is not even alpha.

this is a Airplay(r)(tm)-like Music streaming service using Webtechnology. In particular Websockets are used to stream binary PCM data over the network from a sender app to the reciever app.

## installation
clone this repository, install the node modules with `npm install`. 
For spotify support install [libspotify](https://developer.spotify.com/technologies/libspotify/) **before** you do `npm install`. Further you have to create a .account.json (look at .account.json-sample) inside the **sender** folder  and enter your spotify credentials and get a libspotify application key and save it as spotify-appkey.key inside the **sender** directory.

## streaming sources
From Filesystem or via Spotify (you need a Premium Account).

## streaming targets
Stream to anything that can run NodeJS.
Im using it at home with my Raspberry pi via wifi.

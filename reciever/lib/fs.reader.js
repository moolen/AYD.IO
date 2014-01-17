var fs = require('fs'),
	config = require('../config.json'),
	async = require('async'),
	_ = require('lodash');

module.exports = function( vent ){

	// events
	vent.on('SOCKET:FSChange', autocomplete);
	
	vent.on('SOCKET:getDirectoryContentINIT', function(data){
		getDirectoryContent(data, function(items){
			vent.emit('FSREADER:directoryContentINIT', items, data);
		});
	});
	vent.on('SOCKET:getDirectoryContent', function(data){
		getDirectoryContent(data, function(items){
			vent.emit('FSREADER:directoryContent', items, data);
		});
	});

	// init:get Music Directory Content
	getMusicDirContent();

	return {
		autocomplete: autocomplete,
		getMusicDirContent: getMusicDirContent,
		getDirectoryContent: getDirectoryContent,
	};
};

var util = {};

util.getStats = function(path, callback)
{
	fs.stat( path, function(err, stats){
		if(typeof callback === "function")
		{
			callback(err, stats);
		}
	});
};

util.isDirectory = function(path, callback)
{
	fs.stat( path, function(err, stats){
		if(typeof callback === "function")
		{
			callback( stats.isDirectory() );
		}
	});
};

util.isFile = function(path, callback)
{
	fs.stat( path, function(err, stats){
		if(typeof callback === "function")
		{
			callback( stats.isFile() );
		}
	});
};

/**
 * the Autocompleter
 * @param  {object}   data     [ { path: "path/to/dir" } ]
 * @param  {Function} callback [gets called when done]
 */
var autocomplete = function(data, callback)
{
	var pos = data.path.lastIndexOf('/');
	var currentDir = data.path.substr(0, pos + 1);
	var searchString = data.path.substr(pos + 1);

	try{
		var dir = fs.readdir(currentDir, function(err, files){
			var dir = [];
			var fileList = [];

			_.each(files, function(file, i){

				// matches searchString?
				var match = new RegExp("^" + searchString);
				var isMatch = match.test(file);

				if(isMatch && searchString.length > 0)
				{
					dir.push(file);
				}
				// matches file extension?
				if(file.match(/.mp3/) !== null)
				{
					fileList.push(file);
				}
			});

			GLOBAL.store.currentDir = currentDir;

			if(typeof callback === "function")
			{
				callback({
					fileList: fileList,
					suggestions: dir,
					currentDir: currentDir,
					searchString: searchString
				});
			}
		});

		dir.on('error', function(err){
			console.log(err);
		});
	}catch(e){
		console.log(e);
	}
	
};

/**
 * get Directories inside "musicDirectory" @ config.json
 * @param  {Function} callback [exec when done]
 */
var getMusicDirContent = function(callback)
{
	GLOBAL.store.musicDirectory.folders = [];

	fs.readdir(config.musicDirectory, function(err, files)
	{
		_.each(files, function(file){
			util.isDirectory(config.musicDirectory + file, function(isDir){
				if(isDir)
				{
					GLOBAL.store.musicDirectory.folders.push(file);
				}
			});
		}, function(err){
			if(typeof callback === "function")
			{
				callback(err, GLOBAL.store.musicDirectory.folders);
			}
		});
	});
};

/**
 * get Subdirectory inside musicDirectory
 * @param  {object} cfg | configuration object: path / showDirectories / showFiles 
 * @param {function} callback | callback function
 */
var getDirectoryContent = function( cfg, callback )
{
	console.log(cfg);
	cfg = cfg || {};
	var items = [];
	var conf = cfg || {};

	conf.path = cfg.path || config.musicDirectory;
	conf.showFolders = cfg.showFolders || true;
	conf.showFiles = cfg.showFiles || false;
	conf.showMP3 = cfg.showMP3 || true;
	console.log(conf.path);
	fs.readdir(conf.path, function(err, files){
		if(!files)
		{
			return false;
		}
		async.each(files, function(file, done){
			util.getStats( conf.path + file, function(err, stats){
				// show wanted stuff: folders, files, mp3s
				if(
					(
						stats.isFile() === conf.showFiles
						&& stats.isDirectory() === conf.showFolders
					)
					|| ( file.match(/.mp3/) && conf.showMP3 )
				)
				{
					var type = getFileType(file, stats);
					items.push({ filename: file, type: type });
				}
				done();
			});
		}, function(){
			if(typeof callback === "function")
			{
				callback(items);
			}
		});
	});
};

var getFileType = function(file, stats){

	if(stats.isDirectory())
		return "dir";

	if(stats.isFile()){
		if(file.match(/.mp3/)){
			return "mp3";
		}else{
			return "file";
		}
	}

};
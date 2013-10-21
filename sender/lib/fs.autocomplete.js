module.exports = function(data, webSocket)
{
	var fs = require('fs'),
		_ = require('lodash');

	var pos = data.path.lastIndexOf('/');
	var currentDir = data.path.substr(0, pos + 1);
	var searchString = data.path.substr(pos + 1);

	fs.readdir(currentDir, function(err, files){
		var dir = [];
		var fileList = [];
		_.each(files, function(file, i){

			// matches searchString?
			var match = new RegExp("^" + searchString);
			var isMatch = match.test(file);
			// console.log(isMatch + ' for: ' + file);
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
		webSocket.emit('onFSSuggestion', {
			fileList : fileList,
			suggestions: dir,
			currentDir: currentDir,
			searchString: searchString
		});
	});
};
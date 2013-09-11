var socket = io.connect('http://localhost:6556');

function FSAutocomplete(config)
{
	var self = this;

	// defaults
	this.input = config.input || $('#FS');
	this.suggestion = config.suggestion || $('#suggestion');
	this.socket = config.socket;
	this.fileList = config.fileList || $('#fileList');
	this.onSelect = config.onSelect;


	// instance vars
	this.currentDir = "";
	this.searchString = "";
	this.suggestionArray = [];
	this.selectedListElement = "";

	// FS input Autocomplete
	this.input.on('keyup', function(e){
		if( e.keyCode === 9 || e.keyCode === 39 )
		{
			if(self.suggestionArray.length > 0)
			{
				var path = self.currentDir + self.suggestionArray[0] + "/";
				console.log('complete');
				self.input.val(path);
			}
			
		}
		socket.emit('onFSChange', { path: $(this).val() });
	});

	// render fileList
	this.renderFileList = function(files)
	{
		var html = "";
		_.each(files, function(file, index){
			
			html += '<li class="file">' + file + '</li>';
		});
		self.fileList.html(html);
		self.initFileListHandler();
	};

	// init fileList click
	this.initFileListHandler = function()
	{
		self.fileList.find('li.file').click(function(){
			self.fileList.find('li.file.selected').removeClass('selected');
			$(this).addClass('selected');
			if(typeof self.onSelect === 'function')
			{
				self.selectedListElement = $(this).html();
				var path = self.currentDir + $(this).html();
				self.onSelect( path );
			}
			
		});
	};

	// socket onFSSuggestion event
	socket.on('onFSSuggestion', function(data){

		// update instance vars
		self.currentDir = data.currentDir;
		self.searchString = data.searchString;
		self.suggestionArray = data.suggestions;

		// update fileList
		if(data.fileList.length > 0)
		{
			self.renderFileList(data.fileList);
		}

		// print suggestion
		if(data.suggestions.length > 0)
		{
			var path = data.currentDir + data.suggestions[0];
			self.suggestion.html(path);
		}else{
			self.suggestion.html('');
		}
		
	});

	// initialize
	this.init = (function()
	{
		self.initFileListHandler();
	})();

}

$(document).ready(function(){

	var FSA = new FSAutocomplete({
		socket: socket,
		onSelect: function(filePath){
			console.log('onAudioSubmit');
			console.log(filePath);
			socket.emit('onAudioSubmit', { file: filePath });
		}
	});

	$('form').on('submit', function(e){
		//e.preventDefault();
		console.log('submit');
		console.log($('form').find('input[name="file"]'));
		//socket.emit('onAudioSubmit', { file: 'asd' });
	});

	$('#cancel').click(function(){
		socket.emit('cancelAudio', {});
	});

	

});

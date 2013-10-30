var socket = io.connect('http://localhost:6556');


var App = function(socket)
{
	return new App.init(socket);
};

App.modules = {};
App.prototypes = {};

// PROTOTYPES
App.prototypes.FileList = function()
{
	var self = this;
	this.fileList = $('#fileList');

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
};

App.prototypes.Source = function()
{
	var self = this;

	this.onClose = function()
	{
		// remove listener etc.
	};
};

// MODULES

/**
 * DeviceUpdater
 */
App.modules.DeviceUpdater = function(config)
{
	var self = this;
	this.socket = config.socket || false;
	this.deviceList = config.deviceList || $('#deviceList');
	this.currentDevice = false;
	this.socket.on('onDeviceChange', function(devices){
		console.log('deviceChange');
		self.renderDeviceList(devices);
	});

	this.renderDeviceList = function(devices)
	{
		var reminder = self.deviceList.find('device.selected').attr('data-ip');
		var html = "";
		_.each(devices, function(device, i){
			html += '<li class="device" data-ip="' + device.ip + '">' + device.name + '</li>';
		});
		self.deviceList.html(html);
		self.initClickHandler();
		self.deviceList.find('.device[data-ip="'+ reminder +'"]');
	};

	this.initClickHandler = function()
	{
		$('#deviceList .device').click(function()
		{
			$('#deviceList').children().removeClass('selected');
			$(this).addClass('selected');
			self.currentDevice = $(this).attr('data-ip');
		});
	};

	this.init = (function()
	{
		this.initClickHandler();
	});
};

/**
 * FILESYSTEM
 */
App.modules.FILESYSTEM = function(config)
{
	var self = this;
	// inherit from filelist
	App.prototypes.FileList.call(this);

	// defaults
	config = config || {};
	this.input = config.input || $('#FS');
	this.suggestion = config.suggestion || $('#suggestion');
	this.socket = config.socket;
	//this.fileList = config.fileList || $('#fileList');
	this.onSelect = function(filePath){
		console.log('onAudioSubmit');
		socket.emit('onAudioSubmit', { file: filePath, host: $('#deviceList .device.selected').attr('data-ip') });
	};

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

	this.removeBindings = function()
	{
		self.fileList.find('li.file').off();
		self.input.off();
		socket.removeAllListeners('onFSSuggestion');
	};

	// initialize
	this.init = (function()
	{
		self.initFileListHandler();
	})();

};

App.modules.SPOTIFY = function(cfg)
{
	var config = cfg || {};
	App.prototypes.FileList.call(this);
	var self = this;
	this.socket = config.socket || false;

	this.initBindings = function()
	{
		$('#FS').on('keyup', function(e)
		{
			console.log(e.keyCode);
			if(e.keyCode === 13)
			{
				var data = $(this).val();
				socket.emit('SpotifySearch', data);
				socket.on('SpotifySearchReturn', self.onSearchReturn);
			}
		});
	};

	this.initFileListHandler = function()
	{
		$('.file').click(function()
		{
			var id = $(this).attr('data-id');
			var o = {
				host: AYDIO.instances.DU.currentDevice,
				id: id
			};
			socket.emit('SpotifyPlaySong', o);
		});
	};

	this.renderFileList = function(files)
	{
		var html = "";
		_.each(files, function(file, index){
			
			html += '<li class="file" data-id="'+file.id+'">' + file.text + '</li>';
		});
		self.fileList.html(html);
		self.initFileListHandler();
	};

	this.onSearchReturn = function(tracks)
	{
		var result = [];
		_.each(tracks, function(el, i)
		{
			var o = {
				text: el.artist.name + " - " + el.title + " " + el.humanDuration,
				id: i
			};
			result.push(o);
		});

		self.renderFileList(result);
	};


	this.removeBindings = function()
	{

	};

	this.init = (function()
	{
		self.initBindings();
		self.initFileListHandler();
	}());
};

/**
 * PlayerControls
 */
App.modules.PlayerControls = function(cfg)
{
	var config = cfg || {};
	var self = this;
	this.socket = config.socket || false;
	// inherit from FileList

	this.initBindings = function()
	{
		$('#cancel').click(function(){
			self.socket.emit('cancelAudio', { host: $('#deviceList .device.selected').attr('data-ip') });
		});
	};

	this.init = (function()
	{
		self.initBindings();
	}());

};

/**
 * SourceMenu
 */
App.modules.SourceMenu = function(cfg)
{
	var config = cfg || {};
	var self = this;
	this.socket = config.socket || false;
	this.list = $('#menu');
	this.sourceCache = {};

	this.initBindings = function()
	{
		// click on source
		self.list.find('li').click(function()
		{
			// save old state in cache
			var oldSource = self.list.find('li.active').attr('data-source');
			var newSource = $(this).attr('data-source');
			
			self.sourceCache[oldSource] = {
				fileList: $('#fileList').html(),
				input: $('.fs-wrapper input').val()
			};
			
			// update state in menu
			self.list.find('li').removeClass('active');
			$(this).addClass('active');

			// emit socket event
			socket.emit('changeSource', newSource);

			// update view
			if(self.sourceCache[newSource])
			{
				$('#fileList').html(self.sourceCache[newSource].fileList);
				$('.fs-wrapper input').val(self.sourceCache[newSource].input);
			}
			else
			{
				// render 
				$('#fileList').html('');
				$('.fs-wrapper input').val('');
				$('.fs-wrapper #suggestion').html('');
			}

			// unregister old Event Handler
			AYDIO.currentSource.removeBindings();

			// register new Event handler
			AYDIO.currentSource = new App.modules[ newSource.toUpperCase() ]();
		});
	};

	this.removeBindings = function()
	{

	};

	this.init = (function(){
		self.initBindings();
	}());
};

/**
 * init
 */
App.init = function(socket)
{
	var self = this;
	this.socket = socket || false;
	this.instances = {};

	// init FS Source per default
	this.currentSource = new App.modules.FILESYSTEM({ socket: socket });

	// init SourceMenu
	this.instances['SourceMenu'] = new App.modules.SourceMenu({socket: socket});

	// init DeviceUpdater
	this.instances['DU'] = new App.modules.DeviceUpdater({socket: socket});
	
	// init PlayerControls
	this.instances['PlayerControls'] = new App.modules.PlayerControls({socket: socket});

	return this;
};

$(document).ready(function(){
	AYDIO = new App(socket);
});

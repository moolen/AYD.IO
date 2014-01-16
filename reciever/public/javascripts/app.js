var App = function()
{
	return new App.init();
};

App.modules = {};
App.prototypes = {};
App.config = {};

// PROTOTYPES
App.prototypes.FileList = function()
{
	var self = this;
	this.fileList = $('#browser');

	// render fileList
	this.renderFileList = function(files)
	{
		self.files = files;
		files = _.sortBy(files, function(el){ return el.type; });
		var html = '<tbody><tr id="folder_up"><td class="col-xs-1 center"><span class="glyphicon glyphicon-folder-open"></span></td><td>..</td></tr>';
		_.each(files, function(file, index){
			var typeClass = (file.type === "dir") ? "folder" : "track";
			var folderClass = (file.type === "dir") ? "glyphicon glyphicon-folder-close" : "glyphicon glyphicon-music";
			var folderIcon = '<td><span class="'+ folderClass +'"></span></td>';
			html += '<tr class="'+ typeClass +'">'+folderIcon+'<td>' + file.filename + '</td></tr>';
		});

		html += "</tbody>";

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
	this.devices = config.devices || App.config.devices;
	this.socket.on('DeviceChange', function(devices){
		console.log('deviceChange');
		self.devices = devices;
		self.renderDeviceList();
	});

	this.renderDeviceList = function()
	{
		var reminder = self.deviceList.find('.device.selected').attr('data-ip');
		var html = "";
		_.each(self.devices, function(device, i){
			isActive = (device.isPlaying === true) ? 'selected' : '';
			html += '<li class="device '+isActive+'" data-ip="' + device.ip + '">' + device.name + '</li>';
		});

		self.deviceList.html(html);
		self.initClickHandler();
		self.deviceList.find('.device[data-ip="'+ reminder +'"]').addClass('selected');
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

	// init stuff
	(function(){
		self.initClickHandler();
		self.renderDeviceList();
	}());
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

	this.socket.on('directoryContent', function(data){
		self.filesCache = data;
		self.renderFileList(data);
	});

	//this.fileList = config.fileList || $('#fileList');
	this.onSelectFile = function(filePath, filename){
		console.log('audioSubmit');
		self.socket.emit('audioSubmit', { filename: filename, file: filePath, host: $('#deviceList .device.selected').attr('data-ip') });
	};

	// instance vars
	this.currentDir = App.config.currentDir || "";
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
		self.socket.emit('FSChange', { path: $(this).val() });
	});

	// init fileList click
	this.initFileListHandler = function()
	{
		self.fileList.find('tr').off('click').click(function(){
			self.fileList.find('tr.selected').removeClass('selected');
			$(this).addClass('selected');
			
			// case: folder up
			if($(this).index() === 0){
				var last = self.currentDir.substring(0, self.currentDir.length - 1).lastIndexOf('/');
				self.currentDir = self.currentDir.substring(0, last) + "/";

				self.socket.emit('getDirectoryContent', { path: self.currentDir });
			}

			// case: folder
			if($(this).hasClass('folder')){
				console.log('folder');
				self.currentDir = self.currentDir + $(this).find('td').last().html() + "/";
				self.socket.emit('getDirectoryContent', { path: self.currentDir });
			}

			// case: track
			if($(this).hasClass('track')){
				if(typeof self.onSelectFile === 'function')
				{
					self.selectedListElement = $(this).find('td').last().html();
					var path = self.currentDir + $(this).find('td').last().html();
					self.onSelectFile( path, $(this).find('td').last().html() );
				}
			}
		});
	};

	// socket FSSuggestion event
	self.socket.on('FSSuggestion', function(data){

		var playbackState = null;

		// update instance vars
		App.config.currentDir = data.currentDir;
		self.currentDir = data.currentDir;
		self.searchString = data.searchString;
		self.suggestionArray = data.suggestions;

		self.socket.on('directoryContent', function(data){
			AYDIO.currentSource.filesCache = data;
			self.renderFileList(data);
		});

		// update fileList
		if(data.fileList.length > 0){
			self.renderFileList(data.fileList);
			if(App.config.currentSong){
				var song = App.config.currentSong;
				$.each($('#fileList li'), function(i, el){
					if( song.indexOf($(el).html()) !== -1){
						$(el).addClass('selected');
					}
				});
			}
			

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
		self.socket.removeAllListeners('FSSuggestion');
	};

	// initialize
	this.init = function(){
		if(self.currentDir){
			$('#FS').val(self.currentDir);
			self.socket.emit('FSChange', { path: self.currentDir });
		}
		self.filesCache = App.config.musicDirectory.folders;
		self.renderFileList(App.config.musicDirectory.folders);
		self.initFileListHandler();
	};

	this.init();

};

App.modules.Searchbox = function(cfg){

	var self = this;
	this.cached = null;

	this.initBindings = function(){
		$('#search input').off().on('keyup', self.filterView);
	};

	this.filterView = function(e){
		var render = AYDIO.currentSource.renderFileList;
		var files = AYDIO.currentSource.files;
		var cached = AYDIO.currentSource.filesCache;
		var $el = $(this);
		if($el.val() !== ""){
			files = files.filter(function(el){
				return el.filename.indexOf( $el.val() ) !== -1;
			});
		}else{
			files = cached;
		}
		

		render(files);
	};

	this.init = function(){
		self.initBindings();
	};

	this.init();

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
				self.socket.emit('SpotifySearch', data);
				self.socket.on('SpotifySearchReturn', self.onSearchReturn);
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
			self.socket.emit('SpotifyPlaySong', o);
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

	this.init = function(){
		self.initBindings();
		self.initFileListHandler();
	};

	this.init();
};

/**
 * PlayerControls
 */
App.modules.PlayerControls = function(cfg)
{
	var self = this;
	this.config = cfg || {};
	this.socket = this.config.socket || false;
	this.dragging = false;
	this.currentTimeInterval = null;
	
	// inherit from FileList
	this.initBindings = function()
	{
		// volume slider
		$('.player-controls .sound_control').on('mouseup', self.volumeMouseUp);
		$('.player-controls .sound_control').on('mousemove', self.volumeMouseMove);
		$('.player-controls .sound_control').on('mousedown', self.volumeMouseDown);
		$(document).on('mouseup', self.volumeMouseUp);

		//PLAY PAUSE BUTTON
		$('#playPause').click(self.playPauseControl);

		//NEXT BUTTON
		$('#next').click(self.nextControl);

		//PREVIOUS BUTTON
		$('#previous').click(self.prevControl);
	};

	this.playPauseControl = function(){
		if($('#playPause').hasClass('button_play')){
			var fileArr = document.getElementById("fileList").getElementsByTagName("li");
			$('#fileList').find('li.file').filter(':contains(' + fileArr[0].innerHTML + ')').addClass('selected');
			self.socket.emit('audioSubmit', { file: App.config.currentDir + fileArr[0].innerHTML, host: $('#deviceList .device.selected').attr('data-ip') });

			$('#playPause').removeClass('button_play');
			$('#playPause').addClass('button_pause');
		} else {
			self.socket.emit('cancelAudio', { host: $('#deviceList .device.selected').attr('data-ip') });
			$('#fileList').find('li.file.selected').removeClass('selected');
			$('#playPause').removeClass('button_pause');
			$('#playPause').addClass('button_play');
		}
	};

	this.nextControl = function(){
		if($('#fileList').find('li.file.selected')) {
			var fileArr = document.getElementById("fileList").getElementsByTagName("li");
			var fileArrLength = fileArr.length;
			var fileSel = $('#fileList .file.selected').html();
			var nextFile = '';

			$('#fileList').find('li.file.selected').removeClass('selected');

			_.each(fileArr, function(file, index){
				if(file.innerHTML == fileSel) {

					var nextIndex = index + 1;

					if(nextIndex == fileArrLength) {
						nextFile = fileArr[0].innerHTML;
					} else {
						nextFile = fileArr[nextIndex].innerHTML;
					}

					$('#fileList').find('li.file').filter(':contains(' + nextFile + ')').addClass('selected');
					self.socket.emit('audioSubmit', { file: App.config.currentDir + nextFile, host: $('#deviceList .device.selected').attr('data-ip') });
				}
			});
		}
	};

	this.prevControl = function(){
		if($('#fileList').find('li.file.selected')) {
			var fileArr = document.getElementById("fileList").getElementsByTagName("li");
			var fileArrLength = fileArr.length;
			var fileSel = $('#fileList .file.selected').html();
			var previousFile = '';

			$('#fileList').find('li.file.selected').removeClass('selected');

			_.each(fileArr, function(file, index){
				if(file.innerHTML == fileSel) {

					var previousIndex = index - 1;

					if(previousIndex < 0) {
						previousFile = fileArr[fileArrLength-1].innerHTML;
					} else {
						previousFile = fileArr[previousIndex].innerHTML;
					}

					$('#fileList').find('li.file').filter(':contains(' + previousFile + ')').addClass('selected');
					self.socket.emit('audioSubmit', { file: App.config.currentDir + previousFile, host: $('#deviceList .device.selected').attr('data-ip') });
				}
			});
		}
	};

	this.volumeMouseUp = function(e){
		self.dragging = false;
	};

	this.volumeMouseMove = function(e){
		// @TODO: fix for FF, IE
		var $el = $(e.currentTarget).find('.track .active'),
			x = e.clientX - $el.offset().left,
			w = $el.width();

		var width = x / w > 1 ? 1 : ( x / w  < 0.15) ? 0.15 : x / w;
		
		if(self.dragging === true){
			var dd = (20 * Math.log( Math.abs( x / w > 1 ? 1 : x / w) )) / 3;
			//var dB = -Math.log(dd) === null ? 0 : -Math.log(dd) - 1.42;
			self.socket.emit('setRecieverGain', { ip: $('.device.selected').attr('data-ip'), dB: dd });
			$el.css('width', width * 100 + "%");
		}
	};

	this.volumeMouseDown = function(e){
		self.dragging = true;
	};

	/**
	 * renders the status controls (title / album / artist)
	 */
	this.handleMP3Metadata = function(data){
		// show play button
		$('#playPause').removeClass('button_play').addClass('button_pause');

		// update text
		$('.artist-line').html(data.metadata.artist || data.filename);
		$('.track-line').html(data.metadata.title || '');

		// calc some time
		var sec = parseInt(data.format.duration),
			minuten = parseInt(sec/60),
			sec = sec%60,
			stunden = parseInt(minuten/60),
			minuten = minuten%60,
			counter = data.format.currentTime || 0;

		// display time
		$('.text-right').html(stunden+':'+minuten+':'+sec);
		$('.text-left').html(Math.floor(counter/60) + ":" + counter%60);
		self.handleSlider(counter, data.format.duration);
		
		// clear "old" interval
		clearInterval(self.currentTimeInterval);
		
		// setup new interval
		self.currentTimeInterval = setInterval(function(){

			// update counter
			counter++;

			// update text
			$('.text-left').html( Math.floor(counter/60) + ":" + counter%60 );
			
			// update slider
			self.handleSlider(counter, data.format.duration);

			// abort condition
			if(counter >= data.format.duration) {
				clearInterval(self.currentTimeInterval);
			}
		}, 1000);

	};

	/**
	 * updates the time/duration slider
	 */
	this.handleSlider = function(current, duration){
		var $el = $('.status-controls .track .active'),
			width = (current / duration * 100) + "%";
		$el.css('width', width);
	};

	this.handleVolumeSlider = function(width){
		$('.player-controls .track .active').css('width', width + "%");
	};

	this.init = function(){
		self.initBindings();
		self.socket.on('MP3Metadata', self.handleMP3Metadata);
		// if we have a playback state
		if( self.config.playbackState ){
			// display the "last" one
			for(var k in App.config.playbackState){
				self.handleMP3Metadata({
					filename: App.config.currentFilename,
					format: {
						duration: self.config.playbackState[k].duration,
						currentTime: self.config.playbackState[k].currentTime
					},
					metadata: {
						artist: self.config.playbackState[k].artist,
						title: self.config.playbackState[k].title,
						album: self.config.playbackState[k].album
					}
				});

			}
		}
		var percent = Math.pow(10, ( (self.config.playbackVolume || 0) / 20)) * 100;
		self.handleVolumeSlider(percent);
	};

	this.init();

};

/**
 * SourceMenu
 */
App.modules.SourceMenu = function(cfg)
{
	var config = cfg || {};
	var self = this;
	this.socket = config.socket || false;
	this.list = $('#source-menu');
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
			self.socket.emit('changeSource', newSource);

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
			AYDIO.currentSource = new App.modules[ newSource.toUpperCase() ]({socket: self.socket});
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
App.init = function()
{
	var self = this;
	self.socket = io.connect('http://localhost:6500');
	self.socket.on('initcfg', function(data){
		App.config = data.config || {};
		console.log(data.config);
		self.instances = {};

		// init FS Source per default
		self.currentSource = new App.modules.FILESYSTEM({ socket: self.socket});

		// init SourceMenu
		self.instances['SourceMenu'] = new App.modules.SourceMenu({socket: self.socket});

		// init DeviceUpdater
		self.instances['DU'] = new App.modules.DeviceUpdater({socket: self.socket});
		
		// init PlayerControls
		self.instances['PlayerControls'] = new App.modules.PlayerControls({socket: self.socket });

		// init searchControls
		self.instances['searchbar'] = new App.modules.Searchbox();

	});

	return this;
	
};

$(document).ready(function(){
	window.AYDIO = new App();
});

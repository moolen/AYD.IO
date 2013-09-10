var socket = io.connect('http://localhost:6556');
var socketFO = new SocketIOFileUpload(socket);
socket.on('news', function (data) {
  console.log(data);
});
$(document).ready(function(){

	$('form').on('submit', function(e){
		e.preventDefault();
		socketFO.prompt();
		console.log('submit');
		console.log($('form').find('input[name="file"]'));
		socket.emit('onAudioSubmit', { file: 'asd' });
	});

	$('#FS').on('keyup', function(e){
		if( e.keyCode === 9 || e.keyCode === 39 )
		{
			console.log('complete!');
		}
		socket.emit('onFSChange', { path: $(this).val() });
	});

	socket.on('onFSSuggestion', function(data){
		if(data.dir)
		{
			var path = data.path + data.dir[0];
			$('#suggestion').html(path);
		}
		
	});

});

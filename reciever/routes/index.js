/*
 * GET home page.
 */

exports.index = function(req, res){

	res.write(JSON.stringify({
		'ayd.io' : 'reciever',
		'name' : 'raspberryPI'
	}));
	res.end();
};
/*
 * GET home page.
 */
exports.index = function(req, res)
{
	// just render index
	res.render('index');
};

exports.ping = function(req, res){

	res.write(JSON.stringify({
		'ayd.io' : 'reciever',
		'name' : 'myPi'
	}));
	res.end();
};
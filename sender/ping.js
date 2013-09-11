module.exports = function(config)
{
	// dependencies
	var _ = require('lodash'),
		os = require('os'),
		http = require('http');

	// target self
	var self = this;

	// config
	this.afterScanForDevices = config.afterScanForDevices || function(){};
	this.onDeviceChange = config.onDeviceChange || function(){};
	// instance vars
	this._devices = [];
	this.debug = true;
	this.ips = 255;
	this.requestReturned = 1;
	this._deviceCache = [];

	// device getter
	this.getDevices = function()
	{
		return self._devices;
	};

	// upp addr setter
	this.ipAddress = function(ip)
	{
		var index = ip.lastIndexOf('.');
		self._ip = ip;
		console.log(index);
		self._ipStripped = ip.substr(0, index + 1);
		return ip;
	};

	// scan for Interfaces
	this.scanForNetworkInterfaces = function()
	{
		_.each(os.networkInterfaces(), function(interface, i){
			_.each(interface, function(stat, i){
				if(stat.internal === false && stat.family === 'IPv4')
				{
					self.ipAddress(stat.address);
				}
			});
		});
	};

	// try to connect to ip addr inside this range
	this.scanForDevices = function()
	{
		ips = 255;
		self.debug ? console.log('scanning for devices...') : '';
		// reset devices
		self._deviceCache = self._devices;
		self._devices = [];

		// loop over ip addresses in range X.X.X.1 - X.X.X.254 
		
		while(ips > 0)
		{
			var req = http.request({
				port: 3001,
				hostname: self._ipStripped + ips,
				path: '/ping',
				method: 'GET'
			}, function(res){
				//console.log(res);
				res.on('data', function (chunk) {
					// we have a device!
					self.debug ? console.log('found a device') : '';
					self.requestReturned++;
					var m = res.req._header.match(/Host:(.*)\:3001/);
					var ip = m[0].replace('Host: ', '');
					self._devices.push(ip);
				});
			});

			req.on('error', function(e){
				//console.log(e.message);
			});
			req.on('close', function(data){
				self.requestReturned++;
				//self.debug? console.log('close event' + self.requestReturned) : '';
				if(self.requestReturned === 254)
				{
					self.debug? console.log('last one returned') : '';
					self.requestReturned = 1;
					setTimeout(self.scanForDevices, 5000);
					console.log(self._devices);
					console.log(self._deviceCache);
					self.afterScanForDevices(self._devices);
					if( arraysEqual(self._deviceCache, self._devices) )
					{
						self.onDeviceChange(self._devices);
						console.log('oh, A NEW DEVICE!');
					}
				}
			});
			req.end();

			ips--;
		}
	};

	// init stuff
	this.init = (function(){
		self.scanForNetworkInterfaces();
		self.scanForDevices();
		// debug inteval
		//self.debug ? setInterval(function(){console.log(self._devices)}, 2000) : '';
	})();

	// public api
	return {
		scanForDevices: this.scanForDevices,
		scanForInterfaces: this.scanForNetworkInterfaces,
	};
	
};

function arraysEqual(arr1, arr2) {
    if(arr1.length !== arr2.length)
        return false;
    for(var i = arr1.length; i--;) {
        if(arr1[i] !== arr2[i])
            return false;
    }

    return true;
}
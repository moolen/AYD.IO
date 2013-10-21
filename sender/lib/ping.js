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
	this.onEachDevice = config.onEachDevice || function(){};

	// instance vars
	this._devices = [];
	this.debug = false;
	this.verbose = false;
	this.ips = 254;
	this.requestReturned = 0;
	this._deviceCache = [];

	// device getter
	this.getDevices = function()
	{
		return self._devices;
	};

	// upp addr setter
	this.ipAddress = function(ip)
	{
		if(ip === undefined)
		{
			ip = self._internalIpAddress;
		}
		var index = ip.lastIndexOf('.');
		self._ip = ip;
		//console.log(ip);
		self._ipStripped = ip.substr(0, index + 1);
		return ip;
	};

	// scan for Interfaces
	this.scanForNetworkInterfaces = function()
	{
		_.each(os.networkInterfaces(), function(interface, i){
			self.verbose ? console.log(interface) : '';
			_.each(interface, function(stat, i){
				if(stat.internal === true && stat.family === 'IPv4')
				{
					self._internalIpAddress = stat.address;
				}
				if(stat.internal === false && stat.family === 'IPv4')
				{
					self.debug ? console.log("chosen IP: " + stat) : '';
					self.ipAddress(stat.address);
				}
			});
		});
	};

	// try to connect to ip addr inside this range
	this.scanForDevices = function()
	{
		///console.log('scanning...');
		ips = 255;
		self.debug ? console.log('scanning for devices...') : '';
		// reset devices
		self._deviceCache = self._devices;
		self._devices = [];

		// loop over ip addresses in range X.X.X.1 - X.X.X.253 
		
		while(ips > 0)
		{
			self.verbose ? console.log(self._ipStripped + ips): '';
			var req = http.request({
				port: 3001,
				hostname: self._ipStripped + ips,
				path: '/ping',
				method: 'GET'
			}, function(res){
				res.on('data', function (chunk) {
					var body = JSON.parse(chunk.toString());
					// we have a device!
					//self.debug ? console.log('found a device') : '';
					self.requestReturned++;
					var m = res.req._header.match(/Host:(.*)\:3001/);
					var ip = m[0].replace('Host: ', '').replace(':3001', '');
					self.debug ? console.log(ip, body.name) : '';
					self._devices.push({ ip: ip, name: body.name });
					self.onEachDevice({ ip: ip, name: body.name });
				});
			});

			req.on('error', function(e){
				//console.log('<<<>>>')
				//console.log(e.message);
			});
			req.on('close', function(data){
				self.requestReturned++;
				self.debug? console.log('close event' + self.requestReturned) : '';
				if(self.requestReturned === 253)
				{
					self.debug? console.log('done.') : '';
					self.requestReturned = 0;
					self.verbose? console.log(self._devices) : '';
					self.verbose? console.log(self._deviceCache) : '';
					setTimeout(self.scanForDevices, 10000);
					self.afterScanForDevices(self._devices);
					//console.log(self._devices);
					//console.log('done.');
					if( !arraysEqual(self._deviceCache, self._devices) )
					{
						self.onDeviceChange(self._devices);
						//console.log(self._devices);
						console.log('updated deviceList');
					}
				}
			});
			req.end();
			ips--;
		}
	};

	function arraysEqual(arr1, arr2) {
		if(arr1.length !== arr2.length)
			return false;
		if(arr1.length === 0 && arr2.length === 0)
			return true;
		for(var i = arr1.length; i--;) {
			if(typeof arr1[i] === "string" || typeof arr1[i] === "number")
			{
				if(arr1[i] !== arr2[i])
					return false;
			}
			else if(typeof arr1 === "object")
			{
				return _.isEqual(arr1[i], arr2[i]);
			}
			
		}

		return true;
	}

	// init stuff
	this.init = (function(){
		self.scanForNetworkInterfaces();
		self.scanForDevices();
	})();

	// public api
	return {
		scanForDevices: this.scanForDevices,
		scanForInterfaces: this.scanForNetworkInterfaces,
	};
	
};


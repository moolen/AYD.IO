module.exports = function()
{
	// dependencies
	var _ = require('lodash'),
		os = require('os'),
		pubsub = require('./pubsub.js'),
		http = require('http');

	// target self
	var self = this;
	this.vent = new pubsub();

	// instance vars
	this._devices = [];
	
	this.debug = false;
	this.verbose = false;
	this.ips = 254;
	this.requestReturned = 0;
	this._deviceCache = [];

	setInterval(function(){
		self.checkDeviceStatus();
	}, 4000);

	setInterval(function(){
		self.scanForDevices();
	}, 8000);

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
					self.debug ? console.log("chosen IP: " + stat.address) : '';
					self.ipAddress(stat.address);
				}
			});
		});
	};

	// try to connect to ip addr inside this range
	this.scanForDevices = function()
	{
		console.log('scanning for new devices...');
		ips = 255;

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
					self.updateDeviceList({ ip: ip, name: body.name });
				});
			});
			req.on('error', function(err){
				// suppress errrrr event
			});
			req.end();
			ips--;
		}
	};

	this.updateDeviceList = function(device)
	{
		// internal
		// self._devices.push(device);

		var exists = self._devices.filter(function(el){
			return el.ip == device.ip;
		});

		if(exists.length === 0)
		{
			self._devices.push(device);
			GLOBAL.store.devices = self._devices;
			self.vent.trigger('onDeviceChange', self._devices, "fromupdateList");
		}		
	};

	this.checkDeviceStatus = function()
	{
		console.log('checking device status...');
		_.each(self._devices, function(device, i){

			try{
				var req = http.request({
					port: 3001,
					hostname: device.ip,
					path: '/ping',
					method: 'GET'
				}, function(res){
					res.on('data', function (chunk) {
						var body = JSON.parse(chunk.toString());
						// we have a device!
						var m = res.req._header.match(/Host:(.*)\:3001/);
						var ip = m[0].replace('Host: ', '').replace(':3001', '');
						self.debug ? console.log('got a device response!') : '';
						self.updateDeviceList({ ip: ip, name: body.name, isPlaying: false });
					});
				});

				req.on('error', function(e){
					//console.log(e);
					self._devices.splice(i, 1);
					self.vent.trigger('onDeviceChange', self._devices, "fromCheckDevices");
				});
				req.end();
			}
			catch(e)
			{
				console.log(e);
			}
			
		});
	};

	// init stuff
	(function(){
		self.scanForNetworkInterfaces();
		self.scanForDevices();
	})();

	// public api
	return {
		vent: self.vent,
		scanForDevices: this.scanForDevices,
		scanForInterfaces: this.scanForNetworkInterfaces,
	};
	
};


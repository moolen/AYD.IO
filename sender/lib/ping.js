 module.exports = function(vent)
{
	// dependencies
	var _ = require('lodash'),
		os = require('os'),
        config = require('../config.json'),
		http = require('http');

	// target self
	var self = this;

	// instance vars
	this._devices = [];

	// settings
	this.debug = false;
	this.verbose = false;
	this.ips = 254;
	this._deviceCache = [];

   this.init = function()
   {
       if( !config.reciever )
       {
           self.scanForNetworkInterfaces();
           /**
            * DEVICE STATUS CHECKER
            */
           setInterval(function(){
               self.checkDevices();
           }, 4000);

           /**
            * DEVICE SCANNER
            */
           setInterval(function(){
               self.scanForDevices();
           }, 8000);
       }
       else
       {
            self.updateDeviceList({ ip: "127.0.0.1", name: "dev_reciever" });
       }

   };

	// IP Address Fallback: if no Network interface is found / has no valid ip; 
	// fallback to loopback device
	this.setIPAddress = function(ip)
	{
		if(ip === undefined)
		{
			ip = self._internalIpAddress;
		}
		var index = ip.lastIndexOf('.');
		self._ip = ip;

		self._ipStripped = ip.substr(0, index + 1);
		return ip;
	};

	// scan for Interfaces
	this.scanForNetworkInterfaces = function()
	{
		_.each(os.networkInterfaces(), function(interface, i){
			//self.verbose ? console.log(interface) : '';
			_.each(interface, function(stat, i){
				// set loopback 
				if(stat.internal === true && stat.family === 'IPv4')
				{
					self._internalIpAddress = stat.address;
				}
				if(stat.internal === false && stat.family === 'IPv4')
				{
					//self.debug ? console.log("chosen IP: " + stat.address) : '';
					self.setIPAddress(stat.address);
				}
			});
		});
	};

	// try to connect to ip addr inside this range
	this.scanForDevices = function()
	{
        if( !config.reciever )
        {
            console.log('scanning for new devices...');
            ips = 255;

            // loop over ip addresses in range X.X.X.1 - X.X.X.253
            while(ips > 0)
            {
                //self.verbose ? console.log(self._ipStripped + ips): '';
                self.sendRequest( self._ipStripped + ips );
                ips--;
            }
        }
	};

	/**
	 * updates the internal and global deviceList; propagates this message through eventEmitter
	 * @param  {object} device [device object]
	 */
	this.updateDeviceList = function(device)
	{
        var exists = self._devices.filter(function(el){
            return el.ip == device.ip;
        });

        if(exists.length === 0)
        {
            self._devices.push(device);
            GLOBAL.store.devices = self._devices;
            vent.emit('PING:DeviceChange', self._devices);
        }
	};

	/**
	 * checks the reciever devices if they are still available
	 */
	this.checkDevices = function()
	{
        if( !config.reciever )
        {
            console.log('checking device status...');
            _.each(self._devices, self.checkDevice, function(){
                // done with all.. update?
            });
        }
	};

	/**
	 * sends an HTTP Request to ipAddress
	 * @param  {string} ipAddress [destination ip Address]
	 */
	this.sendRequest = function(ipAddress)
	{
		var req = http.request({
			port: 3001,
			hostname: ipAddress,
			path: '/ping',
			method: 'GET'
		}, function(res){
			res.on('data', function (chunk) {
				try{
					var body = JSON.parse(chunk.toString());
				}
				catch(err)
				{
					return;
				}
				
				// we have a device!
				//self.debug ? console.log('found a device') : '';
				var m = res.req._header.match(/Host:(.*)\:3001/);
				var ip = m[0].replace('Host: ', '').replace(':3001', '');
				//self.debug ? console.log(ip, body.name) : '';
				self.updateDeviceList({ ip: ip, name: body.name });
			});
		});
		req.on('error', function(err){
            //console.log(err.message);
			// suppress errrrr event
		});
		req.end();
	};

	/**
	 * sends an HTTP Request to the device.
	 * if no response: delete from reciever list
	 * @param  {object} device [the device object]
	 * @param  {integer} i      [counter]
	 */
	this.checkDevice = function(device, i)
	{
        if( !config.reciever )
        {
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
                    //self.debug ? console.log('got a device response!') : '';
                    self.updateDeviceList({ ip: ip, name: body.name, isPlaying: false });
                });
            });

            req.on('error', function(e){
                self._devices.splice(i, 1);
                vent.emit('PING:DeviceChange', self._devices);
            });
            req.end();
        }

	};

	// init stuff
    self.init();


	// public api
	return {
		vent: self.vent,
		scanForDevices: self.scanForDevices,
		scanForInterfaces: self.scanForNetworkInterfaces
	};
	
};


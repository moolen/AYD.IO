// Generated by CoffeeScript 1.6.3
(function() {
  var b1, b2, d, distance, isBitSet, printNice, sprintf;

  sprintf = require('./sprintf').sprintf;

  isBitSet = function(byte, bit) {
    return (byte & (1 << bit)) !== 0;
  };

  distance = function(b1, b2) {
    var i, len, res, _i;
    if (b1.length !== b2.length) {
      throw "b1.length != b2.length";
    }
    len = b1.length;
    res = new Buffer(len);
    for (i = _i = 0; 0 <= len ? _i < len : _i > len; i = 0 <= len ? ++_i : --_i) {
      res[i] = b1[i] ^ b2[i];
    }
    return res;
  };

  printNice = function(b) {
    var i, s, _i, _ref;
    s = "";
    for (i = _i = _ref = b.length - 1; _ref <= 0 ? _i <= 0 : _i >= 0; i = _ref <= 0 ? ++_i : --_i) {
      s += sprintf("%02X ", b[i]);
    }
    return s;
  };

  exports.isBitSet = isBitSet;

  exports.distance = distance;

  exports.printNice = printNice;

  b1 = new Buffer([0x00, 0xff, 0xff]);

  b2 = new Buffer([0x00, 0xff, 0x01]);

  d = distance(b1, b2);

  process.stdout.write(printNice(b1) + '\n');

  process.stdout.write(printNice(b2) + '\n');

  process.stdout.write(printNice(d) + '\n');

}).call(this);

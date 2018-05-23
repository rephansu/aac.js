var Bitstream, BufferList, Decoder, EventEmitter, Stream, UnderflowError,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

EventEmitter = require('./events');

BufferList = require('./bufferlist');

Stream = require('./stream');

Bitstream = require('./bitstream');

UnderflowError = require('./underflow');

Decoder = (function(_super) {
  var codecs;

  __extends(Decoder, _super);

  function Decoder(demuxer, format) {
    var list;
    this.demuxer = demuxer;
    this.format = format;
    list = new BufferList;
    this.stream = new Stream(list);
    this.bitstream = new Bitstream(this.stream);
    this.receivedFinalBuffer = false;
    this.waiting = false;
    this.demuxer.on('cookie', (function(_this) {
      return function(cookie) {
        var error;
        try {
          return _this.setCookie(cookie);
        } catch (_error) {
          error = _error;
          return _this.emit('error', error);
        }
      };
    })(this));
    this.demuxer.on('data', (function(_this) {
      return function(chunk) {
        list.append(chunk);
        if (_this.waiting) {
          return _this.decode();
        }
      };
    })(this));
    this.demuxer.on('end', (function(_this) {
      return function() {
        _this.receivedFinalBuffer = true;
        if (_this.waiting) {
          return _this.decode();
        }
      };
    })(this));
    this.init();
  }

  Decoder.prototype.init = function() {};

  Decoder.prototype.setCookie = function(cookie) {};

  Decoder.prototype.readChunk = function() {};

  Decoder.prototype.decode = function() {
    var error, offset, packet;
    this.waiting = !this.receivedFinalBuffer;
    offset = this.bitstream.offset();
    try {
      packet = this.readChunk();
    } catch (_error) {
      error = _error;
      if (!(error instanceof UnderflowError)) {
        this.emit('error', error);
        return false;
      }
    }
    if (packet) {
      this.emit('data', packet);
      if (this.receivedFinalBuffer) {
        this.emit('end');
      }
      return true;
    } else if (!this.receivedFinalBuffer) {
      this.bitstream.seek(offset);
      this.waiting = true;
    } else {
      this.emit('end');
    }
    return false;
  };

  Decoder.prototype.seek = function(timestamp) {
    var seekPoint;
    seekPoint = this.demuxer.seek(timestamp);
    this.stream.seek(seekPoint.offset);
    return seekPoint.timestamp;
  };

  codecs = {};

  Decoder.register = function(id, decoder) {
    return codecs[id] = decoder;
  };

  Decoder.find = function(id) {
    return codecs[id] || null;
  };

  return Decoder;

})(EventEmitter);

module.exports = Decoder;
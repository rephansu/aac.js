var Asset, Decoder, Demuxer, EventEmitter,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

EventEmitter = require('./events');

// HTTPSource = require('./sources/node/http');

// FileSource = require('./sources/node/file');

// BufferSource = require('./sources/buffer');

Demuxer = require('./demuxer');

Decoder = require('./avdecoder');

Asset = (function(_super) {
  __extends(Asset, _super);

  function Asset(source) {
    this.source = source;
    this._decode = __bind(this._decode, this);
    this.findDecoder = __bind(this.findDecoder, this);
    this.probe = __bind(this.probe, this);
    this.buffered = 0;
    this.duration = null;
    this.format = null;
    this.metadata = null;
    this.active = false;
    this.demuxer = null;
    this.decoder = null;
    this.source.once('data', this.probe);
    this.source.on('error', (function(_this) {
      return function(err) {
        _this.emit('error', err);
        return _this.stop();
      };
    })(this));
    this.source.on('progress', (function(_this) {
      return function(buffered) {
        _this.buffered = buffered;
        return _this.emit('buffer', _this.buffered);
      };
    })(this));
  }

  // Asset.fromURL = function(url, opts) {
  //   return new Asset(new HTTPSource(url, opts));
  // };

  // Asset.fromFile = function(file) {
  //   return new Asset(new FileSource(file));
  // };

  // Asset.fromBuffer = function(buffer) {
  //   return new Asset(new BufferSource(buffer));
  // };

  Asset.prototype.start = function(decode) {
    if (this.active) {
      return;
    }
    if (decode != null) {
      this.shouldDecode = decode;
    }
    if (this.shouldDecode == null) {
      this.shouldDecode = true;
    }
    this.active = true;
    this.source.start();
    if (this.decoder && this.shouldDecode) {
      return this._decode();
    }
  };

  Asset.prototype.stop = function() {
    if (!this.active) {
      return;
    }
    this.active = false;
    return this.source.pause();
  };

  Asset.prototype.get = function(event, callback) {
    if (event !== 'format' && event !== 'duration' && event !== 'metadata') {
      return;
    }
    if (this[event] != null) {
      return callback(this[event]);
    } else {
      this.once(event, (function(_this) {
        return function(value) {
          _this.stop();
          return callback(value);
        };
      })(this));
      return this.start();
    }
  };

  Asset.prototype.decodePacket = function() {
    return this.decoder.decode();
  };

  Asset.prototype.decodeToBuffer = function(callback) {
    var chunks, dataHandler, length;
    length = 0;
    chunks = [];
    this.on('data', dataHandler = function(chunk) {
      length += chunk.length;
      return chunks.push(chunk);
    });
    this.once('end', function() {
      var buf, chunk, offset, _i, _len;
      buf = new Float32Array(length);
      offset = 0;
      for (_i = 0, _len = chunks.length; _i < _len; _i++) {
        chunk = chunks[_i];
        buf.set(chunk, offset);
        offset += chunk.length;
      }
      this.off('data', dataHandler);
      return callback(buf);
    });
    return this.start();
  };

  Asset.prototype.probe = function(chunk) {
    var demuxer;
    if (!this.active) {
      return;
    }
    demuxer = Demuxer.find(chunk);
    if (!demuxer) {
      return this.emit('error', 'A demuxer for this container was not found.');
    }
    this.demuxer = new demuxer(this.source, chunk);
    this.demuxer.on('format', this.findDecoder);
    this.demuxer.on('duration', (function(_this) {
      return function(duration) {
        _this.duration = duration;
        return _this.emit('duration', _this.duration);
      };
    })(this));
    this.demuxer.on('metadata', (function(_this) {
      return function(metadata) {
        _this.metadata = metadata;
        return _this.emit('metadata', _this.metadata);
      };
    })(this));
    return this.demuxer.on('error', (function(_this) {
      return function(err) {
        _this.emit('error', err);
        return _this.stop();
      };
    })(this));
  };

  Asset.prototype.findDecoder = function(format) {
    var decoder, div;
    this.format = format;
    if (!this.active) {
      return;
    }
    this.emit('format', this.format);
    decoder = Decoder.find(this.format.formatID);
    if (!decoder) {
      return this.emit('error', "A decoder for " + this.format.formatID + " was not found.");
    }
    this.decoder = new decoder(this.demuxer, this.format);
    if (this.format.floatingPoint) {
      this.decoder.on('data', (function(_this) {
        return function(buffer) {
          return _this.emit('data', buffer);
        };
      })(this));
    } else {
      div = Math.pow(2, this.format.bitsPerChannel - 1);
      this.decoder.on('data', (function(_this) {
        return function(buffer) {
          var buf, i, sample, _i, _len;
          buf = new Float32Array(buffer.length);
          for (i = _i = 0, _len = buffer.length; _i < _len; i = ++_i) {
            sample = buffer[i];
            buf[i] = sample / div;
          }
          return _this.emit('data', buf);
        };
      })(this));
    }
    this.decoder.on('error', (function(_this) {
      return function(err) {
        _this.emit('error', err);
        return _this.stop();
      };
    })(this));
    this.decoder.on('end', (function(_this) {
      return function() {
        return _this.emit('end');
      };
    })(this));
    this.emit('decodeStart');
    if (this.shouldDecode) {
      return this._decode();
    }
  };

  Asset.prototype._decode = function() {
    while (this.decoder.decode() && this.active) {
      continue;
    }
    if (this.active) {
      return this.decoder.once('data', this._decode);
    }
  };

  Asset.prototype.destroy = function() {
    var _ref, _ref1, _ref2;
    this.stop();
    if ((_ref = this.demuxer) != null) {
      _ref.off();
    }
    if ((_ref1 = this.decoder) != null) {
      _ref1.off();
    }
    if ((_ref2 = this.source) != null) {
      _ref2.off();
    }
    return this.off();
  };

  return Asset;

})(EventEmitter);

module.exports = Asset;
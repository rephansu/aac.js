var BufferList, Demuxer, EventEmitter, Stream,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

EventEmitter = require('./events');

BufferList = require('./bufferlist');

Stream = require('./stream');

Demuxer = (function(_super) {
  var formats;

  __extends(Demuxer, _super);

  Demuxer.probe = function(buffer) {
    return false;
  };

  function Demuxer(source, chunk) {
    var list, received;
    list = new BufferList;
    list.append(chunk);
    this.stream = new Stream(list);
    received = false;
    source.on('data', (function(_this) {
      return function(chunk) {
        var e;
        received = true;
        list.append(chunk);
        try {
          return _this.readChunk(chunk);
        } catch (_error) {
          e = _error;
          return _this.emit('error', e);
        }
      };
    })(this));
    source.on('error', (function(_this) {
      return function(err) {
        return _this.emit('error', err);
      };
    })(this));
    source.on('end', (function(_this) {
      return function() {
        if (!received) {
          _this.readChunk(chunk);
        }
        return _this.emit('end');
      };
    })(this));
    this.seekPoints = [];
    this.init();
  }

  Demuxer.prototype.init = function() {};

  Demuxer.prototype.readChunk = function(chunk) {};

  Demuxer.prototype.addSeekPoint = function(offset, timestamp) {
    var index;
    index = this.searchTimestamp(timestamp);
    return this.seekPoints.splice(index, 0, {
      offset: offset,
      timestamp: timestamp
    });
  };

  Demuxer.prototype.searchTimestamp = function(timestamp, backward) {
    var high, low, mid, time;
    low = 0;
    high = this.seekPoints.length;
    if (high > 0 && this.seekPoints[high - 1].timestamp < timestamp) {
      return high;
    }
    while (low < high) {
      mid = (low + high) >> 1;
      time = this.seekPoints[mid].timestamp;
      if (time < timestamp) {
        low = mid + 1;
      } else if (time >= timestamp) {
        high = mid;
      }
    }
    if (high > this.seekPoints.length) {
      high = this.seekPoints.length;
    }
    return high;
  };

  Demuxer.prototype.seek = function(timestamp) {
    var index, seekPoint;
    if (this.format && this.format.framesPerPacket > 0 && this.format.bytesPerPacket > 0) {
      seekPoint = {
        timestamp: timestamp,
        offset: this.format.bytesPerPacket * timestamp / this.format.framesPerPacket
      };
      return seekPoint;
    } else {
      index = this.searchTimestamp(timestamp);
      return this.seekPoints[index];
    }
  };

  formats = [];

  Demuxer.register = function(demuxer) {
    return formats.push(demuxer);
  };

  Demuxer.find = function(buffer) {
    var e, format, offset, stream, _i, _len;
    stream = Stream.fromBuffer(buffer);
    for (_i = 0, _len = formats.length; _i < _len; _i++) {
      format = formats[_i];
      offset = stream.offset;
      try {
        if (format.probe(stream)) {
          return format;
        }
      } catch (_error) {
        e = _error;
      }
      stream.seek(offset);
    }
    return null;
  };

  return Demuxer;

})(EventEmitter);

module.exports = Demuxer;
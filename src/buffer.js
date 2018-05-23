var AVBuffer;

AVBuffer = (function() {
  var BlobBuilder, URL;

  function AVBuffer(input) {
    var _ref;
    if (input instanceof Uint8Array) {
      this.data = input;
    } else if (input instanceof ArrayBuffer || Array.isArray(input) || typeof input === 'number' || ((_ref = global.Buffer) != null ? _ref.isBuffer(input) : void 0)) {
      this.data = new Uint8Array(input);
    } else if (input.buffer instanceof ArrayBuffer) {
      this.data = new Uint8Array(input.buffer, input.byteOffset, input.length * input.BYTES_PER_ELEMENT);
    } else if (input instanceof AVBuffer) {
      this.data = input.data;
    } else {
      throw new Error("Constructing buffer with unknown type.");
    }
    this.length = this.data.length;
    this.next = null;
    this.prev = null;
  }

  AVBuffer.allocate = function(size) {
    return new AVBuffer(size);
  };

  AVBuffer.prototype.copy = function() {
    return new AVBuffer(new Uint8Array(this.data));
  };

  AVBuffer.prototype.slice = function(position, length) {
    if (length == null) {
      length = this.length;
    }
    if (position === 0 && length >= this.length) {
      return new AVBuffer(this.data);
    } else {
      return new AVBuffer(this.data.subarray(position, position + length));
    }
  };

  BlobBuilder = global.BlobBuilder || global.MozBlobBuilder || global.WebKitBlobBuilder;

  URL = global.URL || global.webkitURL || global.mozURL;

  AVBuffer.makeBlob = function(data, type) {
    var bb;
    if (type == null) {
      type = 'application/octet-stream';
    }
    try {
      return new Blob([data], {
        type: type
      });
    } catch (_error) {}
    if (BlobBuilder != null) {
      bb = new BlobBuilder;
      bb.append(data);
      return bb.getBlob(type);
    }
    return null;
  };

  AVBuffer.makeBlobURL = function(data, type) {
    return URL != null ? URL.createObjectURL(this.makeBlob(data, type)) : void 0;
  };

  AVBuffer.revokeBlobURL = function(url) {
    return URL != null ? URL.revokeObjectURL(url) : void 0;
  };

  AVBuffer.prototype.toBlob = function() {
    return AVBuffer.makeBlob(this.data.buffer);
  };

  AVBuffer.prototype.toBlobURL = function() {
    return AVBuffer.makeBlobURL(this.data.buffer);
  };

  return AVBuffer;

})();

module.exports = AVBuffer;

var Base,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

Base = (function() {
  var fnTest;

  function Base() {}

  fnTest = /\b_super\b/;

  Base.extend = function(prop) {
    var Class, fn, key, keys, _ref, _super;
    Class = (function(_super) {
      __extends(Class, _super);

      function Class() {
        return Class.__super__.constructor.apply(this, arguments);
      }

      return Class;

    })(this);
    if (typeof prop === 'function') {
      keys = Object.keys(Class.prototype);
      prop.call(Class, Class);
      prop = {};
      _ref = Class.prototype;
      for (key in _ref) {
        fn = _ref[key];
        if (__indexOf.call(keys, key) < 0) {
          prop[key] = fn;
        }
      }
    }
    _super = Class.__super__;
    for (key in prop) {
      fn = prop[key];
      if (typeof fn === 'function' && fnTest.test(fn)) {
        (function(key, fn) {
          return Class.prototype[key] = function() {
            var ret, tmp;
            tmp = this._super;
            this._super = _super[key];
            ret = fn.apply(this, arguments);
            this._super = tmp;
            return ret;
          };
        })(key, fn);
      } else {
        Class.prototype[key] = fn;
      }
    }
    return Class;
  };

  return Base;

})();

module.exports = Base;
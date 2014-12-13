// D.js
(function(scope) {
  /*#inport <types.js>*/
  /*#inport <array.js>*/
  /*#inport <extend.js>*/

  function D() {}

  function arr(src) {
    return Array.prototype.splice.call(src, 0);
  };

  function _(args, cbfn) {
    var source = ( (isArray(args[0]) || isDomObj(args[0])) &&
        args.shift() ) || this, result;
    if( isArray(source) ) {
      result = [];
      for(var index = 0; index < source.length; index++) {
        apply(push, result, cbfn.apply(source[index], args));
      };
    } else { result = cbfn.apply(source, args); }
    return result;
  };

  D.prototype = {
    css: function() {
      _(arr(arguments), 
        function(name, value) {
          if(isObject(name)) { extend(this.style, name); }
          else { this.style[name] = value; }
        }
      );
    },
    on: function() {
      return _(arr(arguments), 
        function() {
          this.addEventListener.apply(this, arguments); } );
    },
    off: function() {
      return _(arr(arguments),
        function() { this.removeEventListener.apply(this, arguments); });
    },
    bind: function(dst, name, value) {
      return Object.defineProperty(dst, name, {
        __proto__: null,
        value: value
      });
    },
    find: function() {
      return _(arr(arguments), function(selector) {
        return this.querySelector(selector);
      });
    },
    findAll: function() {
      return _(arr(arguments), function(selector) {
        return this.querySelectorAll(selector);
      });
    },
    attr: function() {
      return _(arr(arguments), function(attrName, value) {
        var attrValue = this.getAttribute(attrName);
        if(value) { this.setAttribute(attrName, value); }
        return attrValue;
      });
    },
    extend: extend,
    isFunction: isFunction,
    isArray: isArray,
    isNumber: isNumber,
    isString: isString,
    isObject: isObject,
    isBoolean: isBoolean,
    isDefined: isDefined,
    isUndefined: isUndefined,
    isRegExp: isRegExp,
    isElement: isElement,
    isDomObj: isDomObj
  };

  scope.D = extend(D, D.prototype);
  scope.D.forEach = forEach;
})(window);
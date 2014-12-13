// D.js
(function(scope) {
  // types.js

/**
 * @doc function
 * @name isArray
 * @module ng
 * @kind function
 *
 * @description
 * Determines if a reference is a `Array`.
 *
 * @param {*} value Reference to check.
 * @returns {boolean} True if `value` is a `Array`.
 */
var isArray = Array.isArray;

/**
 * @doc function
 * @name isFunction
 * @module ng
 * @kind function
 *
 * @description
 * Determines if a reference is a `Function`.
 *
 * @param {*} value Reference to check.
 * @returns {boolean} True if `value` is a `Function`.
 */
function isFunction(value){return typeof(value) === 'function';}

/**
 * @doc function
 * @name isNumber
 * @module ng
 * @kind function
 *
 * @description
 * Determines if a reference is a `Number`.
 *
 * @param {*} value Reference to check.
 * @returns {boolean} True if `value` is a `Number`.
 */
function isNumber(value){return typeof(value) === 'number';}

/**
 * @doc function
 * @name isString
 * @module ng
 * @kind function
 *
 * @description
 * Determines if a reference is a `String`.
 *
 * @param {*} value Reference to check.
 * @returns {boolean} True if `value` is a `String`.
 */
function isString(value){return typeof(value) === 'string';}

/**
 * @doc function
 * @name isObject
 * @module ng
 * @kind function
 *
 * @description
 * Determines if a reference is a `Object`.
 *
 * @param {*} value Reference to check.
 * @returns {boolean} True if `value` is a `Object`.
 */
function isObject(value){return typeof(value) === 'object';}

/**
 * @doc function
 * @name isBoolean
 * @module ng
 * @kind function
 *
 * @description
 * Determines if a reference is a `Boolean`.
 *
 * @param {*} value Reference to check.
 * @returns {boolean} True if `value` is a `Boolean`.
 */
function isBoolean(value){return typeof(value) === 'boolean';}

/**
 * @doc function
 * @name isDefined
 * @module ng
 * @kind function
 *
 * @description
 * Determines if a reference is a `Defined`.
 *
 * @param {*} value Reference to check.
 * @returns {boolean} True if `value` is a `Defined`.
 */
function isDefined(value){return value !== null && typeof value !== 'undefined';}

/**
 * @doc function
 * @name isUndefined
 * @module ng
 * @kind function
 *
 * @description
 * Determines if a reference is a `undefined`.
 *
 * @param {*} value Reference to check.
 * @returns {boolean} True if `value` is a `undefined`.
 */
function isUndefined(value){ return typeof(value) === 'undefined'; }

function isRegExp(value){ return value instanceof RegExp; }

/**
 * @ngdoc function
 * @name angular.isElement
 * @module ng
 * @kind function
 *
 * @description
 * Determines if a reference is a DOM element (or wrapped jQuery element).
 *
 * @param {*} value Reference to check.
 * @returns {boolean} True if `value` is a DOM element (or wrapped jQuery element).
 */
function isElement(node) {
  return !!(node &&
    (node.nodeName  // we are a direct element
    || (node.prop && node.attr && node.find)));  // we have an on and find method part of jQuery API
}
  //array.js


function property(key, def) {
  return function getProperty(obj) {
    var val;
    if( obj ) {
      if( !obj[key] && (val = isFunction(def)? def(): def) ) {
        obj[key] = val;
      }
      return obj[key];
    }
  };
}

function flat(set) {
  var result = [];
  for (var i = 0; i < set.length; i++) {
    invoke(result, set[i]);
  };
  return result;
}

function apply(fn, thisArg, args) {
  if( arguments.length > 3 ) { 
    args = flat(slice.call(arguments, 2)); 
  }
  if( fn ) { return fn.apply(thisArg, args); }
};

function call(fn, thisArg) {
  if( fn ) { return fn.call(thisArg, slice.call(arguments, 2)); }
};

function invoke(fn, thisArg, args) {
  if(args && args.length) {
    fn.apply(thisArg, args);
  } else if(isDefined(args)) { fn.call(thisArg, args); }
  else { fn.call(thisArg); }
  return thisArg;
};
function first(src) {
  if(src && src.length) {
    return src[0]; 
  }
}

function last(src) {
  if(src && src.length) {
    return src[src.length - 1]; 
  }
}

var push = Array.prototype.push;
var pop = Array.prototype.pop;
var unshift = Array.prototype.unshift;
var shift = Array.prototype.shift;
var splice = Array.prototype.splice;
var slice = Array.prototype.slice;

/*function flatInvoke(thisArg, array, fn) {
  if(array && array.length) { fn.apply(thisArg, array); }
  else if(!isArray(array)) { fn.call(thisArg, array); }
  return thisArg;
}*/

/**
* Convert a object to array.
*/
function toArray(dst) {
  forEach(arguments, function(src) {
    if(src !== dst && src) {
      if(!isFunction(src) && isNumber(src.length)) {
        if(src.length) { apply(push, this, src); }
      } else { Array.prototype.push.call(this, src); }
    }
  }, dst);
  return dst;
}


function filter(arr, cbFn, thisArg, result) {
  if( isFunction(arr.filter) ) {
    return arr.filter(cbFn, thisArg);
  }
  
  var isArr = isArray(arr);
  result = result || (isArr? [] : {});
  forEach(arr, function(value, index) {
    if( cbFn.call(thisArg, value, index, arr) ) {
      if( isArr ) { result.push(value); }
      else { result[index] = value; }
    }
  }, thisArg);
  return result;
}

function find(arr, cbFn, thisArg) {
  return arr[findIndex(arr, cbFn, thisArg)];
}

function findIndex(arr, cbFn, thisArg) {
  var s, keys;
  if( isNumber(arr.length) ) {
    for (s = 0; s < arr.length; s++) { 
      if( cbFn.call(thisArg, arr[s], s, arr) ) { return s; }
    }
  } else {
    keys = Object.keys(arr);
    for (s = 0; s < keys.length; s++) {
      if( cbFn.call(thisArg, arr[keys[s]], keys[s], arr) ) { return keys[s]; }
    }
  }
  return -1;
}

  //extend.js
//forEach.js

function forEach(arr, iterator, thisArg) {
  if(arr) {
    var s;
    if(arr.forEach) {
      arr.forEach(iterator, thisArg);
    } else if( isNumber(arr.length) ) {
      for (s = 0; s < arr.length; s++) { 
        iterator.call(thisArg, arr[s], s, arr);
      }
    } else {
      var keys = Object.keys(arr);
      for (s = 0; s < keys.length; s++) {
        iterator.call(thisArg, arr[keys[s]], keys[s], arr);
      }
    }
  }
}
function extend(dst) {
  forEach(arguments, function(obj){
    if (obj !== dst) {
      forEach(obj, function(value, key){
        dst[key] = value;
      });
    }
  });
  return dst;
}
  function D() {}

  function arr(src) {
    return Array.prototype.splice.call(src, 0);
  };

  function _(args, cbfn) {
    var source = ( (isArray(args[0]) || isElement(args[0])) &&
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
      return _(arr(arguments), Node.prototype.addEventListener);
    },
    off: function() {
      return _(arr(arguments), Node.prototype.removeEventListener);
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
    extend: extend
  };

  scope.D = extend(D, D.prototype);
})(window);
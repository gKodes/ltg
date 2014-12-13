//http://www.html5rocks.com/en/tutorials/es6/promises/

//array.js

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

var P = (function() {
  function Promise(resolver, args) {
    var status, result, callbacks = []; // resolve || reject

    function invokeState(forStatus) {
      return function invokeCallbacks() {
        var callback, resolved;
        status = forStatus;
        while( (callback = callbacks.shift()) ) {
          if(resolved && resolved.then) {
            resolved.then.apply(resolved, callback);
          } else if(callback[status]) {
            resolved = callback[status].apply(null, arguments);
          }
        }
        result = resolved || arguments;
      }
    }

    function notify() {
      for(var n = 0; n < callbacks.length; n++) {
        if(callbacks[n][2]) { callbacks[n][2].apply(null, arguments); }
      }
    }
    
    this.then = function(resolveCb, rejectCb, notifyCb) {
      if(result && result.then) {
        return result.then.apply(result, arguments);
      }
      
      if(!status) { callbacks.push(arguments); }
      else if(arguments[status]) {
        arguments[status].apply(null, result);
      }

      return this;
    };

    var resolverType = typeof(resolver);
    if(resolverType !== 'function') {
      throw new TypeError('Promise resolver ' + 
          resolverType + ' is not a function');
    }

    resolver.apply(this, 
      invoke(push, [invokeState(0), invokeState(1), notify],
        args) );
  }

  Promise.prototype = {
    'catch': function(catchFn) {
      this.then(undefined, catchFn);
    },
    notice: function(noticeFn) {
      this.then(undefined, undefined, noticeFn);
    }
  };

  function P(resolver) {
    return new Promise(resolver, slice.call(arguments, 1));
  }

  P.resolve = function() {
    return Promise(function(resolve) { resolve(last(arguments)); }, arguments);
  };
  
  P.reject = function() {
    return Promise(function() { arguments[1](last(arguments)); }, arguments);
  };

  return P;
})();
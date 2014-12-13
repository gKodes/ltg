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

function stringify(src) {
	var strValue = src;
	if(src) {
		if(isFunction(src)) { strValue = src.toString(); } 
		else if( !isString(src) ) { strValue = JSON.stringify(src); }
	}
	return '' + strValue;
}

function fError(module, ErrorConstructor) {
	ErrorConstructor = ErrorConstructor || Error;
	return function ferror(type, template) {
		var subs = arguments;

		template = template.replace(/\{(\d+)\}/g, function(holder, index) {
			return stringify(subs[parseInt(index) + 2]);
		});

		return new ErrorConstructor(module + ' <' + type + '> : ' + template);
	}
}
// di.js
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
//extend.js

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
/*
API's to define
* last
* first
*/
// http://careers.stackoverflow.com/bevacqua

var diError = fError('DI');
function DI() {
  var injuctables = {};

  this.has = function(name) {
    return (name in injuctables);
  };

  this.get = function(name) {
    return injuctables[name];
  };

  this.register = function(name, value) {
    injuctables[name] = value;
  };
}

var FN_ARGS = /^function\s*[^\(]*\(\s*([^)]*)\)/m,
    FN_ARG_SPLIT = /\s?\/\*[^\*]+\*\/|\/[^\r\n]+|[,\s]{1,}/mg; //(\/\/.*$|\/\*[^\*]*\*\/|[^,\s\/]{1,})/mg;

DI.prototype = {
  instantiate: function(fn, locals) {
    var instance = Object.create((last(fn) || fn).prototype);
    this.invoke(fn, locals, instance);
    return instance;
  },
  annotate: function(fn) {
    var depends,
        fnArgStr;

    if( isArray(fn) ) {
      return fn.slice(0, fn.length - 1);
    } else if(isFunction(fn)) {
      if( !(depends = fn.$di) ) {
        fnArgStr = fn.toString().split(FN_ARGS)[1];
        
        if(fnArgStr) {
          forEach(fnArgStr.split(FN_ARG_SPLIT), function(match) {
            if( match ) { this.push(match); }
          }, (fn.$di = depends = []) );
        }
        return depends;
      }
      return fn.$di;
    }
  },
  invoke: function(fn, locals, thisArg) {
    var depends = this.annotate(fn), fnArgs;
    if( isArray(depends) ) {
      fnArgs = depends.map(function(name) {
        var injuctable = this.get(name) || (locals && locals[name]);
        if(isUndefined(injuctable)) {
          throw diError('d01', 'Injuctable "{0}" not found', name);
        }
        return injuctable;
      }, this);
    } if( isArray(fn) ) { fn = last(fn); }
    return fn.apply(thisArg, fnArgs);
  }
};
var Provider = function() {
  var providerSuffix = 'Provider',
      serviceCache = {'$provider': this},
      pError = fError('Provider'),
      configFns = [], depth = [],
      INIT_STATE = {};

  function canInvoke(fn) {
    return ( isArray(fn) && isFunction( last(fn) ) ) || isFunction(fn);
  }

  this.provider = function(name, provider) {
    if(serviceCache[name + providerSuffix]) {
      throw pError('p01', 'Provider for the given service \'{0}\' is already registered', name);
    }

    if( isFunction(provider) ) { provider = this.instantiate(provider); }
    if( !provider.$get ) {
      throw pError('p02', 'Provider \'{0}\' does not provide a \'$get\' method', name);
    }

    //INFO: Register the provider
    serviceCache[name + providerSuffix] = provider;
    /* INFO: If the $get of the provider is not a function mark it as
       Constant and add to the `serviceCache` */
    if( !canInvoke(provider.$get) ) {
      serviceCache[name] = provider.$get;
    }
  };

  function getSource(name) {
    if( serviceCache[name] == INIT_STATE ) {
      throw pError('p03', 'Circular dependency found: {0}',
                    name + ' <- ' + depth.join(' <- ') ); /* Cyclic Dependency */
    } else if(serviceCache[name]) { return serviceCache[name]; }

    if( serviceCache[name + providerSuffix] ) {
      try {
        depth.unshift(name);
        serviceCache[name] = INIT_STATE;
        return this.invoke(serviceCache[name + providerSuffix].$get);
      } finally { delete serviceCache[name]; depth.shift(); }
    }
    return false;
  }

  this.has = function(name) { /**/ };

  this.get = function(name) {
    return serviceCache[name];
  };

  this.config = function(fn) {
    if( this.get != getSource ) {
      if( isFunction(fn) ) { return configFns.push(fn); }
      while( (fn = configFns.pop()) ) { this.invoke(fn); }
      this.get = getSource;
    }
  };
};

Provider.prototype = DI.prototype; 
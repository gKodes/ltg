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

function isDomObj(elm) {
return (isElement(elm) || elm.constructor == Window);
}

function noop() {}	
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

function hasOwn(obj, propName) {
  return Object.hasOwnProperty.apply(obj, propName);
};

function isPO(src) {
  return !isArray(src) && isObject(src) && src.constructor && src.constructor === Object;
}
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
      if(!isFunction(src) && !isString(src) && isNumber(src.length)) {
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
    } else if( isNumber(arr.length) && !isFunction(arr) ) {
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

  
  function extend(dst) {
    forEach(arguments, function(obj){
      if (obj && obj !== dst) {
        forEach(obj, function(value, key) {
          dst[key] = value;
        });
      }
    });
    return dst;
  }

  var _D = scope.D = function(nodes, query) {
    if( isElement(nodes) && query) {
      nodes = _D.findAll(nodes, query);
    }
    return new D(nodes);
  }

  function D(nodes) {
    mergeArray(nodes, this);
  }

  function css(element, name, value) {
    if(isObject(name)) { extend(element.style, name); }
    else { element.style[name] = value; }
  }

  function on(element, type, listener, useCapture) {
    element.addEventListener(type, listener, useCapture);
  }
  
  function off(element, type, listener, useCapture) {
    element.removeEventListener(type, listener, useCapture);
  }
  
  function bind(dst, name, value) {
    return Object.defineProperty(dst, name, {
      __proto__: null,
      value: value
    });
  }
  
  function find(element, selector) {
    return element.querySelector(selector);
  }
  
  function findAll(element, selector) {
    return element.querySelectorAll(selector);
  }

  function setAttr(element, name, value) {
    var attrValue = element.getAttribute(name);
    element.setAttribute(name, value);
    return attrValue;
  }

  function attr(element, name, value) {
    if(!element.getAttribute) { return ''; }

    if(isArray(name)) {
      for(value = 0; value < name.length; value++) {
        name[value] = element.getAttribute(name[value]);
      }
      return name;
    }

    if(isObject(name)) {
      for(value in name) {
        name[value] = setAttr(element, value, name[value]);
      }
      return name;
    }
    
    return isDefined(value)? setAttr(element, name, value) : 
        ( element.getAttribute(name) || '');
  }

  function removeAttr(element) {
    for(var a = 1; a < arguments.length; a++) {
      element.removeAttribute(name[a]);
    }
  }

  function addClass(element, name, noCheck) {
    if(noCheck || !hasClass(element, name)) {
      var classNames = attr(element, 'class');
      classNames = classNames? classNames.split(/\s/g) : [];
      classNames.push(name);
      setAttr(element, 'class', classNames.join(' '));
    }
  }

  function removeClass(element, name, noCheck) {
    if(noCheck || hasClass(element, name)) {
      var classNames = attr(element, 'class').split(/\s/g);
      classNames.splice(classNames.indexOf(name), 1);
      setAttr(element, 'class', classNames.join(' '));
    }
  }
  
  function hasClass(element, name) {
    return !!~(' ' + attr(element, 'class').replace(/\s/g, ' ') + ' ')
        .indexOf(' ' + name + ' ');
  }
  
  function toggleClass(element, classNames) {
    forEach(classNames.split(' '), function(name) {
      (hasClass(element, name)? removeClass: addClass)(element, name, true);
    });
  }

  extend(_D, {
    on: on,
    off: off,
    css: css,
    find: find,
    findAll: findAll,
    attr:attr,
    removeAttr: removeAttr,
    addClass: addClass,
    removeClass: removeClass,
    hasClass: hasClass,
    toggleClass: toggleClass,
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
  });
  _D.forEach = forEach;

  D.prototype = [];

  function mergeArray(args, result) {
    return args && Array.prototype.push.apply((result = result || []), args) && result;
  }

  forEach(['on', 'off', 'css', 'addClass', 'removeClass', 'toggleClass', 'hasClass'], function(name) {
    D.prototype[name] = function() {
      var args = [undefined];
      mergeArray(arguments, args);
      
      forEach(this, function(node) {
        args[0] = node;
        _D[name].apply(null, args);
      });
      return this;
    }
  });

  forEach(['style', 'find', 'attr'], function(name) {
    D.prototype[name] = function() {
      var args = [undefined], result = [];
      mergeArray(arguments, args);
      
      forEach(this, function(node) {
        var out; args[0] = node;
        if(out = _D[name].apply(null, args)) { result.push(out); }
      });

      return result.length === 1? result.pop(): result;
    }
  });

  forEach(['findAll'], function(name) {
    D.prototype[name] = function() {
      var args = [undefined], result = [];
      mergeArray(arguments, args);
      
      forEach(this, function(node) {
        args[0] = node;
        mergeArray(_D[name].apply(null, args), result);
      });

      return result;
    }
  });
})(window);
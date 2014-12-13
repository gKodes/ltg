//array.js

/*#inport <object.js>*/

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

/*#inport <forEach.js>*/

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

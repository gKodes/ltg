/*#inport <types.js>*/

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
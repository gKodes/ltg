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
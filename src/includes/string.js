//string.js

/**
* Formats the given string to camelCase
*/
function camelCase(str) {
  if(str) {
    return str.replace(/-[a-z]/g, 
      function(alpha) { 
        return alpha[1].toUpperCase();
      });
  }
  return str;
}

/**
* Formats the given string to snake-case
*/
function snakeCase(str) {
  if(str) {
    return str.replace(/[A-Z]/g, 
      function(alpha, pos) { 
        return (pos? '-' : '') + alpha.toLowerCase();
      });
  }
  return str;
}

function contains(src, valIn) {
  return src && !!~src.indexOf(valIn);
}

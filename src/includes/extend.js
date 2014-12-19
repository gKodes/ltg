//extend.js
/*#inport <forEach.js>*/
/*#inport <object.js>*/

function extend(dst) {
  if(!dst) {
  	if(arguments.length == 2) { return arguments[1]; }
  	else { dst = {}; }
  }
  forEach(arguments, function(obj){
    if (obj && obj !== dst) {
      forEach(obj, function(value, key){
        if( isArray(value) ) {
          Array.prototype.push.apply( 
            ( dst[key] = isArray(dst[key])? dst[key] : [] ), value );
        } else if(isArray(dst[key])) {
          dst[key].push(value);
        } else if( isPO(value) ) {
          dst[key] = extend((isObject(dst[key]) && dst[key]), value);
        }
        else { dst[key] = value; }
      });
    }
  });
  return dst;
}
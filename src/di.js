// di.js
/*#inport <forEach.js>*/
/*#inport <extend.js>*/
/*#inport <array.js>*/
/*#inport <types.js>*/
/*#inport <error.js>*/

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
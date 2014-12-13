//http://www.html5rocks.com/en/tutorials/es6/promises/

/*#inport <array.js>*/

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
      
      if(isUndefined(status)) { callbacks.push(arguments); }
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
    return new Promise(function(resolve) { resolve(last(arguments)); }, arguments);
  };
  
  P.reject = function() {
    return new Promise(function() { arguments[1](last(arguments)); }, arguments);
  };

  P.all = function(promises) {
    return new Promise(function(resolve, reject, notify) {
      var isList = isArray(promises),
          pending = (isList? promises: Object.keys(promises)).length,
          results = isList? [] : {};

      forEach(promises, function(value, pos) {
        if( value && isFunction(value.then) ) {
          value.then(function() {
            results[pos] = result;
            if(!(--pending)) { resolve(results); }
          }, reject, notify);
        } else { results[pos] = value; pending--; }
      });

      if(!pending) { resolve(results); }
    });
  }

  return P;
})();
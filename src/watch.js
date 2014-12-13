var $watch = (function() {
  function isWritable(obj, property) {
    if(obj && property) {
      if(obj[property]) {
        var definition = Object.getOwnPropertyDescriptor(obj, property),
            originalValue = obj[property];
        try {
          if(!definition.writable) { // change the value to random to prevent any failures
            return ((obj[property] = 'writable') == 'writable');
          }
        } finally { obj[property] = originalValue; }
      }
      return true;
    }
  }

  function provider(value, compare) {
    var $observers = [];
    return {
      get: function(observerFn) {
        if( isFunction(observerFn) ) {
          return $observers.push(observerFn);
        }
        return value;
      },
      set: function(obj) {
        if( compare(obj, value) ) { // TODO: need to replace with an equals method
          value = $watch.$digest($observers, obj);
        }
      }
    };
  }

  function digestLoopExecutor(index, $track, value, lastKnown) {
    function $digestLoop() {
      /* INFO: `index` helps to identify if an addtional `$digest` is inovked,
       * if invoked, will stop this one. */
       //TODO: find if there is a better way to do this
      for(var t = 0; t < $track.length && index === $track.index; t++) {
        $track[t](value, lastKnown);
      }
    }
    return $digestLoop;
  }

  return {
    $digest: function(observers, value, lastKnown) {
      clearTimeout(observers.$digestId); /*Kill the TimeOut if not yet triggered*/
      if(!observers.index) { observers.index = 1; }
      observers.$digestId = setTimeout( digestLoopExecutor(
          ++observers.index, observers, value, lastKnown), 100);
    },
    $observe: function(obj, property, watchFn, compare) {
      var definition;
      if( !( definition = Object.getOwnPropertyDescriptor(obj, name) ) ) {
        Object.defineProperty(obj, property,
          ( definition = provider( obj[property], (compare || equals) ) ) );
      }
      return definition.get(watchFn);
    },
    $unwatch : function(obj, property) {},
    $extend: function(instance) {
      function watch() {
        this.$observe = function(name, watchFn) {
          return $watch.observe(this, name, watchFn);
        };
      }

      watch.apply(instance);
      return instance;
    }
  };
})();
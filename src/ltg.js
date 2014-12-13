/**
 * <t> Disto Main File
 */

(function() {
'use strict';
  /*#inport 'provider.js'*/
  /*#inport 'ltg.element.js'*/
  /*#inport 'ltg.controllers.js'*/
  /*#inport 'P.js'*/
  var bootstrap = false,
  $provider = new Provider({
    '$watch': $watch,
    '$p': P,
    '$controller': $controller
  }),
  elementCahce = [],
  runFns = [];

  window.ltg = {
    factory: function(name, factoryFn) {
      $provider.provider(name, {$get: factoryFn});
    },
    service: function(name, initFn) {
      var instance, serviceProvider = {
        $get: ['$provider',
          function($provider) {
            if(!instance) { instance = $provider.instantiate(initFn); }
            return instance;
          }
        ]
      };
      $provider.provider(name, serviceProvider);
    },
    config: function(fn) { if(fn) { $provider.config(fn); } },
    run: function(fn) { if(fn) { runFns.push(fn); } },
    element: function() {
      if(arguments.length > 0) {
        if(bootstrap) { apply(element, this, arguments); }
        else { elementCahce.push(arguments); }
      }
    },
    bootstrap: function() {
      var fn;
      $provider.config();
      bootstrap = true;
      while(fn = runFns.shift()) { $provider.invoke(fn); }
      while(fn = elementCahce.shift()) {
        apply(element, this, fn);
      }
    },
    controller: controller,
    provider: function(name, provider) {
      $provider.provider(name, provider);
    },
    str: {
      camelCase: camelCase,
      snakeCase: snakeCase
    }
  }

  window.ltg.provider.get = function(name) { return $provider.get(name); }
})()

/*ltg.service('sample', function() { return 'sampleX'; });
ltg.factory('test', ['sample', function(sample){ console.info(sample); }])*/
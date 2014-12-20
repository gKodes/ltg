/**
 * <t> ltg - HTML5 Element Simplified Library
 */

(function() {
'use strict';
  /*#inport 'provider.js'*/
  /*#inport 'ltg.element.js'*/
  /*#inport 'ltg.controllers.js'*/
  /*#inport 'P.js'*/
  var bootstrap = false,
  $provider = new Provider({
    //'$watch': $watch,
    '$p': P,
    '$controller': $controller
  }),
  runSeq = [],
  polyfills = ('import' in document.createElement('link'));

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
    config: function(fn) { $provider.config(fn); },
    run: function(fn) { runSeq.push(fn); },
    element: function() {
      if(arguments.length > 0) {
        var elementArgs = arguments;
        runSeq.push(function() {
          element.apply(null, elementArgs);
        });
      }
    },
    constant: function(name, value) {
      $provider.constant(name, value);
    },
    bootstrap: function() {
      $provider.bootstrap(function() {
        var fn;
        while(fn = runSeq.shift()) { $provider.invoke(fn); }
        window.ltg.element = element;
        window.ltg.config = window.ltg.run = noop;
        document.dispatchEvent( new CustomEvent('ltgLoaded') );
      });
    },
    controller: controller,
    provider: function(name, provider) {
      $provider.provider(name, provider);
    },
    polyfil: !('import' in document.createElement('link')),
    //Inc D here
    str: {
      camelCase: camelCase,
      snakeCase: snakeCase
    }
  }

  window.ltg.provider.get = function(name) { return $provider.get(name); }
})();
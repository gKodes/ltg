/*#inport <array.js>*/
/*#inport <types.js>*/
/*#inport <error.js>*/
/*#inport 'di.js'*/

var Provider = function(serviceCache) {
  var providerSuffix = 'Provider',
      pError = fError('Provider'),
      configFns = [], depth = [],
      INIT_STATE = {};

  serviceCache = extend(serviceCache, {'$provider': this});

  function canInvoke(fn) {
    return ( isArray(fn) && isFunction( last(fn) ) ) || isFunction(fn);
  }

  this.provider = function(name, provider) {
    if(serviceCache[name + providerSuffix]) {
      throw pError('p01', 'Provider for the given service \'{0}\' is already registered', name);
    }

    if( canInvoke(provider) ) { provider = this.instantiate(provider); }
    if( !provider.$get ) {
      throw pError('p02', 'Provider \'{0}\' does not provide a \'$get\' method', name);
    }

    //INFO: Register the provider
    serviceCache[name + providerSuffix] = provider;
    /* INFO: If the $get of the provider is not a function mark it as
       Constant and add to the `serviceCache` */
    if( !canInvoke(provider.$get) ) {
      serviceCache[name] = provider.$get;
    }
  };

  function getSource(name) {
    if( serviceCache[name] == INIT_STATE ) {
      throw pError('p03', 'Circular dependency found: {0}',
                    name + ' <- ' + depth.join(' <- ') ); /* Cyclic Dependency */
    } else if(serviceCache[name]) { return serviceCache[name]; }

    if( serviceCache[name + providerSuffix] ) {
      try {
        depth.unshift(name);
        serviceCache[name] = INIT_STATE;
        return this.invoke(serviceCache[name + providerSuffix].$get);
      } finally { delete serviceCache[name]; depth.shift(); }
    }
    return false;
  }

  this.has = function(name) { /**/ };

  this.get = function(name) {
    return serviceCache[name];
  };

  this.config = function(fn) {
    if( this.get != getSource ) {
      if( canInvoke(fn) ) { return configFns.push(fn); }
      while( (fn = configFns.pop()) ) { this.invoke(fn); }
      this.get = getSource;
    }
  };
};

Provider.prototype = DI.prototype; 
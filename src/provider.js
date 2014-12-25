/*#inport <array.js>*/
/*#inport <types.js>*/
/*#inport <error.js>*/
/*#inport 'di.js'*/

function canInvoke(fn) {
  return ( isArray(fn) && isFunction( last(fn) ) ) || isFunction(fn);
}

var Provider = function() {
  var providerSuffix = 'Provider',
      pError = fError('Provider'),
      configSeq = [], depth = [],
      INIT_STATE = {},
      serviceCache = {'$provider': this},
      bootstrap;

  this.provider = function(name, provider) {
    if(serviceCache[name] || serviceCache[name + providerSuffix]) {
      throw pError('p01', 'Provider/Constant with the given name \'{0}\' is already registered', name); 
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

  this.get = function(name) {
    if( serviceCache[name] == INIT_STATE ) {
      throw pError('p03', 'Circular dependency found: {0}',
                    name + ' <- ' + depth.join(' <- ') ); /* Cyclic Dependency */
    } else if(serviceCache[name]) { return serviceCache[name]; }

    if( bootstrap && serviceCache[name + providerSuffix] ) {
      try {
        depth.unshift(name);
        serviceCache[name] = INIT_STATE;
        return this.invoke(serviceCache[name + providerSuffix].$get);
      } finally { delete serviceCache[name]; depth.shift(); }
    }
    return false; // raise error not found
  }

  this.constant = function(name, value) {
    if(serviceCache[name]) {
      throw 'Constant already exists "' + name + '"';
    }
    serviceCache[name] = value;
  };

  this.has = function(name) {
    return (serviceCache[name] || serviceCache[name + providerSuffix]);
  };

  this.config = function(fn) {
    if( canInvoke(fn) ) {
      configSeq.push(fn);
    };
    return this;
  };

  this.bootstrap = function(onBoot) {
    while( (bootstrap = configSeq.shift()) ) {
      this.invoke(bootstrap);
    }
    bootstrap = true;
    this.invoke(onBoot);
  }

  this.canInvoke = canInvoke;
};

Provider.prototype = DI.prototype; 
Provider.canInvoke = canInvoke;
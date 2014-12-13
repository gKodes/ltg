/**
 * <t> Disto Main File
 */

(function() {
'use strict';
  


function stringify(src) {
	var strValue = src;
	if(src) {
		if(isFunction(src)) { strValue = src.toString(); } 
		else if( !isString(src) ) { strValue = JSON.stringify(src); }
	}
	return '' + strValue;
}

function fError(module, ErrorConstructor) {
	ErrorConstructor = ErrorConstructor || Error;
	return function ferror(type, template) {
		var subs = arguments;

		template = template.replace(/\{(\d+)\}/g, function(holder, index) {
			return stringify(subs[parseInt(index) + 2]);
		});

		return new ErrorConstructor(module + ' <' + type + '> : ' + template);
	}
}
// di.js





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
var Provider = function() {
  var providerSuffix = 'Provider',
      serviceCache = {'$provider': this},
      pError = fError('Provider'),
      configFns = [], depth = [],
      INIT_STATE = {};

  function canInvoke(fn) {
    return ( isArray(fn) && isFunction( last(fn) ) ) || isFunction(fn);
  }

  this.provider = function(name, provider) {
    if(serviceCache[name + providerSuffix]) {
      throw pError('p01', 'Provider for the given service \'{0}\' is already registered', name);
    }

    if( isFunction(provider) ) { provider = this.instantiate(provider); }
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
      if( isFunction(fn) ) { return configFns.push(fn); }
      while( (fn = configFns.pop()) ) { this.invoke(fn); }
      this.get = getSource;
    }
  };
};

Provider.prototype = DI.prototype; 
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



//extend.js

function extend(dst) {
  forEach(arguments, function(obj){
    if (obj !== dst) {
      forEach(obj, function(value, key){
        dst[key] = value;
      });
    }
  });
  return dst;
}
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
var bindingTypes = {
  '&' : function(eventName) {
    return {
      value: function dispatchEvent(detail) {
        this.$$element.dispatchEvent(new CustomEvent(eventName, detail));
      }
    };
  },
  '@' : function(attrName) { // Convert to Snake Case
    return {
      get: function() { return this.$get(attrName); },
      set: function(value) { this.$set(attrName, value); }
    };
  },
  '=' : function(propName, readOnly) {
    return function propertyBinding() {
      var storage = this[propName], $trackers = [], descriptor =
      {
        get: function(fn) {
          if(isFunction(fn)) {
            $trackers.push(fn);
          }
          return storage;
        },
        set: function(value) {
          $watch.$digest($trackers, value, storage);
          storage = value;
        }
      };

      Object.defineProperty(this.$$element, propName, 
        (readOnly? {get: descriptor.get}: descriptor) );
      Object.defineProperty(this, propName, descriptor);
      return this[propName];
    };
  },
  '*': function(propName) {
    return function attrAndPropBinding() {
      var elm = this.$$element,
      descriptor = {
        get: function() { return elm.getAttribute(propName); },
        set: function(value) { elm.setAttribute(propName, value); }
      };
      Object.defineProperty(this, propName, descriptor);
      Object.defineProperty(elm, propName, descriptor);
      return this[propName];
    }
  }
};

function bindings(bmap, postBinding) {
  var bindings = {};
  forEach(bmap, function(type, name) {
    if( bindingTypes[type[0]] ) {
      var descriptor = bindingTypes[type[0]](name, ('!' == type[1]));
      if( isFunction(descriptor) ) { postBinding.push(descriptor); }
      else { bindings[name] = descriptor; };
    }
  });
  return bindings;
};

var prototype = {
  $observer: function(attrName, fn) {
    (this.$$observers[attrName] = (this.$$observers[attrName] || [])).push(fn);
  },
  $digest: function(attrName, newValue, oldValue) {
    if(this.$$observers[attrName]) {
      $watch.$digest(this.$$observers[attrName], newValue, oldValue);
    }
  },
  $get: function(attrName) {
    return this.$$element.getAttribute(attrName);
  },
  $set: function(attrName, value) {
    this.$$element.setAttribute(attrName, value);
  },
  // Extract the info from data-* attributes
  $data: function() {}
};

function attribute(bmap) {
  var postBinding = [];
  function Attribute(element) {
    this.$$element = element;
    // this.$$attrs = {};
    this.$$events = [];
    this.$$observers = {};

    forEach(postBinding, function(fn) { fn.apply(this); }, this);
  };

  Attribute.prototype = 
    Object.create(prototype, bindings(bmap, postBinding));
  Attribute.prototype.constructor = Attribute;

  return Attribute;
}


// var Attribute = attribute({'class': '@', 'prop': '='});
// var s1 = new Attribute($0);

/*
<ltg-route path="{service}" view="view id?"></ltg-route>

<!-- link the content of the path to the view only on succsfull creation of the controller -->
<!-- template - id or uri of the template which would be rendered for the given view / in case of using a uri it should be
bound by an remote (used to make ajax/server calls) tag -->
<ltg-route for="view id?">
  <ltg-path controller="" src="">/</ltg-path>
  <ltg-path controller="" src="">/about</ltg-path>
  <ltg-path controller="" src="">/contact</ltg-path>
  <ltg-path controller="" src="" value="/readme"></ltg-path>
</ltg-route>

<remote-http>
  <http-post src="/name" on="auto|change|manual">
    <!-- html form element & inputs -->
    <post-data name="" src="string, css selector"></post-data>
  </http-post>
  <http-get src="/name/{templated}/clear" on="auto|change|manual"></http-get>
</remote-http>


<ltg-view path="/sample/name/grand/" is="ltg-view"
  on-ready="method" <!-- method name, would be called once the view's dom is ready. To be used to bind other event for elements insied the view -->
  on-show="method" <!-- request an ajax call to fetch and populate the data -->
  on-hide="method"  <!-- validate and show warning, can prevent the view from unloading -->
  >
  <div is="splash"></div> <!-- preloader element -->
</ltg-view>
*/

var ltgUniqueStr, data = (function(uniqueStr) {
  var uid = 0, edCache = {},
      ltgCacheId = property(uniqueStr, nextUid);

  function nextUid() { return ++uid; }

  function data(element, key, value) {
    var cacheId = ltgCacheId(element);
    if( !(isDefined(key) || isDefined(value)) ) { return edCache[cacheId]; }
    var container = property(cacheId, {})(edCache);
    
    if( isObject(key) ) {
      forEach(key, function(value, token) {
        this[token] = value;
      }, container);
      return;
    }

    var inCache = container[key];
    if(value) { container[key] = value; }
    return inCache;
  }

  data.clean = function(element) {
    var cacheId = ltgCacheId(element);
    if(cacheId && edCache[cacheId]) {
      delete edCache[cacheId];
    }
  };

  return data;
})(ltgUniqueStr = 'ltg' + Date.now() + 'Ci');
function Shadow(element) {
  this.$$element = element;
  this.$$shadow = element.shadowRoot;
}

Shadow.prototype = {
  content: function(selector) {
    var nodes = [];

    forEach(this.$$shadow.querySelectorAll('content'), 
      function(content) {
        var items = content.getDistributedNodes();
        if(selector) {
          forEach(items, function(item) {
            if(item.matches(selector)) { this.push(item); }
          }, this);
        } else { toArray(this, items); }
      },
    nodes);
    return nodes;
  },
  $q: function(query) {
    return toArray([], this.$$shadow.querySelectorAll(query));
  },
  $append: function(node) {
    if(node) { this.$$shadow.appendChild(node); }
  },
  $remove: function(node) {
    if(node) { this.$$shadow.removeChild(node); }
  },
  $replace: function(srcNode, dstNode) {
    if(dstNode) { this.$$shadow.replaceChild(srcNode, dstNode); }
  },
  $bind: function() {} // TODO: template
};
function ltgElement(compilerFn, controllerFn, linkFn, unlinkFn, name) {
  // this.requires = ['^', 'name', ''];

  this.compile = function(fn) {
    if(isFunction(fn)) { compilerFn.push(fn); }
    return compilerFn;
  };

  this.controller = function(ctrlFn, extend) {
    if(isString(ctrlFn)) {
      if( !(ctrlFn = controllers[ctrlFn]) ) {
        throw new Error('Controller not found');
      }
    }

    if(ctrlFn) {
	    controllerFn[name] = ctrlFn;
	    ctrlFn.extend = extend;
    }
    return controllerFn;
  };

  this.link = function(fn, requires) {
  	if(fn) {
	    if(controllerFn[name]) { 
	      (requires = requires || []).push(name);
	    }
	    if(isFunction(fn)) { fn.requires = requires; linkFn.push(fn); }
    }
    return linkFn;
  };

  this.unlink = function(fn) {
    if(isFunction(fn)) { unlinkFn.push(fn); }
    return unlinkFn;
  };
}

var ltgElements = {};

/*Start: Require Stack Function's*/
//NOTE: Partren used to identify the Controller Type
var REQ_REFIX_REGX = /^([\^:]*)?(\??)(.+)/;

/**
 * Function used to identify the controller and map it from an
 * elements `data`.
 */
function mapRequireForElement(require, index, soruce) {
  var requireEx = REQ_REFIX_REGX.exec(require);
  if( requireEx[1] == this.type && requireEx[3] && !this.result[requireEx[3]] ) {
    if( !(this.result[requireEx[3]] = this.data['$' + requireEx[3] + 'Ctrl'])
          && !requireEx[2] ) {
      if( !this.type || this.type[0] != '^' ) {
        throw 'Controller Not Found';
      } else { this.notFound.push(requireEx[3]); }
    } else {
      if(!!~(index = this.notFound.indexOf(requireEx[3]))) {
        this.notFound.splice(index , 1);
      }
      this.found++;
    }
  }
}

/**
 * Function used to build the Object (Map) for a linker
 * requires (dependent controllers).
 *
 * @param `element` starting element for which the search for controllers would start
 * @param `requires` list of controllers required
 *
 * @return an Map of controllers if `requires` length is &gt; 1 or
 * just the controller requested
 */
function buildRequireStack(element, requires) {
  var stack = {}, node = element,
      stackCallBlock = {
        data: data(node),
        result: stack,
        notFound: [],
        found: 0
      };
  
  //NOTE: Search Controllers in the Current Element
  forEach(requires, mapRequireForElement, stackCallBlock);

  if(element.attributes['for'] &&
      ( stackCallBlock.data = 
        data(node = document.getElementById(element.attributes['for']) ) ) ) {
    stackCallBlock.type = ':';
    forEach(requires, mapRequireForElement, stackCallBlock);
  } // TODO: If we dont have for attr and have an ctrl using "for" throw an error

  stackCallBlock.type = '^';
  node = node.parentNode;

  //NOTE: Search Controllers in Parent Nodes until the top
  do {
  	//TODO: Need to step out of the Shadow dom for geting the parent
    if(stackCallBlock.data = data(node)) {
      forEach(requires, mapRequireForElement, stackCallBlock);
    }
  } while( (node = (node.parentNode || (node.nodeType === 11 && node.host)) ) && 
      stackCallBlock.found < requires.length);

  if(stackCallBlock.notFound.length) {
    throw 'Controllers Not Found';
  }

  return requires.length == 1? stack[requires[0]]: stack;
}

/*End: Require Stack Function's*/

var LOCAL_ELEMENT_NAME = /HTML([A-Z]{2}?)|([A-Z][a-z0-9]+)Element/;

/**
 * The Core function used to build an HTML Element
 *
 */
var element = function(name) {
  var base = arguments.length == 3? arguments[1]: undefined,
      buildFn = last(arguments),
      baseCtrlName, bindings = {},
      compilerFn = [], controllerFn = {},
      linkFn = [], unlinkFn = [],
      baseType;
  
  /* populate the functions from parents */
  forEach(base, function(baseName, index) {
    if( !ltgElements[baseName] ) {
      if( !window[baseName] ) {
        throw new eError('e01', 'Base tag by the name "{0}" not found', baseName)
      } else if(!index) { baseType = window[baseName]; }
    } else {
    	if(!baseCtrlName) { baseCtrlName = baseName; }
      apply(push, compilerFn, ltgElements[baseName].compile());
      extend(controllerFn, ltgElements[baseName].controller());
      extend(bindings, ltgElements[baseName].bindings);
      apply(push, linkFn, ltgElements[baseName].link());
      apply(push, unlinkFn, ltgElements[baseName].unlink());
    }
  });

  baseCtrlName = baseCtrlName || name;

  var elmType = ltgElements[name] 
  	= new ltgElement(compilerFn, controllerFn, linkFn, unlinkFn, name);
  $provider.invoke(buildFn, null, elmType);

  elmType.bindings = extend(bindings, elmType.bindings);
  elmType.Attributes = attribute(elmType.bindings);

  var tagElement = Object.create((baseType || window['HTMLElement']).prototype);

  tagElement.createdCallback = function() {
    //INFO: invokded when the tag is created, `this` is the instance of the tag
    
    var nodeData, shadow,
        $attributes = new elmType.Attributes(this),
        $shadow;
    
    if( !elmType.noShadow && (elmType.template || compilerFn.length) 
        && (shadow = this.createShadowRoot()) ) {
      shadow.innerHTML = elmType.template; // template()
      $shadow = new Shadow(this);
    }

    nodeData = {'$attributes': $attributes};

    /* NOTE:
    * Compile the element where we make changes to the element,
    * IMP: the element should not be replaced by the compler function
		*/
    forEach(compilerFn, function(compiler) {
      compiler(this, $attributes, $shadow);
    }, this);

    var controllerLoacls = {
      $element: this,
      $attrs: $attributes
    };

    if(!elmType.noShadow) {
      nodeData.$shadow = controllerLoacls.$shadow = $shadow; }

    forEach(controllerFn, function(ctrlFn, name) {
      if(ctrlFn.extend) {
        $provider.invoke(ctrlFn, controllerLoacls, 
          (nodeData['$' + name + 'Ctrl'] = 
          	nodeData['$' + baseCtrlName + 'Ctrl']) );
      } else {
        nodeData['$' + name + 'Ctrl'] = 
          $provider.instantiate(ctrlFn, controllerLoacls);
      }
    }, this);

    data(this, nodeData);
  };

  tagElement.attachedCallback = function() {
    //INFO: invokded when the tag is attached to a parent
    if(!this[ltgUniqueStr]) { return; }

    var nodeData = data(this),
        linkArgs = [this, nodeData.$attributes];
    if(!elmType.noShadow) { linkArgs.push(nodeData.$shadow); }
    linkArgs.push(undefined);

    forEach(linkFn, function(fn) {
      linkArgs[linkArgs.length - 1] 
        = fn.requires? buildRequireStack(this, fn.requires) : undefined;
        fn.apply(null, linkArgs);
    }, this);
  };

  tagElement.attributeChangedCallback = function(attrName, old, value) {
    if(!this[ltgUniqueStr]) { return; }
    var $attributes = data(this, '$attributes');

    value = (value === null)? false : (value? value : true);
    $attributes.$digest(camelCase(attrName), value, old);
  };

  tagElement.detachedCallback = function() {
    //INFO: invokded when the tag is attached to a parent
    if(!this[ltgUniqueStr]) { return; }
    var nodeData = data(this);

    forEach(unlinkFn, function(compiler) {
      compiler(this, nodeData['$shadow'], nodeData['$attributes']);
    }, this);

    data.clean(this);
  };

  var regOptions = {'prototype': tagElement},
      baseName;

  if( baseType && (baseName = first(base)) &&
        (baseName = LOCAL_ELEMENT_NAME.exec(baseName)) ) {
    regOptions['extends'] = (baseName[1] || baseName[2]).toLowerCase();
  }

  /* register the tag */
  document.registerElement(snakeCase(name), regOptions);
};


  var controllers = {};

function controller(name, fn) {
	controllers[name] = fn;
}
  //http://www.html5rocks.com/en/tutorials/es6/promises/

//array.js

// types.js

/**
 * @doc function
 * @name isArray
 * @module ng
 * @kind function
 *
 * @description
 * Determines if a reference is a `Array`.
 *
 * @param {*} value Reference to check.
 * @returns {boolean} True if `value` is a `Array`.
 */
var isArray = Array.isArray;

/**
 * @doc function
 * @name isFunction
 * @module ng
 * @kind function
 *
 * @description
 * Determines if a reference is a `Function`.
 *
 * @param {*} value Reference to check.
 * @returns {boolean} True if `value` is a `Function`.
 */
function isFunction(value){return typeof(value) === 'function';}

/**
 * @doc function
 * @name isNumber
 * @module ng
 * @kind function
 *
 * @description
 * Determines if a reference is a `Number`.
 *
 * @param {*} value Reference to check.
 * @returns {boolean} True if `value` is a `Number`.
 */
function isNumber(value){return typeof(value) === 'number';}

/**
 * @doc function
 * @name isString
 * @module ng
 * @kind function
 *
 * @description
 * Determines if a reference is a `String`.
 *
 * @param {*} value Reference to check.
 * @returns {boolean} True if `value` is a `String`.
 */
function isString(value){return typeof(value) === 'string';}

/**
 * @doc function
 * @name isObject
 * @module ng
 * @kind function
 *
 * @description
 * Determines if a reference is a `Object`.
 *
 * @param {*} value Reference to check.
 * @returns {boolean} True if `value` is a `Object`.
 */
function isObject(value){return typeof(value) === 'object';}

/**
 * @doc function
 * @name isBoolean
 * @module ng
 * @kind function
 *
 * @description
 * Determines if a reference is a `Boolean`.
 *
 * @param {*} value Reference to check.
 * @returns {boolean} True if `value` is a `Boolean`.
 */
function isBoolean(value){return typeof(value) === 'boolean';}

/**
 * @doc function
 * @name isDefined
 * @module ng
 * @kind function
 *
 * @description
 * Determines if a reference is a `Defined`.
 *
 * @param {*} value Reference to check.
 * @returns {boolean} True if `value` is a `Defined`.
 */
function isDefined(value){return value !== null && typeof value !== 'undefined';}

/**
 * @doc function
 * @name isUndefined
 * @module ng
 * @kind function
 *
 * @description
 * Determines if a reference is a `undefined`.
 *
 * @param {*} value Reference to check.
 * @returns {boolean} True if `value` is a `undefined`.
 */
function isUndefined(value){ return typeof(value) === 'undefined'; }

function isRegExp(value){ return value instanceof RegExp; }

/**
 * @ngdoc function
 * @name angular.isElement
 * @module ng
 * @kind function
 *
 * @description
 * Determines if a reference is a DOM element (or wrapped jQuery element).
 *
 * @param {*} value Reference to check.
 * @returns {boolean} True if `value` is a DOM element (or wrapped jQuery element).
 */
function isElement(node) {
  return !!(node &&
    (node.nodeName  // we are a direct element
    || (node.prop && node.attr && node.find)));  // we have an on and find method part of jQuery API
}
function property(key, def) {
  return function getProperty(obj) {
    var val;
    if( obj ) {
      if( !obj[key] && (val = isFunction(def)? def(): def) ) {
        obj[key] = val;
      }
      return obj[key];
    }
  };
}

function flat(set) {
  var result = [];
  for (var i = 0; i < set.length; i++) {
    invoke(result, set[i]);
  };
  return result;
}

function apply(fn, thisArg, args) {
  if( arguments.length > 3 ) { 
    args = flat(slice.call(arguments, 2)); 
  }
  if( fn ) { return fn.apply(thisArg, args); }
};

function call(fn, thisArg) {
  if( fn ) { return fn.call(thisArg, slice.call(arguments, 2)); }
};

function invoke(fn, thisArg, args) {
  if(args && args.length) {
    fn.apply(thisArg, args);
  } else if(isDefined(args)) { fn.call(thisArg, args); }
  else { fn.call(thisArg); }
  return thisArg;
};
function first(src) {
  if(src && src.length) {
    return src[0]; 
  }
}

function last(src) {
  if(src && src.length) {
    return src[src.length - 1]; 
  }
}

var push = Array.prototype.push;
var pop = Array.prototype.pop;
var unshift = Array.prototype.unshift;
var shift = Array.prototype.shift;
var splice = Array.prototype.splice;
var slice = Array.prototype.slice;

/*function flatInvoke(thisArg, array, fn) {
  if(array && array.length) { fn.apply(thisArg, array); }
  else if(!isArray(array)) { fn.call(thisArg, array); }
  return thisArg;
}*/

/**
* Convert a object to array.
*/
function toArray(dst) {
  forEach(arguments, function(src) {
    if(src !== dst && src) {
      if(!isFunction(src) && isNumber(src.length)) {
        if(src.length) { apply(push, this, src); }
      } else { Array.prototype.push.call(this, src); }
    }
  }, dst);
  return dst;
}

//forEach.js

function forEach(arr, iterator, thisArg) {
  if(arr) {
    var s;
    if(arr.forEach) {
      arr.forEach(iterator, thisArg);
    } else if( isNumber(arr.length) ) {
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
function filter(arr, cbFn, thisArg, result) {
  if( isFunction(arr.filter) ) {
    return arr.filter(cbFn, thisArg);
  }
  
  var isArr = isArray(arr);
  result = result || (isArr? [] : {});
  forEach(arr, function(value, index) {
    if( cbFn.call(thisArg, value, index, arr) ) {
      if( isArr ) { result.push(value); }
      else { result[index] = value; }
    }
  }, thisArg);
  return result;
}

function find(arr, cbFn, thisArg) {
  return arr[findIndex(arr, cbFn, thisArg)];
}

function findIndex(arr, cbFn, thisArg) {
  var s, keys;
  if( isNumber(arr.length) ) {
    for (s = 0; s < arr.length; s++) { 
      if( cbFn.call(thisArg, arr[s], s, arr) ) { return s; }
    }
  } else {
    keys = Object.keys(arr);
    for (s = 0; s < keys.length; s++) {
      if( cbFn.call(thisArg, arr[keys[s]], keys[s], arr) ) { return keys[s]; }
    }
  }
  return -1;
}

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
      
      if(!status) { callbacks.push(arguments); }
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
    return Promise(function(resolve) { resolve(last(arguments)); }, arguments);
  };
  
  P.reject = function() {
    return Promise(function() { arguments[1](last(arguments)); }, arguments);
  };

  return P;
})();
  var $provider = new Provider();
  $provider.provider('$watch', {$get: $watch});
  $provider.provider('$p', {$get: function() { return P; }});

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
    element: element,
    controller: controller,
    provider: function(name, provider) {
      $provider.provider(name, provider);
    },
    str: {
      camelCase: camelCase,
      snakeCase: snakeCase
    }
  }
})()

/*ltg.service('sample', function() { return 'sampleX'; });
ltg.factory('test', ['sample', function(sample){ console.info(sample); }])*/
/**
 * <t> ltg - HTML5 Element Simplified Library
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
var Provider = function(serviceCache) {
  var providerSuffix = 'Provider',
      pError = fError('Provider'),
      configSeq = [], depth = [],
      INIT_STATE = {},
      bootstrap;

  serviceCache = extend(serviceCache, {'$provider': this});

  function canInvoke(fn) {
    return ( isArray(fn) && isFunction( last(fn) ) ) || isFunction(fn);
  }

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
  '*': function attrAndProp(name) {
    var attrName = snakeCase(name);
    return {
      configurable: false,
      get: function() { return this.getAttribute(attrName); },
      set: function(value) { this.setAttribute(attrName, (storage = value)); }
    }
  },
  '=': function prop(name) {
    var storage, $trackers = [];
    return {
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
  }
};

function propertyMap(bmap) {
  var bindings = {};
  forEach(bmap, function(value, type) {
    if( bindingTypes[type] ) {
      if( isArray(value) ) {
        forEach(value, function(name) {
          bindings[name] = bindingTypes[type](name);
        });
      } else { bindings[value] = bindingTypes[type](value); }
    } else if( bindingTypes[type[0]] ) {
      bindings[type.substr(1)] = {value: value};
    }
  });
  return bindings;
};

function Attribute(element) {
  this.$$element = element;
  this.$$observers = {};

  forEach(element.attributes, function(attr) {
    this[camelCase(attr.name)] = attr.value;
  }, this);
};

Attribute.prototype = {
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
  $set: function(name, value) {
    var attrName = snakeCase(name);
    if( this[name] !== value ) {
      this.$digest(name, value, this[name]);
      this.$$element.setAttribute(attrName, value);
    }
  },
  $dispatch: function(eventName, detail) {
    return this.$$element.dispatchEvent(
      new CustomEvent(eventName, detail) );
  },
  // Extract the info from data-* attributes
  $data: function() {}
};


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
var ltgElements = {};

/*Start: Require Stack Function's*/
//NOTE: Partren used to identify the Controller Type
var REQ_REFIX_REGX = /^([\^:]*)?(\??)(.+)/;

/**
 * Function used to identify the controller and map it from an
 * elements `data`.
 */
function mapRequireForElement(require, index, soruce) {
  var requireEx = REQ_REFIX_REGX.exec(require),
      type = requireEx[1],
      optional = requireEx[2] === '?',
      requireName = requireEx[3];

  if( type == this.type ) {
    if( requireName && !!~(index = this.notFound.indexOf(require)) ) {
      requireName = (this.result[requireName]? type : '') + requireName;
      if( (this.result[requireName] = this.data['$' + requireEx[3] + 'Ctrl']) ) {
        this.notFound.splice(index, 1);
        this.found++;
      } else if (!optional && type != '^') {
        throw 'Controller ' + requireEx[3] + ' Not Found';
      }
    }
  }
}

function notFoundStack(notFound) {
  var resultNot = '';
  for(var i = 0; i < notFound.length; i++) {
    if( '?' !== notFound[i][1] ) {
      resultNot = (!i? ', ' : '') + notFound[i];
    }
  }
  return resultNot;
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
function requireStack(element, requires) {
  if(requires && requires.length) {
    var stack = {}, node = element, notFound,
        stackCallBlock = {
          data: data(node),
          result: stack,
          notFound: requires.slice(0),
          found: 0
        };
    
    //NOTE: Search Controllers in the Current Element
    forEach(requires, mapRequireForElement, stackCallBlock);

    if( node.parentNode ) {
      if(element.attributes['for'] &&
          ( stackCallBlock.data = 
            data(node = document.getElementById(element.attributes['for']) ) ) ) {
        stackCallBlock.type = ':';
        forEach(requires, mapRequireForElement, stackCallBlock);
      } // TODO: If we dont have for attr and have an ctrl using "for" throw an error

      stackCallBlock.type = '^';
      node = element.parentNode;

      //NOTE: Search Controllers in Parent Nodes until the top
      do {
        if(stackCallBlock.data = data(node)) {
          forEach(requires, mapRequireForElement, stackCallBlock);
        }
      } while( (node = (node.parentNode || (node.nodeType === 11 && node.host)) ) && 
          stackCallBlock.found < requires.length);
    }

    if( (notFound = notFoundStack(stackCallBlock.notFound)) ) {
      throw 'Controllers Not Found [' + notFound + ']';
    }

    return requires.length == 1? stack[Object.keys(stack)[0]]: stack;
  }
}

/*End: Require Stack Function's*/

var LOCAL_ELEMENT_NAME = /HTML([A-Z]{2}?)|([A-Z][a-z0-9]+)Element/;

function invokeFnsWithRequires(element, fns, noShadow) {
  var nodeData = data(element),
      args = [element, nodeData.$attrs, undefined];
  
  if(!noShadow) { args.splice(2, 0, nodeData.$shadow); }

  forEach(fns, function(fn) {
    if( fn.requires ) {
      args[args.length - 1] = requireStack(element, fn.requires);
    }
    fn.apply(null, args);
  });
}

/**
 * Element 
 * bindings - proporties which are exposed on the element instance
 * controller - an instance of the function which can be shared between
 *    multiple linkers of the same element or children
 * link - function invoked when the element is liked to its parent
 * unlink - function invoked when the element is removed/destroyed
 * compile - function invoked when the element is created
 *
 * An Element can have only one base type and can extend
 * any number of other elements. The base type determines how the
 * element tag is defined
 */

/**
 * The Core function used to build a HTML Element
 */
function element(name) {
  var baseTypes = arguments.length == 3? arguments[1]: undefined,
  type = ltgElements[name] = {
    compile: [],
    controller: {},
    link: [],
    unlink: [],
    binding: {},
    noShadow: false
  },
  elementSetup = $provider.invoke(last(arguments)),
  baseType, baseName, baseCtrlName;

  if( elementSetup ) {
    if(arguments.length === 3) {
      forEach(baseTypes, function(typeName, index) {
        if( !index && (baseType = window[typeName]) ) {
          //NOTE: Base Type should be an HTMLElement
          baseName = (baseName = LOCAL_ELEMENT_NAME.exec(typeName)) &&
            (baseName[1] || baseName[2]).toLowerCase();
        } else if( ltgElements[typeName] ) {
          extend(type, ltgElements[typeName]);
          if(!index) { baseCtrlName = typeName; }
        } else {
          throw 'Base tag by the name "' + typeName + '" not found';
        }
      });
    }

    if( elementSetup.link ) {
      if( isArray(elementSetup.link) ) { // Not correct re-work
        var linkFn = elementSetup.link.pop();
        linkFn.requires = elementSetup.link
        elementSetup.link = linkFn;
      }
    }
    
    if(elementSetup.controller) {
      if(elementSetup.link) {
        elementSetup.link.requires = 
          toArray([], name, elementSetup.link.requires);
      }
      if(elementSetup.unlink) { elementSetup.unlink = [name]; }
      if( isArray(elementSetup.controller) ) {
        elementSetup.controller = elementSetup.controller.shift();
        elementSetup.controller.extend = true;
      }

      type.controller[name] = elementSetup.controller;
      delete elementSetup.controller;
    }

    extend(type, elementSetup);

    var tag = Object.create((baseType || window['HTMLElement']).prototype,
      propertyMap(type.binding));

    /**
     * Invoked when the tage is created, we call the compile methods &
     * create instance of all the controllers for th element.
     */
    tag.createdCallback = function() {
      var nodeData = {
        '$attrs': new Attribute(this)
      };
      
      if( !type.noShadow && this.createShadowRoot() ) {
        //TODO: Support DOM elements
        this.shadowRoot.innerHTML = (type.template || '');
        nodeData['$shadow'] = new Shadow(this);
      }

      var locals = { $element: this };

      /* NOTE:
      * Compile the element where we make changes to the element,
      * IMP: the element should not be replaced by the compler function
      */
      forEach(type.compile, function(compiler) {
        compiler(this, nodeData.$attrs, nodeData.$shadow, function(transclude) {
          //var recent = locals['$transclude'];           return recent;
          locals['$transclude'] = transclude;
        });
      }, this);

      extend(locals, nodeData);

      forEach(type.controller, function(ctrlFn, name) { 
        if(ctrlFn.extend && baseCtrlName) {
          $provider.invoke(ctrlFn, locals, 
            (nodeData['$' + name + 'Ctrl'] = 
              nodeData['$' + baseCtrlName + 'Ctrl']) );
        } else {
          nodeData['$' + name + 'Ctrl'] = 
            $provider.instantiate(ctrlFn, locals);
        }
      }, this);

      data(this, nodeData);
    };

    /**
     * Invoked when the node is attached to its parent
     */
    tag.attachedCallback = function() {
      if(this[ltgUniqueStr]) { // Check to see if we had success in createdCallback
        invokeFnsWithRequires(this, type.link, type.noShadow);
      }
    };

    /**
     * Invoked when a attribute value changes
     */
    tag.attributeChangedCallback = function(attrName, old, value) {
      if(this[ltgUniqueStr]) {
        var $attrs = data(this, '$attrs');

        value = (value === null)? false : (value? value : true);
        $attrs[camelCase(attrName)]  = value;
        $attrs.$digest(camelCase(attrName), value, old);
      }
    };

    tag.detachedCallback = function() {
      if(!this[ltgUniqueStr]) {
        invokeFnsWithRequires(this, type.unlink, type.noShadow);
        data.clean(this); // Clean up the data
      }
    };

    var regOptions = {'prototype': tag};
    if( baseType ) { regOptions['extends'] = baseName; }

    /* register the tag */
    return document.registerElement(snakeCase(name), regOptions);
  }
}

  // ltg.controller.js


var controllers = {};

function controller(name, fn) {
  if(fn) { controllers[name] = fn; }
  return controllers[name];
}

function $controller(name, fn) {
  return controller(name, fn);
}

// If the name is an function directly invoke it

$controller.invoke = function(name, resolvers) {
  var resolved = {};
  forEach(resolvers, function(fn, name) {
    this[name] = D.isFunction(fn)? $provider.invoke(fn, locals): fn;
/*    if(this[name].then) {
      this[name].then(function(result) {
        resolved[name] = result;
      });
    }*/
  }, resolved);

  return P.all(resolved).then(function(depends) {
    return P(function(resolve) {
      // TODO: resolver should provide a link function which
      // would help bind it to a node
      resolve(function linkCtrl(element, locals, bind) { 
        locals['$element'] = element;
        //TODO: get the $attrs into the local stack
        // locals['$attrs'] = element;
        var controller =
            $provider.invoke(controllers[name], extend({}, locals, depends));
        if(bind) { data(element, name + 'Ctrl', controller); }
      });
    });
  });
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

function isDomObj(elm) {
return (isElement(elm) || elm.constructor == Window);
}

function noop() {}	
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

function hasOwn(obj, propName) {
  return Object.hasOwnProperty.apply(obj, propName);
};

function isPO(src) {
  return !isArray(src) && isObject(src) && src.constructor && src.constructor === Object;
}
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
      if(!isFunction(src) && !isString(src) && isNumber(src.length)) {
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
    } else if( isNumber(arr.length) && !isFunction(arr) ) {
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
    //Inc D here
    str: {
      camelCase: camelCase,
      snakeCase: snakeCase
    }
  }

  window.ltg.provider.get = function(name) { return $provider.get(name); }
})();
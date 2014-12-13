/*#inport <string.js>*/
/*#inport 'attributes.js'*/
/*#inport 'ltg.element.data.js'*/
/*#inport 'ltg.shadow.js'*/

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
    if(isFunction(fn)) {
      if(controllerFn[name]) {
        requires = (requires || []);
        requires.push(name);
      }
      fn.requires = requires;
      linkFn.push(fn);
    }
    return linkFn;
  };

  this.unlink = function(fn) {
    if(isFunction(fn)) {
      if(controllerFn[name]) {  fn.requires = [name]; }
      unlinkFn.push(fn);
    }
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
function buildRequireStack(element, requires) {
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
      node = node.parentNode;

      //NOTE: Search Controllers in Parent Nodes until the top
      do {
        //TODO: Need to step out of the Shadow dom for geting the parent
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


function invokeLinks(element, fns, noShadow) {
  var nodeData = data(element),
      fnArgs = [element, nodeData.$attributes];
  
  if(!noShadow) { fnArgs.push(nodeData.$shadow); }
  fnArgs.push(undefined);

  forEach(fns, function(fn) {
    if( fn.requires ) {
      fnArgs[fnArgs.length - 1] = 
        buildRequireStack(element, fn.requires);
    }
    fn.apply(null, fnArgs);
  });
}

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
  // elmType.Attributes = attribute(elmType.bindings);

  var tagElement = Object.create((baseType || window['HTMLElement']).prototype,
    propertyMap(elmType.bindings));

  tagElement.createdCallback = function() {
    //INFO: invokded when the tag is created, `this` is the instance of the tag
    
    var nodeData, shadow,
        $attributes = new Attribute(this),
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

    invokeLinks(this, linkFn, elmType.noShadow);
/*    var nodeData = data(this),
        fnArgs = [this, nodeData.$attributes];
    if(!elmType.noShadow) { fnArgs.push(nodeData.$shadow); }
    fnArgs.push(undefined);

    forEach(linkFn, function(fn) {
      if( fn.requires ) 
        fnArgs[fnArgs.length - 1] = 
          buildRequireStack(this, fn.requires);
      }
      fn.apply(null, fnArgs);
    }, this);*/
  };

  tagElement.attributeChangedCallback = function(attrName, old, value) {
    if(!this[ltgUniqueStr]) { return; }
    var $attributes = data(this, '$attributes');

    value = (value === null)? false : (value? value : true);
    $attributes[camelCase(attrName)]  = value;
    $attributes.$digest(camelCase(attrName), value, old);
  };

  tagElement.detachedCallback = function() {
    //INFO: invokded when the tag is attached to a parent
    if(!this[ltgUniqueStr]) { return; }
    
/*    var nodeData = data(this),
        fnArgs = [this, nodeData.$attributes];
    if(!elmType.noShadow) { fnArgs.push(nodeData.$shadow); }
    fnArgs.push(undefined);

    forEach(unlinkFn, function(fn) {
      if( fn.requires ) 
        fnArgs[fnArgs.length - 1] = 
          buildRequireStack(this, fn.requires);
      }
      fn.apply(null, fnArgs);
    }, this);*/
    invokeLinks(this, unlinkFn, elmType.noShadow);

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


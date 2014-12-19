/*#inport <string.js>*/
/*#inport 'attributes.js'*/
/*#inport 'ltg.element.data.js'*/
/*#inport 'ltg.shadow.js'*/

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

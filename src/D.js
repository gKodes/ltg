// D.js
(function(scope) {
  /*#inport <types.js>*/
  /*#inport <array.js>*/
  
  function extend(dst) {
    forEach(arguments, function(obj){
      if (obj && obj !== dst) {
        forEach(obj, function(value, key) {
          dst[key] = value;
        });
      }
    });
    return dst;
  }

  var _D = scope.D = function(nodes, query) {
    if( isElement(nodes) && query) {
      nodes = _D.findAll(nodes, query);
    }
    return new D(nodes);
  }

  function D(nodes) {
    mergeArray(nodes, this);
  }

  function css(element, name, value) {
    if(isObject(name)) { extend(element.style, name); }
    else { element.style[name] = value; }
  }

  function on(element, type, listener, useCapture) {
    element.addEventListener(type, listener, useCapture);
  }
  
  function off(element, type, listener, useCapture) {
    element.removeEventListener(type, listener, useCapture);
  }
  
  function bind(dst, name, value) {
    return Object.defineProperty(dst, name, {
      __proto__: null,
      value: value
    });
  }
  
  function find(element, selector) {
    return element.querySelector(selector);
  }
  
  function findAll(element, selector) {
    return element.querySelectorAll(selector);
  }

  function setAttr(element, name, value) {
    var attrValue = element.getAttribute(name);
    element.setAttribute(name, value);
    return attrValue;
  }

  function attr(element, name, value) {
    if(!element.getAttribute) { return ''; }

    if(isArray(name)) {
      for(value = 0; value < name.length; value++) {
        name[value] = element.getAttribute(name[value]);
      }
      return name;
    }

    if(isObject(name)) {
      for(value in name) {
        name[value] = setAttr(element, value, name[value]);
      }
      return name;
    }
    
    return isDefined(value)? setAttr(element, name, value) : 
        ( element.getAttribute(name) || '');
  }

  function removeAttr(element) {
    for(var a = 1; a < arguments.length; a++) {
      element.removeAttribute(name[a]);
    }
  }

  function addClass(element, name, noCheck) {
    if(noCheck || !hasClass(element, name)) {
      var classNames = attr(element, 'class');
      classNames = classNames? classNames.split(/\s/g) : [];
      classNames.push(name);
      setAttr(element, 'class', classNames.join(' '));
    }
  }

  function removeClass(element, name, noCheck) {
    if(noCheck || hasClass(element, name)) {
      var classNames = attr(element, 'class').split(/\s/g);
      classNames.splice(classNames.indexOf(name), 1);
      setAttr(element, 'class', classNames.join(' '));
    }
  }
  
  function hasClass(element, name) {
    return !!~(' ' + attr(element, 'class').replace(/\s/g, ' ') + ' ')
        .indexOf(' ' + name + ' ');
  }
  
  function toggleClass(element, classNames) {
    forEach(classNames.split(' '), function(name) {
      (hasClass(element, name)? removeClass: addClass)(element, name, true);
    });
  }

  extend(_D, {
    on: on,
    off: off,
    css: css,
    find: find,
    findAll: findAll,
    attr:attr,
    removeAttr: removeAttr,
    addClass: addClass,
    removeClass: removeClass,
    hasClass: hasClass,
    toggleClass: toggleClass,
    extend: extend,
    isFunction: isFunction,
    isArray: isArray,
    isNumber: isNumber,
    isString: isString,
    isObject: isObject,
    isBoolean: isBoolean,
    isDefined: isDefined,
    isUndefined: isUndefined,
    isRegExp: isRegExp,
    isElement: isElement,
    isDomObj: isDomObj
  });
  _D.forEach = forEach;

  D.prototype = [];

  function mergeArray(args, result) {
    return args && Array.prototype.push.apply((result = result || []), args) && result;
  }

  forEach(['on', 'off', 'css', 'addClass', 'removeClass', 'toggleClass', 'hasClass'], function(name) {
    D.prototype[name] = function() {
      var args = [undefined];
      mergeArray(arguments, args);
      
      forEach(this, function(node) {
        args[0] = node;
        _D[name].apply(null, args);
      });
      return this;
    }
  });

  forEach(['style', 'find', 'attr'], function(name) {
    D.prototype[name] = function() {
      var args = [undefined], result = [];
      mergeArray(arguments, args);
      
      forEach(this, function(node) {
        var out; args[0] = node;
        if(out = _D[name].apply(null, args)) { result.push(out); }
      });

      return result.length === 1? result.pop(): result;
    }
  });

  forEach(['findAll'], function(name) {
    D.prototype[name] = function() {
      var args = [undefined], result = [];
      mergeArray(arguments, args);
      
      forEach(this, function(node) {
        args[0] = node;
        mergeArray(_D[name].apply(null, args), result);
      });

      return result;
    }
  });
})(window);
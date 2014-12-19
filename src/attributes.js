/*#inport <forEach.js>*/
/*#inport <types.js>*/
/*#inport <extend.js>*/
/*#inport 'watch.js'*/

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

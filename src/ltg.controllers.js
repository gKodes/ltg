// ltg.controller.js

/*#inport 'P.js'*/

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

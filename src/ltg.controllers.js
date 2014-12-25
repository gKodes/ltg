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

$controller.invoke = function(name, resolvers, locals) {
  var resolved = {};
  forEach(resolvers, function(fn, name) {
    this[name] = Provider.canInvoke(fn)? $provider.invoke(fn, locals): fn;
  }, resolved);

  return P.all(resolved).then(function(depends) {
    return P(function(resolve) {
      resolve(function linkCtrl(element, locals, bind) { 
        locals = extend({}, locals, depends);
        locals['$element'] = element;
        //TODO: get the $attrs into the local stack
        // locals['$attrs'] = element;
        var controller = $provider.invoke(controllers[name], locals);
        if(bind) { data(element, name + 'Ctrl', controller); }
      });
    });
  });
}

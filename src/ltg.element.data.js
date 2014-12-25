/*#inport <object.js>*/

var ltgUniqueStr, data = (function(uniqueStr) {
  var uid = 0, edCache = {},
      ltgCacheId = property(uniqueStr, nextUid);

  function nextUid() { return ++uid; }

  function getContainer(element) {
    var cacheId = ltgCacheId(element);
    return edCache[cacheId] || ( edCache[cacheId] = {} );
  }

  function data(element, key) {
    var container = getContainer(element);
    return (!isDefined(key) && container) || container[key];
  }

  data.set = function(element, key, value) {
    var container = getContainer(element);
    if( !isObject(key) ) { return (container[key] = value); }

    for(var id in key) {
      container[id] = key[id];
    }    
  };

  data.clean = function(element) {
    var cacheId = ltgCacheId(element);
    if(cacheId && edCache[cacheId]) {
      delete edCache[cacheId];
    }
  };

  return data;
})(ltgUniqueStr = 'ltg' + Date.now() + 'Ci');
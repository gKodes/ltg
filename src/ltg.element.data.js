/*#inport <object.js>*/

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
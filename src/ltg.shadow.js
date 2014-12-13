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
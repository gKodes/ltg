function nodeIterator(nodeMatch) {
  return function NodeIterator(element) {
    var nodes = element.querySelectorAll('*'), idx = 0;

    this.iterateNext = function() {
      var node;
      while (node = nodes[idx++]) {
        if (nodeMatch(node)) {
          return node;
        }
      }
    }
  }
}
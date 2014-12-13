/*
<ltr-remote>
  <ltr-credentials user="" password=""/>
  <ltr-request method="GET|POST" url="" user="" password="">
    <content name="">Value</content>
  </ltr-request>

  <button is="ltr-remote-submit">
    <ltr-request method="GET|POST" url=""/>
  </button>
</ltr-remote>

<remote-ajax>
  <ltr-credentials user="" password=""/>
  <ajax-header name=""></ajax-header>
  <ajax-get url="" user="" password=""/>
  <ajax-post url="" user="" password=""/>
  <button is="ltr-remote-submit">
    <ajax-post url="?optional"/> <!-- if url not present use the form action attrs -->
  </button>
</remote-ajax>
*/

ltg.element('ltgRemote', function() {
  this.noShadow = true;

  this.controller(function($element, $attrs) {});
  
  this.link(function(element, attrs, ltgRemote) {
    D.bind(element, 'request', ltgRemote.request);
    D.bind(element, 'abort', ltgRemote.abort);
    D.bind(element, 'credentials', ltgRemote.credentials);
  });
});

ltg.element('ltgRequest', function() {
  this.noShadow = true;
  this.bindings = {
    'send': '*',
    'url': '*',
/*    '*': ['url', 'send'],
    '&': ['progress', 'load', 'error', 'abort'],
    '=': ['data', 'headers'],*/
    'progress': '&',
    'load': '&',
    'error': '&',
    'abort': '&',
    'data': '=',
    'headers': '='
  };

  this.controller(function($element, $attrs) {
    this.mapData = function(fn) {
      var dataNodes = $element.getElementsByTagName('data');
      for(var i = 0; i < dataNodes.length; i++) {
        if(dataNodes[i].attributes.name) {
          fn(D.attr(headerNodes[i], 'name'), 
              D.attr(headerNodes[i], 'value') || headerNodes[i].innerText);
        }
      }
    };

    this.data = function() {
      var fdata = {};
      this.mapData(function(name, value) { fdata[name] = value; });
      return fdata;
    };

    this.append = function() {};

    this.build = function() { return $attrs; };
  });
  
  this.link(function(element, attrs, ctrls) {
    attrs.$observer('send', function(value) {
      if(value === 'true' && ctrls.ltgRemote.request) {
        attrs.send = false;
        ctrls.ltgRemote.request(ctrls.ltgRequest.build(),
          ctrls.ltgRequest.data(), attrs );
      }
    });
    var auto = attrs.$get('auto');
    attrs.send = (!auto || (auto && auto !== 'false'));
    D.bind(element, 'append', ctrls.ltgRequest.append);
  }, ['^ltgRemote']);
});

ltg.element('remoteAjax', ['ltgRemote'], function() {
  this.noShadow = true;
  this.bindings = {
    'render': '@',
    'view': '@'
  };

  this.controller(function($element, $attrs) {    
    this.request = function(kargs, data, src) {
      var request = new XMLHttpRequest();

      request.addEventListener('progress', function(evt) {
        if(!evt.eventPhase) {
          src.data = undefined;
        }
      }, false);

      request.addEventListener('load', function(evt) {
        src.data = evt.target.response;
        src.load({bubbles: true, cancelBubble: true, detail: evt.target});
      }, false);

      request.addEventListener('error', function(evt) {
        src.$set('error')
        src.error({target: evt.target});
      }, false);

      request.addEventListener('error', function(evt) {
        src.$set('abort')
        src.abort({bubbles: true, cancelable: true, detail: {target: evt.target}});
      }, false);

      request.open(kargs.method || 'GET', kargs.url, true);

      //INFO: support custom headers
      var headerNodes = $element.getElementsByTagName('header');
      for(var i = 0; i < headerNodes.length; i++) {
        if(headerNodes[i].attributes.name) {
          request.setRequestHeader(D.attr(headerNodes[i], 'name'), 
              D.attr(headerNodes[i], 'value') || headerNodes[i].innerText);
        }
      }

      request.send(data);

      return request;
    };
    
    this.abort = function(request) { request.abort() };
    this.credentials = function() {};
  }, true);

  this.link(function(element, attrs, ctrls) {
    if( attrs.view ) {
      attrs.$observer('render', function(value) {
        var viewPoint = document.querySelector(attrs.view);
        if( viewPoint ) {
          viewPoint.innerHTML = (value === 'true')?element.data : '';
        }
      });
    }
  });
});

ltg.controller('ajax.RequestCtrl', ['$element', '$attrs',
  function($element, $attrs) {
    var method = $element.tagName.split('-')[1];
    this.data = function() {
      var formData = new FormData(D.find($element, 'form'));
      this.mapData(function(name, value) {
        formData.append(name, value);
      });
      return formData;
    };

    this.build = function() {
      return {
        method: method,
        url: $attrs.url
      }
    }
  }
]);

ltg.element('ajaxGet', ['ltgRequest'], function() {
  this.noShadow = true;
  this.controller('ajax.RequestCtrl', true);
});

ltg.element('ajaxPost', ['ltgRequest'], function() {
  this.noShadow = true;
  this.controller('ajax.RequestCtrl', true);
});
// Copyright 2011 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

(function(scope) {

  'use strict';

  // polyfill DOMTokenList
  // * add/remove: allow these methods to take multiple classNames
  // * toggle: add a 2nd argument which forces the given state rather
  //  than toggling.

  var add = DOMTokenList.prototype.add;
  var remove = DOMTokenList.prototype.remove;
  DOMTokenList.prototype.add = function() {
    for (var i = 0; i < arguments.length; i++) {
      add.call(this, arguments[i]);
    }
  };
  DOMTokenList.prototype.remove = function() {
    for (var i = 0; i < arguments.length; i++) {
      remove.call(this, arguments[i]);
    }
  };
  DOMTokenList.prototype.toggle = function(name, bool) {
    if (arguments.length == 1) {
      bool = !this.contains(name);
    }
    bool ? this.add(name) : this.remove(name);
  };
  DOMTokenList.prototype.switch = function(oldName, newName) {
    oldName && this.remove(oldName);
    newName && this.add(newName);
  };

  // add array() to NodeList, NamedNodeMap, HTMLCollection

  var ArraySlice = function() {
    return Array.prototype.slice.call(this);
  };

  var namedNodeMap = (window.NamedNodeMap || window.MozNamedAttrMap || {});

  NodeList.prototype.array = ArraySlice;
  namedNodeMap.prototype.array = ArraySlice;
  HTMLCollection.prototype.array = ArraySlice;

  // polyfill performance.now

  if (!window.performance) {
    var start = Date.now();
    // only at millisecond precision
    window.performance = {now: function(){ return Date.now() - start }};
  } else if (!window.performance.now) {
    window.performance.now = function(){ return Date.now() - start };
  }


  // polyfill for requestAnimationFrame

  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = (function() {
      var nativeRaf = window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame;

      return nativeRaf ?
        function(callback) {
          return nativeRaf(function() {
            callback(performance.now());
          });
        } :
        function( callback ){
          return window.setTimeout(callback, 1000 / 60);
        };
    })();
  }

  if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = (function() {
      return  window.webkitCancelAnimationFrame ||
        window.mozCancelAnimationFrame ||
        function(id) {
          clearTimeout(id);
        };
    })();
  }

  // TODO(sorvell): workaround for bug:
  // https://code.google.com/p/chromium/issues/detail?id=229142
  // remove when this bug is addressed
  // give main document templates a base that allows them to fetch eagerly
  // resolved paths relative to the main document
  var template = document.createElement('template');
  var base = document.createElement('base');
  base.href = document.baseURI;
  template.content.ownerDocument.appendChild(base);
  

  // utility

  function createDOM(inTagOrNode, inHTML, inAttrs) {
    var dom = typeof inTagOrNode == 'string' ?
        document.createElement(inTagOrNode) : inTagOrNode.cloneNode(true);
    dom.innerHTML = inHTML;
    if (inAttrs) {
      for (var n in inAttrs) {
        dom.setAttribute(n, inAttrs[n]);
      }
    }
    return dom;
  }
  // Make a stub for Polymer() for polyfill purposes; under the HTMLImports
  // polyfill, scripts in the main document run before imports. That means
  // if (1) polymer is imported and (2) Polymer() is called in the main document
  // in a script after the import, 2 occurs before 1. We correct this here
  // by specfiically patching Polymer(); this is not necessary under native
  // HTMLImports.
  var elementDeclarations = [];

  var polymerStub = function(name, dictionary) {
    elementDeclarations.push(arguments);
  }
  window.Polymer = polymerStub;

  // deliver queued delcarations
  scope.deliverDeclarations = function() {
    scope.deliverDeclarations = null;
    return elementDeclarations;
  }

  // Once DOMContent has loaded, any main document scripts that depend on
  // Polymer() should have run. Calling Polymer() now is an error until
  // polymer is imported.
  window.addEventListener('DOMContentLoaded', function() {
    if (window.Polymer === polymerStub) {
      window.Polymer = function() {
        console.error('You tried to use polymer without loading it first. To ' +
          'load polymer, <link rel="import" href="' + 
          'components/polymer/polymer.html">');
      };
    }
  });

  // exports
  scope.createDOM = createDOM;

})(window.Platform);

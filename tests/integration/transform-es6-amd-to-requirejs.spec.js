'use strict';

const preset = require('preset/amd-to-requirejs.js');

describe('transform-es6-amd-to-requirejs', () => {
  beforeAll(() => {
      exposeBabel(preset);
  })

  it('exports functions in es5 module as top level return object', () => {
    expectJavaScript(`export function coolFunction(value) { return false; }`)
      .toTransformLike(
        `define([], function () {
              var _exports = {};
              
              return _exports;
          });
          `
      );
  });

  it('exports default class as es5 class', () => {
      expectJavaScript(
          `class SomeClass { 
              constructor(value1) {
                this.value1 = value1;          
              }
          }
          
          export default SomeClass`
      )
      .toTransformLike(
        `define([], function () {
            "use strict";
            
            var _exports = {};
            var _defaultExports = function _default(value) {
               return false;
            };
            
            Object.assign(defaultExports, _exports);
            return _defaultExports;
        });
        `
      );
  });
});

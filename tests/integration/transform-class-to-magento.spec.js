const preset = require('preset/classes');

describe('transform-es6-class-to-magento', () => {
  beforeAll(() => {
    exposeBabel([preset, {magentoClasses: ['uiCollection', 'uiElement']}]);
  });

  it('leaves non magento class in tact', () => {
    expectJavaScript(
      `define(["some-location"], function (someLocation) {
        class CoolClass extends someLocation {}
        return CoolClass;
      });`
    ).toTransformLike(
      `define(["some-location"], function (someLocation) {
        class CoolClass extends someLocation {}
        return CoolClass;
      });`
    );
  });

  it('simple class is transformed into Magento format', () => {
    expectJavaScript(
      `define(["uiElement"], function (Element) {
        class CoolClass extends Element {
          someMethod(argument) {
            return true;
          }
        }
        return CoolClass;
       });`
    ).toTransformLike(
      `define(["uiElement"], function (Element) {
        const CoolClass = Element.extend({
          someMethod: function (argument) {
            return true;
          }
        });
          
        return CoolClass;
    });`
    );
  });

  it('simple class is transformed into Magento format', () => {
    expectJavaScript(
      `define(["uiElement"], function (Element) {
        class CoolClass extends Element {
          someMethod(argument) {
            return true;
          }
        }
        return CoolClass;
      });`
    ).toTransformLike(
      `define(["uiElement"], function (Element) {
        const CoolClass = Element.extend({
          someMethod: function (argument) {
            return true;
          }
        });
        
        return CoolClass;
      });`
    );
  });

  it('class with properties is transformed into Magento format', () => {
    expectJavaScript(
      `define(["uiElement"], function (Element) {
        class CoolClass extends Element {
          property = 'one';
          defaults = {value: 1};

          someMethod(argument) {
            return true;
          }
        }
        
        return CoolClass;
      });`
    ).toTransformLike(
      `define(["uiElement"], function (Element) {
        const CoolClass = Element.extend({
          property: 'one',
          defaults: {
            value: 1          
          },
          someMethod: function (argument) {
            return true;
          }
        });
        
        return CoolClass;
      });`
    );
  });

  it('methods with super calls correctly transofrmed into Magento _super', () => {
    expectJavaScript(
      `define(["uiElement"], function (Element) {
        class CoolClass extends Element {
          constructor() {
            super();
          }

          someMethod(argument) {
            super.someMethod(argument).otherCall();
          } 
        }
        
        return CoolClass;
      });`
    ).toTransformLike(
      `define(["uiElement"], function (Element) {
        const CoolClass = Element.extend({
          initialize: function () {
            _super();
          },
          someMethod: function (argument) {
            _super(argument).otherCall();
          }
        });
        
        return CoolClass;
      });`
    );
  });

  it('methods with super calls correctly transofrmed into Magento _super', () => {
      expectJavaScriptError(
          `define(["uiElement"], function (Element) {
      class CoolClass extends Element {
        someMethod(argument) {
          super.otherCall();
        }
      }
      
      return CoolClass;
    });`
      ).toThrow();
  });
});

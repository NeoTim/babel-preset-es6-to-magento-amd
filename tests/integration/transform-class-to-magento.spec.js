const preset = require('preset/classes').default;

describe('transform-es6-class-to-magento', () => {
  beforeAll(() => {
    exposeBabel(preset(['uiCollection', 'uiElement']));
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
          constructor() {
            this.property = 'one';
            this.default = {
              value: 1
            };
          }

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
          default: {
            value: 1          
          },
          initialize: function () {},
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

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
});

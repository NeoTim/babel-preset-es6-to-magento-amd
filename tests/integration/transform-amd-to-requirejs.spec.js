describe('transform-es6-amd-to-requirejs', () => {
  beforeAll(() => {
      exposeBabel(require('preset/amd-to-requirejs'));
  });

  it('exports functions in es5 module in top level return object', () => {
    expectJavaScript(`
export function coolFunction(value) { return false; }
    `).toTransformLike(`
define([], function () {
    function coolFunction(value) { return false; }
    return {
        coolFunction: coolFunction
    };
});`);
  });

  it('exports functions in es5 module in top level return object', () => {
    expectJavaScript(`
class CoolClass {}
export { CoolClass }
export function coolFunction() {}
    `).toTransformLike(`
define([], function () {
    class CoolClass {}
    function coolFunction() {}
    return {
        coolFunction: coolFunction,
        CoolClass: CoolClass
    };
});`);
  });

  it('exports default function as is', () => {
    expectJavaScript(`
export default function coolFunction() {}
    `).toTransformLike(`
define([], function () {
    function coolFunction() {}
    return coolFunction;
});`);
  });

  it('adds other exports to default export', () => {
    expectJavaScript(`
export function anotherExportOne() {}
export function anotherExportTwo() {}
export default function coolFunction() {}
    `).toTransformLike(`
define([], function () {
    function anotherExportOne() {}
    function anotherExportTwo() {}
    function coolFunction() {}
    
    return Object.assign(coolFunction, {
       anotherExportOne: anotherExportOne,
       anotherExportTwo: anotherExportTwo
    });
});`);
  });

  it('uses default object as dependency when instantiates a class', () => {
    expectJavaScript(`
import dependency from 'some-location';
export default function coolFunction() {
    const value = new dependency();
    return value;
}
    `).toTransformLike(`
define(["some-location"], function (_someLocation) {
    function coolFunction() {
        const value = new _someLocation();
        return value;
    }
    
    return coolFunction;
});`);
  });

  it('uses default object as dependency when extends a class', () => {
    expectJavaScript(`
import dependency from 'some-location';
export default class CoolClass extends dependency {}
    `).toTransformLike(`
define(["some-location"], function (_someLocation) {
    class CoolClass extends _someLocation {}
    return CoolClass;
});`);
  });
});

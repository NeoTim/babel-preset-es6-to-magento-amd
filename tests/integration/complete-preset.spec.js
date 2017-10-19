describe('transform-es6-amd-to-requirejs', () => {
  beforeAll(() => {
    exposeBabel([__dirname + '/../../', { magentoClasses: ['test'] }]);
  });

  it('uses transforms TypeScript function only modules', () => {
    expectTypeScript(`
        export function moveArrayItem(array: Array<any> | KnockoutObservableArray<any>, fromIndex: number, toIndex: number): Array<any> | KnockoutObservableArray<any> {
            return array;
        }
        
        export function moveArrayItemIntoArray(item: any, array: Array<any> | KnockoutObservableArray<any>, toIndex: number): Array<any> | KnockoutObservableArray<any> {
            return array;
        }
        
        export function removeArrayItem(array: Array<any> | KnockoutObservableArray<any>, item: any): Array<any> | KnockoutObservableArray<any> {
            return array;
        }
    `).toTransformLike(`
        define([], function () {
          function moveArrayItem(array, fromIndex, toIndex) {
              return array;
          }
          
          function moveArrayItemIntoArray(item, array, toIndex) {
              return array;
          }
          
          function removeArrayItem(array, item) {
              return array;
          }
          
          return {
              moveArrayItem: moveArrayItem,
              moveArrayItemIntoArray: moveArrayItemIntoArray,
              removeArrayItem: removeArrayItem
          };
        });
    `);
  });

  it('uses default object as dependency when extends a class', () => {
    expectTypeScript(`
        import Test from 'test'; 
        
        export default class extends Test {}
    `).toTransformLike(`
        define(["test"], function (_test) { 
            const _default = _test.extend({}); 
            return _default;
        });
    `);
  });
});

const preset = require('index').preset;

describe('transform-es6-amd-to-requirejs', () => {
    beforeAll(() => {
        exposeBabel(preset(['uiElement']));
    });

    it('uses default object as dependency when extends a class', () => {
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
});`);
    });
});

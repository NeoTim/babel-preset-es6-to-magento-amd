'use strict';

const { findAmdModule, extractDependencyMap, removeExportsDependency } = require('ast-utils');
const t = require('babel-types');

describe('findAmdModule', () => {
  const ast = fixture(`
        define(['dep1'], function () {});
        define('name', ['dep1'], function () {});
        ("some string");
        callToSomeMethod();
        (function() {
            define(['dep1'], function() {});
        });
        define();
        define(['dep1']);
        define(function () {});
    `);

  it('returns true when expression is a simple define expression', () => {
    expect(findAmdModule(ast.body(0))).toMatchAstType('CallExpression');
  });

  it('returns true when expression is a named define expression', () => {
    expect(findAmdModule(ast.body(1))).toMatchAstType('CallExpression');
  });

  it('returns false when expression is not a call expression', () => {
    expect(findAmdModule(ast.body(2))).toBe(false);
  });

  it('returns false when expression is a function call, but not a define', () => {
    expect(findAmdModule(ast.body(3))).toBe(false);
  });

  it('returns false when define is not in program scope ', () => {
    expect(findAmdModule(ast.bodyPath('expression.body.body.0', 4))).toBe(false);
  });

  it('returns false when define is invalid', () => {
    expect(findAmdModule(ast.body(5))).toBe(false);
  });

  it('returns false when define does not have factory ', () => {
    expect(findAmdModule(ast.body(6))).toBe(false);
  });

  it('returns false when define does not have dependencies ', () => {
    expect(findAmdModule(ast.body(7))).toBe(false);
  });
});

describe('extractDependencyMap', () => {
  it('returns empty map if dependency list is empty', () => {
    const ast = fixture('define([], function () {})');
    expect(extractDependencyMap(ast.bodyPath('expression'))).toEqual({});
  });

  it('returns dependency map for all dependencies in factory', () => {
    const ast = fixture('define(["dep1", "dep2", "dep3"], function (dep1, dep2, dep3) {});');
    expect(extractDependencyMap(ast.bodyPath('expression'))).toEqual({
      dep1: expect.objectContaining(t.identifier('dep1')),
      dep2: expect.objectContaining(t.identifier('dep2')),
      dep3: expect.objectContaining(t.identifier('dep3'))
    });
  });

  it('returns dependency map only for dependencies available in factory', () => {
    const ast = fixture('define(["dep1", "dep2", "dep3"], function (dep1, dep2) {});');
    expect(Object.keys(extractDependencyMap(ast.bodyPath('expression')))).toEqual(['dep1', 'dep2']);
  });
});

describe('removeExportsDependency', () => {
  it('removes exports dependency', () => {
    const ast = fixture('define(["exports"], function (_exports) {})');
    removeExportsDependency(ast.bodyPath('expression'));
    expect(extractDependencyMap(ast.bodyPath('expression'))).toEqual({});
  });

  it('removes exports dependency and leaves other dependencies in tact', () => {
    const ast = fixture('define(["dep1", "exports", "dep3"], function (dep1, _exports, dep3) {})');
    removeExportsDependency(ast.bodyPath('expression'));
    expect(extractDependencyMap(ast.bodyPath('expression'))).toEqual({
      dep1: expect.objectContaining(t.identifier('dep1')),
      dep3: expect.objectContaining(t.identifier('dep3'))
    });
  });

    it('leaves dependencies in tact if no exports found', () => {
        const ast = fixture('define(["dep1", "dep2", "dep3"], function (dep1, _exports, dep3) {})');
        removeExportsDependency(ast.bodyPath('expression'));
        expect(extractDependencyMap(ast.bodyPath('expression'))).toEqual({
            dep1: expect.objectContaining(t.identifier('dep1')),
            dep2: expect.objectContaining(t.identifier('_exports')),
            dep3: expect.objectContaining(t.identifier('dep3'))
        });
    });
});

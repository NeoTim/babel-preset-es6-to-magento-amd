const {
  findAmdModule,
  extractDependencyMap,
  removeExportsDependency,
  extractDependencyAndFactory,
  isEsModulePropertyDefinition,
  isObjectAssignment,
  isVoidExpression,
  isInteropRequireCall,
  isInteropRequireDefinition
} = require('ast-utils');

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
  const ast = fixture(`
    define([], function () {});
    define(["dep1", "dep2", "dep3"], function (dep1, dep2, dep3) {});
    define(["dep1", "dep2", "dep3"], function (dep1, dep2) {});
  `);

  it('returns empty map if dependency list is empty', () => {
    expect(extractDependencyMap(ast.bodyPath('expression', 0))).toEqual({});
  });

  it('returns dependency map for all dependencies in factory', () => {
    expect(extractDependencyMap(ast.bodyPath('expression', 1))).toEqual({
      dep1: expect.objectContaining(t.identifier('dep1')),
      dep2: expect.objectContaining(t.identifier('dep2')),
      dep3: expect.objectContaining(t.identifier('dep3'))
    });
  });

  it('returns dependency map only for dependencies available in factory', () => {
    expect(Object.keys(extractDependencyMap(ast.bodyPath('expression', 2)))).toEqual([
      'dep1',
      'dep2'
    ]);
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

describe('isEsModulePropertyDefinition', () => {
  const ast = fixture(`
      Object.defineProperty(_exports, "__esModule", {value: true});
      Object.defineProperty(_customExports, "__esModule", {value: true});
      defineProperty(_exports, "__esModule", {value: true});
      Object.assign(_exports, "__esModule", {value: true});
      Something.defineProperty(_exports, "__esModule", {value: true});
      Object.defineProperty(_exports, "anotherProperty", {value: true});
      Object.defineProperty(_someOther, "__esModule", {value: true});
    `);

  it('returns true if valid expression is provided', () => {
    expect(isEsModulePropertyDefinition(ast.body(0), t.identifier('_exports'))).toBe(true);
  });

  it('returns true if valid expression is provided with custom scope', () => {
    expect(isEsModulePropertyDefinition(ast.body(1), t.identifier('_customExports'))).toBe(true);
  });

  it('returns false if not a member expression', () => {
    expect(isEsModulePropertyDefinition(ast.body(2), t.identifier('_exports'))).toBe(false);
  });

  it('returns false if not defineProperty method', () => {
    expect(isEsModulePropertyDefinition(ast.body(3), t.identifier('_exports'))).toBe(false);
  });

  it('returns false if not Object instance', () => {
    expect(isEsModulePropertyDefinition(ast.body(4), t.identifier('_exports'))).toBe(false);
  });

  it('returns false if not __esModule property is defined', () => {
    expect(isEsModulePropertyDefinition(ast.body(5), t.identifier('_exports'))).toBe(false);
  });

  it('returns false if property identifier is not matching one in scope', () => {
    expect(isEsModulePropertyDefinition(ast.body(6), t.identifier('_exports'))).toBe(false);
  });
});

describe('extractDependencyAndFactory', () => {
  const ast = fixture(`
      define(['dep1'], function () {});
      define('name', ['dep1'], function () {});
  `);

  it('returns first and second argument when simple definition', () => {
    expect(extractDependencyAndFactory(ast.bodyPath('expression', 0))).toEqual({
      factory: isMatching(t.isFunctionExpression),
      dependencies: isMatching(t.isArrayExpression)
    });
  });

  it('returns second and third argument when named definition', () => {
    expect(extractDependencyAndFactory(ast.bodyPath('expression', 1))).toEqual({
      factory: isMatching(t.isFunctionExpression),
      dependencies: isMatching(t.isArrayExpression)
    });
  });
});

describe('isObjectAssignment', () => {
  const ast = fixture(`
      someObject.name = name;
      notAssignment();
      notObject = name; 
      anotherObject.name = name;
      someObject.notASimpleProperty[1] = name;
      this.someProperty = name;
  `);

  const objectId = t.identifier('someObject');

  it('returns true when valid object is provided', () => {
    expect(isObjectAssignment(ast.body(0), objectId)).toBe(true);
  });

  it('returns false when not an assignment', () => {
    expect(isObjectAssignment(ast.body(1), objectId)).toBe(false);
  });

  it('returns false when not a member assignment', () => {
    expect(isObjectAssignment(ast.body(2), objectId)).toBe(false);
  });

  it('returns false when a member assignment does not match current object', () => {
    expect(isObjectAssignment(ast.body(3), objectId)).toBe(false);
  });

  it('returns false when a member assignment is not a simple property', () => {
    expect(isObjectAssignment(ast.body(4), objectId)).toBe(false);
  });

  it('supports this as objectId', () => {
    expect(isObjectAssignment(ast.body(5), t.thisExpression())).toBe(true);
  });
});

describe('isVoidExpression', () => {
  const ast = fixture(`
      void 0;
      notUnaryExpression();
      typeof item;
    `);

  it('returns true when void statement is provided', () => {
    expect(isVoidExpression(ast.bodyPath('expression', 0))).toBe(true);
  });

  it('returns false when not an unary expression', () => {
    expect(isVoidExpression(ast.bodyPath('expression', 1))).toBe(false);
  });

  it('returns false when not a void unary expression', () => {
    expect(isVoidExpression(ast.bodyPath('expression', 2))).toBe(false);
  });
});

describe('isInteropRequireCall', function() {
  const ast = fixture(`
        someValue = _interopRequireDefault(someValue);
        someValue;
        someValue = someValue;
        someValue = anotherCall(someValue);
        someValue = _interopRequireDefault2(someValue);
    `);

  it('returns true when a proper interop assignment call provided', () => {
    expect(isInteropRequireCall(ast.body(0))).toBe(true);
  });

  it('returns false when regular expression', () => {
    expect(isInteropRequireCall(ast.body(1))).toBe(false);
  });

  it('returns false when not a function call assignment', () => {
    expect(isInteropRequireCall(ast.body(2))).toBe(false);
  });

  it('returns false when another function call', () => {
    expect(isInteropRequireCall(ast.body(3))).toBe(false);
  });

  it('returns true when a proper interop assignment call with indexed name', () => {
    expect(isInteropRequireCall(ast.body(4))).toBe(true);
  });
});

describe('isInteropRequireDefinition', function() {
  const ast = fixture(`
        function _interopRequireDefault() {}
        nonDefinition;
        function anotherFunction() {}
        function _interopRequireDefault2() {}
    `);

  it('returns true when a proper interop definition provided', () => {
    expect(isInteropRequireDefinition(ast.body(0))).toBe(true);
  });

  it('returns false when not a function definition', () => {
    expect(isInteropRequireDefinition(ast.body(1))).toBe(false);
  });

  it('returns false when another function definition provided', () => {
    expect(isInteropRequireDefinition(ast.body(2))).toBe(false);
  });

  it('returns true when a proper interop definition provided with function index', () => {
    expect(isInteropRequireDefinition(ast.body(3))).toBe(true);
  });
});

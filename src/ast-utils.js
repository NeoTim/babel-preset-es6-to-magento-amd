import * as t from 'babel-types';

const INTEROP_FUNCTION_NAME = '_interopRequire';

const findExpression = path => {
  if (!t.isExpressionStatement(path.node)) {
    return false;
  }

  return path.get('expression');
};

const isObjectProperty = (path, objectName, propertyName) => {
  return (
    t.isMemberExpression(path) &&
    path.get('object').isIdentifier(t.identifier(objectName)) &&
    path.get('property').isIdentifier(t.identifier(propertyName))
  );
};

export function extractDependencyAndFactory(path) {
  const args = path.node.arguments;

  const dependencies = path.get(`arguments.${args.length - 2}`);
  const factory = path.get(`arguments.${args.length - 1}`);

  return { dependencies, factory };
}

export function findAmdModule(path) {
  if (!path.parentPath.isProgram()) {
    return false;
  }

  const expression = findExpression(path);
  if (
    !expression ||
    !t.isCallExpression(expression) ||
    !t.isIdentifier(expression.node.callee, { name: 'define' })
  ) {
    return false;
  }

  const { dependencies, factory } = extractDependencyAndFactory(expression);
  if (dependencies && factory) {
    return expression;
  }

  return false;
}

export function extractDependencyMap(path) {
  const dependencyMap = {};

  const { dependencies, factory } = extractDependencyAndFactory(path);
  const dependencyList = dependencies.node.elements;
  const factoryParams = factory.node.params;

  dependencyList.forEach((dependency, index) => {
    if (factoryParams[index]) {
      dependencyMap[dependency.value] = factoryParams[index];
    }
  });

  return dependencyMap;
}

export function removeExportsDependency(path) {
  const { dependencies, factory } = extractDependencyAndFactory(path);
  const dependencyMap = extractDependencyMap(path);

  if (!dependencyMap.exports) {
    return;
  }

  dependencies.node.elements = dependencies.node.elements.filter(
    item => !t.isStringLiteral(item, { value: 'exports' })
  );
  factory.node.params = factory.node.params.filter(
    item => !t.isIdentifier(item, dependencyMap.exports)
  );
}

export function isEsModulePropertyDefinition(path, scope) {
  const callExpression = findExpression(path);
  const callee = callExpression.get('callee');
  const callArguments = callExpression.node.arguments;

  const isObjectDefinePropertyCall = isObjectProperty(callee, 'Object', 'defineProperty');

  if (isObjectDefinePropertyCall) {
    const isEsModulePropertyInArguments = t.isStringLiteral(callArguments[1], {
      value: '__esModule'
    });
    const isInScope = t.isIdentifier(callArguments[0], scope);

    return isEsModulePropertyInArguments && isInScope;
  }

  return false;
}

export function isObjectAssignment(path, objectId) {
  const expression = t.isAssignmentExpression(path) ? path : findExpression(path);
  const isMemberAssignment =
    t.isAssignmentExpression(expression) && t.isMemberExpression(expression.get('left'));

  if (isMemberAssignment) {
    return t.isNodesEquivalent(expression.get('left.object').node, objectId);
  }

  return false;
}

export function isVoidExpression(path) {
  return t.isUnaryExpression(path) && path.node.operator === 'void';
}

export function isInteropRequireCall(path) {
  const expression = findExpression(path);
  const isAssignmentCall =
    t.isAssignmentExpression(expression) && t.isCallExpression(expression.get('right'));

  if (isAssignmentCall) {
    const callee = expression.get('right.callee');
    return callee.isIdentifier() && callee.node.name.indexOf(INTEROP_FUNCTION_NAME) === 0;
  }

  return false;
}

export function isInteropRequireDefinition(path) {
  if (t.isFunction(path) && path.node.id) {
    return path.node.id.name.indexOf(INTEROP_FUNCTION_NAME) === 0;
  }

  return false;
}

import {
  findAmdModule,
  removeExportsDependency,
  extractDependencyAndFactory,
  extractDependencyMap,
  isEsModulePropertyDefinition,
  isObjectAssignment,
  isVoidExpression,
  isInteropRequireCall,
  isInteropRequireDefinition
} from '../../ast-utils';

import * as t from 'babel-types';

const replaceExportAssignment = (path, state) => {
  const property = path.get('left.property');
  const expression = path.get('right');
  path.remove();

  if (isVoidExpression(expression)) {
    return;
  }
  if (property.isIdentifier({ name: 'default' })) {
    state.defaultExport = expression.node;
    return;
  }
  state.exports.push(t.objectProperty(property.node, expression.node));
};

const memberExpressionVisitor = {
  MemberExpression(path, state) {
    const matchedDependencies = state.dependencies.filter(item =>
      path.get('object').isIdentifier({ name: item.name })
    );
    const isDefaultDependency =
      matchedDependencies.length === 1 && path.get('property').isIdentifier({ name: 'default' });

    if (isDefaultDependency) {
      path.replaceWith(matchedDependencies[0]);
    }
  }
};

const functionBodyVisitor = {
  ExpressionStatement(path, state) {
    if (isEsModulePropertyDefinition(path, state.scope)) {
      path.remove();
    }
    if (isObjectAssignment(path, state.scope)) {
      replaceExportAssignment(path.get('expression'), state);
    }
    if (isInteropRequireCall(path)) {
      path.remove();
    }
  },
  Function(path, state) {
    if (isInteropRequireDefinition(path)) {
      path.remove();
    }

    path.traverse(memberExpressionVisitor, state);
  },
  ClassMethod(path, state) {
    path.traverse(memberExpressionVisitor, state);
  },
  DirectiveLiteral(path) {
    if (path.node.value === 'use strict') {
      path.parentPath.remove();
    }
  },
  MemberExpression: memberExpressionVisitor.MemberExpression
};

const processAmdDefinition = path => {
  const { factory } = extractDependencyAndFactory(path);
  const dependencyMap = extractDependencyMap(path);
  if (dependencyMap.exports) {
    removeExportsDependency(path);
    const state = {
      scope: dependencyMap.exports,
      dependencies: Object.values(dependencyMap),
      exports: []
    };

    factory.traverse(functionBodyVisitor, state);

    let returnStatement = t.objectExpression(state.exports);

    if (state.defaultExport) {
      returnStatement = state.defaultExport;

      if (state.exports.length > 0) {
        returnStatement = t.callExpression(
          t.memberExpression(t.identifier('Object'), t.identifier('assign')),
          [state.defaultExport, t.objectExpression(state.exports)]
        );
      }
    }

    factory.get('body').pushContainer('body', t.returnStatement(returnStatement));
  }
};

export default function() {
  return {
    visitor: {
      ExpressionStatement(path) {
        const amdModule = findAmdModule(path);
        if (amdModule) {
          processAmdDefinition(amdModule);
        }
      }
    }
  };
}

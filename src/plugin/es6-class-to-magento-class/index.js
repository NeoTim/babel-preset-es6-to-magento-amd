import {
  findAmdModule,
  extractDependencyAndFactory,
  extractDependencyMap,
  isObjectAssignment
} from '../../ast-utils';

import * as t from 'babel-types';

import classPropertySyntax from 'babel-plugin-syntax-class-properties';

const classMethodVisitor = {
  Super(path, state) {
    if (state.isConstructor && t.isCallExpression(path.parent)) {
      path.replaceWith(t.identifier('_super'));
      return;
    }

    if (
      t.isMemberExpression(path.parent) &&
      t.isIdentifier(path.parent.property, { name: state.methodName })
    ) {
      path.parentPath.replaceWith(t.identifier('_super'));
      return;
    }

    throw path.buildCodeFrameError(
      'You can call super object method only on the same method as current one'
    );
  }
};

const classBodyVisitor = {
  ClassProperty: function(path, state) {
    state.classProperties.push(
      t.objectProperty(path.node.key, path.node.value, path.node.computed, false)
    );
  },
  ClassMethod: function(path, state) {
    path.skip();

    const isConstructor = t.isIdentifier(path.node.key, { name: 'constructor' });
    const methodName = isConstructor ? 'initialize' : path.node.key.name;

    path.traverse(classMethodVisitor, { isConstructor, methodName });

    state.properties.push(
      t.objectProperty(
        isConstructor ? t.identifier('initialize') : path.node.key,
        t.functionExpression(
          null,
          path.node.params,
          path.node.body,
          path.node.generator,
          path.node.async
        ),
        path.node.computed,
        false
      )
    );
  }
};

const factoryBodyVisitor = {
  ClassDeclaration(path, state) {
    path.skip();
    const superClass = path.get('superClass');
    if (state.replaceClasses[superClass.node.name]) {
      const classState = {
        classProperties: [],
        properties: []
      };

      path.traverse(classBodyVisitor, classState);
      path.replaceWith(
        t.variableDeclaration('const', [
          t.variableDeclarator(
            path.node.id,
            t.callExpression(t.memberExpression(superClass.node, t.identifier('extend')), [
              t.objectExpression(classState.classProperties.concat(classState.properties))
            ])
          )
        ])
      );
    }
  }
};

const processAmdDefinition = (path, magentoClasses) => {
  const { factory } = extractDependencyAndFactory(path);
  const dependencyMap = extractDependencyMap(path);
  const replaceClasses = {};

  Object.keys(dependencyMap)
    .filter(key => magentoClasses.indexOf(key) !== -1)
    .forEach(key => {
      replaceClasses[dependencyMap[key].name] = key;
    });

  const state = { replaceClasses };

  factory.traverse(factoryBodyVisitor, state);
};

export default function() {
  return {
    inherits: classPropertySyntax,
    visitor: {
      ExpressionStatement(path, state) {
        const amdModule = findAmdModule(path);
        const magentoClasses = state.opts.magentoClasses;
        if (amdModule) {
          processAmdDefinition(amdModule, magentoClasses);
        }
      }
    }
  };
}

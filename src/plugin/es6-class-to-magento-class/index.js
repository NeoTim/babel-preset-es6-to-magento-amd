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
    const value = path.node.value || t.nullLiteral();

    state.classProperties.push(
      t.objectProperty(path.node.key, value, path.node.computed, false)
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

const extractDependencyMapFromImport = path => {
  const dependencyMap = {};

  if (path) {
    path.get('body').forEach(statement => {
      if (statement.isImportDeclaration()) {
        statement.get('specifiers').forEach(specifier => {
          if (specifier.isImportDefaultSpecifier()) {
            dependencyMap[statement.node.source.value] = specifier.node.local;
          }
        });
      }
    });
  }

  return dependencyMap;
};

const isMagentoSuperClass = (path, magentoClasses) => {
  const amdModuleParent = path.find(
    parent => (parent.isExpressionStatement() ? findAmdModule(parent) : false)
  );

  const dependencyMap = amdModuleParent
    ? extractDependencyMap(findAmdModule(amdModuleParent))
    : extractDependencyMapFromImport(path.find(parent => parent.isProgram()));

  return (
    Object.keys(dependencyMap)
      .filter(key => magentoClasses.indexOf(key) !== -1)
      .findIndex(key => path.isIdentifier({ name: dependencyMap[key].name })) !== -1
  );
};

export default function() {
  return {
    inherits: classPropertySyntax,
    visitor: {
      ClassDeclaration(path, state) {
        const superClass = path.get('superClass');
        if (
          t.isIdentifier(superClass.node) &&
          isMagentoSuperClass(superClass, state.opts.magentoClasses)
        ) {
          const classState = {
            classProperties: [],
            properties: []
          };

          if (!path.node.id) {
            path.node.id = path.scope.generateUidIdentifier('_defaultClass');
          }

          path.traverse(classBodyVisitor, classState);
          const magentoClass = t.variableDeclaration('const', [
            t.variableDeclarator(
              path.node.id,
              t.callExpression(t.memberExpression(superClass.node, t.identifier('extend')), [
                t.objectExpression(classState.classProperties.concat(classState.properties))
              ])
            )
          ]);

          if (path.parentPath.isExportDeclaration()) {
            path.parentPath.insertBefore(magentoClass);
            path.replaceWith(path.node.id);
            return;
          }

          path.replaceWith(magentoClass);
        }
      }
    }
  };
}

import { findAmdModule, extractDependencyAndFactory, extractDependencyMap } from '../../ast-utils';
import * as t from 'babel-types';

const classBodyVisitor = {
  ClassProperty: function() {},
  ClassMethod: function(path, state) {
    state.properties.push(
      t.objectProperty(
        path.node.key,
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
        properties: []
      };

      path.traverse(classBodyVisitor, classState);
      path.replaceWith(
        t.variableDeclaration('const', [
          t.variableDeclarator(
            path.node.id,
            t.callExpression(t.memberExpression(superClass.node, t.identifier('extend')), [
              t.objectExpression(classState.properties)
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

export default function(magentoClasses) {
  return () => {
    return {
      visitor: {
        ExpressionStatement(path) {
          const amdModule = findAmdModule(path);
          if (amdModule) {
            processAmdDefinition(amdModule, magentoClasses);
          }
        }
      }
    };
  };
}

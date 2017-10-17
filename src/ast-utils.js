import * as t from 'babel-types';

const findExpression = (path) => {
    if (!t.isExpressionStatement(path.node)) {
        return false;
    }

    return path.get('expression');
};

export function extractDependencyAndFactory(path) {
    const args = path.node.arguments;

    const dependencies = path.get(`arguments.${args.length - 2}`);
    const factory = path.get(`arguments.${args.length - 1}`);

    return {dependencies, factory};
}

export function findAmdModule(path) {
    if (!path.parentPath.isProgram()) {
        return false;
    }

    const expression = findExpression(path);
    if (!expression
        || !t.isCallExpression(expression)
        || !t.isIdentifier(expression.node.callee, {name: "define"})) {
        return false;
    }


    const {dependencies, factory} = extractDependencyAndFactory(expression);
    if (dependencies && factory) {
        return expression;
    }

    return false;
}

export function extractDependencyMap(path)
{
    const dependencyMap = {};

    const {dependencies, factory} = extractDependencyAndFactory(path);
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
    const {dependencies, factory} = extractDependencyAndFactory(path);
    const dependencyMap = extractDependencyMap(path);

    if (!dependencyMap.exports) {
        return;
    }


    dependencies.node.elements = dependencies.node.elements.filter(item => !t.isStringLiteral(item, {value: 'exports'}));
    factory.node.params = factory.node.params.filter(item => !t.isIdentifier(item, dependencyMap.exports));
}

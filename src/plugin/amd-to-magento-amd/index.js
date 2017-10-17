import {
    findAmdModule, removeExportsDependency,
    extractDependencyAndFactory, extractDependencyMap
} from "../../ast-utils";

import t from 'babel-types';

const BodyVisitor = {
    Expression(path) {
        console.log(path);
    },
    Directive(path) {
        console.log(path);
    }
};

const processAmdDefinition = (path) => {
    const factory = extractDependencyAndFactory(path);
    const dependencyMap = extractDependencyMap(path)
    removeExportsDependency(path);

    factory.traverse(BodyVisitor);
};

export default function ({ types: t }) {


    return {
        visitor: {
            ExpressionStatement(path) {
                const amdModule = findAmdModule(path);
                if (!amdModule) {
                    path.stop();
                    return;
                }

                processAmdDefinition(amdModule);
            }
        }
    };
};

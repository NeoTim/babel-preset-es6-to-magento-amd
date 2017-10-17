import traverse from 'babel-traverse';
import { transform } from 'babel-core';
import { parse } from 'babylon';
import { readFileSync } from 'fs';

const transformCode = (code, presets) => {
    return {
        code: transform(code, {presets: presets, babelrc: false}).code,
        from: code,
        presets: presets
    };
};

const typescriptPreset = {
    plugins: [
        'transform-typescript',
        'transform-class-properties'
    ]
};

const createPresetFactory = (expect) => {
    return (preset) => {
        return {
            expectTypeScript(code) {
                return expect(transformCode(code, [typescriptPreset, preset]));
            },
            expectTypeScriptFile(file) {
                return this.expectTypeScript(readFileSync(file), preset);
            },
            expectJavaScript(code) {
                return expect(transformCode(code, [preset]));
            },
            expectJavaScriptFile(file) {
                return this.expectJavaScript(readFileSync(file), preset);
            }
        };
    };
};

const createFixtureFactory = (expect) => {
    return (code, sourceType) => {
        const ast = parse(code, {sourceType});
        const state = {};
        traverse(
            ast,
            {
                enter(path, state) {
                    state.nodePath = path;
                    path.stop();
                }
            },
            undefined,
            state
        );

        const findPath = (location) => {
            return state.nodePath.get(location);
        };

        return {
            body: function (index = 0) {
                return findPath(`body.${index}`);
            },
            bodyPath: function (path, index = 0) {
                return findPath(`body.${index}.${path}`);
            },
            directive: function (index = 0) {
                return findPath(`directives.${index}`);
            }
        };
    };
};

export default function (scope) {
    const presetFactory = createPresetFactory(scope.expect);
    const fixtureFactory = createFixtureFactory(scope.expect);

    return {
        exposeBabel(preset) {
            Object.assign(scope, presetFactory(preset));
        },
        fixture(code, sourceType = 'module') {
            return fixtureFactory(code, sourceType);
        }
    };
};

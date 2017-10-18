import traverse from 'babel-traverse';
import { transform } from 'babel-core';
import { parse } from 'babylon';
import { readFileSync } from 'fs';

const transformCode = (code, preset, parsePreset) => {
    const presets = [preset];
    if (parsePreset) {
        presets.push(parsePreset);
    }

    return {
        code: transform(code, {presets: presets, babelrc: false}).code,
        from: code,
        parsePreset: parsePreset
    };
};

const typescriptPreset = {
    plugins: [
        'transform-typescript'
    ]
};

const createPresetFactory = (expect) => {
    return (preset) => {
        return {
            expectTypeScript(code) {
                return expect(transformCode(code, preset, typescriptPreset));
            },
            expectTypeScriptError(code) {
                return expect(() => transformCode(code, preset, typescriptPreset))
            },
            expectTypeScriptFile(file) {
                return this.expectTypeScript(readFileSync(file));
            },
            expectJavaScript(code) {
                return expect(transformCode(code, preset));
            },
            expectJavaScriptError(code) {
                return expect(() => transformCode(code, preset))
            },
            expectJavaScriptFile(file) {
                return this.expectJavaScript(readFileSync(file));
            }
        };
    };
};

const fixtureFactory = (code, sourceType) => {
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
        }
    };
};

export default function (scope) {
    const presetFactory = createPresetFactory(scope.expect);

    return {
        exposeBabel(preset) {
            Object.assign(scope, presetFactory(preset));
        },
        fixture(code, sourceType = 'module') {
            return fixtureFactory(code, sourceType);
        },
        isMatching(typeValidator) {
            return {
                asymmetricMatch(other) {
                    return typeValidator(other);
                }
            }
        }
    };
};

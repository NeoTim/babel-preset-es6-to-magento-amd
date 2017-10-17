'use strict';

const babel = require('babel-core');
const diff = require('jest-diff');
const fs = require('fs');

const normalizeFormatting = code => {
  return babel.transform(code).code;
};

const removeBlankLines = string => {
  return string
    .split('\n')
    .filter(line => !!line.trim().length)
    .join('\n');
};

const createFailMessage = (pass, utils, verb, actual, expected, originalValue) => {
  originalValue = originalValue || actual;
  if (pass) {
      return () => {
          return `Expected\n\n` +
              `${originalValue}\n\n` +
              `not to ${verb} \n\n` +
              `${utils.printExpected(expected)}\n\n`
      };
  }

  return () => {
    return `Expected\n\n${originalValue}\n\nto ${verb}\n\n` +
      `${utils.printExpected(expected)}\n\n` +
      `but instead got\n\n` +
      `${utils.printReceived(actual)}\n\n` +
      `Difference:\n\n${diff(expected, actual)}\n`;
  }
};

const customMatcher = {
  toTransformLike(actual, expected) {
    const originalCode = removeBlankLines(normalizeFormatting(actual.from));
    const actualCode = removeBlankLines(normalizeFormatting(actual.code));
    const expectedCode = removeBlankLines(normalizeFormatting(expected));
    const pass = actualCode === expectedCode;
    return {
      pass: pass,
      message: createFailMessage(pass, this.utils, 'transform like', actualCode, expectedCode, originalCode)
    };
  },
  toTransformLikeFile(actual, expectedFile) {
    return this.toTransformInto(actual, fs.readFileSync(expectedFile));
  },
  toMatchAstType(nodePath, expectedType) {
      const actualType = nodePath.type;
      const pass = actualType === expectedType;

      return {
          pass,
          message: createFailMessage(pass, this.utils, 'match babel type', actualType, expectedType).bind(this)
      };
  }
};

module.exports = customMatcher;

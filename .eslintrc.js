'use strict';

module.exports = {
  env: {
    node: true
  },
  parserOptions: {
      ecmaVersion: 6,
      sourceType: 'module'
  },
  plugins: [
    'prettier'
  ],
  extends: ['msrose', 'prettier'],
  rules: {
    'prettier/prettier': ['error', { printWidth: 100, singleQuote: true }]
  }
};

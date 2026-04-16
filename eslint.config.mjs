import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: [
      '.build/**',
      'dist/**',
      'lib/**',
      'node_modules/**'
    ]
  },
  js.configs.recommended,
  {
    files: ['devtools.js', 'panel.js'],
    languageOptions: {
      globals: {
        ...globals.browser,
        browser: 'readonly',
        chrome: 'readonly',
        CodeMirror: 'readonly'
      }
    }
  },
  {
    files: ['scripts/*.mjs'],
    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  }
];

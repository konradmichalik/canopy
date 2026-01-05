import js from '@eslint/js';
import ts from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';

export default ts.config(
  // Ignore patterns first
  {
    ignores: [
      'dist/',
      'node_modules/',
      '.svelte-kit/',
      'build/',
      '*.config.js',
      '*.config.ts',
      'proxy/',
      // Ignore Svelte 5 rune files until ESLint supports them
      '**/*.svelte.ts'
    ]
  },
  // Base configurations
  js.configs.recommended,
  ...ts.configs.recommended,
  ...svelte.configs['flat/recommended'],
  // Global settings
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    rules: {
      // TypeScript
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // General
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
      'eqeqeq': ['error', 'always'],

      // Svelte - downgrade compile warnings to warnings
      'svelte/no-at-html-tags': 'warn',
      'svelte/valid-compile': ['warn', { ignoreWarnings: true }]
    }
  },
  // Svelte files - AFTER general rules to override
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parserOptions: {
        parser: ts.parser
      }
    },
    rules: {
      // Svelte 5 uses let for props with $props() - cannot use const
      'prefer-const': 'off'
    }
  },
  // Logger file can use console
  {
    files: ['**/logger.ts'],
    rules: {
      'no-console': 'off'
    }
  }
);

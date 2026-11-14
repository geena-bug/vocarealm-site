import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

// React Compiler rules the current code doesn't satisfy yet (it mutates state objects and reads refs during render).
// They warn rather than fail; `npm run lint` caps the warning count so it can only go down.
const compilerRulesToBurnDown = {
  'react-hooks/refs': 'warn',
  'react-hooks/immutability': 'warn',
  'react-hooks/purity': 'warn',
  'react-hooks/set-state-in-effect': 'warn',
};

export default [
  { ignores: ['dist/', '.vercel/', 'e2e-report/', 'e2e-results/', 'web/public/vendor/', 'integrations/**/*.ts'] },
  js.configs.recommended,
  {
    linterOptions: { reportUnusedDisableDirectives: 'error' },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrors: 'none' }],
      // Empty catches are deliberate: storage and speech APIs throw in private mode and unsupported browsers.
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
  // React app (ES modules bundled by Vite).
  {
    files: ['web/src/**/*.{js,jsx}'],
    languageOptions: {
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { 'react-hooks': reactHooks },
    rules: { ...reactHooks.configs.recommended.rules, 'react-hooks/exhaustive-deps': 'error', ...compilerRulesToBurnDown },
  },
  // Legacy classic scripts share state through window globals, so cross-file names aren't checked.
  {
    files: ['web/public/**/*.js'],
    languageOptions: { sourceType: 'script', globals: { ...globals.browser, module: 'readonly' } },
    rules: { 'no-undef': 'off', 'no-unused-vars': 'off' },
  },
  {
    files: ['integrations/**/*.js'],
    languageOptions: { sourceType: 'module', globals: globals.node },
  },
  {
    files: ['**/*.cjs'],
    languageOptions: { sourceType: 'commonjs', globals: { ...globals.node, ...globals.browser } },
  },
  {
    files: ['**/*.mjs'],
    languageOptions: { sourceType: 'module', globals: globals.node },
  },
];

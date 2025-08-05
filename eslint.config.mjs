// eslint.config.js
import { defineConfig, globalIgnores } from 'eslint/config';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginReact from 'eslint-plugin-react';
import autoImports from './.wxt/eslint-auto-imports.mjs';

export default defineConfig([
  globalIgnores(['node_modules/*', '.output/*', 'ai-docs/*', '.wxt/*']),
  autoImports,
  { files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'] },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ...pluginReact.configs.flat.recommended,
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  // combine configurations using spread syntax
  ...[
    {
      files: ['**/*.{jsx,tsx}'], // Apply to JSX and TSX files
      rules: {
        'react/react-in-jsx-scope': 'off',
        'react/function-component-definition': [
          2,
          {
            namedComponents: 'arrow-function',
          },
        ],
      },
    },
  ],
]);

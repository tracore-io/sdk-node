import tsparser from '@typescript-eslint/parser';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Standalone flat config. Vendored from the monorepo's @tracore/eslint-config/base
// so this repo lints without any workspace dependency. Generated code is never linted.
export default tseslint.config(
	{
		ignores: ['dist/**', 'src/generated/**', 'node_modules/**'],
	},
	{
		files: ['**/*.{js,ts}'],
		languageOptions: {
			parser: tsparser,
			ecmaVersion: 2020,
			globals: globals.node,
		},
	},
);

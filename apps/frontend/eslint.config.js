import { includeIgnoreFile } from "@eslint/compat";
import pluginVue from "eslint-plugin-vue";
import globals from "globals";
import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import { fileURLToPath } from "node:url";
import typescriptEslint from "typescript-eslint";

const gitignorePath = fileURLToPath(new URL(".gitignore", import.meta.url));

export default typescriptEslint.config(
	includeIgnoreFile(gitignorePath),
	js.configs.recommended,
	...typescriptEslint.configs.recommended,
	...pluginVue.configs["flat/recommended"],
	{
		rules: {
			"vue/multi-word-component-names": "off",
			"no-undef": "off",
		},
		languageOptions: {
			sourceType: "module",
			globals: {
				...globals.browser,
			},
			parserOptions: {
				parser: typescriptEslint.parser,
			},
		},
	},
	eslintConfigPrettier,
);

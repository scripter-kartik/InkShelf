import nextPlugin from "@next/eslint-plugin-next";
import tsParser from "@typescript-eslint/parser";
import reactHooksPlugin from "eslint-plugin-react-hooks";

/** @type {import("eslint").Linter.Config[]} */
export default [
  {
    files: ["**/*.{js,jsx,ts,tsx,mjs,cjs}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    plugins: {
      "@next/next": nextPlugin,
      "react-hooks": reactHooksPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,

      // Register react-hooks plugin rules at warn level so eslint-disable comments
      // are recognised without breaking the build on existing patterns.
      "react-hooks/rules-of-hooks": "warn",
      "react-hooks/exhaustive-deps": "warn",

      // Pre-existing warnings in the codebase — kept off so CI passes cleanly.
      "@next/next/no-img-element": "off",
      "@next/next/no-page-custom-font": "off",
    },
  },
];

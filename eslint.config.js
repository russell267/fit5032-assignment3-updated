import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import vuePlugin from "eslint-plugin-vue";
import vueA11y from "eslint-plugin-vuejs-accessibility";
import vueParser from "vue-eslint-parser";

export default [

  {
    ignores: ["dist/**", "node_modules/**"],
  },


  {
    files: ["**/*.ts", "**/*.js"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2020,
      sourceType: "module",
      parserOptions: {
        project: false,
        ecmaFeatures: { jsx: false },
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tsPlugin.configs.recommended.rules,
    },
  },


  {
    files: ["**/*.vue"],
    languageOptions: {

      parser: vueParser,
      ecmaVersion: 2020,
      sourceType: "module",
      parserOptions: {
        parser: tsParser,
        project: false,
        extraFileExtensions: [".vue"],
      },
    },
    plugins: {
      vue: vuePlugin,
      "@typescript-eslint": tsPlugin,
      "vuejs-accessibility": vueA11y,
    },
    rules: {

      ...vuePlugin.configs["vue3-recommended"].rules,

      ...vueA11y.configs.recommended.rules,


      "vue/multi-word-component-names": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/ban-ts-comment": "off",
    },
  },
];

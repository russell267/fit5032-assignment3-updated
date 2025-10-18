// .eslintrc.cjs
module.exports = {
  root: true,
  env: { browser: true, node: true, es6: true },


  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
    extraFileExtensions: [".vue"],
  },

  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:vue/vue3-recommended",
    "plugin:vuejs-accessibility/recommended",
    "google",
  ],

  plugins: ["@typescript-eslint", "vue", "vuejs-accessibility"],

  rules: {

    "no-restricted-globals": ["error", "name", "length"],
    "prefer-arrow-callback": "error",
    quotes: ["error", "double", { allowTemplateLiterals: true }],


    "vue/multi-word-component-names": "off",


    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": [
      "warn",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
    ],


    "no-undef": "off",
  },

  overrides: [

    {
      files: ["**/*.vue"],
      parser: "vue-eslint-parser",
      parserOptions: {
        parser: "@typescript-eslint/parser",
        ecmaVersion: 2020,
        sourceType: "module",
      },
    },


    {
      files: ["functions/**/*.js"],
      parser: "espree",
      parserOptions: { ecmaVersion: 2020, sourceType: "module" },
    },
  ],
};

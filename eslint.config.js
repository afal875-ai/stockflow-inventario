module.exports = [
  {
    ignores: ["node_modules/**", "coverage/**"]
  },
  {
    files: ["src/**/*.js", "tests/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs"
    },
    rules: {
      curly: "error",
      eqeqeq: "error",
      "no-constant-condition": "error",
      "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
      "no-var": "error",
      "prefer-const": "error"
    }
  },
  {
    files: ["public/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script",
      globals: {
        document: "readonly",
        window: "readonly",
        fetch: "readonly",
        URLSearchParams: "readonly",
        Intl: "readonly",
        FormData: "readonly",
        HTMLDialogElement: "readonly"
      }
    },
    rules: {
      curly: "error",
      eqeqeq: "error",
      "no-unused-vars": "error",
      "no-var": "error",
      "prefer-const": "error"
    }
  }
];

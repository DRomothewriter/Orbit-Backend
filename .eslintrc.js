module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    project: "./tsconfig.json",
  },
  plugins: ["@typescript-eslint", "node"],
  extends: [
    "eslint:recommended",
    "@typescript-eslint/recommended",
    "@typescript-eslint/recommended-requiring-type-checking",
  ],
  env: {
    node: true,
    es2022: true,
    jest: true,
  },
  rules: {
    // TypeScript específicas
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-unsafe-assignment": "warn",
    "@typescript-eslint/no-unsafe-call": "warn",
    "@typescript-eslint/no-unsafe-member-access": "warn",
    "@typescript-eslint/no-unsafe-return": "warn",

    // Mejores prácticas generales
    "no-console": "error", // No console.log en producción
    "no-debugger": "error",
    "no-var": "error",
    "prefer-const": "error",
    "no-unused-vars": "off", // Usar la versión de TypeScript

    // Estilo de código
    quotes: ["error", "single"],
    semi: ["error", "always"],
    indent: ["error", 2],
    "comma-dangle": ["error", "always-multiline"],

    // Node.js específicas
    "node/no-unsupported-features/es-syntax": "off",
    "node/no-missing-import": "off",
    "node/no-unpublished-import": "off",
  },
  ignorePatterns: ["dist/", "node_modules/", "*.js", "coverage/"],
};

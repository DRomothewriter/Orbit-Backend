import js from "@eslint/js";
import tsEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
  js.configs.recommended,
  {
    files: ["src/**/*.ts", "tests/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        project: "./tsconfig.json",
      },
      globals: {
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        global: "readonly",
        module: "readonly",
        require: "readonly",
        exports: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tsEslint,
    },
    rules: {
      // TypeScript específicas
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",

      // Mejores prácticas generales
      "no-console": "error", // No console.log en producción
      "no-debugger": "error",
      "no-var": "error",
      "prefer-const": "error",
      "no-unused-vars": "off", // Usar la versión de TypeScript
      "no-undef": "off", // TypeScript maneja esto mejor
      "no-empty": "warn", // Permitir bloques vacíos con warning
      "no-control-regex": "warn", // Regex con caracteres de control como warning

      // Estilo de código
      quotes: ["error", "single"],
      semi: ["error", "always"],
      indent: ["error", 2],
      "comma-dangle": ["error", "always-multiline"],
    },
  },
  {
    files: ["tests/**/*.ts"],
    languageOptions: {
      globals: {
        describe: "readonly",
        it: "readonly",
        expect: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        jest: "readonly",
      },
    },
    rules: {
      "no-console": "off", // Permitir console en tests
      "@typescript-eslint/no-unused-vars": "off", // Más permisivo en tests
    },
  },
  {
    ignores: ["dist/", "node_modules/", "*.js", "coverage/", ".eslintrc.js"],
  },
];

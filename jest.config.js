module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src", "<rootDir>/tests"],
  testMatch: ["<rootDir>/tests/**/*.test.ts", "<rootDir>/tests/**/*.spec.ts"],
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/index.ts",
    "!src/socket.ts",
  ],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  testTimeout: 30000,
  clearMocks: true,
  restoreMocks: true,
  testEnvironment: "node",
  globalSetup: undefined,
  globalTeardown: undefined,
  setupFiles: [],
  // Establecer NODE_ENV para tests
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
};

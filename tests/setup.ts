// Jest setup file for unit tests
// This file runs before each test file

// Set test environment variables
process.env.NODE_ENV = 'test';

// Add custom matchers or global test utilities if needed
beforeEach(() => {
  // Clear any mocks or reset state before each test
  jest.clearAllMocks();
});

// Global error handling for unhandled promises
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});
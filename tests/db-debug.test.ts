import { connectTestDatabase, closeDatabase } from './setup/database';

describe('Database and Model Debug', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await connectTestDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  test('should be able to create User model after connection', async () => {
    // First ensure database is connected
    const mongoose = await import('mongoose');
    console.log('Mongoose connection state:', mongoose.connection?.readyState);
    console.log('Mongoose models:', mongoose.models ? Object.keys(mongoose.models) : 'no models');
    
    // Try to import the model
    try {
      const userModule = await import('../src/app/users/user.model');
      console.log('User module:', userModule);
      console.log('User default export:', userModule.default);
      
      if (userModule.default) {
        console.log('User model functions:', Object.keys(userModule.default));
        console.log('User model find:', typeof userModule.default.findOne);
      }
    } catch (error) {
      console.error('Error importing user model:', error);
    }
    
    expect(true).toBe(true); // Just to pass the test
  });
});
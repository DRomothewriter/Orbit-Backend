import { connection, connect } from 'mongoose';

export const connectTestDatabase = async (): Promise<void> => {
  // Disconnect if already connected to avoid conflicts
  if (connection.readyState !== 0) {
    await connection.close();
  }
  
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/orbit-test';
  
  try {
    await connect(mongoUri);
    console.log('✅ Connected to test database');
  } catch (error) {
    console.error('❌ Failed to connect to test database:', error);
    throw error;
  }
};

export const clearDatabase = async (): Promise<void> => {
  if (connection.db) {
    const collections = await connection.db.collections();
    for (const collection of collections) {
      await collection.deleteMany({});
    }
  }
};

export const closeDatabase = async (): Promise<void> => {
  if (connection.readyState !== 0) {
    await connection.close();
    console.log('✅ Disconnected from test database');
  }
};
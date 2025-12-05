import { MongoMemoryServer } from 'mongodb-memory-server';
import { connect, connection } from 'mongoose';

let mongoServer: MongoMemoryServer;

export const connectTestDatabase = async (): Promise<void> => {
  mongoServer = await MongoMemoryServer.create({
    instance: {
      port: 27018, // Different port to avoid conflicts
      dbName: 'orbit-test',
    },
  });

  const mongoUri = mongoServer.getUri();
  await connect(mongoUri);
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
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
};
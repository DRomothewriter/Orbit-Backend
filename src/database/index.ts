import { connect } from 'mongoose';

export const dbConnect = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/orbit';
    await connect(mongoUri);
    // MongoDB connection success
  } catch (_err) {
    // Error in DB connection
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    } else {
      throw _err;
    }
  }
};

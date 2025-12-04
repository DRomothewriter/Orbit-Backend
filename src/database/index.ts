import { connect } from 'mongoose';

export const dbConnect = async () => {
  try {
    await connect(process.env.MONGO_URI);
    // MongoDB connection success
  } catch (_err) {
    // Error in DB connection
    process.exit(1);
  }
};

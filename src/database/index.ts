import { connect } from "mongoose";

export const dbConnect = async () => {
    try {
        await connect(process.env.MONGO_URI);
        console.log(' MongoDB connection success');
    } catch (err) {
        console.error(' Error in DB connection:', err);
        process.exit(1);
    }
};
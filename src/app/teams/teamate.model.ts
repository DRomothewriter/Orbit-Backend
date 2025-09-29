import mongoose from "mongoose";

const teamateSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    teamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        required: true
    },
    role: {
        type: String,
        enum: ['admin', 'member'],
        required: true
    }
});

const Teamate = mongoose.model('Teamate', teamateSchema);
export default Teamate;
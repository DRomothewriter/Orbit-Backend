import mongoose from 'mongoose';

const friendshipSchema = new mongoose.Schema({
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true
	},
	friendId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true,
	},
    status: {
        type: String,
        enum: ['pending', 'accepted', 'blocked', 'muted'],
		required: true
    }
});
const Friendship = mongoose.model('Friendship', friendshipSchema);
export default Friendship;

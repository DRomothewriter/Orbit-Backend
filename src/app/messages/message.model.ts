import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
	{
		type: {
			type: String,
			enum: ['text', 'image', 'voice', 'video', 'emoji', 'multimedia'],
			required: true,
		},
		text: {
			type: String,
			required: true,
		},
		groupId: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
		},
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
		},
		detailReactions: {
			type: mongoose.Schema.Types.ObjectId,
		},
	},
	{ timestamps: true }
);
const Message = mongoose.model('Message', messageSchema);
export default Message;

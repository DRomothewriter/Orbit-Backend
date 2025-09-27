import mongoose from 'mongoose';

const groupMemberSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
		},
		groupId: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
		},
		role: {
			type: String,
			enum: ['admin', 'member'],
			required: true,
		},
	},
	{ timestamps: true }
);

const GroupMember = mongoose.model('GroupMember', groupMemberSchema);
export default GroupMember;
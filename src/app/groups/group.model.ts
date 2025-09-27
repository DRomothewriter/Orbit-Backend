import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema(
	{
		topic: {
			type: String,
			require: true,
		},
		lastMessage: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Message' //Message
		},
		listIds: {
			type: null, //[List]
		},
		groupImgUrl: {
			type: String,
		},
	},
	{ timestamps: true }
);

const Group = mongoose.model('Group', groupSchema);
export default Group;
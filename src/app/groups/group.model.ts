import { model, Schema, SchemaTypes} from 'mongoose';

const groupSchema = new Schema(
	{
		topic: {
			type: SchemaTypes.String,
			require: true,
		},
		lastMessage: {
			type: SchemaTypes.ObjectId,
			ref: 'Message' //Message
		},
		listIds: {
			type: null, //[List]
		},
		groupImgUrl: {
			type: SchemaTypes.String,
		},
	},
	{ timestamps: true }
);

const Group = model('Group', groupSchema);
export default Group;
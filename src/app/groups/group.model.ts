import { model, Schema, SchemaTypes} from 'mongoose';

const groupSchema = new Schema(
	{
		communityId:{
			type: SchemaTypes.ObjectId,
		},
		topic: {
			type: SchemaTypes.String,
			require: true,
		},
		description: {
			type: SchemaTypes.String
		},
		lastMessage: {
			type: SchemaTypes.ObjectId,
			ref: 'Message' //Message
		},
		listIds: [{
			type: SchemaTypes.ObjectId,
			ref:'List' //[List]
		}],
		groupImgUrl: {
			type: SchemaTypes.String,
		},
	},
	{ timestamps: true }
);

const Group = model('Group', groupSchema);
export default Group;
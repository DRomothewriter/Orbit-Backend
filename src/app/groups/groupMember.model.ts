import { model, Schema, SchemaTypes} from 'mongoose';

const groupMemberSchema = new Schema(
	{
		userId: {
			type: SchemaTypes.ObjectId,
			required: true,
		},
		groupId: {
			type: SchemaTypes.ObjectId,
			required: true,
		},
		role: {
			type: SchemaTypes.String,
			enum: ['admin', 'member'],
			required: true,
		},
	},
	{ timestamps: true }
);

const GroupMember = model('GroupMember', groupMemberSchema);
export default GroupMember;
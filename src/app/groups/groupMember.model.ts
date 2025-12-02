import { model, Schema, SchemaTypes, Types} from 'mongoose';

export interface IGroupMember {
	userId: Types.ObjectId;
	groupId: Types.ObjectId;
	role: 'admin' | 'member';
}

const groupMemberSchema = new Schema(
	{
		userId: {
			type: SchemaTypes.ObjectId,
			required: true,
			ref: 'User'
		},
		groupId: {
			type: SchemaTypes.ObjectId,
			required: true,
		},
		role: {
			type: SchemaTypes.String,
			enum: ['admin', 'member'],
			required: true,
			default: 'member'
		},
	},
	{ timestamps: true }
);

const GroupMember = model<IGroupMember>('GroupMember', groupMemberSchema);
export default GroupMember;
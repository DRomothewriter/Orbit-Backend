import { model, Schema, Types} from 'mongoose';

export interface IGroupMember {
	userId: Types.ObjectId;
	groupId: Types.ObjectId;
	role: 'admin' | 'member';
}

const groupMemberSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      ref: 'User',
    },
    groupId: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      required: true,
      default: 'member',
    },
  },
  { timestamps: true },
);

const GroupMember = model<IGroupMember>('GroupMember', groupMemberSchema);
export default GroupMember;

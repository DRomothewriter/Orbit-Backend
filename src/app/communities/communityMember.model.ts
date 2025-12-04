
import { model, Schema, SchemaTypes } from 'mongoose';

const communityMemberSchema = new Schema({
  userId: {
    type: SchemaTypes.ObjectId,
    ref: 'User',
    required: true,
  },
  communityId: {
    type: SchemaTypes.ObjectId,
    ref: 'Community',
    required: true,
  },
  role: {
    type: SchemaTypes.String,
    enum: ['admin', 'member'],
    required: true,
  },
});

const CommunityMember = model('CommunityMember', communityMemberSchema);
export default CommunityMember;


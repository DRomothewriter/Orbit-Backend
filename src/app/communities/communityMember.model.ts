
import { model, Schema } from 'mongoose';

const communityMemberSchema = new Schema({
  userId: {
    type: String,
    ref: 'User',
    required: true,
  },
  communityId: {
    type: String,
    ref: 'Community',
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'member'],
    required: true,
  },
});

const CommunityMember = model('CommunityMember', communityMemberSchema);
export default CommunityMember;


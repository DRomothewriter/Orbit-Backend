
import { model, Schema } from 'mongoose';

const friendshipSchema = new Schema({
  userId: {
    type: String,
    ref: 'User',
    required: true,
  },
  friendId: {
    type: String,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'blocked', 'muted'],
    required: true,
  },
});
const Friendship = model('Friendship', friendshipSchema);
export default Friendship;

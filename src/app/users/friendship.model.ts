
import { model, Schema, SchemaTypes } from 'mongoose';

const friendshipSchema = new Schema({
  userId: {
    type: SchemaTypes.ObjectId,
    ref: 'User',
    required: true,
  },
  friendId: {
    type: SchemaTypes.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: SchemaTypes.String,
    enum: ['pending', 'accepted', 'blocked', 'muted'],
    required: true,
  },
});
const Friendship = model('Friendship', friendshipSchema);
export default Friendship;

import { model, Schema } from 'mongoose';

const reactionSchema = new Schema({
  messageId: {
    type: String,
    ref: 'Message',
  },

  emojiCode: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    ref: 'User',
    required: true,
  },
});

const Reaction = model('Reaction', reactionSchema);
export default Reaction;

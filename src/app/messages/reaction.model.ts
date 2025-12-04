import { model, Schema, SchemaTypes } from 'mongoose';

const reactionSchema = new Schema({
  messageId: {
    type: SchemaTypes.ObjectId,
    ref: 'Message',
  },

  emojiCode: {
    type: SchemaTypes.String,
    required: true,
  },
  userId: {
    type: SchemaTypes.ObjectId,
    ref: 'User',
    required: true,
  },
});

const Reaction = model('Reaction', reactionSchema);
export default Reaction;

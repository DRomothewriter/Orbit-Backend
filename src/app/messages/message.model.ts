import { model, Schema } from 'mongoose';
const messageSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['text', 'image', 'voice', 'video', 'emoji', 'multimedia'],
      required: true,
    },
    text: {
      type: String,
      required: function(this: any) {
        return this.type === 'text' || this.type === 'emoji';
      },
    },
    imageUrl: {
      type: String,
      required: function(this: any) {
        return this.type === 'image';
      },
    },
    groupId: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    username:{
      type: String,
      required: true,
    },
    reactionCount: {
      type: Number,
    },
  },
  { timestamps: true },
);
const Message = model('Message', messageSchema);
export default Message;

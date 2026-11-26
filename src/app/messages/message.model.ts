import { model, SchemaTypes, Schema } from 'mongoose';
const messageSchema = new Schema(
	{
		type: {
			type: SchemaTypes.String,
			enum: ['text', 'image', 'voice', 'video', 'emoji', 'multimedia', 'event'],
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
        eventData: {
            title: { type: String },
            date: { type: String },
            participants: [{ type: String }],
        },
		groupId: {
			type: SchemaTypes.ObjectId,
			required: true,
		},
		userId: {
			type: SchemaTypes.ObjectId,
			required: true,
		},
		username:{
			type: SchemaTypes.String,
			required: true
		},
		reactionCount: {
			type: SchemaTypes.Number,
		},
	},
	{ timestamps: true }
);
if (typeof messageSchema.index === 'function') {
	messageSchema.index({ groupId: 1, createdAt: -1 });
}
const Message = model('Message', messageSchema);
export default Message;

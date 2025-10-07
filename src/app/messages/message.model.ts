import { model, SchemaTypes, Schema} from 'mongoose';

const messageSchema = new Schema(
	{
		type: {
			type: SchemaTypes.String,
			enum: ['text', 'image', 'voice', 'video', 'emoji', 'multimedia'],
			required: true,
		},
		text: {
			type: String,
			required: true,
		},
		groupId: {
			type: SchemaTypes.ObjectId,
			required: true,
		},
		userId: {
			type: SchemaTypes.ObjectId,
			required: true,
		},
		detailReactions: {
			type: SchemaTypes.ObjectId,
		},
	},
	{ timestamps: true }
);
const Message = model('Message', messageSchema);
export default Message;

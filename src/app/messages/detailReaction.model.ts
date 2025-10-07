import { model, Schema, SchemaTypes } from 'mongoose';

const detailReactionsSchema = new Schema({
	messageId: {
		type: SchemaTypes.ObjectId,
		ref: 'Message',
	},
	reactions: [
		{
			emojiCode: {
				type: SchemaTypes.String,
				required: true,
			},
			userId: {
				type: SchemaTypes.ObjectId,
				ref: 'User',
				required: true,
			},
		},
	],
});

const DetailReactions = model('DetailReactions', detailReactionsSchema);
export default DetailReactions;


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
if (typeof friendshipSchema.index === 'function') {
	friendshipSchema.index({ userId: 1, friendId: 1 }, { unique: true });
}
const Friendship = model('Friendship', friendshipSchema);
export default Friendship;

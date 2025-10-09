import { model, Schema, SchemaTypes } from 'mongoose';

const notificationSchema = new Schema({
	receiverId: {
		type: SchemaTypes.ObjectId,
		ref: 'User',
		required: true,
	},
	messageId: {
		type: SchemaTypes.ObjectId,
		ref: 'Message',
		required: true,
	},
	seen: {
		type: SchemaTypes.Boolean,
	},
},{timestamps: true});

const Notification = model('Notification', notificationSchema);
export default Notification;

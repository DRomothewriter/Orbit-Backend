import { model, Schema, SchemaTypes } from 'mongoose';

const notificationSchema = new Schema(
	{
		receiverId: {
			type: SchemaTypes.ObjectId,
			ref: 'User',
			required: true,
		},
		type: {
			type: String,
			enum: ['message', 'friend_request', 'addedToGroup', 'addedToCommunity'], //mention, reaction 
			required: true,
		},
		data: {
			type: SchemaTypes.Mixed, // Puede ser cualquier objeto con detalles específicos
			required: true,
		},
		seen: {
			type: SchemaTypes.Boolean,
			default: false,
		},
	},
	{ timestamps: true }
);

const Notification = model('Notification', notificationSchema);
export default Notification;

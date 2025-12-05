import { model, Schema, SchemaTypes } from 'mongoose';
export enum NotificationType {
	MESSAGE = 'message',
	FRIEND_REQUEST = 'friend_request',
	FRIEND_REQUEST_ACCEPTED = 'friend_request_accepted',
	ADDED_TO_GROUP = 'added_to_group',
	ADDED_TO_COMMUNITY = 'added_to_community',
	DELETED_FROM_GROUP = 'deleted_from_group',
	DELETED_FROM_COMMUNITY = 'deleted_from_community'
}
const notificationSchema = new Schema(
	{
		receiverId: {
			type: SchemaTypes.ObjectId,
			ref: 'User',
			required: true,
		},
		type: {
			type: String,
			enum: [
				NotificationType.MESSAGE,
				NotificationType.FRIEND_REQUEST,
				NotificationType.FRIEND_REQUEST_ACCEPTED,
				NotificationType.ADDED_TO_GROUP,
				NotificationType.ADDED_TO_COMMUNITY,
				NotificationType.DELETED_FROM_GROUP,
				NotificationType.DELETED_FROM_COMMUNITY
			], //mention, reaction
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

import { Server } from 'socket.io';
import Notification from './notification.model';
import mongoose from 'mongoose';
import { NotificationType } from './notification.model';

export const notifyUser = async (
	receiverId: mongoose.Types.ObjectId,
	type: NotificationType,
	data: any = {},
	io: Server
) => {
	const notification = await Notification.create({
		receiverId: receiverId,
		type: type,
		data: data,
		seen: false,
	});
	io.to(receiverId.toString()).emit('notification', notification);
};
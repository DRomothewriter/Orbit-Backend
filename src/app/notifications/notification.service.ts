import { Server } from 'socket.io';
import Notification from './notification.model';
import mongoose from 'mongoose';
import { IGroupMember } from 'app/groups/groupMember.model';

export const notifyUsers = async (receivers: IGroupMember[], messageId: mongoose.Types.ObjectId, io: Server) => {
	await Promise.all(
		receivers.map(async (receiver) => {
			const notification = await Notification.create({
				receiverId: receiver.userId,
				messageId,
				seen: false,
			});
			io.to(receiver.userId.toString()).emit('notification', notification);
		})
	);
};

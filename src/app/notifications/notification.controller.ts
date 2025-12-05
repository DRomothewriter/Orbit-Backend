import Notification from './notification.model';
import Status from '../interfaces/Status';
import { Request, Response } from 'express';

//Tal vez no necesitamos esta función
export const createNotification = async (req: Request, res: Response) => {
	const { receiverId, messageId } = req.body;
	try {
		const newNotification = new Notification({
			receiverId: receiverId,
			messageId: messageId,
		});
		await newNotification.save();
		return res
			.status(Status.CREATED)
			.json({ newNotification: newNotification });
	} catch (e) {
		return res
			.status(Status.INTERNAL_ERROR)
			.json({ error: 'Server error' + e });
	}
};

export const getUnseen = async (req: Request, res: Response) => {
	const userId = req.user.id;
	try {
		const myUnseenNotifications = await Notification.find({
			receiverId: userId,
			seen: false,
		});
		if (myUnseenNotifications.length === 0)
			return res
				.status(Status.SUCCESS)
				.json({ message: "You've seen all your notifications" });
		return res.status(Status.SUCCESS).json(myUnseenNotifications);
	} catch (e) {
		return res
			.status(Status.INTERNAL_ERROR)
			.json({ error: 'Server error' + e });
	}
};

export const getAllMyNotifications = async (req: Request, res: Response) => {
	const userId = req.user.id;
	try {
		const myNotifications = await Notification.find({ receiverId: userId });
		if (myNotifications.length === 0)
			return res
				.status(Status.SUCCESS)
				.json({ message: "You don't have notifications" });
	} catch (e) {
		return res
			.status(Status.INTERNAL_ERROR)
			.json({ error: 'Server error' + e });
	}
};

export const updateToSeen = async (req: Request, res: Response) => {
	const { notificationIds } = req.body;
	try {
		const notifications = await Notification.updateMany(
			{_id: { $in: notificationIds }}
			,{$set: {seen:true}}
		);
		return res.status(Status.SUCCESS).json(notifications);
	} catch (e) {
		return res
			.status(Status.INTERNAL_ERROR)
			.json({ error: 'Server error' + e });
	}
};

export const deleteNotification = async (req: Request, res: Response) => {
	const notificationId = req.params.notificationId;
	try {
		const deletedNotification = await Notification.findByIdAndDelete(
			notificationId
		);
		if (!deletedNotification)
			return res
				.status(Status.NOT_FOUND)
				.json({ error: 'Notification not found' });
		return res
			.status(Status.SUCCESS)
			.json({ deletedNotification: deletedNotification });
	} catch (e) {
		return res
			.status(Status.INTERNAL_ERROR)
			.json({ error: 'Server error' + e });
	}
};

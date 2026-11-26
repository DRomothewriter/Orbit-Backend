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
		return res.status(Status.SUCCESS).json(myNotifications);
	} catch (e) {
		return res
			.status(Status.INTERNAL_ERROR)
			.json({ error: 'Server error' + e });
	}
};

export const updateToSeen = async (req: Request, res: Response) => {
	const userId = req.user.id;
	const ids = req.body.notificationsIds ?? req.body.notificationIds;
	if (!Array.isArray(ids) || ids.length === 0) {
		return res.status(Status.SUCCESS).json({ modifiedCount: 0 });
	}
	try {
		const notifications = await Notification.updateMany(
			{ _id: { $in: ids }, receiverId: userId },
			{ $set: { seen: true } }
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
	const userId = req.user.id;
	try {
		const deletedNotification = await Notification.findOneAndDelete({
			_id: notificationId,
			receiverId: userId,
		});
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

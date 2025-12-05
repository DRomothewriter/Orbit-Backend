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
  } catch (_e) {
    return res
      .status(Status.INTERNAL_ERROR)
      .json({ error: 'Server error' + _e });
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
        .json({ message: 'You\'ve seen all your notifications' });
    return res
      .status(Status.SUCCESS)
      .json({ unseenNotifications: myUnseenNotifications });
  } catch (_e) {
    return res
      .status(Status.INTERNAL_ERROR)
      .json({ error: 'Server error' + _e });
  }
};

export const getAllMyNotifications = async (req: Request, res: Response) => {
  const userId = req.user.id;
  try {
    const myNotifications = await Notification.find({ receiverId: userId });
    if (myNotifications.length === 0)
      return res
        .status(Status.SUCCESS)
        .json({ message: 'You don\'t have notifications' });
  } catch (_e) {
    return res
      .status(Status.INTERNAL_ERROR)
      .json({ error: 'Server error' + _e });
  }
};



export const updateToSeen = async (req: Request, res: Response) => {
  const userId = req.user.id;
  const notificationId = req.params.id;
  try {
    const notification = await Notification.findById(notificationId);
    if (!notification)
      return res
        .status(Status.NOT_FOUND)
        .json({ error: 'Notification not found' });
    if (notification.receiverId.toString() !== userId.toString())
      return res.status(Status.UNAUTHORIZED).json({ error: 'Not authorized' });
    const updatedNotification = await Notification.findByIdAndUpdate(
      notificationId,
      { seen: true },
      { new: true },
    );
    return res
      .status(Status.SUCCESS)
      .json({ updatedNotification: updatedNotification });
  } catch (_e) {
    return res
      .status(Status.INTERNAL_ERROR)
      .json({ error: 'Server error' + _e });
  }
};

export const deleteNotification = async (req: Request, res: Response) => {
  const notificationId = req.params.notificationId;
  try {
    const deletedNotification = await Notification.findByIdAndDelete(notificationId);
    if(!deletedNotification) return res.status(Status.NOT_FOUND).json({error: 'Notification not found'});
    return res.status(Status.SUCCESS).json({deletedNotification: deletedNotification});
  } catch (_e) {
    return res.status(Status.INTERNAL_ERROR).json({error: 'Server error' + _e});
  }
};

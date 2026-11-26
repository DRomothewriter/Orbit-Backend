import Message from './message.model';
import Reaction from './reaction.model';

import { Request, Response } from 'express';
import Status from '../interfaces/Status';
import { notifyUser } from '../notifications/notification.service';
import { getGroupMembers } from '../groups/group.service';
import GroupMember, { IGroupMember } from '../groups/groupMember.model';
import Group from '../groups/group.model';
import { NotificationType } from '../notifications/notification.model';
import { resolveUploadedFileUrl } from '../middlewares/s3';

export const getGroupMessages = async (req: Request, res: Response) => {
	const { groupId } = req.params;
	const userId = req.user?.id;
	const page: number = Math.max(1, parseInt(req.query.page as string, 10) || 1);
	const pageSize = 100;
	try {
		const latestMessages = await Message.find({ groupId: groupId })
			.sort({ createdAt: -1 })
			.skip((page - 1) * pageSize)
			.limit(pageSize)
			.lean();
		if (userId && page === 1) {
			await GroupMember.findOneAndUpdate(
				{ groupId, userId },
				{ lastReadAt: new Date() }
			);
		}
		const groupMessages = latestMessages.reverse();
		return res.status(Status.SUCCESS).json(groupMessages);
	} catch (e) {
		return res.status(Status.INTERNAL_ERROR).json({ error: 'Server error', e });
	}
};

export const getMessageById = async (req: Request, res: Response) => {
	const messageId = req.params.messageId;
	const userId = req.user.id;
	try {
		const message = await Message.findById(messageId);
		if (!message)
			return res.status(Status.NOT_FOUND).json({ error: 'Message not found' });
		const membership = await GroupMember.findOne({
			userId,
			groupId: message.groupId,
		});
		if (!membership) {
			return res.status(Status.FORBIDDEN).json({ error: 'Forbidden' });
		}
		return res.status(Status.SUCCESS).json({ message: message });
	} catch (e) {
		return res.status(Status.INTERNAL_ERROR).json({ error: 'Server error', e });
	}
};

export const createMessage = async (req: Request, res: Response) => {
	const userId = req.user.id;
	const incomingMessage = req.body.message ?? req.body ?? {};
	const { type, text, groupId, username, eventData } = incomingMessage;
	const io = req.app.get('io');
	try {
		const newMessage = new Message({
			type,
			text,
			groupId,
			userId,
			username,
			...(eventData ? { eventData } : {}),
		});
		await newMessage.save();
		const messageId = newMessage._id;
		await Group.findByIdAndUpdate(groupId, { lastMessage: messageId });

		//socket
		io.to(`${groupId}`).emit('message', newMessage);
		const receivers: IGroupMember[] = (await getGroupMembers(groupId)).filter(
			(r) => r.userId.toString() !== userId.toString()
		);

		Promise.all(
			receivers.map(async (receiver) => {
				await notifyUser(
					receiver.userId,
					NotificationType.MESSAGE,
					newMessage,
					io
				);
			})
		).catch((err) => console.error('Error notifying group members:', err));

		return res
			.status(Status.CREATED)
			.json({ newMessage: newMessage, messageId: messageId });
	} catch (e) {
		return res
			.status(Status.INTERNAL_ERROR)
			.json({ error: 'Server error' + e });
	}
};

export const createImageMessage = async (req: Request, res: Response) => {
	const userId = req.user.id;
	const { groupId, username, text } = req.body;
	const file = req.file as Express.MulterS3.File;
	const io = req.app.get('io');

	if (!file) {
		return res.status(Status.BAD_REQUEST).json({ error: 'No image uploaded' });
	}

	try {
		const imageUrl = resolveUploadedFileUrl(req, file);
		const newMessage = new Message({
			type: 'image',
			text: text || '',
			imageUrl,
			groupId,
			userId,
			username,
		});

		await newMessage.save();
		const messageId = newMessage._id;
		await Group.findByIdAndUpdate(groupId, { lastMessage: messageId });

		// Socket
		io.to(`${groupId}`).emit('message', newMessage);
		const receivers: IGroupMember[] = (await getGroupMembers(groupId)).filter(
			(r) => r.userId.toString() !== userId.toString()
		);

		Promise.all(
			receivers.map(async (receiver) => {
				await notifyUser(
					receiver.userId,
					NotificationType.MESSAGE,
					newMessage,
					io
				);
			})
		).catch((err) => console.error('Error notifying image message:', err));

		return res
			.status(Status.CREATED)
			.json({ newMessage: newMessage, messageId: messageId });
	} catch (e) {
		return res
			.status(Status.INTERNAL_ERROR)
			.json({ error: 'Server error: ' + e });
	}
};

export const createReaction = async (req: Request, res: Response) => {
	const userId = req.user.id;
	const { messageId, emojiCode } = req.body;
	try {
		const updatedMessage = await Message.findByIdAndUpdate(
			messageId,
			{
				$inc: { reactionCount: 1 },
			},
			{ new: true }
		);
		if (!updatedMessage)
			return res.status(Status.NOT_FOUND).json({ error: 'Message not found' });
		const newReaction = new Reaction({ messageId, emojiCode, userId });
		await newReaction.save();

		return res
			.status(Status.SUCCESS)
			.json({ newReaction: newReaction, updatedMessage: updatedMessage });
	} catch (e) {
		return res.status(Status.INTERNAL_ERROR).json({ error: 'Server error', e });
	}
};

export const updateMessage = async (req: Request, res: Response) => {
	const messageId = req.params.messageId;
	const userId = req.user.id;
	const { text } = req.body;
	try {
		const existing = await Message.findById(messageId);
		if (!existing)
			return res.status(Status.NOT_FOUND).json({ error: 'Message not found' });
		if (existing.userId.toString() !== userId.toString())
			return res.status(Status.FORBIDDEN).json({ error: 'Forbidden' });
		const updatedMessage = await Message.findByIdAndUpdate(
			messageId,
			{ text },
			{ new: true }
		);
		return res.status(Status.SUCCESS).json({ updatedMessage: updatedMessage });
	} catch (e) {
		return res.status(Status.INTERNAL_ERROR).json({ error: 'Server error', e });
	}
};

export const deleteMessage = async (req: Request, res: Response) => {
	const messageId = req.params.messageId;
	const userId = req.user.id;
	try {
		const existing = await Message.findById(messageId);
		if (!existing)
			return res.status(Status.NOT_FOUND).json({ error: 'Message not found' });
		if (existing.userId.toString() !== userId.toString())
			return res.status(Status.FORBIDDEN).json({ error: 'Forbidden' });
		const deletedMessage = await Message.findByIdAndDelete(messageId);
		return res.status(Status.SUCCESS).json({ deletedMessage: deletedMessage });
	} catch (e) {
		return res.status(Status.INTERNAL_ERROR).json({ error: 'Server error', e });
	}
};

export const deleteReaction = async (req: Request, res: Response) => {
	const reactionId = req.params.reactionId;
	const userId = req.user.id;
	try {
		const existing = await Reaction.findById(reactionId);
		if (!existing)
			return res.status(Status.NOT_FOUND).json({ error: 'Reaction not found' });
		if (existing.userId.toString() !== userId.toString())
			return res.status(Status.FORBIDDEN).json({ error: 'Forbidden' });
		const deletedReaction = await Reaction.findByIdAndDelete(reactionId);
		const updatedMessage = await Message.findByIdAndUpdate(
			existing.messageId,
			{ $inc: { reactionCount: -1 } },
			{ new: true }
		);
		return res.status(Status.SUCCESS).json({
			deletedReaction: deletedReaction,
			updatedMessage: updatedMessage,
		});
	} catch (e) {
		return res.status(Status.INTERNAL_ERROR).json({ error: 'Server error', e });
	}
};

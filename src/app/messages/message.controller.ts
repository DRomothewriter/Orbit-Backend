import Message from './message.model';
import Reaction from './reaction.model';

import { Request, Response } from 'express';
import Status from '../interfaces/Status';
import { notifyUsers } from 'app/notifications/notification.service';
import { getGroupMembers } from 'app/groups/group.service';
import { IGroupMember } from 'app/groups/groupMember.model';

export const getGroupMessages = async (req: Request, res: Response) => {
	const { groupId } = req.params;
	const page: number = parseInt(req.query.page as string, 10) || 1;
	const pageSize = 100;
	try {
		const groupMessages = await Message.find({ groupId: groupId })
			.sort({ createdAt: -1 })
			.skip((page - 1) * pageSize)
			.limit(pageSize);

		const messagesWithReactions = await Promise.all(
			groupMessages.map(async (msg) => {
				const reactions = await Reaction.find({ messageId: msg._id });
				return { ...msg.toObject(), reactions };
			})
		);

		return res.status(Status.SUCCESS).json({
			messagesWithReactions: messagesWithReactions,
			length: messagesWithReactions.length,
		});
	} catch (e) {
		return res.status(Status.INTERNAL_ERROR).json({ error: 'Server error', e });
	}
};

export const getMessageById = async (req: Request, res: Response) => {
	const messageId = req.params.messageId;
	try {
		const message = await Message.findById(messageId);
		if (!message)
			return res.status(Status.NOT_FOUND).json({ error: 'Message not found' });
		return res.status(Status.SUCCESS).json({ message: message });
	} catch (e) {
		return res.status(Status.INTERNAL_ERROR).json({ error: 'Server error', e });
	}
};

export const createMessage = async (req: Request, res: Response) => {
	const userId = req.user.id;
	const { type, text, groupId } = req.body;
	const io = req.app.get('io');
	try {
		const newMessage = new Message({ type, text, groupId, userId });
		await newMessage.save();
		const messageId = newMessage._id;

		//socket
		io.to(`${groupId}`).emit('receiveMessage', newMessage); 

		const receivers: IGroupMember[] = await getGroupMembers(groupId);
		
		//sin await para que sea más rápido. Igual si no se recibe alguna notification no es importante
		notifyUsers(receivers, messageId, req.app.get('io'));

		return res
			.status(Status.CREATED)
			.json({ newMessage: newMessage, messageId: messageId });
	} catch (e) {
		return res.status(Status.INTERNAL_ERROR).json({ error: 'Server error' +  e });
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
	try {
		const updatedMessage = await Message.findByIdAndUpdate(
			messageId,
			req.body,
			{
				new: true,
			}
		);
		if (!updatedMessage)
			return res.status(Status.NOT_FOUND).json({ error: 'Message not found' });
		return res.status(Status.SUCCESS).json({ updatedMessage: updatedMessage });
	} catch (e) {
		return res.status(Status.INTERNAL_ERROR).json({ error: 'Server error', e });
	}
};

export const deleteMessage = async (req: Request, res: Response) => {
	const messageId = req.params.messageId;
	try {
		const deletedMessage = await Message.findByIdAndDelete(messageId);
		if (!deletedMessage)
			return res.status(Status.NOT_FOUND).json({ error: 'Message not found' });
		return res.status(Status.SUCCESS).json({ deletedMessage: deletedMessage });
	} catch (e) {
		return res.status(Status.INTERNAL_ERROR).json({ error: 'Server error', e });
	}
};

export const deleteReaction = async (req: Request, res: Response) => {
	const reactionId = req.params.reactionId;
	try {
		const deletedReaction = await Reaction.findByIdAndDelete(reactionId);
		if (!deletedReaction)
			return res.status(Status.NOT_FOUND).json({ error: 'Reaction not found' });
		const updatedMessage = await Message.findByIdAndUpdate(
			deletedReaction.messageId,
			{ $inc: { reactionCount: -1 } },
			{ new: true }
		);
		return res.status(Status.SUCCESS).json({
			deletedReaction: deletedReaction,
			updatedMessage: updatedMessage,
		});
	} catch (e) {}
};

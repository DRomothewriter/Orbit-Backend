import Group from './group.model';
import GroupMember from './groupMember.model';

import { Request, Response } from 'express';
import Status from '../interfaces/Status';
import Message from '../messages/message.model';
import { deleteImageFromS3 } from '../middlewares/s3';
import { notifyUser } from '../notifications/notification.service';
import { NotificationType } from '../notifications/notification.model';
import { connectedSockets } from '../../socket';

export const getAllMyGroups = async (req: Request, res: Response) => {
	const userId = req.user.id;
	try {
		const groupMembers = await GroupMember.find({ userId: userId });
		const groupIds = groupMembers.map((gM) => gM.groupId);

		const myGroups = await Group.find({ _id: { $in: groupIds } });

		return res.status(Status.SUCCESS).json(myGroups);
	} catch (e) {
		return res.status(Status.INTERNAL_ERROR).json({ error: 'Server error', e });
	}
};

//DMs
export const getMyGroups = async (req: Request, res: Response) => {
	const userId = req.user.id;
	try {
		const groupMembers = await GroupMember.find({ userId: userId });
		const groupIds = groupMembers.map((gM) => gM.groupId);

		const myGroups = await Group.find({
			_id: { $in: groupIds },
			communityId: { $exists: false },
		});

		return res.status(Status.SUCCESS).json(myGroups);
	} catch (e) {
		return res.status(Status.INTERNAL_ERROR).json({ error: 'Server error', e });
	}
};

export const getMyCommunityGroups = async (req: Request, res: Response) => {
	const userId = req.user.id;
	const communityId = req.params.communityId;
	try {
		const groupMembers = await GroupMember.find({ userId: userId });
		const groupIds = groupMembers.map((gM) => gM.groupId);

		const myCommunityGroups = await Group.find({
			_id: { $in: groupIds },
			communityId: communityId,
		});

		return res.status(Status.SUCCESS).json(myCommunityGroups);
	} catch (e) {
		return res.status(Status.INTERNAL_ERROR).json({ error: 'Server error', e });
	}
};

export const getGroupById = async (req: Request, res: Response) => {
	const groupId = req.params.groupId;
	try {
		const group = await Group.findById(groupId);
		if (!group)
			return res.status(Status.NOT_FOUND).json({ message: 'Group not found' });
		return res.status(Status.SUCCESS).json(group);
	} catch (e) {
		return res.status(Status.INTERNAL_ERROR).json({ error: 'Server error', e });
	}
};

export const getMyGroupMember = async (req: Request, res: Response) => {
	const groupId = req.params.groupId;
	const userId = req.user.id;
	try {
		const myGroupMember = await GroupMember.findOne({ groupId, userId });
		if (!myGroupMember)
			return res
				.status(Status.NOT_FOUND)
				.json({ error: 'groupMember not found' });
		return res.status(Status.SUCCESS).json(myGroupMember);
	} catch (e) {
		return res.status(Status.INTERNAL_ERROR).json({ error: e });
	}
};

export const getGroupMembers = async (req: Request, res: Response) => {
	const groupId = req.params.groupId;
	try {
		const groupMembers = await GroupMember.find({ groupId: groupId }).populate(
			'userId'
		);
		if (!groupMembers || !groupMembers.length)
			return res
				.status(Status.NOT_FOUND)
				.json({ message: 'No group members found' });
		return res.status(Status.SUCCESS).json(groupMembers);
	} catch (e) {
		return res.status(Status.INTERNAL_ERROR).json({ error: 'Server error', e });
	}
};

export const createGroup = async (req: Request, res: Response) => {
	const userId = req.user.id;
	const { initialMembersIds, group } = req.body;
	const io = req.app.get('io');
	//Tal vez revisar que si el grupo viene con communityId, el user y los initial members sean miembros de la community
	try {
		const newGroup = new Group(group);
		await newGroup.save();

		const groupId = newGroup._id.toString();
		const newMember = new GroupMember({ userId, groupId, role: 'admin' });
		await newMember.save();

		// Agregar los miembros iniciales
		for (const memberId of initialMembersIds) {
			const newMember = new GroupMember({
				userId: memberId,
				groupId,
				role: 'member',
			});
			await newMember.save();

			const socketId = connectedSockets[memberId];
			if (socketId && io.sockets.sockets.get(socketId)) {
				io.sockets.sockets.get(socketId).join(groupId);
			}
		}

		Promise.all(
			initialMembersIds.map(async (receiverId) => {
				await notifyUser(
					receiverId,
					NotificationType.ADDED_TO_GROUP,
					newGroup,
					io
				);
			})
		);

		return res.status(Status.CREATED).json(newGroup);
	} catch (e) {
		return res.status(Status.INTERNAL_ERROR).json({ error: 'Server error', e });
	}
};

export const addMembers = async (req: Request, res: Response) => {
	const { groupId, userIds } = req.body;
	try {
		const members = [];
		userIds.forEach(async (userId: string) => {
			const member = new GroupMember({ groupId, userId });
			await member.save();
			members.push(member);
		});
		//Mandar notificación al nuevo groupMember
		//hacer join del nuevo usuario a la sala del grupo. Tal vez enviar un evento.
		return res.status(Status.CREATED).json(members);
	} catch (e) {
		return res.status(Status.INTERNAL_ERROR).json({ error: 'Server error', e });
	}
};

export const changeGroupInfo = async (req: Request, res: Response) => {
	const { groupId, topic, groupImgUrl } = req.body;
	try {
		const changedGroup = await Group.findByIdAndUpdate(
			groupId,
			{ topic, groupImgUrl },
			{ new: true }
		);
		return res.status(Status.SUCCESS).json({ changedGroup: changedGroup });
	} catch (e) {
		return res.status(Status.INTERNAL_ERROR).json({ error: 'Server error', e });
	}
};

export const editTopic = async (req: Request, res: Response) => {
	const groupId = req.params.groupId;
	const topic = req.body.topic;
	try {
		const newGroup = await Group.findByIdAndUpdate(
			groupId,
			{ topic },
			{ new: true }
		);
		if (!newGroup)
			return res.status(Status.NOT_FOUND).json({ message: 'Group not found' });
		return res.status(Status.SUCCESS).json(newGroup.topic);
	} catch (e) {
		return res.status(Status.INTERNAL_ERROR).json({ error: e });
	}
};

export const editGroupImg = async (req: Request, res: Response) => {
	const file = req.file as Express.MulterS3.File;
	const groupId = req.params.groupId;
	if (!file) {
		return res.status(Status.BAD_REQUEST).json({ error: 'No image uploaded' });
	}
	try {
		const pastGroup = await Group.findByIdAndUpdate(
			groupId,
			{ groupImgUrl: file.location },
			{ new: false }
		);
		if (!pastGroup)
			return res.status(Status.NOT_FOUND).json({ message: 'Group not found' });
		if (pastGroup.groupImgUrl) {
			deleteImageFromS3(pastGroup.groupImgUrl);
		}
		return res.status(Status.SUCCESS).json(file.location);
	} catch (e) {
		return res.status(Status.INTERNAL_ERROR).json({ error: e });
	}
};

export const makeGroupAdmin = async (req: Request, res: Response) => {
	const { groupMemberId } = req.params;
	try {
		const newAdmin = await GroupMember.findByIdAndUpdate(
			groupMemberId,
			{ role: 'admin' },
			{ new: true }
		);
		if (!newAdmin)
			return res
				.status(Status.NOT_FOUND)
				.json({ message: 'Group Member not found' });
		return res.status(Status.SUCCESS).json(newAdmin);
	} catch (e) {
		return res.status(Status.INTERNAL_ERROR).json({ error: e });
	}
};

export const deleteGroup = async (req: Request, res: Response) => {
	const { groupId } = req.params;
	try {
		const deletedGroup = await Group.findByIdAndDelete(groupId);
		const deletedMembers = await GroupMember.deleteMany({ groupId: groupId });
		await Message.deleteMany({ groupId: groupId });
		await GroupMember.deleteMany({ groupId: groupId });
		return res
			.status(Status.SUCCESS)
			.json({ deletedGroup: deletedGroup, deletedMembers: deletedMembers });
	} catch (e) {
		return res.status(Status.INTERNAL_ERROR).json({ error: 'Server error' });
	}
};

export const deleteGroupMember = async (req: Request, res: Response) => {
	const { groupMemberId } = req.params;
	try {
		const deletedMember = await GroupMember.findByIdAndDelete(groupMemberId);
		//Mandar notificación
		return res.status(Status.SUCCESS).json({ deletedMember: deletedMember });
	} catch (e) {
		return res.status(Status.INTERNAL_ERROR).json({ error: 'Server error', e });
	}
};

export const leaveGroup = async (req: Request, res: Response) => {
	const groupId = req.params;
	const userId = req.user.id;
	try {
		const deletedMember = await GroupMember.findOneAndDelete({
			groupId,
			userId,
		});
		return res.status(Status.SUCCESS).json(deletedMember);
	} catch (e) {
		return res.status(Status.INTERNAL_ERROR).json({ error: e });
	}
};

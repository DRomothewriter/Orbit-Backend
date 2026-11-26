import Group from './group.model';
import GroupMember from './groupMember.model';

import { Request, Response } from 'express';
import Status from '../interfaces/Status';
import Message from '../messages/message.model';
import { deleteImageFromS3, resolveUploadedFileUrl } from '../middlewares/s3';
import { notifyUser } from '../notifications/notification.service';
import { NotificationType } from '../notifications/notification.model';
import { connectedSockets } from '../../socket';
import {
	getRandomAstronomicalAvatar,
	isDefaultAstronomicalAvatar,
} from '../shared/defaultAvatars';

const joinUserSocketsToGroup = (io: any, userId: string | number, groupId: string) => {
	if (!io?.sockets?.sockets) return;
	const matchingSockets = connectedSockets.filter(
		(cS) => cS.userId?.toString() === userId.toString()
	);
	for (const entry of matchingSockets) {
		const sock = io.sockets.sockets.get(entry.socketId);
		if (sock) {
			sock.join(groupId);
		}
	}
};

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

const enrichGroupsForUser = async (
	groups: any[],
	memberships: any[],
	userId: string | number
) => {
	const lastReadByGroupId = new Map<string, Date | undefined>();
	for (const membership of memberships) {
		lastReadByGroupId.set(
			membership.groupId.toString(),
			membership.lastReadAt
		);
	}

	const nonCommunityGroupIds = groups
		.filter((g) => !g.communityId)
		.map((g) => g._id);

	const dmAvatarByGroupId = new Map<string, string>();
	const directGroupIds = new Set<string>();
	if (nonCommunityGroupIds.length > 0) {
		const dmMembers = await GroupMember.find({
			groupId: { $in: nonCommunityGroupIds },
		})
			.populate('userId', 'username profileImgUrl')
			.lean();

		const membersByGroup = new Map<string, any[]>();
		for (const member of dmMembers) {
			const gId = member.groupId.toString();
			const list = membersByGroup.get(gId) ?? [];
			list.push(member);
			membersByGroup.set(gId, list);
		}

		for (const [gId, members] of membersByGroup.entries()) {
			if (members.length === 2) {
				directGroupIds.add(gId);
				const other = members.find(
					(m) => m.userId?._id?.toString() !== userId.toString()
				);
				if (other?.userId?.profileImgUrl) {
					dmAvatarByGroupId.set(gId, other.userId.profileImgUrl);
				}
			}
		}
	}

	const enriched = await Promise.all(
		groups.map(async (group) => {
			const gId = group._id.toString();
			let lastMessage = group.lastMessage ?? null;
			if (!lastMessage) {
				lastMessage = await Message.findOne({ groupId: group._id })
					.sort({ createdAt: -1 })
					.lean();
			}

			const lastReadAt = lastReadByGroupId.get(gId);
			const unreadFilter: Record<string, any> = {
				groupId: group._id,
				userId: { $ne: userId },
			};
			if (lastReadAt) {
				unreadFilter.createdAt = { $gt: lastReadAt };
			}
			const unreadCount = await Message.countDocuments(unreadFilter);

			const resolvedImgUrl =
				group.groupImgUrl || dmAvatarByGroupId.get(gId) || '';

			return {
				...group,
				groupImgUrl: resolvedImgUrl,
				lastMessage,
				unreadCount,
				isDirect: directGroupIds.has(gId),
			};
		})
	);

	return enriched.sort((a, b) => {
		const timeA = new Date(
			a.lastMessage?.createdAt || a.updatedAt || a.createdAt || 0
		).getTime();
		const timeB = new Date(
			b.lastMessage?.createdAt || b.updatedAt || b.createdAt || 0
		).getTime();
		return timeB - timeA;
	});
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
		})
			.populate('lastMessage')
			.lean();

		const enriched = await enrichGroupsForUser(myGroups, groupMembers, userId);
		return res.status(Status.SUCCESS).json(enriched);
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
		})
			.populate('lastMessage')
			.lean();

		const enriched = await enrichGroupsForUser(
			myCommunityGroups,
			groupMembers,
			userId
		);
		return res.status(Status.SUCCESS).json(enriched);
	} catch (e) {
		return res.status(Status.INTERNAL_ERROR).json({ error: 'Server error', e });
	}
};

export const markGroupAsRead = async (req: Request, res: Response) => {
	const userId = req.user.id;
	const { groupId } = req.params;
	try {
		const updated = await GroupMember.findOneAndUpdate(
			{ groupId, userId },
			{ lastReadAt: new Date() },
			{ new: true }
		);
		if (!updated) {
			return res
				.status(Status.NOT_FOUND)
				.json({ error: 'groupMember not found' });
		}
		return res.status(Status.SUCCESS).json(updated);
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
	
	// Validation: topic is required and not empty
	if (!group?.topic || group.topic.trim().length === 0) {
		return res.status(Status.BAD_REQUEST).json({ error: 'Group topic is required' });
	}

	//Tal vez revisar que si el grupo viene con communityId, el user y los initial members sean miembros de la community
	try {
		const isDirectChat = !group?.communityId && Array.isArray(initialMembersIds) && initialMembersIds.length === 1;
		if (isDirectChat) {
			const friendId = initialMembersIds[0];
			const currentUserMemberships = await GroupMember.find({ userId });
			const friendMemberships = await GroupMember.find({ userId: friendId });

			const currentUserGroupIds = new Set(
				currentUserMemberships.map((member) => member.groupId.toString())
			);
			const sharedGroupIds = friendMemberships
				.map((member) => member.groupId.toString())
				.filter((groupId) => currentUserGroupIds.has(groupId));

			for (const candidateGroupId of sharedGroupIds) {
				const existingDirectChat = await Group.findOne({
					_id: candidateGroupId,
					communityId: { $exists: false },
				});

				if (!existingDirectChat) {
					continue;
				}

				const members = await GroupMember.find({ groupId: candidateGroupId });
				const memberIds = members.map((member) => member.userId.toString());

				if (
					members.length === 2 &&
					memberIds.includes(userId.toString()) &&
					memberIds.includes(friendId.toString())
				) {
					const payload =
						typeof existingDirectChat.toObject === 'function'
							? existingDirectChat.toObject()
							: existingDirectChat;
					return res.status(Status.CONFLICT).json({
						error: 'Ya existe un chat individual con este usuario. No se pueden crear chats individuales duplicados.',
						code: 'DUPLICATE_DIRECT_CHAT',
						existingGroup: { ...payload, isDirect: true },
					});
				}
			}
		}

		const newGroup = new Group({
			...group,
			groupImgUrl: group.groupImgUrl || getRandomAstronomicalAvatar(),
		});
		await newGroup.save();

		const groupId = newGroup._id.toString();
		const newMember = new GroupMember({ userId, groupId, role: 'admin' });
		await newMember.save();

		joinUserSocketsToGroup(io, userId, groupId);

		// Agregar los miembros iniciales (excluyendo al creador para evitar duplicados o auto-notificaciones)
		const safeInitialMembers = Array.isArray(initialMembersIds)
			? Array.from(
					new Set(
						initialMembersIds
							.map((id) => id?.toString())
							.filter((id): id is string => Boolean(id) && id !== userId.toString())
					)
				)
			: [];
		for (const memberId of safeInitialMembers) {
			const existing = await GroupMember.findOne({ userId: memberId, groupId });
			if (!existing) {
				const memberDoc = new GroupMember({
					userId: memberId,
					groupId,
					role: 'member',
				});
				await memberDoc.save();
			}
			joinUserSocketsToGroup(io, memberId, groupId);
		}

		const createdPayload =
			typeof newGroup.toObject === 'function' ? newGroup.toObject() : newGroup;
		const createdGroupResponse = {
			...createdPayload,
			isDirect: isDirectChat,
		};

		Promise.all(
			safeInitialMembers.map(async (receiverId) => {
				await notifyUser(
					receiverId as any,
					NotificationType.ADDED_TO_GROUP,
					createdGroupResponse,
					io
				);
			})
		).catch((err) => console.error('Error notifying group members:', err));

		return res.status(Status.CREATED).json(createdGroupResponse);
	} catch (e) {
		return res.status(Status.INTERNAL_ERROR).json({ error: 'Server error', e });
	}
};

export const addMembers = async (req: Request, res: Response) => {
	const { groupId, userIds } = req.body;
	const io = req.app.get('io');
	if (!groupId || !Array.isArray(userIds)) {
		return res.status(Status.BAD_REQUEST).json({ error: 'groupId and userIds array are required' });
	}
	try {
		const members = [];
		const group = await Group.findById(groupId);
		for (const targetUserId of userIds) {
			const existing = await GroupMember.findOne({ groupId, userId: targetUserId });
			if (existing) {
				members.push(existing);
				continue;
			}
			const member = new GroupMember({ groupId, userId: targetUserId, role: 'member' });
			await member.save();
			members.push(member);

			joinUserSocketsToGroup(io, targetUserId, groupId.toString());
			if (group && io) {
				await notifyUser(
					targetUserId,
					NotificationType.ADDED_TO_GROUP,
					group,
					io
				).catch((err) => console.error('Error notifying added member:', err));
			}
		}
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
		const imageUrl = resolveUploadedFileUrl(req, file);
		const pastGroup = await Group.findByIdAndUpdate(
			groupId,
			{ groupImgUrl: imageUrl },
			{ new: false }
		);
		if (!pastGroup)
			return res.status(Status.NOT_FOUND).json({ message: 'Group not found' });
		if (pastGroup.groupImgUrl && !isDefaultAstronomicalAvatar(pastGroup.groupImgUrl)) {
			await deleteImageFromS3(pastGroup.groupImgUrl).catch((err) =>
				console.error('Error deleting old group image:', err)
			);
		}
		return res.status(Status.SUCCESS).json(imageUrl);
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
	const { groupId } = req.params;
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

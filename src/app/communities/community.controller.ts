import { Request, Response } from 'express';
import Community from './community.model';
import CommunityMember from './communityMember.model';
import Group from '../groups/group.model';
import GroupMember from '../groups/groupMember.model';
import Message from '../messages/message.model';
import Status from '../interfaces/Status';
import { getRandomAstronomicalAvatar } from '../shared/defaultAvatars';

export const getMyCommunities = async (req: Request, res: Response) => {
	const userId = req.user.id;
	try {
		const communityMembers = await CommunityMember.find({ userId: userId });
		const communityIds = communityMembers.map((t) => t.communityId);
		const myCommunitys = await Community.find({ _id: { $in: communityIds } });
		return res.status(Status.SUCCESS).json(myCommunitys);
	} catch (e) {
		return res.status(Status.INTERNAL_ERROR).json({ error: 'Server error', e });
	}
};
export const getCommunityMembers = async (req: Request, res: Response) => {
	const communityId = req.params.communityId;
	try{
		const communtiyMembers = await CommunityMember.find({communityId}).populate('userId')
		return res.status(Status.SUCCESS).json(communtiyMembers);
	}catch(e){
		return res.status(Status.INTERNAL_ERROR).json(e);
	}
};
export const getCommunityById = async (req: Request, res: Response) => {
	const communityId = req.params.communityId;
	try {
		const community = await Community.findById(communityId);
		return res.status(Status.SUCCESS).json({ community: community });
	} catch (e) {
		return res.status(Status.INTERNAL_ERROR).json({ error: 'Server error', e });
	}
};

export const createCommunity = async (req: Request, res: Response) => {
	const { initialMembersIds, community } = req.body;
	const userId = req.user.id;
	
	// Validation: communityName is required and not empty
	if (!community?.communityName || community.communityName.trim().length === 0) {
		return res.status(Status.BAD_REQUEST).json({ error: 'Community name is required' });
	}

	try {
		const newCommunity = new Community({
			...community,
			communityImgUrl: community.communityImgUrl || getRandomAstronomicalAvatar(),
		});
		await newCommunity.save();

		const communityId = newCommunity._id;
		const newCommunityMember = new CommunityMember({
			userId,
			communityId,
			role: 'admin',
		});
		await newCommunityMember.save();

		// Agregar los miembros iniciales
		const safeInitialMembers = Array.isArray(initialMembersIds) ? initialMembersIds : [];
		for (const memberId of safeInitialMembers) {
			const existing = await CommunityMember.findOne({ userId: memberId, communityId });
			if (!existing) {
				const newMember = new CommunityMember({
					userId: memberId,
					communityId,
					role: 'member',
				});
				await newMember.save();
			}
		}
		return res.status(Status.CREATED).json(newCommunity);
	} catch (e) {
		return res.status(Status.INTERNAL_ERROR).json(e);
	}
};

export const addCommunityMembers = async (req: Request, res: Response) => {
	const { communityId, userIds } = req.body;
	if (!communityId || !Array.isArray(userIds)) {
		return res.status(Status.BAD_REQUEST).json({ error: 'communityId and userIds array are required' });
	}
	try {
		const communityMembers = [];
		for (const userId of userIds) {
			const existing = await CommunityMember.findOne({ communityId, userId });
			if (existing) {
				communityMembers.push(existing);
				continue;
			}
			const communityMember = new CommunityMember({
				communityId,
				userId,
				role: 'member',
			});
			await communityMember.save();
			communityMembers.push(communityMember);
		}
		return res.status(Status.CREATED).json(communityMembers);
	} catch (e) {
		return res.status(Status.INTERNAL_ERROR).json({ error: 'Server error', e });
	}
};

export const changeCommunityInfo = async (req: Request, res: Response) => {
	const { communityId, communityName, communityImgUrl } = req.body;

	try {
		const changedCommunity = await Community.findByIdAndUpdate(
			communityId,
			{ communityName, communityImgUrl },
			{ new: true }
		);
		return res
			.status(Status.SUCCESS)
			.json({ changedCommunity: changedCommunity });
	} catch (e) {
		return res.status(Status.INTERNAL_ERROR).json({ error: 'Server error', e });
	}
};

export const deleteCommunity = async (req: Request, res: Response) => {
	const { communityId } = req.params;
	try {
		const deletedCommunity = await Community.findByIdAndDelete(communityId);
		const deletedCommunityMembers = await CommunityMember.deleteMany({
			communityId: communityId,
		});
		const communityGroups = await Group.find({ communityId });
		const groupIds = communityGroups.map((g) => g._id);
		if (groupIds.length > 0) {
			await GroupMember.deleteMany({ groupId: { $in: groupIds } });
			await Message.deleteMany({ groupId: { $in: groupIds } });
			await Group.deleteMany({ _id: { $in: groupIds } });
		}
		return res.status(Status.SUCCESS).json({
			deletedCommunity: deletedCommunity,
			deletedCommunityMembers: deletedCommunityMembers,
		});
	} catch (e) {
		return res.status(Status.INTERNAL_ERROR).json({ error: 'Server error', e });
	}
};

export const deleteCommunityMember = async (req: Request, res: Response) => {
	const { communityId, userId } = req.params;
	try {
		const deletedCommunityMember = await CommunityMember.findOneAndDelete({
			communityId,
			userId,
		});
		if (!deletedCommunityMember) {
			return res.status(Status.NOT_FOUND).json({ error: 'Community member not found' });
		}
		return res
			.status(Status.SUCCESS)
			.json({ deletedCommunityMember: deletedCommunityMember });
	} catch (e) {
		return res.status(Status.INTERNAL_ERROR).json({ error: 'Server error', e });
	}
};

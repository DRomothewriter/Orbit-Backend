import { Request, Response } from 'express';
import Community from './community.model';
import CommunityMember from './communityMember.model';
import Status from '../interfaces/Status';

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
	const userId = req.user.id;
	try{
		const communtiyMembers = await CommunityMember.find({communityId}).populate('userId')
		return res.status(Status.SUCCESS).json(communtiyMembers);
	}catch(e){
		return res.status(Status.INTERNAL_ERROR).json(e);
	}
};
export const getCommunityById = async (req: Request, res: Response) => {
	const communityId = req.params.CommunityId;
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
	try {
		const newCommunity = new Community(community);
		await newCommunity.save();

		const communityId = newCommunity._id;
		const newCommunityMember = new CommunityMember({
			userId,
			communityId,
			role: 'admin',
		});
		await newCommunityMember.save();

		// Agregar los miembros iniciales
		for (const memberId of initialMembersIds) {
			const newMember = new CommunityMember({
				userId: memberId,
				communityId,
				role: 'member',
			});
			await newMember.save();
			//io.to(newMember.userId).emit('newCommunity')
		}
		return res.status(Status.CREATED).json(newCommunity);
	} catch (e) {
		return res.status(Status.INTERNAL_ERROR).json(e);
	}
};

export const addCommunityMembers = async (req: Request, res: Response) => {
	const { communityId, userIds } = req.body;
	try {
		const communityMembers = [];
		userIds.foreach(async (userId: string) => {
			const communityMember = new CommunityMember({ communityId, userId });
			await communityMember.save();
			communityMembers.push(communityMember);
		});
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
		return res.status(Status.SUCCESS).json({
			deletedCommunity: deletedCommunity,
			deletedCommunityMembers: deletedCommunityMembers,
		});
	} catch (e) {
		return res.status(Status.INTERNAL_ERROR).json({ error: 'Server error', e });
	}
};

export const deleteCommunityMember = async (req: Request, res: Response) => {
	const { communityMemberId } = req.params;
	try {
		const deletedCommunityMember = await CommunityMember.findByIdAndDelete(
			communityMemberId
		);
		return res
			.status(Status.SUCCESS)
			.json({ deletedCommunityMember: deletedCommunityMember });
	} catch (e) {
		return res.status(Status.INTERNAL_ERROR).json({ error: 'Server error', e });
	}
};

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
		return res.status(Status.SUCCESS).json({ myCommunitys: myCommunitys });
	} catch (e) {
		return res
			.status(Status.INTERNAL_ERROR)
			.json({ error: 'Server error', e });
	}
};

export const getCommunityById = async (req: Request, res: Response) => {
	const communityId = req.params.CommunityId;
	try {
		const community = await Community.findById(communityId);
		return res.status(Status.SUCCESS).json({ community: community });
	} catch (e) {
		return res
			.status(Status.INTERNAL_ERROR)
			.json({ error: 'Server error', e });
	}
};

export const createCommunity = async (req: Request, res: Response) => {
	const { communityName, description, communityImgUrl } = req.body;
	const userId = req.user.id;
	try {
		const newCommunity = new Community({ communityName, description, communityImgUrl });
		await newCommunity.save();
		const communityId = newCommunity._id;

		const newCommunityMember = new CommunityMember({ userId, communityId, admin: "admin" }); //checar admin
		await newCommunityMember.save();
		return res
			.status(Status.CREATED)
			.json({ newCommunity: newCommunity, newCommunityMember: newCommunityMember });
	} catch (e) {
		return res
			.status(Status.INTERNAL_ERROR)
			.json({ error: 'Server error', e });
	}
};

export const addCommunityMember = async (req: Request, res: Response) => {
	const { communityId, userId } = req.body;
	try {
		const communityMember = new CommunityMember({ communityId, userId });
		await communityMember.save();
		return res.status(Status.CREATED).json({ communityMember: communityMember });
	} catch (e) {
		return res
			.status(Status.INTERNAL_ERROR)
			.json({ error: 'Server error', e});
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
		return res
			.status(Status.INTERNAL_ERROR)
			.json({ error: 'Server error', e});
	}
};

export const deleteCommunity = async (req: Request, res: Response) => {
	const { communityId } = req.params;
	try {
		const deletedCommunity = await Community.findByIdAndDelete(communityId);
		const deletedCommunityMembers = await CommunityMember.deleteMany({communityId: communityId});
		return res.status(Status.SUCCESS).json({deletedCommunity: deletedCommunity, deletedCommunityMembers: deletedCommunityMembers })
	}catch(e){
		return res.status(Status.INTERNAL_ERROR).json({error: 'Server error', e});
	}
};

export const deleteCommunityMember = async (req: Request, res: Response) => {
	const { communityMemberId } = req.params;
	try{
		const deletedCommunityMember = await CommunityMember.findByIdAndDelete(communityMemberId);
		return res.status(Status.SUCCESS).json({deletedCommunityMember: deletedCommunityMember});
	}catch(e){
		return res.status(Status.INTERNAL_ERROR).json({error: 'Server error', e});
	}
};

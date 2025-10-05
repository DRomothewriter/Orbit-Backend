import Group from './group.model';
import GroupMember from './groupMember.model';

import { Request, Response } from 'express';
import Status from '../interfaces/Status';

export const getMyGroups = async (req: Request, res: Response) => {
	const userId = req.user.id;
	try {
		const groupMembers = await GroupMember.find({ userId: userId });
		const groupIds = groupMembers.map((gM) => gM.userId);
		const allMyGroups = await Group.find({ _id: { $in: groupIds } });

        const myTeamGroups = allMyGroups.filter((g) => g.teamId);
        const myGroups = allMyGroups.filter((g)=> !g.teamId);

		return res.status(Status.SUCCESS).json({ myGroups: myGroups, myTeamGroups: myTeamGroups });
	} catch (e) {
		return res.status(Status.INTERNAL_ERROR).json({ error: 'Server error', e });
	}
};

export const getGroupById = async (req: Request, res: Response) => {
	const groupId = req.params.groupId;
	try {
		const group = await Group.findById(groupId);
		return res.status(Status.SUCCESS).json({ group: group });
	} catch (e) {
		return res.status(Status.INTERNAL_ERROR).json({ error: 'Server error', e });
	}
};

export const createGroup = async (req: Request, res: Response) => {
    const { teamId, topic, description, groupImgUrl } = req.body;
    const userId = req.user.id;
    try{
        const newGroup = new Group({ teamId, topic, description, groupImgUrl});
        await newGroup.save();
        const groupId = newGroup._id;


        const newMember = new GroupMember({userId, groupId, admin: "admin" });//checar admin
		await newMember.save();
		return res.status(Status.CREATED).json({ newGroup: newGroup, newMember: newMember});
    }catch(e){
		return res.status(Status.INTERNAL_ERROR).json({error: 'Server error', e});
    }	
}

export const addMember =async (req: Request, res: Response) => {
	const { groupId, userId} = req.body;
	try{
		const member = new GroupMember({groupId, userId});
		await member.save();
		return res.status(Status.CREATED).json({ member: member });
	} catch(e){
		return res.status(Status.INTERNAL_ERROR).json({error: 'Server error', e});
	}
}

export const changeGroupInfo = async (req:Request, res: Response) => {
	const { groupId, topic, groupImgUrl } = req.body;
	try{
		const changedGroup = await Group.findByIdAndUpdate(groupId, {topic, groupImgUrl}, {new:true});
		return res.status(Status.SUCCESS).json({ changedGroup: changedGroup});
	}catch(e){
		return res.status(Status.INTERNAL_ERROR).json({ error: 'Server error', e});
	}
};

export const deleteGroup = async (req: Request, res: Response) => {
	const { groupId } = req.params;
	try{
		const deletedGroup = await Group.findByIdAndDelete(groupId);
		const deletedMembers = await GroupMember.deleteMany({groupId: groupId});
		return res.status(Status.SUCCESS).json({deletedGroup: deletedGroup, deletedMembers: deletedMembers});
	}catch(e){
		return res.status(Status.INTERNAL_ERROR).json({error: 'Server error'});
	}
}

export const deleteGroupMember = async (req: Request, res: Response) => {
	const { groupMemberId } = req.params;
	try{
		const deletedMember = await GroupMember.findByIdAndDelete(groupMemberId);
		return res.status(Status.SUCCESS).json({deletedMember: deletedMember});
	}catch(e){
		return res.status(Status.INTERNAL_ERROR).json({error: 'Server error', e})
	}
}
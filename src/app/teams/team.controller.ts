import { Request, Response } from 'express';
import Team from './team.model';
import Teamate from './teamate.model';
import Status from '../interfaces/Status';

export const getMyTeams = async (req: Request, res: Response) => {
	const userId = req.user.id;
	try {
		const teamates = await Teamate.find({ userId: userId });
		const teamIds = teamates.map((t) => t.teamId);
		const myTeams = await Team.find({ _id: { $in: teamIds } });
		return res.status(Status.SUCCESS).json({ myTeams: myTeams });
	} catch (e) {
		return res
			.status(Status.INTERNAL_ERROR)
			.json({ error: 'Server error', e });
	}
};

export const getTeamById = async (req: Request, res: Response) => {
	const teamId = req.params.teamId;
	try {
		const team = await Team.findById(teamId);
		return res.status(Status.SUCCESS).json({ team: team });
	} catch (e) {
		return res
			.status(Status.INTERNAL_ERROR)
			.json({ error: 'Server error', e });
	}
};

export const createTeam = async (req: Request, res: Response) => {
	const { teamName, description, teamImgUrl } = req.body;
	const userId = req.user.id;
	try {
		const newTeam = new Team({ teamName, description, teamImgUrl });
		await newTeam.save();
		const teamId = newTeam._id;

		const newTeamate = new Teamate({ userId, teamId, admin: "admin" }); //checar admin
		await newTeamate.save();
		return res
			.status(Status.CREATED)
			.json({ newTeam: newTeam, newTeamate: newTeamate });
	} catch (e) {
		return res
			.status(Status.INTERNAL_ERROR)
			.json({ error: 'Server error', e });
	}
};

export const addTeamate = async (req: Request, res: Response) => {
	const { teamId, userId } = req.body;
	try {
		const teamate = new Teamate({ teamId, userId });
		await teamate.save();
		return res.status(Status.CREATED).json({ teamate: teamate });
	} catch (e) {
		return res
			.status(Status.INTERNAL_ERROR)
			.json({ error: 'Server error', e});
	}
};

export const changeTeamInfo = async (req: Request, res: Response) => {
	const { teamId, teamName, teamImgUrl } = req.body;

	try {
		const changedTeam = await Team.findByIdAndUpdate(
			teamId,
			{ teamName, teamImgUrl },
			{ new: true }
		);
		return res
			.status(Status.SUCCESS)
			.json({ changedTeam: changedTeam });
	} catch (e) {
		return res
			.status(Status.INTERNAL_ERROR)
			.json({ error: 'Server error', e});
	}
};

export const deleteTeam = async (req: Request, res: Response) => {
	const { teamId } = req.params;
	try {
		const deletedTeam = await Team.findByIdAndDelete(teamId);
		const deletedTeamates = await Teamate.deleteMany({teamId: teamId});
		return res.status(Status.SUCCESS).json({deletedTeam: deletedTeam, deletedTeamates: deletedTeamates })
	}catch(e){
		return res.status(Status.INTERNAL_ERROR).json({error: 'Server error', e});
	}
};

export const deleteTeamate = async (req: Request, res: Response) => {
	const { teamateId } = req.params;
	try{
		const deletedTeamate = await Teamate.findByIdAndDelete(teamateId);
		return res.status(Status.SUCCESS).json({deletedTeamate: deletedTeamate});
	}catch(e){
		return res.status(Status.INTERNAL_ERROR).json({error: 'Server error', e});
	}
};

import User from './user.model';

import { Request, Response } from 'express';
import Status from '../interfaces/Status';


export const createUser = async (req: Request, res: Response) => {
	const { username, email, password, profileImgUrl } = req.body;
	try {
		const newUser = new User({ username, email, password, profileImgUrl});
		await newUser.save();
		
		return res.status(Status.CREATED).json({ newUser: newUser});
	} catch (e) {
		return res.status(Status.INTERNAL_ERROR).json({ error: 'Server error', e });
	}
}

export const getUser = (req: Request, res: Response) => {
	console.log('User: ', req.user);
	res.send([]);
}

export const getUserById = async (req: Request, res: Response) => {
	const userId = req.params.userId;
	try {
		const user = await User.findById(userId);
		return res.status(Status.SUCCESS).json({ user: user });
	} catch (e) {
		return res.status(Status.INTERNAL_ERROR).json({ error: 'Server error', e });
	}
}

export const modifyUser = async (req:Request, res: Response) => {
	const {userId, username, email, password, profileImgUrl} = req.body;
	try {
		const user = await User.findByIdAndUpdate(userId, {username, email, password, profileImgUrl}, {new: true});
		return res.status(Status.SUCCESS).json({ updatedUser: user});
	} catch (e) {
		return res.status(Status.INTERNAL_ERROR).json({ error: 'Server error', e });
	}
}

export const deleteUser = async (req: Request, res: Response) => {
	const userId = req.params.userId;
	try {
		const deletedUser = await User.findByIdAndDelete(userId);
		return res.status(Status.SUCCESS).json({deletedUser: deletedUser});
	} catch (e) {
		return res.status(Status.INTERNAL_ERROR).json({ error: 'Server error', e });
	}
}

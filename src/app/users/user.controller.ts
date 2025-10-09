import User from './user.model';
import Friendship from './friendship.model';
import { Request, Response } from 'express';
import Status from '../interfaces/Status';

export const getAllUsers = async (req: Request, res: Response) => {
	try{
		const users = await User.find().select('_id username');
		return res.status(Status.SUCCESS).json({ users: users})
	}catch(e){
		return res.status(Status.INTERNAL_ERROR).json({ error: 'Server error', e});
	}
};

export const getMyUser = async (req: Request, res: Response) => {
	try {
		const user = await User.findById(req.user.id); 
		return res.status(Status.SUCCESS).json({ user: user });
	} catch (e) {
		return res.status(Status.UNAUTHORIZED).json({ error: 'No autenticado' });
	}
};

export const getUserById = async (req: Request, res: Response) => {
	const userId = req.params.userId;
	try {
		const user = await User.findById(userId);
		return res.status(Status.SUCCESS).json({ user: user });
	} catch (e) {
		return res.status(Status.INTERNAL_ERROR).json({ error: 'Server error', e });
	}
};

export const modifyUser = async (req: Request, res: Response) => {
	const { userId, username, email, password, profileImgUrl } = req.body;
	try {
		const user = await User.findByIdAndUpdate(
			userId,
			{ username, email, password, profileImgUrl },
			{ new: true }
		);
		return res.status(Status.SUCCESS).json({ updatedUser: user });
	} catch (e) {
		return res.status(Status.INTERNAL_ERROR).json({ error: 'Server error', e });
	}
};

export const deleteUser = async (req: Request, res: Response) => {
	const userId = req.params.userId;
	try {
		const deletedUser = await User.findByIdAndDelete(userId);
		return res.status(Status.SUCCESS).json({ deletedUser: deletedUser });
	} catch (e) {
		return res.status(Status.INTERNAL_ERROR).json({ error: 'Server error', e });
	}
};

export const sendFriendRequest = async (req: Request, res: Response) => {
	const userId = req.user.id;
	const { friendId } = req.body;
	try {
		const exists = await Friendship.findOne({ userId, friendId });
		if (exists)
			return res
				.status(Status.CONFLICT)
				.json({ error: 'Solicitud ya enviada' });

		const friendship = new Friendship({ userId, friendId, status: 'pending' });
		await friendship.save();
		return res.status(Status.CREATED).json({ friendship });
	} catch (e) {
		return res.status(Status.INTERNAL_ERROR).json({ error: 'Server error', e });
	}
};

export const acceptFriendRequest = async (req: Request, res: Response) => {
	const userId = req.user.id;
	const { friendshipId } = req.body;
	try {
		const friendship = await Friendship.findOneAndUpdate(
			{ _id: friendshipId, friendId: userId, status: 'pending' },
			{ status: 'accepted' },
			{ new: true }
		);
		if (!friendship)
			return res.status(Status.NOT_FOUND).json({ error: 'Request not found' });

		const reverseFriendship = new Friendship({
			userId: userId,
			friendId: friendship.userId,
			status: 'accepted',
		});
		await reverseFriendship.save();

		return res
			.status(Status.SUCCESS)
			.json({ hisFriendship: friendship, myFriendship: reverseFriendship });
	} catch (e) {
		return res.status(Status.INTERNAL_ERROR).json({ error: 'Server error', e });
	}
};

export const blockFriend = async (req: Request, res: Response) => {
	const userId = req.user.id;
	const { friendId } = req.body;
	try {
		const friendship = await Friendship.findOneAndUpdate(
			{ friendId: friendId, userId: userId },
			{ status: 'blocked' },
			{ new: true }
		);
		if (!friendship)
			return res
				.status(Status.NOT_FOUND)
				.json({ error: 'Friendship not found' });
		return res.status(Status.SUCCESS).json({ friendship: friendship });
	} catch (e) {
		return res.status(Status.INTERNAL_ERROR).json({ error: 'Server error', e });
	}
};
export const muteFriend = async (req: Request, res: Response) => {
	const userId = req.user.id;
	const { friendId } = req.body;
	try {
		const friendship = await Friendship.findOneAndUpdate(
			{ friendId: friendId, userId: userId },
			{ status: 'mute' },
			{ new: true }
		);
		if (!friendship)
			return res
				.status(Status.NOT_FOUND)
				.json({ error: 'Friendship not found' });
		return res.status(Status.SUCCESS).json({ friendship: friendship });
	} catch (e) {
		return res.status(Status.INTERNAL_ERROR).json({ error: 'Server error', e });
	}
};

export const getFriends = async (req: Request, res: Response) => {
	const userId = req.user.id;
	try {
		const friendships = await Friendship.find({userId: userId}).populate('userId friendId');
		if(!friendships) return res.status(Status.NO_CONTENT).json({ message: 'You have no friends'});
		return res.status(Status.SUCCESS).json({ friends: friendships });
	} catch (e) {
		return res.status(Status.INTERNAL_ERROR).json({ error: 'Server error', e });
	}
};

export const getReceivedRequests = async (req: Request, res: Response) => {
	const userId = req.user.id;
	try{
		const friendRequests = await Friendship.find({friendId: userId});
		if(!friendRequests) return res.status(Status.NO_CONTENT).json({message: "You don't have friend requests"});
		return res.status(Status.SUCCESS).json({ friendRequests: friendRequests});
	}catch(e){
		return res.status(Status.INTERNAL_ERROR).json({ error: `Server error: ${e}`});
	}
};

export const deleteFriendship = async (req: Request, res: Response) => {
	const { friendshipId } = req.body;
	try {
		const deleted = await Friendship.findByIdAndDelete(friendshipId);
		if (!deleted)
			return res
				.status(Status.NOT_FOUND)
				.json({ error: 'Friendship not found' });
		return res.status(Status.SUCCESS).json({ deleted });
	} catch (e) {
		return res.status(Status.INTERNAL_ERROR).json({ error: 'Server error', e });
	}
};

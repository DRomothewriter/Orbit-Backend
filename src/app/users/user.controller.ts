import User from './user.model';
import Friendship from './friendship.model';
import { Request, Response } from 'express';
import Status from '../interfaces/Status';
import { notifyUser } from '../notifications/notification.service';
import { NotificationType } from '../notifications/notification.model';
import { deleteImageFromS3 } from '../middlewares/s3';

export const getAllUsers = async (req: Request, res: Response) => {
	try {
		const users = await User.find().select('_id username');
		return res.status(Status.SUCCESS).json({ users: users });
	} catch (e) {
		return res.status(Status.INTERNAL_ERROR).json({ error: 'Server error' });
	}
};

export const getMyUser = async (req: Request, res: Response) => {
	if (!req.user) {
		return res.status(Status.UNAUTHORIZED).json({ error: 'No autenticado' });
	}
	try {
		const user = await User.findById(req.user.id);
		return res.status(Status.SUCCESS).json(user);
	} catch (e) {
		return res.status(Status.INTERNAL_ERROR).json({ error: 'Server error' });
	}
};

export const getUserById = async (req: Request, res: Response) => {
	const userId = req.params.userId;
	try {
		const user = await User.findById(userId);
		return res.status(Status.SUCCESS).json({ user: user });
	} catch (e) {
		return res.status(Status.INTERNAL_ERROR).json({ error: 'Server error' });
	}
};

export const searchUsers = async (req: Request, res: Response) => {
	const username = req.query.username as string;
	const userId = req.user.id;
	try {
		const users = await User.find({
			username: { $regex: username, $options: 'i' },
			_id: { $ne: userId}
		}).select('_id username email profileImgUrl');
		return res.status(Status.SUCCESS).json(users);
	} catch (e) {
		return res.status(Status.INTERNAL_ERROR).json({ error: 'Server error' });
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
		if (!user)
			return res.status(Status.NOT_FOUND).json({ Message: 'User not found' });
		return res.status(Status.SUCCESS).json({ updatedUser: user });
	} catch (e) {
		return res.status(Status.INTERNAL_ERROR).json({ error: 'Server error' });
	}
};

export const editUsername = async (req: Request, res: Response) => {
	const username = req.body.username;
	const userId = req.user.id;
	try {
		const user = await User.findByIdAndUpdate(
			userId,
			{ username: username },
			{ new: true }
		);
		if (!user)
			return res.status(Status.NOT_FOUND).json({ Message: 'User not found' });
		return res.status(Status.SUCCESS).json(user);
	} catch (e) {
		return res.status(Status.INTERNAL_ERROR).json({ error: 'Server error' });
	}
};

export const deleteUser = async (req: Request, res: Response) => {
	const userId = req.params.userId;
	try {
		const deletedUser = await User.findByIdAndDelete(userId);
		return res.status(Status.SUCCESS).json({ deletedUser: deletedUser });
	} catch (e) {
		return res.status(Status.INTERNAL_ERROR).json({ error: 'Server error' });
	}
};

export const sendFriendRequest = async (req: Request, res: Response) => {
	const userId = req.user.id;
	const { friendId } = req.body;
	const io = req.app.get('io');
	try {
		const exists = await Friendship.findOne({ userId, friendId });
		if (exists)
			return res
				.status(Status.CONFLICT)
				.json({ error: 'Solicitud ya enviada' });
		const friendship = new Friendship({ userId, friendId, status: 'pending' });
		await friendship.save();
		const friendshipWUser = {...friendship, userId: req.user};
		//notification
		notifyUser(friendId, NotificationType.FRIEND_REQUEST, friendshipWUser, io);

		return res.status(Status.CREATED).json({ friendship });
	} catch (e) {
		return res.status(Status.INTERNAL_ERROR).json({ error: 'Server error' });
	}
};

export const acceptFriendRequest = async (req: Request, res: Response) => {
	const userId = req.user.id;
	const { friendshipId } = req.body;
	const io = req.app.get('io');
	try {
		const friendship = await Friendship.findByIdAndUpdate(
			friendshipId,
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

		notifyUser(
			friendship.userId,
			NotificationType.FRIEND_REQUEST_ACCEPTED,
			friendship,
			io
		);

		return res
			.status(Status.SUCCESS)
			.json({ hisFriendship: friendship, myFriendship: reverseFriendship });
	} catch (e) {
		return res.status(Status.INTERNAL_ERROR).json({ error: 'Server error' });
	}
};

export const getFriends = async (req: Request, res: Response) => {
	const userId = req.user.id;
	try {
		const friendships = await Friendship.find({
			userId: userId,
			status: 'accepted',
		}).populate('friendId');
		if (!friendships)
			return res
				.status(Status.NO_CONTENT)
				.json({ message: 'You have no friends' });
		return res.status(Status.SUCCESS).json(friendships);
	} catch (e) {
		return res.status(Status.INTERNAL_ERROR).json({ error: 'Server error' });
	}
};

export const getReceivedRequests = async (req: Request, res: Response) => {
	const userId = req.user.id;
	try {
		const friendRequests = await Friendship.find({
			friendId: userId,
			status: 'pending',
		}).populate('userId');
		if (!friendRequests)
			return res
				.status(Status.NO_CONTENT)
				.json({ message: "You don't have friend requests" });
		return res.status(Status.SUCCESS).json(friendRequests);
	} catch (e) {
		return res
			.status(Status.INTERNAL_ERROR)
			.json({ error: `Server error: ${e}` });
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

		await Friendship.findOneAndDelete({
			userId: deleted.friendId,
			friendId: deleted.userId,
		});
		return res.status(Status.SUCCESS).json({ deleted });
	} catch (e) {
		return res.status(Status.INTERNAL_ERROR).json({ error: 'Server error' });
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
		return res.status(Status.INTERNAL_ERROR).json({ error: 'Server error' });
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
		return res.status(Status.INTERNAL_ERROR).json({ error: 'Server error' });
	}
};
export const changeUserStatus = async (req: Request, res: Response) => {
	const userId = req.user.id;
	const status = req.params.status;
	try {
		const newUser = await User.findByIdAndUpdate(
			userId,
			{ status: status },
			{ new: true }
		);
		return res.status(Status.SUCCESS).json(newUser);
	} catch (e) {
		return res.status(Status.INTERNAL_ERROR).json({ error: 'Server error' });
	}
};
export const editProfileImg = async (req: Request, res: Response) => {
	const userId = req.user.id;
	const file = req.file as Express.MulterS3.File;
	if (!file) {
		return res.status(Status.BAD_REQUEST).json({ error: 'No image uploaded' });
	}
	try {
		const pastUser = await User.findByIdAndUpdate(
			userId,
			{ profileImgUrl: file.location },
			{ new: false }
		);
		if (pastUser.profileImgUrl) {
			deleteImageFromS3(pastUser.profileImgUrl);
		}
		return res.status(Status.SUCCESS).json(file.location);
	} catch (e) {
		return res.status(Status.INTERNAL_ERROR).json({ error: e });
	}
};

import User from './user.model';
import Friendship from './friendship.model';
import { Request, Response } from 'express';
import Status from '../interfaces/Status';
import { notifyUser } from '../notifications/notification.service';
import { NotificationType } from '../notifications/notification.model';
import { deleteImageFromS3, resolveUploadedFileUrl } from '../middlewares/s3';
import { isDefaultAstronomicalAvatar } from '../shared/defaultAvatars';

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

const escapeRegex = (str: string): string =>
	str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const searchUsers = async (req: Request, res: Response) => {
	const rawUsername = typeof req.query.username === 'string' ? req.query.username : '';
	const username = escapeRegex(rawUsername);
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
	const authUserId = req.user?.id;
	const { username, profileImgUrl } = req.body;
	if (!authUserId) {
		return res.status(Status.UNAUTHORIZED).json({ error: 'No autenticado' });
	}
	const updates: Record<string, any> = {};
	if (typeof username === 'string' && username.trim()) updates.username = username.trim();
	if (typeof profileImgUrl === 'string') updates.profileImgUrl = profileImgUrl;
	try {
		const user = await User.findByIdAndUpdate(
			authUserId,
			updates,
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
	if (!req.user || req.user.id.toString() !== userId.toString()) {
		return res.status(Status.FORBIDDEN).json({ error: 'Forbidden' });
	}
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
	if (!friendId || friendId.toString() === userId.toString()) {
		return res
			.status(Status.BAD_REQUEST)
			.json({ error: 'No puedes enviarte solicitud a ti mismo' });
	}
	try {
		const exists = await Friendship.findOne({
			$or: [
				{ userId, friendId },
				{ userId: friendId, friendId: userId },
			],
		});
		if (exists)
			return res
				.status(Status.CONFLICT)
				.json({ error: 'Solicitud ya enviada' });
		const friendship = new Friendship({ userId, friendId, status: 'pending' });
		await friendship.save();
		const sender = await User.findById(userId).select('_id username profileImgUrl email');
		const friendshipWUser = {
			...(typeof friendship.toObject === 'function' ? friendship.toObject() : friendship),
			userId: sender || req.user,
		};
		//notification
		await notifyUser(friendId, NotificationType.FRIEND_REQUEST, friendshipWUser, io).catch(
			(err) => console.error('Error notifying friend request:', err)
		);

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
		const existing = await Friendship.findById(friendshipId);
		if (!existing)
			return res.status(Status.NOT_FOUND).json({ error: 'Request not found' });
		if (existing.friendId.toString() !== userId.toString()) {
			return res.status(Status.FORBIDDEN).json({ error: 'Forbidden' });
		}
		if (existing.status !== 'pending') {
			return res.status(Status.BAD_REQUEST).json({ error: 'Request is not pending' });
		}

		existing.status = 'accepted';
		await existing.save();

		let reverseFriendship = await Friendship.findOne({
			userId: userId,
			friendId: existing.userId,
		});
		if (!reverseFriendship) {
			reverseFriendship = new Friendship({
				userId: userId,
				friendId: existing.userId,
				status: 'accepted',
			});
			await reverseFriendship.save();
		} else {
			reverseFriendship.status = 'accepted';
			await reverseFriendship.save();
		}

		const accepter = await User.findById(userId).select('_id username profileImgUrl');
		const notifPayload = {
			...(typeof existing.toObject === 'function' ? existing.toObject() : existing),
			userId: accepter || { _id: userId },
		};

		await notifyUser(
			existing.userId,
			NotificationType.FRIEND_REQUEST_ACCEPTED,
			notifPayload,
			io
		).catch((err) => console.error('Error notifying friend accepted:', err));

		return res
			.status(Status.SUCCESS)
			.json({ hisFriendship: existing, myFriendship: reverseFriendship });
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
	const userId = req.user.id;
	const { friendshipId } = req.body;
	try {
		const existing = await Friendship.findById(friendshipId);
		if (!existing)
			return res
				.status(Status.NOT_FOUND)
				.json({ error: 'Friendship not found' });
		if (
			existing.userId.toString() !== userId.toString() &&
			existing.friendId.toString() !== userId.toString()
		) {
			return res.status(Status.FORBIDDEN).json({ error: 'Forbidden' });
		}

		const deleted = await Friendship.findByIdAndDelete(friendshipId);
		await Friendship.findOneAndDelete({
			userId: existing.friendId,
			friendId: existing.userId,
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
			{ status: 'muted' },
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
	if (!['online', 'working', 'offline'].includes(status)) {
		return res.status(Status.BAD_REQUEST).json({ error: 'Invalid status' });
	}
	try {
		const newUser = await User.findByIdAndUpdate(
			userId,
			{ status: status },
			{ new: true, runValidators: true }
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
		const imageUrl = resolveUploadedFileUrl(req, file);
		const pastUser = await User.findByIdAndUpdate(
			userId,
			{ profileImgUrl: imageUrl },
			{ new: false }
		);
		if (pastUser?.profileImgUrl && !isDefaultAstronomicalAvatar(pastUser.profileImgUrl)) {
			await deleteImageFromS3(pastUser.profileImgUrl).catch((err) =>
				console.error('Error deleting previous profile image from S3:', err)
			);
		}
		return res.status(Status.SUCCESS).json(imageUrl);
	} catch (e) {
		return res.status(Status.INTERNAL_ERROR).json({ error: e });
	}
};

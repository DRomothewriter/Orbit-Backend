import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from '../src/app/users/user.model';
import Group from '../src/app/groups/group.model';
import Community from '../src/app/communities/community.model';
import { getShuffledAstronomicalAvatars } from '../src/app/shared/defaultAvatars';

function createDeckPicker() {
	let deck = getShuffledAstronomicalAvatars();
	let cursor = 0;
	return (): string => {
		if (cursor >= deck.length) {
			deck = getShuffledAstronomicalAvatars();
			cursor = 0;
		}
		return deck[cursor++];
	};
}

async function assignAstronomicalAvatars() {
	const mongoUri = process.env.MONGO_URI;
	if (!mongoUri) {
		throw new Error('MONGO_URI is not defined in .env');
	}

	await mongoose.connect(mongoUri);
	const dbName = mongoose.connection.db?.databaseName;
	console.log(`Connected to MongoDB database: ${dbName}`);

	const [users, groups, communities] = await Promise.all([
		User.find({}, '_id'),
		Group.find({}, '_id'),
		Community.find({}, '_id'),
	]);

	// Baraja independiente por colección para garantizar 0 repeticiones dentro de cada lista
	const pickUserAvatar = createDeckPicker();
	const pickGroupAvatar = createDeckPicker();
	const pickCommunityAvatar = createDeckPicker();

	if (users.length > 0) {
		await User.bulkWrite(
			users.map((user) => ({
				updateOne: {
					filter: { _id: user._id },
					update: { $set: { profileImgUrl: pickUserAvatar() } },
				},
			}))
		);
	}

	if (groups.length > 0) {
		await Group.bulkWrite(
			groups.map((group) => ({
				updateOne: {
					filter: { _id: group._id },
					update: { $set: { groupImgUrl: pickGroupAvatar() } },
				},
			}))
		);
	}

	if (communities.length > 0) {
		await Community.bulkWrite(
			communities.map((community) => ({
				updateOne: {
					filter: { _id: community._id },
					update: { $set: { communityImgUrl: pickCommunityAvatar() } },
				},
			}))
		);
	}

	console.log(
		JSON.stringify({
			database: dbName,
			bankSize: 24,
			updatedUsers: users.length,
			updatedGroups: groups.length,
			updatedCommunities: communities.length,
		})
	);

	await mongoose.disconnect();
}

assignAstronomicalAvatars().catch(async (err) => {
	console.error('Migration failed:', err);
	await mongoose.disconnect().catch(() => {});
	process.exit(1);
});

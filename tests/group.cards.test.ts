import { Request, Response } from 'express';

const mockGroupFind = jest.fn();
const mockGroupFindByIdAndUpdate = jest.fn();
const mockGroupMemberFind = jest.fn();
const mockGroupMemberFindOneAndUpdate = jest.fn();
const mockMessageFind = jest.fn();
const mockMessageFindOne = jest.fn();
const mockMessageCountDocuments = jest.fn();
const mockMessageSave = jest.fn();

jest.mock('../src/app/groups/group.model', () => ({
	__esModule: true,
	default: {
		find: mockGroupFind,
		findByIdAndUpdate: mockGroupFindByIdAndUpdate,
	},
}));

jest.mock('../src/app/groups/groupMember.model', () => ({
	__esModule: true,
	default: {
		find: mockGroupMemberFind,
		findOneAndUpdate: mockGroupMemberFindOneAndUpdate,
	},
}));

const MockMessage: any = jest.fn().mockImplementation((data: any) => ({
	...data,
	_id: 'msg-new-1',
	createdAt: new Date('2026-11-26T15:00:00.000Z'),
	save: mockMessageSave,
}));
MockMessage.find = mockMessageFind;
MockMessage.findOne = mockMessageFindOne;
MockMessage.countDocuments = mockMessageCountDocuments;

jest.mock('../src/app/messages/message.model', () => ({
	__esModule: true,
	default: MockMessage,
}));

jest.mock('../src/app/messages/reaction.model', () => ({
	__esModule: true,
	default: {},
}));

jest.mock('../src/app/notifications/notification.service', () => ({
	notifyUser: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../src/app/groups/group.service', () => ({
	getGroupMembers: jest.fn().mockResolvedValue([]),
}));

import {
	getMyGroups,
	markGroupAsRead,
} from '../src/app/groups/group.controller';
import {
	createMessage,
	getGroupMessages,
} from '../src/app/messages/message.controller';

const createMockRes = () => {
	const res: Partial<Response> = {};
	res.status = jest.fn().mockReturnValue(res);
	res.json = jest.fn().mockReturnValue(res);
	return res as Response;
};

describe('Group Cards - lastMessage, unreadCount & DM avatar', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('createMessage should update Group.lastMessage with the created message id', async () => {
		mockMessageSave.mockResolvedValue(true);
		mockGroupFindByIdAndUpdate.mockResolvedValue({});

		const emitMock = jest.fn();
		const req = {
			user: { id: 'user-1' },
			body: {
				message: {
					type: 'text',
					text: 'Hola mundo',
					groupId: 'group-1',
					username: 'diego',
				},
			},
			app: {
				get: jest.fn().mockReturnValue({
					to: jest.fn().mockReturnValue({ emit: emitMock }),
				}),
			},
		} as unknown as Request;
		const res = createMockRes();

		await createMessage(req, res);

		expect(mockGroupFindByIdAndUpdate).toHaveBeenCalledWith('group-1', {
			lastMessage: 'msg-new-1',
		});
		expect(res.status).toHaveBeenCalledWith(201);
	});

	it('getGroupMessages should update GroupMember.lastReadAt for the requesting user', async () => {
		const leanChain = {
			sort: jest.fn().mockReturnThis(),
			skip: jest.fn().mockReturnThis(),
			limit: jest.fn().mockReturnThis(),
			lean: jest.fn().mockResolvedValue([]),
		};
		mockMessageFind.mockReturnValue(leanChain);
		mockGroupMemberFindOneAndUpdate.mockResolvedValue({});

		const req = {
			user: { id: 'user-1' },
			params: { groupId: 'group-1' },
			query: {},
		} as unknown as Request;
		const res = createMockRes();

		await getGroupMessages(req, res);

		expect(mockGroupMemberFindOneAndUpdate).toHaveBeenCalledWith(
			{ groupId: 'group-1', userId: 'user-1' },
			{ lastReadAt: expect.any(Date) }
		);
		expect(res.status).toHaveBeenCalledWith(200);
	});

	it('markGroupAsRead should update GroupMember.lastReadAt and return 200', async () => {
		mockGroupMemberFindOneAndUpdate.mockResolvedValue({
			groupId: 'group-1',
			userId: 'user-1',
		});

		const req = {
			user: { id: 'user-1' },
			params: { groupId: 'group-1' },
		} as unknown as Request;
		const res = createMockRes();

		await markGroupAsRead(req, res);

		expect(mockGroupMemberFindOneAndUpdate).toHaveBeenCalledWith(
			{ groupId: 'group-1', userId: 'user-1' },
			{ lastReadAt: expect.any(Date) },
			{ new: true }
		);
		expect(res.status).toHaveBeenCalledWith(200);
	});

	it('getMyGroups should return groups with lastMessage, unreadCount, DM contact avatar, and sorted by recency', async () => {
		const lastReadOld = new Date('2026-11-26T10:00:00.000Z');
		// User memberships
		mockGroupMemberFind
			.mockResolvedValueOnce([
				{ groupId: 'g-older', userId: 'user-1', lastReadAt: lastReadOld },
				{ groupId: 'g-newer', userId: 'user-1', lastReadAt: lastReadOld },
			])
			// Group members for DM avatar resolution
			.mockReturnValueOnce({
				populate: jest.fn().mockReturnValue({
					lean: jest.fn().mockResolvedValue([
						{
							groupId: 'g-older',
							userId: { _id: 'user-1', username: 'diego', profileImgUrl: '' },
						},
						{
							groupId: 'g-older',
							userId: {
								_id: 'user-2',
								username: 'ana',
								profileImgUrl: 'https://cdn.orbit/ana.png',
							},
						},
						{
							groupId: 'g-newer',
							userId: { _id: 'user-1', username: 'diego', profileImgUrl: '' },
						},
						{
							groupId: 'g-newer',
							userId: { _id: 'user-3', username: 'luis', profileImgUrl: '' },
						},
						{
							groupId: 'g-newer',
							userId: { _id: 'user-4', username: 'sofia', profileImgUrl: '' },
						},
					]),
				}),
			});

		const groupsFromDb = [
			{
				_id: 'g-older',
				topic: 'ana',
				groupImgUrl: '',
				lastMessage: {
					_id: 'm1',
					text: 'Mensaje viejo',
					createdAt: new Date('2026-11-26T11:00:00.000Z'),
				},
				updatedAt: new Date('2026-11-26T11:00:00.000Z'),
			},
			{
				_id: 'g-newer',
				topic: 'Equipo',
				groupImgUrl: 'https://cdn.orbit/team.png',
				lastMessage: {
					_id: 'm2',
					text: 'Mensaje reciente',
					createdAt: new Date('2026-11-26T14:00:00.000Z'),
				},
				updatedAt: new Date('2026-11-26T14:00:00.000Z'),
			},
		];

		mockGroupFind.mockReturnValue({
			populate: jest.fn().mockReturnValue({
				lean: jest.fn().mockResolvedValue(groupsFromDb),
			}),
		});

		mockMessageCountDocuments
			.mockResolvedValueOnce(2) // g-older
			.mockResolvedValueOnce(5); // g-newer

		const req = { user: { id: 'user-1' } } as unknown as Request;
		const res = createMockRes();

		await getMyGroups(req, res);

		expect(res.status).toHaveBeenCalledWith(200);
		const returned = (res.json as jest.Mock).mock.calls[0][0];
		expect(returned).toHaveLength(2);
		// Sorted newest first
		expect(returned[0]._id).toBe('g-newer');
		expect(returned[0].unreadCount).toBe(5);
		expect(returned[0].lastMessage.text).toBe('Mensaje reciente');
		expect(returned[0].isDirect).toBe(false);
		// DM without groupImgUrl resolves contact's profileImgUrl
		expect(returned[1]._id).toBe('g-older');
		expect(returned[1].unreadCount).toBe(2);
		expect(returned[1].groupImgUrl).toBe('https://cdn.orbit/ana.png');
		expect(returned[1].isDirect).toBe(true);
	});

	it('getMyGroups should mark 2-member chats without communityId as isDirect: true even if groupImgUrl is already set', async () => {
		mockGroupMemberFind
			.mockResolvedValueOnce([{ groupId: 'g-dm-img', userId: 'user-1' }])
			.mockReturnValueOnce({
				populate: jest.fn().mockReturnValue({
					lean: jest.fn().mockResolvedValue([
						{ groupId: 'g-dm-img', userId: { _id: 'user-1', username: 'diego' } },
						{ groupId: 'g-dm-img', userId: { _id: 'user-2', username: 'ana' } },
					]),
				}),
			});

		mockGroupFind.mockReturnValue({
			populate: jest.fn().mockReturnValue({
				lean: jest.fn().mockResolvedValue([
					{
						_id: 'g-dm-img',
						topic: 'ana',
						groupImgUrl: 'https://cdn.orbit/default.png',
						lastMessage: { _id: 'm1', text: 'Hola', createdAt: new Date() },
					},
				]),
			}),
		});

		mockMessageCountDocuments.mockResolvedValueOnce(0);

		const req = { user: { id: 'user-1' } } as unknown as Request;
		const res = createMockRes();

		await getMyGroups(req, res);

		expect(res.status).toHaveBeenCalledWith(200);
		const returned = (res.json as jest.Mock).mock.calls[0][0];
		expect(returned[0].isDirect).toBe(true);
	});
});

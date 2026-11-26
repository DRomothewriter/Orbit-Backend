import { Request, Response } from 'express';

const mockGroupFindOne = jest.fn();
const mockGroupSave = jest.fn();
const mockGroupMemberFind = jest.fn();
const mockGroupMemberFindOne = jest.fn();
const mockGroupMemberSave = jest.fn();
const mockNotifyUser = jest.fn().mockResolvedValue(undefined);

const MockGroup: any = jest.fn().mockImplementation((data: any) => ({
	...data,
	_id: 'group-new-1',
	createdAt: new Date('2026-11-26T16:50:00.000Z'),
	updatedAt: new Date('2026-11-26T16:50:00.000Z'),
	save: mockGroupSave,
	toObject() {
		return {
			_id: this._id,
			topic: this.topic,
			communityId: this.communityId,
			groupImgUrl: this.groupImgUrl,
			createdAt: this.createdAt,
			updatedAt: this.updatedAt,
		};
	},
}));
MockGroup.findOne = mockGroupFindOne;

jest.mock('../src/app/groups/group.model', () => ({
	__esModule: true,
	default: MockGroup,
}));

const MockGroupMember: any = jest.fn().mockImplementation((data: any) => ({
	...data,
	save: mockGroupMemberSave,
}));
MockGroupMember.find = mockGroupMemberFind;
MockGroupMember.findOne = mockGroupMemberFindOne;

jest.mock('../src/app/groups/groupMember.model', () => ({
	__esModule: true,
	default: MockGroupMember,
}));

jest.mock('../src/app/messages/message.model', () => ({
	__esModule: true,
	default: {},
}));

jest.mock('../src/app/notifications/notification.service', () => ({
	notifyUser: mockNotifyUser,
}));

jest.mock('../src/app/middlewares/s3', () => ({
	deleteImageFromS3: jest.fn().mockResolvedValue(undefined),
	resolveUploadedFileUrl: jest.fn(),
}));

jest.mock('../src/socket', () => ({
	connectedSockets: [],
}));

import { createGroup } from '../src/app/groups/group.controller';
import { NotificationType } from '../src/app/notifications/notification.model';

const createMockRes = () => {
	const res: Partial<Response> = {};
	res.status = jest.fn().mockReturnValue(res);
	res.json = jest.fn().mockReturnValue(res);
	return res as Response;
};

describe('createGroup - duplicate DM notice & member notifications', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should return 409 CONFLICT with DUPLICATE_DIRECT_CHAT and existingGroup when DM already exists', async () => {
		mockGroupMemberFind
			.mockResolvedValueOnce([{ groupId: 'existing-dm-1', userId: 'user-1' }]) // currentUserMemberships
			.mockResolvedValueOnce([{ groupId: 'existing-dm-1', userId: 'user-2' }]) // friendMemberships
			.mockResolvedValueOnce([
				{ groupId: 'existing-dm-1', userId: 'user-1' },
				{ groupId: 'existing-dm-1', userId: 'user-2' },
			]); // members of candidate group

		mockGroupFindOne.mockResolvedValue({
			_id: 'existing-dm-1',
			topic: 'user-2',
			toObject: () => ({ _id: 'existing-dm-1', topic: 'user-2' }),
		});

		const req = {
			user: { id: 'user-1' },
			body: {
				initialMembersIds: ['user-2'],
				group: { topic: 'DM duplicado' },
			},
			app: { get: jest.fn().mockReturnValue(null) },
		} as unknown as Request;
		const res = createMockRes();

		await createGroup(req, res);

		expect(res.status).toHaveBeenCalledWith(409);
		expect(res.json).toHaveBeenCalledWith(
			expect.objectContaining({
				code: 'DUPLICATE_DIRECT_CHAT',
				error: expect.any(String),
				existingGroup: expect.objectContaining({
					_id: 'existing-dm-1',
					isDirect: true,
				}),
			})
		);
		expect(mockGroupSave).not.toHaveBeenCalled();
	});

	it('should notify all added members (excluding creator) with isDirect in payload', async () => {
		mockGroupSave.mockResolvedValue(true);
		mockGroupMemberFindOne.mockResolvedValue(null);
		mockGroupMemberSave.mockResolvedValue(true);

		const ioMock = { sockets: { sockets: new Map() } };
		const req = {
			user: { id: 'user-1' },
			body: {
				initialMembersIds: ['user-1', 'user-2', 'user-3'],
				group: { topic: 'Equipo Orbit' },
			},
			app: { get: jest.fn().mockReturnValue(ioMock) },
		} as unknown as Request;
		const res = createMockRes();

		await createGroup(req, res);
		// Flush microtasks for Promise.all notification dispatch
		await new Promise((r) => setTimeout(r, 0));

		expect(res.status).toHaveBeenCalledWith(201);
		expect(mockNotifyUser).toHaveBeenCalledTimes(2);
		expect(mockNotifyUser).toHaveBeenCalledWith(
			'user-2',
			NotificationType.ADDED_TO_GROUP,
			expect.objectContaining({
				_id: 'group-new-1',
				topic: 'Equipo Orbit',
				isDirect: false,
			}),
			ioMock
		);
		expect(mockNotifyUser).toHaveBeenCalledWith(
			'user-3',
			NotificationType.ADDED_TO_GROUP,
			expect.objectContaining({
				_id: 'group-new-1',
				topic: 'Equipo Orbit',
				isDirect: false,
			}),
			ioMock
		);
	});
});

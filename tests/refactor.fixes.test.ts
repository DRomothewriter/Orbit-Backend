import fs from 'fs';
import path from 'path';

// Mock mongoose first
jest.mock('mongoose', () => ({
  model: jest.fn(),
  Schema: Object.assign(jest.fn().mockImplementation(() => ({})), {
    Types: {
      ObjectId: 'ObjectId',
      String: 'String',
      Boolean: 'Boolean',
      Number: 'Number',
      Date: 'Date',
      Mixed: 'Mixed',
    },
  }),
  SchemaTypes: {
    ObjectId: 'ObjectId',
    String: 'String',
    Boolean: 'Boolean',
    Number: 'Number',
    Date: 'Date',
    Mixed: 'Mixed',
  },
}));

const mockUserFindOne = jest.fn();
const mockUserFind = jest.fn();
const mockUserFindById = jest.fn();
const mockUserFindByIdAndUpdate = jest.fn();
const mockUserFindByIdAndDelete = jest.fn();

jest.mock('../src/app/users/user.model', () => ({
  __esModule: true,
  default: {
    findOne: mockUserFindOne,
    find: mockUserFind,
    findById: mockUserFindById,
    findByIdAndUpdate: mockUserFindByIdAndUpdate,
    findByIdAndDelete: mockUserFindByIdAndDelete,
  },
}));

const mockFriendshipFindOne = jest.fn();
const mockFriendshipFindOneAndUpdate = jest.fn();
const mockFriendshipFindByIdAndUpdate = jest.fn();
const mockFriendshipFindByIdAndDelete = jest.fn();

jest.mock('../src/app/users/friendship.model', () => ({
  __esModule: true,
  default: {
    findOne: mockFriendshipFindOne,
    findOneAndUpdate: mockFriendshipFindOneAndUpdate,
    findByIdAndUpdate: mockFriendshipFindByIdAndUpdate,
    findByIdAndDelete: mockFriendshipFindByIdAndDelete,
  },
}));

const mockNotificationFind = jest.fn();
const mockNotificationUpdateMany = jest.fn();
const mockNotificationFindOneAndDelete = jest.fn();
const mockNotificationFindByIdAndDelete = jest.fn();

jest.mock('../src/app/notifications/notification.model', () => ({
  __esModule: true,
  NotificationType: {
    MESSAGE: 'message',
    FRIEND_REQUEST: 'friend_request',
    FRIEND_REQUEST_ACCEPTED: 'friend_request_accepted',
    ADDED_TO_GROUP: 'added_to_group',
    ADDED_TO_COMMUNITY: 'added_to_community',
    DELETED_FROM_GROUP: 'deleted_from_group',
    DELETED_FROM_COMMUNITY: 'deleted_from_community',
  },
  default: {
    find: mockNotificationFind,
    updateMany: mockNotificationUpdateMany,
    findOneAndDelete: mockNotificationFindOneAndDelete,
    findByIdAndDelete: mockNotificationFindByIdAndDelete,
  },
}));

jest.mock('../src/app/notifications/notification.service', () => ({
  notifyUser: jest.fn().mockResolvedValue(undefined),
}));

const mockGroupMemberFindOneAndDelete = jest.fn();
const mockGroupMemberFindOne = jest.fn();
const mockGroupMemberSave = jest.fn();

jest.mock('../src/app/groups/groupMember.model', () => {
  const ctor: any = jest.fn().mockImplementation((data: any) => ({
    ...data,
    save: mockGroupMemberSave,
  }));
  ctor.findOneAndDelete = mockGroupMemberFindOneAndDelete;
  ctor.findOne = mockGroupMemberFindOne;
  return {
    __esModule: true,
    default: ctor,
  };
});

jest.mock('../src/app/groups/group.model', () => ({
  __esModule: true,
  default: {
    findById: jest.fn().mockResolvedValue({ _id: 'group-123', topic: 'Test' }),
  },
}));

jest.mock('../src/app/messages/message.model', () => ({
  __esModule: true,
  default: {},
}));

const mockCommunityFindById = jest.fn();
jest.mock('../src/app/communities/community.model', () => ({
  __esModule: true,
  default: {
    findById: mockCommunityFindById,
  },
}));

const mockCommunityMemberSave = jest.fn();
const mockCommunityMemberFindOneAndDelete = jest.fn();
const mockCommunityMemberFindByIdAndDelete = jest.fn();
const mockCommunityMemberFindOne = jest.fn();

jest.mock('../src/app/communities/communityMember.model', () => {
  const ctor: any = jest.fn().mockImplementation((data: any) => ({
    ...data,
    save: mockCommunityMemberSave,
  }));
  ctor.findOneAndDelete = mockCommunityMemberFindOneAndDelete;
  ctor.findByIdAndDelete = mockCommunityMemberFindByIdAndDelete;
  ctor.findOne = mockCommunityMemberFindOne;
  return {
    __esModule: true,
    default: ctor,
  };
});

jest.mock('../src/app/middlewares/s3', () => ({
  deleteImageFromS3: jest.fn().mockResolvedValue(undefined),
  uploadS3: { single: jest.fn(() => (_req: any, _res: any, next: any) => next()) },
}));

jest.mock('bcrypt', () => ({
  compare: jest.fn().mockImplementation((plain: string, hash: string) => {
    if (!hash) return Promise.reject(new Error('data and hash arguments required'));
    return Promise.resolve(true);
  }),
  hash: jest.fn().mockResolvedValue('$2b$10$hashed'),
}));

import { authMiddleware } from '../src/app/middlewares/auth';
import { login } from '../src/app/auth/auth.controller';
import {
  getUnseen,
  getAllMyNotifications,
  updateToSeen,
} from '../src/app/notifications/notification.controller';
import { leaveGroup, addMembers } from '../src/app/groups/group.controller';
import {
  getCommunityById,
  addCommunityMembers,
  deleteCommunityMember,
} from '../src/app/communities/community.controller';
import {
  sendFriendRequest,
  muteFriend,
  searchUsers,
} from '../src/app/users/user.controller';

describe('Refactor Audit Fixes (TDD)', () => {
  let mockReq: any;
  let mockRes: any;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = {
      headers: {},
      params: {},
      query: {},
      body: {},
      user: { id: 'user-1', email: 'u1@test.com' },
      app: { get: jest.fn() },
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('Auth & Middleware Fixes', () => {
    it('AUTH-05: authMiddleware should return 401 JSON when Bearer token is missing', () => {
      mockReq.headers.authorization = 'Bearer ';
      authMiddleware(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('AUTH-04: login should return 401 (not 500) when Google user has no password', async () => {
      mockReq.body = { email: 'google@test.com', password: 'SomePassword123' };
      const googleUser = { _id: 'u-google', email: 'google@test.com', isVerified: true };
      mockUserFindOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(googleUser),
      });
      // Fallback if select is not called yet:
      mockUserFindOne.mockResolvedValueOnce(googleUser);

      await login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('Notifications Fixes', () => {
    it('NOTIF-01: getUnseen should return empty array [] instead of message object when 0 unseen', async () => {
      mockNotificationFind.mockResolvedValue([]);
      await getUnseen(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith([]);
    });

    it('NOTIF-03: getAllMyNotifications should respond 200 with notifications when non-empty', async () => {
      const items = [{ _id: 'n1', seen: false }];
      mockNotificationFind.mockResolvedValue(items);
      await getAllMyNotifications(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(items);
    });

    it('NOTIF-02: updateToSeen should accept notificationsIds (plural) and scope by receiverId', async () => {
      mockReq.body = { notificationsIds: ['n1', 'n2'] };
      mockNotificationUpdateMany.mockResolvedValue({ modifiedCount: 2 });
      await updateToSeen(mockReq, mockRes);
      expect(mockNotificationUpdateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: { $in: ['n1', 'n2'] },
          receiverId: 'user-1',
        }),
        { $set: { seen: true } }
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Groups & Communities Fixes', () => {
    it('GRP-01: leaveGroup should extract req.params.groupId string', async () => {
      mockReq.params = { groupId: 'group-123' };
      mockGroupMemberFindOneAndDelete.mockResolvedValue({ _id: 'gm-1' });
      await leaveGroup(mockReq, mockRes);
      expect(mockGroupMemberFindOneAndDelete).toHaveBeenCalledWith({
        groupId: 'group-123',
        userId: 'user-1',
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('GRP-02: addMembers should await saves and return created members', async () => {
      mockReq.body = { groupId: 'group-123', userIds: ['u2', 'u3'] };
      mockGroupMemberFindOne.mockResolvedValue(null);
      mockGroupMemberSave.mockResolvedValue(true);
      await addMembers(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      const returned = mockRes.json.mock.calls[0][0];
      expect(Array.isArray(returned)).toBe(true);
      expect(returned.length).toBe(2);
    });

    it('GRP-05a: getCommunityById should read req.params.communityId (lowercase)', async () => {
      mockReq.params = { communityId: 'comm-1' };
      mockCommunityFindById.mockResolvedValue({ _id: 'comm-1', communityName: 'Test' });
      await getCommunityById(mockReq, mockRes);
      expect(mockCommunityFindById).toHaveBeenCalledWith('comm-1');
    });

    it('GRP-05b: addCommunityMembers should set role: "member"', async () => {
      mockReq.body = { communityId: 'comm-1', userIds: ['u2'] };
      mockCommunityMemberFindOne.mockResolvedValue(null);
      mockCommunityMemberSave.mockResolvedValue(true);
      await addCommunityMembers(mockReq, mockRes);
      const CommunityMemberMock = require('../src/app/communities/communityMember.model').default;
      expect(CommunityMemberMock).toHaveBeenCalledWith(
        expect.objectContaining({ communityId: 'comm-1', userId: 'u2', role: 'member' })
      );
    });

    it('GRP-05c: deleteCommunityMember should delete using communityId and userId from req.params', async () => {
      mockReq.params = { communityId: 'comm-1', userId: 'u2' };
      mockCommunityMemberFindOneAndDelete.mockResolvedValue({ _id: 'cm-1' });
      await deleteCommunityMember(mockReq, mockRes);
      expect(mockCommunityMemberFindOneAndDelete).toHaveBeenCalledWith({
        communityId: 'comm-1',
        userId: 'u2',
      });
    });
  });

  describe('Friends & Search Security Fixes', () => {
    it('FRD-03: sendFriendRequest should reject self-friend request with 400', async () => {
      mockReq.body = { friendId: 'user-1' };
      await sendFriendRequest(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('FRD-03b: muteFriend should set status to "muted" (matching schema enum)', async () => {
      mockReq.body = { friendId: 'u2' };
      mockFriendshipFindOneAndUpdate.mockResolvedValue({ status: 'muted' });
      await muteFriend(mockReq, mockRes);
      expect(mockFriendshipFindOneAndUpdate).toHaveBeenCalledWith(
        { friendId: 'u2', userId: 'user-1' },
        { status: 'muted' },
        { new: true }
      );
    });

    it('FRD-02: searchUsers should escape regex special characters', async () => {
      mockReq.query = { username: 'a[b(c' };
      mockUserFind.mockReturnValue({
        select: jest.fn().mockResolvedValue([]),
      });
      await searchUsers(mockReq, mockRes);
      expect(mockUserFind).toHaveBeenCalledWith({
        username: { $regex: 'a\\[b\\(c', $options: 'i' },
        _id: { $ne: 'user-1' },
      });
    });
  });

  describe('Routes & S3 Configuration Fixes', () => {
    it('MSG-01: message.routes.ts should run uploadS3 before isGroupMember on /image', () => {
      const content = fs.readFileSync(
        path.join(__dirname, '../src/app/messages/message.routes.ts'),
        'utf8'
      );
      const imageRouteLine = content
        .split('\n')
        .find((l) => l.includes("router.post('/image'"));
      expect(imageRouteLine).toBeDefined();
      const uploadIdx = imageRouteLine!.indexOf("uploadS3.single('image')");
      const memberIdx = imageRouteLine!.indexOf('isGroupMember');
      expect(uploadIdx).toBeGreaterThan(-1);
      expect(memberIdx).toBeGreaterThan(-1);
      expect(uploadIdx).toBeLessThan(memberIdx);
    });

    it('INFRA-01: s3.ts should use S3_MEDIA_BUCKET_NAME and must not set acl public-read', () => {
      const content = fs.readFileSync(
        path.join(__dirname, '../src/app/middlewares/s3.ts'),
        'utf8'
      );
      expect(content).toContain('S3_MEDIA_BUCKET_NAME');
      expect(content).not.toContain("acl: 'public-read'");
    });

    it('IMG-DEV: s3.ts should support local diskStorage fallback when S3 credentials are placeholders/missing in dev', () => {
      const content = fs.readFileSync(
        path.join(__dirname, '../src/app/middlewares/s3.ts'),
        'utf8'
      );
      expect(content).toContain('diskStorage');
      expect(content).toContain('isS3Configured');
    });
  });
});

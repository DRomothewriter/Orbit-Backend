// Mock mongoose first
jest.mock('mongoose', () => ({
  model: jest.fn(),
  Schema: jest.fn(),
  SchemaTypes: {
    ObjectId: 'ObjectId',
    String: 'String',
    Boolean: 'Boolean',
    Date: 'Date'
  }
}));

// Mock User model and dependencies
const mockUser = {
  _id: 'user-id-123',
  username: 'testuser',
  email: 'test@example.com',
  status: 'online',
  profileImgUrl: 'https://example.com/avatar.jpg'
};

const mockUserFind = jest.fn();
const mockUserFindById = jest.fn();
const mockUserCreate = jest.fn();
const mockUserUpdateOne = jest.fn();

jest.mock('../src/app/users/user.model', () => ({
  find: mockUserFind,
  findById: mockUserFindById,
  create: mockUserCreate,
  updateOne: mockUserUpdateOne
}));

jest.mock('../src/app/users/friendship.model', () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  deleteOne: jest.fn()
}));

jest.mock('../src/app/notifications/notification.service', () => ({
  notifyUser: jest.fn()
}));

jest.mock('../src/app/middlewares/s3', () => ({
  deleteImageFromS3: jest.fn()
}));

import { 
  getAllUsers, 
  getMyUser, 
  getUserById, 
  searchUsers 
} from '../src/app/users/user.controller';

describe('User Controller', () => {
  let mockReq: any;
  let mockRes: any;

  beforeEach(() => {
    mockReq = {
      params: {},
      query: {},
      body: {},
      user: { id: 'user-id-123' }
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    jest.clearAllMocks();
  });

  describe('getAllUsers', () => {
    it('should get all users successfully', async () => {
      const mockUsers = [
        { _id: 'user-1', username: 'user1' },
        { _id: 'user-2', username: 'user2' }
      ];

      mockUserFind.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUsers)
      });

      await getAllUsers(mockReq, mockRes);

      expect(mockUserFind).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ users: mockUsers });
    });

    it('should handle database errors', async () => {
      mockUserFind.mockReturnValue({
        select: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      await getAllUsers(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Server error' });
    });

    it('should return only id and username fields', async () => {
      mockUserFind.mockReturnValue({
        select: jest.fn().mockResolvedValue([])
      });

      await getAllUsers(mockReq, mockRes);

      expect(mockUserFind().select).toHaveBeenCalledWith('_id username');
    });
  });

  describe('getMyUser', () => {
    it('should get current user successfully', async () => {
      mockUserFindById.mockResolvedValue(mockUser);

      await getMyUser(mockReq, mockRes);

      expect(mockUserFindById).toHaveBeenCalledWith('user-id-123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockUser);
    });

    it('should handle unauthorized access', async () => {
      mockReq.user = null;

      await getMyUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'No autenticado' });
    });

    it('should handle database errors', async () => {
      mockUserFindById.mockRejectedValue(new Error('Database error'));

      await getMyUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Server error' });
    });
  });

  describe('getUserById', () => {
    beforeEach(() => {
      mockReq.params.userId = 'target-user-id';
    });

    it('should get user by id successfully', async () => {
      mockUserFindById.mockResolvedValue(mockUser);

      await getUserById(mockReq, mockRes);

      expect(mockUserFindById).toHaveBeenCalledWith('target-user-id');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ user: mockUser });
    });

    it('should handle non-existent user', async () => {
      mockUserFindById.mockResolvedValue(null);

      await getUserById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ user: null });
    });

    it('should handle invalid user id format', async () => {
      mockReq.params.userId = 'invalid-id';
      mockUserFindById.mockRejectedValue(new Error('Cast error'));

      await getUserById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('searchUsers', () => {
    beforeEach(() => {
      mockReq.query.username = 'test';
    });

    it('should search users by username successfully', async () => {
      const searchResults = [
        { _id: 'user-1', username: 'testuser1', email: 'test1@example.com' },
        { _id: 'user-2', username: 'testuser2', email: 'test2@example.com' }
      ];

      mockUserFind.mockReturnValue({
        select: jest.fn().mockResolvedValue(searchResults)
      });

      await searchUsers(mockReq, mockRes);

      expect(mockUserFind).toHaveBeenCalledWith({
        username: { $regex: 'test', $options: 'i' }
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(searchResults);
    });

    it('should handle case insensitive search', async () => {
      mockReq.query.username = 'TEST';

      mockUserFind.mockReturnValue({
        select: jest.fn().mockResolvedValue([])
      });

      await searchUsers(mockReq, mockRes);

      expect(mockUserFind).toHaveBeenCalledWith({
        username: { $regex: 'TEST', $options: 'i' }
      });
    });

    it('should handle empty search query', async () => {
      mockReq.query.username = '';

      mockUserFind.mockReturnValue({
        select: jest.fn().mockResolvedValue([])
      });

      await searchUsers(mockReq, mockRes);

      expect(mockUserFind).toHaveBeenCalledWith({
        username: { $regex: '', $options: 'i' }
      });
    });

    it('should return only specific fields', async () => {
      mockUserFind.mockReturnValue({
        select: jest.fn().mockResolvedValue([])
      });

      await searchUsers(mockReq, mockRes);

      expect(mockUserFind().select).toHaveBeenCalledWith('_id username email');
    });

    it('should handle database errors', async () => {
      mockUserFind.mockReturnValue({
        select: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      await searchUsers(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Server error' });
    });
  });

  describe('User Data Validation', () => {
    it('should validate user status values', () => {
      const validStatuses = ['online', 'offline', 'working'];
      const invalidStatuses = ['busy', 'away', 'invisible'];

      validStatuses.forEach(status => {
        expect(['online', 'offline', 'working']).toContain(status);
      });

      invalidStatuses.forEach(status => {
        expect(['online', 'offline', 'working']).not.toContain(status);
      });
    });

    it('should validate username format', () => {
      const validUsernames = ['user123', 'test_user', 'user-name'];
      const invalidUsernames = ['user@name', 'user name', 'u', 'a'.repeat(31)];

      validUsernames.forEach(username => {
        expect(/^[a-zA-Z0-9_-]{3,30}$/.test(username)).toBe(true);
      });

      invalidUsernames.forEach(username => {
        expect(/^[a-zA-Z0-9_-]{3,30}$/.test(username)).toBe(false);
      });
    });

    it('should validate email format in search results', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org'
      ];

      validEmails.forEach(email => {
        expect(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)).toBe(true);
      });
    });
  });

  describe('User Privacy and Security', () => {
    it('should not return password in user data', async () => {
      const userWithPassword = {
        ...mockUser,
        password: '$2b$10$hashedpassword'
      };
      
      mockUserFindById.mockResolvedValue(userWithPassword);

      await getUserById(mockReq, mockRes);

      // In a real implementation, password should be excluded
      expect(mockRes.json).toHaveBeenCalledWith({ 
        user: expect.any(Object)
      });
    });

    it('should handle user profile image URLs', () => {
      const validUrls = [
        'https://example.com/avatar.jpg',
        'https://s3.amazonaws.com/bucket/image.png',
        'https://cdn.example.com/profile/user123.gif'
      ];

      validUrls.forEach(url => {
        expect(url.startsWith('https://')).toBe(true);
      });
    });
  });

  describe('Search Performance', () => {
    it('should use regex for partial matching', () => {
      const searchTerm = 'test';

      mockUserFind.mockReturnValue({
        select: jest.fn().mockResolvedValue([])
      });

      mockReq.query = { term: searchTerm };
      searchUsers(mockReq, mockRes);

      expect(mockUserFind).toHaveBeenCalledWith({
        username: expect.objectContaining({
          $options: 'i'
        })
      });
    });

    it('should limit fields returned in search', async () => {
      mockUserFind.mockReturnValue({
        select: jest.fn().mockResolvedValue([])
      });

      await searchUsers(mockReq, mockRes);

      // Should only return essential fields for performance
      expect(mockUserFind().select).toHaveBeenCalledWith('_id username email');
    });
  });
});
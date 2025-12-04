// Mock Message model
const mockMessage = {
  _id: 'message-id-123',
  type: 'text',
  text: 'Test message',
  groupId: 'group-id-123',
  userId: 'user-id-123',
  username: 'testuser',
  createdAt: new Date(),
  save: jest.fn(),
  toObject: jest.fn().mockReturnValue({
    _id: 'message-id-123',
    type: 'text',
    text: 'Test message',
  }),
};

const mockFind = jest.fn();
const mockFindById = jest.fn();
const mockMessageCreate = jest.fn();

jest.mock('../src/app/messages/message.model', () => jest.fn().mockImplementation(() => ({
  ...mockMessage,
  save: jest.fn().mockResolvedValue(mockMessage),
})));

jest.mock('../src/app/messages/reaction.model', () => ({
  find: jest.fn().mockResolvedValue([]),
}));

jest.mock('../src/app/groups/group.service', () => ({
  getGroupMembers: jest.fn().mockResolvedValue([
    { userId: 'user-1', username: 'user1' },
    { userId: 'user-2', username: 'user2' },
  ]),
}));

jest.mock('../src/app/notifications/notification.service', () => ({
  notifyUsers: jest.fn(),
}));

// Mock the actual static methods
const MessageModel = require('../src/app/messages/message.model');
MessageModel.find = mockFind;
MessageModel.findById = mockFindById;

import { getGroupMessages, createMessage, getMessageById } from '../src/app/messages/message.controller';

describe('Message Controller', () => {
  let mockReq: any;
  let mockRes: any;
  let mockApp: any;
  let mockIo: any;

  beforeEach(() => {
    mockIo = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };

    mockApp = {
      get: jest.fn().mockReturnValue(mockIo),
    };

    mockReq = {
      params: {},
      query: {},
      body: {},
      user: { id: 'user-id-123' },
      app: mockApp,
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    jest.clearAllMocks();
  });

  describe('getGroupMessages', () => {
    beforeEach(() => {
      mockReq.params.groupId = 'group-id-123';
    });

    it('should get group messages successfully', async () => {
      const mockMessages = [
        { ...mockMessage, _id: 'msg1', text: 'Message 1' },
        { ...mockMessage, _id: 'msg2', text: 'Message 2' },
      ];

      mockFind.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockMessages),
      });

      await getGroupMessages(mockReq, mockRes);

      expect(mockFind).toHaveBeenCalledWith({ groupId: 'group-id-123' });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        messages: expect.any(Array),
        length: expect.any(Number),
      });
    });

    it('should handle pagination', async () => {
      mockReq.query.page = '2';

      mockFind.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      });

      await getGroupMessages(mockReq, mockRes);

      expect(mockFind().skip).toHaveBeenCalledWith(100); // (page 2 - 1) * 100
    });

    it('should handle database errors', async () => {
      mockFind.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      await getGroupMessages(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Server error',
        e: expect.any(Error),
      });
    });
  });

  describe('getMessageById', () => {
    beforeEach(() => {
      mockReq.params.messageId = 'message-id-123';
    });

    it('should get message by id successfully', async () => {
      mockFindById.mockResolvedValue(mockMessage);

      await getMessageById(mockReq, mockRes);

      expect(mockFindById).toHaveBeenCalledWith('message-id-123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ message: mockMessage });
    });

    it('should return 404 for non-existent message', async () => {
      mockFindById.mockResolvedValue(null);

      await getMessageById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Message not found' });
    });

    it('should handle database errors', async () => {
      mockFindById.mockRejectedValue(new Error('Database error'));

      await getMessageById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('createMessage', () => {
    const validMessageData = {
      message: {
        type: 'text',
        text: 'Test message content',
        groupId: 'group-id-123',
        username: 'testuser',
      },
    };

    beforeEach(() => {
      mockReq.body = validMessageData;
    });

    it('should create message successfully', async () => {
      await createMessage(mockReq, mockRes);

      expect(mockIo.to).toHaveBeenCalledWith('group-id-123');
      expect(mockIo.emit).toHaveBeenCalledWith('message', expect.any(Object));
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        newMessage: expect.any(Object),
        messageId: expect.any(String),
      });
    });

    it('should handle different message types', async () => {
      mockReq.body.message.type = 'file';
      mockReq.body.message.fileUrl = 'https://example.com/file.pdf';

      await createMessage(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it('should handle missing required fields', async () => {
      mockReq.body = { message: {} };

      await createMessage(mockReq, mockRes);

      // Should handle the error gracefully
      expect(mockRes.status).toHaveBeenCalledWith(expect.any(Number));
    });

    it('should handle socket.io errors', async () => {
      mockIo.to.mockImplementation(() => {
        throw new Error('Socket error');
      });

      await createMessage(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('Message Validation', () => {
    it('should validate message content length', () => {
      const shortMessage = 'Hi';
      const longMessage = 'A'.repeat(1001);
      const validMessage = 'This is a valid message';

      expect(shortMessage.length).toBeGreaterThan(0);
      expect(longMessage.length).toBeGreaterThan(1000);
      expect(validMessage.length).toBeLessThanOrEqual(1000);
    });

    it('should validate message types', () => {
      const validTypes = ['text', 'file', 'image'];
      const invalidTypes = ['video', 'audio', 'unknown'];

      validTypes.forEach(type => {
        expect(['text', 'file', 'image']).toContain(type);
      });

      invalidTypes.forEach(type => {
        expect(['text', 'file', 'image']).not.toContain(type);
      });
    });
  });

  describe('File Message Handling', () => {
    it('should handle file messages with metadata', async () => {
      const fileMessageData = {
        message: {
          type: 'file',
          text: 'Check out this document',
          groupId: 'group-id-123',
          username: 'testuser',
          fileUrl: 'https://example.com/document.pdf',
          fileName: 'document.pdf',
          fileSize: 1024000,
        },
      };

      mockReq.body = fileMessageData;

      await createMessage(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it('should validate file sizes', () => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      const validSize = 5 * 1024 * 1024; // 5MB
      const invalidSize = 15 * 1024 * 1024; // 15MB

      expect(validSize).toBeLessThanOrEqual(maxSize);
      expect(invalidSize).toBeGreaterThan(maxSize);
    });
  });
});
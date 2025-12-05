describe('Authentication Validation', () => {
  describe('Email Validation', () => {
    const isValidEmail = (email: string): boolean => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      return emailRegex.test(email) && !email.includes('..') && email.length > 0;
    };

    it('should validate correct email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'user123@test-domain.com',
        'a@b.co'
      ];

      validEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(true);
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user..name@domain.com',
        'user@domain..com',
        ''
      ];

      invalidEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(false);
      });
    });
  });

  describe('Password Validation', () => {
    const isValidPassword = (password: string): boolean => {
      // Minimum 8 characters, at least one uppercase, one lowercase, one number
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
      return passwordRegex.test(password);
    };

    it('should validate strong passwords', () => {
      const validPasswords = [
        'Password123',
        'MySecret123',
        'Test@123',
        'StrongPass1'
      ];

      validPasswords.forEach(password => {
        expect(isValidPassword(password)).toBe(true);
      });
    });

    it('should reject weak passwords', () => {
      const invalidPasswords = [
        'password', // no uppercase, no number
        'PASSWORD123', // no lowercase
        'Password', // no number
        'Pass1', // too short
        '12345678' // no letters
      ];

      invalidPasswords.forEach(password => {
        expect(isValidPassword(password)).toBe(false);
      });
    });
  });

  describe('Username Validation', () => {
    const isValidUsername = (username: string): boolean => {
      // 3-30 characters, alphanumeric, underscores, hyphens
      const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
      return usernameRegex.test(username);
    };

    it('should validate correct usernames', () => {
      const validUsernames = [
        'user123',
        'test_user',
        'user-name',
        'John_Doe',
        'username123'
      ];

      validUsernames.forEach(username => {
        expect(isValidUsername(username)).toBe(true);
      });
    });

    it('should reject invalid usernames', () => {
      const invalidUsernames = [
        'ab', // too short
        'a'.repeat(31), // too long
        'user@name', // invalid character
        'user name', // space
        'user.name', // dot
        ''
      ];

      invalidUsernames.forEach(username => {
        expect(isValidUsername(username)).toBe(false);
      });
    });
  });
});

describe('Message Validation', () => {
  describe('Content Validation', () => {
    const isValidMessageContent = (content: string): boolean => {
      return content.trim().length > 0 && content.length <= 1000;
    };

    it('should accept valid message content', () => {
      const validContent = [
        'Hello world!',
        'This is a test message.',
        'A'.repeat(999), // Max length - 1
        '   Hello   ' // With whitespace
      ];

      validContent.forEach(content => {
        expect(isValidMessageContent(content)).toBe(true);
      });
    });

    it('should reject invalid message content', () => {
      const invalidContent = [
        '', // Empty
        '   ', // Only whitespace
        'A'.repeat(1001) // Too long
      ];

      invalidContent.forEach(content => {
        expect(isValidMessageContent(content)).toBe(false);
      });
    });
  });

  describe('Message Type Validation', () => {
    const validMessageTypes = ['text', 'file', 'image'];

    const isValidMessageType = (type: string): boolean => {
      return validMessageTypes.includes(type);
    };

    it('should accept valid message types', () => {
      validMessageTypes.forEach(type => {
        expect(isValidMessageType(type)).toBe(true);
      });
    });

    it('should reject invalid message types', () => {
      const invalidTypes = [
        'video',
        'audio',
        'invalid',
        '',
        'TEXT', // Case sensitive
        'File'
      ];

      invalidTypes.forEach(type => {
        expect(isValidMessageType(type)).toBe(false);
      });
    });
  });

  describe('File Size Validation', () => {
    const maxFileSize = 10 * 1024 * 1024; // 10MB

    const isValidFileSize = (size: number): boolean => {
      return size > 0 && size <= maxFileSize;
    };

    it('should accept valid file sizes', () => {
      const validSizes = [
        1024, // 1KB
        1024 * 1024, // 1MB
        5 * 1024 * 1024, // 5MB
        maxFileSize // Exactly max size
      ];

      validSizes.forEach(size => {
        expect(isValidFileSize(size)).toBe(true);
      });
    });

    it('should reject invalid file sizes', () => {
      const invalidSizes = [
        0,
        -1024,
        maxFileSize + 1, // Over limit
        50 * 1024 * 1024 // Way over limit
      ];

      invalidSizes.forEach(size => {
        expect(isValidFileSize(size)).toBe(false);
      });
    });
  });
});

describe('Utility Functions', () => {
  describe('ObjectId Validation', () => {
    const isValidObjectId = (id: string): boolean => {
      const objectIdRegex = /^[0-9a-fA-F]{24}$/;
      return objectIdRegex.test(id);
    };

    it('should validate correct ObjectId format', () => {
      const validIds = [
        '507f1f77bcf86cd799439011',
        '123456789012345678901234',
        'abcdef123456789012345678'
      ];

      validIds.forEach(id => {
        expect(isValidObjectId(id)).toBe(true);
      });
    });

    it('should reject invalid ObjectId format', () => {
      const invalidIds = [
        '507f1f77bcf86cd79943901', // Too short
        '507f1f77bcf86cd7994390111', // Too long
        'invalid-object-id',
        '507f1f77bcf86cd79943901g', // Invalid character
        ''
      ];

      invalidIds.forEach(id => {
        expect(isValidObjectId(id)).toBe(false);
      });
    });
  });

  describe('Date Utilities', () => {
    const isRecentDate = (date: Date, minutesAgo: number = 5): boolean => {
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      return diff <= minutesAgo * 60 * 1000;
    };

    it('should identify recent dates', () => {
      const now = new Date();
      const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);
      const fourMinutesAgo = new Date(now.getTime() - 4 * 60 * 1000);

      expect(isRecentDate(now)).toBe(true);
      expect(isRecentDate(twoMinutesAgo)).toBe(true);
      expect(isRecentDate(fourMinutesAgo)).toBe(true);
    });

    it('should identify old dates', () => {
      const now = new Date();
      const sixMinutesAgo = new Date(now.getTime() - 6 * 60 * 1000);
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      expect(isRecentDate(sixMinutesAgo)).toBe(false);
      expect(isRecentDate(oneHourAgo)).toBe(false);
    });
  });

  describe('String Utilities', () => {
    const sanitizeInput = (input: string): string => {
      return input.trim().replace(/[<>]/g, '');
    };

    it('should sanitize input strings', () => {
      const testCases = [
        { input: '  hello world  ', expected: 'hello world' },
        { input: '<script>alert("xss")</script>', expected: 'scriptalert("xss")/script' },
        { input: 'Normal text', expected: 'Normal text' },
        { input: '   <div>content</div>   ', expected: 'divcontent/div' }
      ];

      testCases.forEach(({ input, expected }) => {
        expect(sanitizeInput(input)).toBe(expected);
      });
    });
  });
});
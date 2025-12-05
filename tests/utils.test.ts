// Mock external libraries
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
  decode: jest.fn()
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn()
}));

import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';

const mockedJwt = jwt as jest.Mocked<typeof jwt>;
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('Utility Functions Tests', () => {
  describe('JWT Token Utilities', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    describe('generateToken', () => {
      it('should generate a valid JWT token', () => {
        const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock.token';
        mockedJwt.sign.mockReturnValue(mockToken);

        const payload = { userId: 'user-123', email: 'test@example.com' };
        const secret = 'jwt-secret';
        const options = { expiresIn: '7d' };

        const generateToken = (payload: any, secret: string, options?: any) => {
          return jwt.sign(payload, secret, options);
        };

        const token = generateToken(payload, secret, options);

        expect(mockedJwt.sign).toHaveBeenCalledWith(payload, secret, options);
        expect(token).toBe(mockToken);
      });

      it('should handle token generation errors', () => {
        mockedJwt.sign.mockImplementation(() => {
          throw new Error('Token generation failed');
        });

        const generateTokenSafe = (payload: any, secret: string) => {
          try {
            return jwt.sign(payload, secret);
          } catch (error) {
            return null;
          }
        };

        const result = generateTokenSafe({ userId: 'user-123' }, 'secret');
        expect(result).toBeNull();
      });
    });

    describe('verifyToken', () => {
      it('should verify a valid token', () => {
        const mockDecoded = { userId: 'user-123', email: 'test@example.com', iat: 1640995200, exp: 1641600000 };
        mockedJwt.verify.mockReturnValue(mockDecoded);

        const verifyToken = (token: string, secret: string) => {
          return jwt.verify(token, secret);
        };

        const token = 'valid.jwt.token';
        const secret = 'jwt-secret';
        const decoded = verifyToken(token, secret);

        expect(mockedJwt.verify).toHaveBeenCalledWith(token, secret);
        expect(decoded).toEqual(mockDecoded);
      });

      it('should handle invalid tokens', () => {
        mockedJwt.verify.mockImplementation(() => {
          throw new Error('Invalid token');
        });

        const verifyTokenSafe = (token: string, secret: string) => {
          try {
            return jwt.verify(token, secret);
          } catch (error) {
            return null;
          }
        };

        const result = verifyTokenSafe('invalid.token', 'secret');
        expect(result).toBeNull();
      });

      it('should handle expired tokens', () => {
        const expiredError = new Error('Token expired');
        expiredError.name = 'TokenExpiredError';
        mockedJwt.verify.mockImplementation(() => {
          throw expiredError;
        });

        const verifyTokenWithExpiry = (token: string, secret: string) => {
          try {
            return { valid: true, decoded: jwt.verify(token, secret) };
          } catch (error: any) {
            if (error.name === 'TokenExpiredError') {
              return { valid: false, reason: 'expired' };
            }
            return { valid: false, reason: 'invalid' };
          }
        };

        const result = verifyTokenWithExpiry('expired.token', 'secret');
        expect(result.valid).toBe(false);
        expect(result.reason).toBe('expired');
      });
    });

    describe('decodeToken', () => {
      it('should decode token without verification', () => {
        const mockDecoded = { userId: 'user-123', email: 'test@example.com' };
        mockedJwt.decode.mockReturnValue(mockDecoded);

        const decodeToken = (token: string) => {
          return jwt.decode(token);
        };

        const token = 'jwt.token.here';
        const decoded = decodeToken(token);

        expect(mockedJwt.decode).toHaveBeenCalledWith(token);
        expect(decoded).toEqual(mockDecoded);
      });

      it('should handle malformed tokens', () => {
        mockedJwt.decode.mockReturnValue(null);

        const decodeTokenSafe = (token: string) => {
          const decoded = jwt.decode(token);
          return decoded || { valid: false };
        };

        const result = decodeTokenSafe('malformed-token');
        expect(result).toEqual({ valid: false });
      });
    });
  });

  describe('Password Utilities', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    describe('hashPassword', () => {
      it('should hash password with salt rounds', async () => {
        const mockHash = '$2b$10$hashedpasswordexample';
        mockedBcrypt.hash.mockResolvedValue(mockHash);

        const hashPassword = async (password: string, saltRounds: number = 10) => {
          return bcrypt.hash(password, saltRounds);
        };

        const password = 'Password123!';
        const hashedPassword = await hashPassword(password);

        expect(mockedBcrypt.hash).toHaveBeenCalledWith(password, 10);
        expect(hashedPassword).toBe(mockHash);
      });

      it('should handle hashing errors', async () => {
        mockedBcrypt.hash.mockRejectedValue(new Error('Hashing failed'));

        const hashPasswordSafe = async (password: string) => {
          try {
            return await bcrypt.hash(password, 10);
          } catch (error) {
            return null;
          }
        };

        const result = await hashPasswordSafe('password');
        expect(result).toBeNull();
      });

      it('should handle different salt rounds', async () => {
        const mockHash = '$2b$12$highsecurityhash';
        mockedBcrypt.hash.mockResolvedValue(mockHash);

        const hashPassword = async (password: string, saltRounds: number) => {
          return bcrypt.hash(password, saltRounds);
        };

        await hashPassword('password', 12);
        expect(mockedBcrypt.hash).toHaveBeenCalledWith('password', 12);
      });
    });

    describe('comparePassword', () => {
      it('should compare password successfully', async () => {
        mockedBcrypt.compare.mockResolvedValue(true);

        const comparePassword = async (plaintext: string, hash: string) => {
          return bcrypt.compare(plaintext, hash);
        };

        const isMatch = await comparePassword('Password123!', '$2b$10$hashedpassword');

        expect(mockedBcrypt.compare).toHaveBeenCalledWith('Password123!', '$2b$10$hashedpassword');
        expect(isMatch).toBe(true);
      });

      it('should return false for incorrect password', async () => {
        mockedBcrypt.compare.mockResolvedValue(false);

        const comparePassword = async (plaintext: string, hash: string) => {
          return bcrypt.compare(plaintext, hash);
        };

        const isMatch = await comparePassword('wrongpassword', '$2b$10$hashedpassword');
        expect(isMatch).toBe(false);
      });

      it('should handle comparison errors', async () => {
        mockedBcrypt.compare.mockRejectedValue(new Error('Comparison failed'));

        const comparePasswordSafe = async (plaintext: string, hash: string) => {
          try {
            return await bcrypt.compare(plaintext, hash);
          } catch (error) {
            return false;
          }
        };

        const result = await comparePasswordSafe('password', 'hash');
        expect(result).toBe(false);
      });
    });
  });

  describe('Validation Utilities', () => {
    describe('Email Validation', () => {
      it('should validate correct email formats', () => {
        const isValidEmail = (email: string): boolean => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(email);
        };

        const validEmails = [
          'test@example.com',
          'user.name@domain.co.uk',
          'user+tag@example.org',
          'firstname.lastname@company.com'
        ];

        validEmails.forEach(email => {
          expect(isValidEmail(email)).toBe(true);
        });
      });

      it('should reject invalid email formats', () => {
        const isValidEmail = (email: string): boolean => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(email);
        };

        const invalidEmails = [
          'invalid-email',
          '@example.com',
          'user@',
          'user@domain',
          'user name@example.com'
        ];

        invalidEmails.forEach(email => {
          expect(isValidEmail(email)).toBe(false);
        });
      });
    });

    describe('Password Validation', () => {
      it('should validate strong passwords', () => {
        const isStrongPassword = (password: string): boolean => {
          const minLength = password.length >= 8;
          const hasUpperCase = /[A-Z]/.test(password);
          const hasLowerCase = /[a-z]/.test(password);
          const hasNumbers = /\d/.test(password);
          const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

          return minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
        };

        const strongPasswords = [
          'Password123!',
          'StrongPass1@',
          'MySecure#2023',
          'Complex$Pass9'
        ];

        strongPasswords.forEach(password => {
          expect(isStrongPassword(password)).toBe(true);
        });
      });

      it('should reject weak passwords', () => {
        const isStrongPassword = (password: string): boolean => {
          const minLength = password.length >= 8;
          const hasUpperCase = /[A-Z]/.test(password);
          const hasLowerCase = /[a-z]/.test(password);
          const hasNumbers = /\d/.test(password);
          const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

          return minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
        };

        const weakPasswords = [
          'password',
          '12345678',
          'PASSWORD',
          'Pass123',
          'password!',
          'PASSWORD123'
        ];

        weakPasswords.forEach(password => {
          expect(isStrongPassword(password)).toBe(false);
        });
      });
    });

    describe('Username Validation', () => {
      it('should validate proper usernames', () => {
        const isValidUsername = (username: string): boolean => {
          const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
          return usernameRegex.test(username);
        };

        const validUsernames = [
          'user123',
          'john_doe',
          'testUser',
          'user_name_123',
          'USERNAME'
        ];

        validUsernames.forEach(username => {
          expect(isValidUsername(username)).toBe(true);
        });
      });

      it('should reject invalid usernames', () => {
        const isValidUsername = (username: string): boolean => {
          const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
          return usernameRegex.test(username);
        };

        const invalidUsernames = [
          'ab', // too short
          'a'.repeat(31), // too long
          'user name', // contains space
          'user-name', // contains hyphen
          'user@name', // contains @
          '123user!', // contains special char
          ''
        ];

        invalidUsernames.forEach(username => {
          expect(isValidUsername(username)).toBe(false);
        });
      });
    });
  });

  describe('Data Formatting Utilities', () => {
    describe('Date Formatting', () => {
      it('should format dates consistently', () => {
        const formatDate = (date: Date): string => {
          return date.toISOString().split('T')[0];
        };

        const testDate = new Date('2023-12-15T10:30:00.000Z');
        const formatted = formatDate(testDate);

        expect(formatted).toBe('2023-12-15');
      });

      it('should handle relative time formatting', () => {
        const getRelativeTime = (date: Date): string => {
          const now = new Date();
          const diffMs = now.getTime() - date.getTime();
          const diffSeconds = Math.floor(diffMs / 1000);
          const diffMinutes = Math.floor(diffSeconds / 60);
          const diffHours = Math.floor(diffMinutes / 60);
          const diffDays = Math.floor(diffHours / 24);

          if (diffSeconds < 60) return 'just now';
          if (diffMinutes < 60) return `${diffMinutes}m ago`;
          if (diffHours < 24) return `${diffHours}h ago`;
          if (diffDays < 7) return `${diffDays}d ago`;
          return date.toLocaleDateString();
        };

        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const result = getRelativeTime(fiveMinutesAgo);

        expect(result).toBe('5m ago');
      });
    });

    describe('File Size Formatting', () => {
      it('should format file sizes correctly', () => {
        const formatFileSize = (bytes: number): string => {
          const sizes = ['Bytes', 'KB', 'MB', 'GB'];
          if (bytes === 0) return '0 Bytes';

          const i = Math.floor(Math.log(bytes) / Math.log(1024));
          const size = bytes / Math.pow(1024, i);

          return `${Math.round(size * 100) / 100} ${sizes[i]}`;
        };

        expect(formatFileSize(0)).toBe('0 Bytes');
        expect(formatFileSize(1024)).toBe('1 KB');
        expect(formatFileSize(1048576)).toBe('1 MB');
        expect(formatFileSize(1536)).toBe('1.5 KB');
      });
    });

    describe('Text Truncation', () => {
      it('should truncate long text properly', () => {
        const truncateText = (text: string, maxLength: number): string => {
          if (text.length <= maxLength) return text;
          return text.substring(0, maxLength - 3) + '...';
        };

        const longText = 'This is a very long text that needs to be truncated';
        const truncated = truncateText(longText, 20);

        expect(truncated).toBe('This is a very lo...');
        expect(truncated.length).toBe(20);
      });

      it('should preserve short text', () => {
        const truncateText = (text: string, maxLength: number): string => {
          if (text.length <= maxLength) return text;
          return text.substring(0, maxLength - 3) + '...';
        };

        const shortText = 'Short text';
        const result = truncateText(shortText, 20);

        expect(result).toBe('Short text');
      });
    });
  });

  describe('Error Handling Utilities', () => {
    describe('API Error Formatting', () => {
      it('should format API errors consistently', () => {
        interface ApiError {
          status: number;
          message: string;
          field?: string;
          code?: string;
        }

        const formatApiError = (error: any): ApiError => {
          if (error.name === 'ValidationError') {
            return {
              status: 400,
              message: 'Validation failed',
              field: error.path,
              code: 'VALIDATION_ERROR'
            };
          }

          if (error.name === 'CastError') {
            return {
              status: 400,
              message: 'Invalid ID format',
              code: 'INVALID_ID'
            };
          }

          return {
            status: 500,
            message: 'Internal server error',
            code: 'INTERNAL_ERROR'
          };
        };

        const validationError = { name: 'ValidationError', path: 'email' };
        const castError = { name: 'CastError' };
        const genericError = { name: 'Error' };

        const formattedValidation = formatApiError(validationError);
        expect(formattedValidation.status).toBe(400);
        expect(formattedValidation.field).toBe('email');

        const formattedCast = formatApiError(castError);
        expect(formattedCast.status).toBe(400);
        expect(formattedCast.code).toBe('INVALID_ID');

        const formattedGeneric = formatApiError(genericError);
        expect(formattedGeneric.status).toBe(500);
      });
    });

    describe('Safe JSON Operations', () => {
      it('should safely parse JSON', () => {
        const safeJsonParse = (jsonString: string): any => {
          try {
            return { success: true, data: JSON.parse(jsonString) };
          } catch (error) {
            return { success: false, error: 'Invalid JSON' };
          }
        };

        const validJson = '{"name": "test", "age": 30}';
        const invalidJson = '{"name": "test", "age":}';

        const validResult = safeJsonParse(validJson);
        expect(validResult.success).toBe(true);
        expect(validResult.data.name).toBe('test');

        const invalidResult = safeJsonParse(invalidJson);
        expect(invalidResult.success).toBe(false);
        expect(invalidResult.error).toBe('Invalid JSON');
      });

      it('should safely stringify JSON', () => {
        const safeJsonStringify = (obj: any): string => {
          try {
            return JSON.stringify(obj);
          } catch (error) {
            return '{}';
          }
        };

        const validObject = { name: 'test', age: 30 };
        const circularObject: any = { name: 'test' };
        circularObject.self = circularObject;

        const validResult = safeJsonStringify(validObject);
        expect(validResult).toBe('{"name":"test","age":30}');

        const circularResult = safeJsonStringify(circularObject);
        expect(circularResult).toBe('{}');
      });
    });
  });
});
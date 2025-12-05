import { generateVerificationCode, generateResetToken } from '../src/app/middlewares/mail';

// Mock nodemailer for this specific test
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' })
  })
}));

describe('Mail Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateVerificationCode', () => {
    it('should generate a 6-digit numeric code', () => {
      const code = generateVerificationCode();
      
      expect(code).toBeDefined();
      expect(typeof code).toBe('string');
      expect(code).toHaveLength(6);
      expect(/^\d{6}$/.test(code)).toBe(true);
    });

    it('should generate different codes on multiple calls', () => {
      const code1 = generateVerificationCode();
      const code2 = generateVerificationCode();
      
      // While there's a small chance they could be the same, it's highly unlikely
      expect(code1).not.toBe(code2);
    });

    it('should generate codes within valid range', () => {
      for (let i = 0; i < 10; i++) {
        const code = generateVerificationCode();
        const numCode = parseInt(code);
        
        expect(numCode).toBeGreaterThanOrEqual(100000);
        expect(numCode).toBeLessThanOrEqual(999999);
      }
    });
  });

  describe('generateResetToken', () => {
    it('should generate a string token', () => {
      const token = generateResetToken();
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(10);
    });

    it('should generate different tokens on multiple calls', () => {
      const token1 = generateResetToken();
      const token2 = generateResetToken();
      
      expect(token1).not.toBe(token2);
    });

    it('should generate tokens with consistent format', () => {
      const token = generateResetToken();
      
      // Should be alphanumeric
      expect(/^[a-zA-Z0-9]+$/.test(token)).toBe(true);
    });
  });
});
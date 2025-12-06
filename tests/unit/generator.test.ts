import { generateVerificationCode, generateResetToken } from '../../src/app/middlewares/mail';
import Status from '../../src/app/interfaces/Status';

describe('Status enum', () => {
  test('should have correct HTTP status codes', () => {
    expect(Status.SUCCESS).toBe(200);
    expect(Status.CREATED).toBe(201);
    expect(Status.NO_CONTENT).toBe(204);
    expect(Status.BAD_REQUEST).toBe(400);
    expect(Status.UNAUTHORIZED).toBe(401);
    expect(Status.FORBIDDEN).toBe(403);
    expect(Status.NOT_FOUND).toBe(404);
    expect(Status.CONFLICT).toBe(409);
    expect(Status.INTERNAL_ERROR).toBe(500);
  });

  test('should be numeric values', () => {
    // TypeScript enums have both string keys and numeric values
    const numericValues = Object.values(Status).filter(val => typeof val === 'number');
    numericValues.forEach(statusCode => {
      expect(typeof statusCode).toBe('number');
      expect(statusCode).toBeGreaterThan(0);
    });
    expect(numericValues.length).toBeGreaterThan(0);
  });
});

describe('Generator utilities', () => {
  test('generateVerificationCode should return a 6-digit string', () => {
    const code = generateVerificationCode();
    expect(typeof code).toBe('string');
    expect(code).toMatch(/^\d{6}$/);
    expect(parseInt(code)).toBeGreaterThanOrEqual(100000);
    expect(parseInt(code)).toBeLessThanOrEqual(999999);
  });

  test('generateVerificationCode should return different codes', () => {
    const codes = new Set();
    for (let i = 0; i < 10; i++) {
      codes.add(generateVerificationCode());
    }
    expect(codes.size).toBeGreaterThan(1); // Should generate different codes
  });

  test('generateResetToken should return a reasonably long unique string', () => {
    const t1 = generateResetToken();
    const t2 = generateResetToken();
    expect(typeof t1).toBe('string');
    expect(typeof t2).toBe('string');
    expect(t1.length).toBeGreaterThanOrEqual(20);
    expect(t2.length).toBeGreaterThanOrEqual(20);
    expect(t1).not.toBe(t2);
  });

  test('generateResetToken should not contain spaces or special chars that break URLs', () => {
    const token = generateResetToken();
    expect(token).not.toContain(' ');
    expect(token).not.toContain('/');
    expect(token).not.toContain('?');
    expect(token).not.toContain('&');
  });
});

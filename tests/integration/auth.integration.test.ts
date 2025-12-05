import request from 'supertest';
import { createApp } from '../../src/index';

const app = createApp();
import { connectTestDatabase, clearDatabase, closeDatabase } from '../setup/database';

describe('Auth Integration Tests', () => {
  beforeAll(async () => {
    await connectTestDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('POST /auth/signup', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      const response = await request(app)
        .post('/auth/signup')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('User created');
    });

    it('should return 400 for invalid email', async () => {
      const userData = {
        username: 'testuser',
        email: 'invalid-email',
        password: 'password123',
      };

      const response = await request(app)
        .post('/auth/signup')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for missing required fields', async () => {
      const userData = {
        username: 'testuser',
        // missing email and password
      };

      const response = await request(app)
        .post('/auth/signup')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 409 for duplicate email', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      // Create user first time
      await request(app)
        .post('/auth/signup')
        .send(userData)
        .expect(201);

      // Try to create with same email
      const response = await request(app)
        .post('/auth/signup')
        .send({
          username: 'testuser2',
          email: 'test@example.com',
          password: 'password456',
        })
        .expect('Content-Type', /json/)
        .expect(409);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('already exists');
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      // Create a verified user for login tests
      await request(app)
        .post('/auth/signup')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        });
    });

    it('should login successfully with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(loginData.email);
    });

    it('should return 401 for invalid password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 404 for non-existent user', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for missing credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({})
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /auth/verify-email', () => {
    it('should handle email verification endpoint', async () => {
      const response = await request(app)
        .post('/auth/verify-email')
        .send({ token: 'some-verification-token' })
        .expect('Content-Type', /json/);

      // Just check that the endpoint exists and returns JSON
      expect(response.body).toBeDefined();
    });
  });

  describe('POST /auth/forgot-password', () => {
    it('should handle forgot password endpoint', async () => {
      const response = await request(app)
        .post('/auth/forgot-password')
        .send({ email: 'test@example.com' })
        .expect('Content-Type', /json/);

      // Just check that the endpoint exists and returns JSON
      expect(response.body).toBeDefined();
    });
  });
});
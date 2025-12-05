import request from 'supertest';
import { createApp } from '../../src/index';

const app = createApp();
import { connectTestDatabase, clearDatabase, closeDatabase } from '../setup/database';

describe('User Integration Tests', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    await connectTestDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
    
    // Create and login a user for authenticated tests
    const signupResponse = await request(app)
      .post('/auth/signup')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

    const loginResponse = await request(app)
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });

    authToken = loginResponse.body.token;
    userId = loginResponse.body.user._id;
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('GET /users', () => {
    it('should return users list for authenticated user', async () => {
      const response = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/users')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /users/my-user', () => {
    it('should return current user profile', async () => {
      const response = await request(app)
        .get('/users/my-user')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.email).toBe('test@example.com');
      expect(response.body.username).toBe('testuser');
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/users/my-user')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /users/search', () => {
    beforeEach(async () => {
      // Create additional users for search testing
      await request(app)
        .post('/auth/signup')
        .send({
          username: 'john_doe',
          email: 'john@example.com',
          password: 'password123',
        });

      await request(app)
        .post('/auth/signup')
        .send({
          username: 'jane_smith',
          email: 'jane@example.com',
          password: 'password123',
        });
    });

    it('should search users by username', async () => {
      const response = await request(app)
        .get('/users/search?q=john')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].username).toContain('john');
    });

    it('should return empty array for non-matching search', async () => {
      const response = await request(app)
        .get('/users/search?q=nonexistent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(0);
    });

    it('should return 400 for missing query parameter', async () => {
      const response = await request(app)
        .get('/users/search')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /users/updateUser', () => {
    it('should update user profile successfully', async () => {
      const updateData = {
        username: 'updateduser',
        bio: 'Updated bio',
      };

      const response = await request(app)
        .put('/users/updateUser')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.username).toBe('updateduser');
      expect(response.body.bio).toBe('Updated bio');
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .put('/users/updateUser')
        .send({ username: 'newname' })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /users/deleteUser', () => {
    it('should delete user account successfully', async () => {
      const response = await request(app)
        .delete('/users/deleteUser')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('deleted');
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .delete('/users/deleteUser')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /users/:id', () => {
    it('should return user by ID', async () => {
      const response = await request(app)
        .get(`/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body._id).toBe(userId);
      expect(response.body.email).toBe('test@example.com');
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = '60d5ecb54b24a63f8c8d1234';
      
      const response = await request(app)
        .get(`/users/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });
});
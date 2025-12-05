import request from 'supertest';
import { createApp } from '../../src/index';

const app = createApp();
import { connectTestDatabase, clearDatabase, closeDatabase } from '../setup/database';

describe('Group Integration Tests', () => {
  let authToken: string;
  let userId: string;
  let groupId: string;

  beforeAll(async () => {
    await connectTestDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
    
    // Create and login a user
    await request(app)
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

  describe('POST /groups', () => {
    it('should create a new group successfully', async () => {
      const groupData = {
        name: 'Test Group',
        description: 'A test group for integration testing',
      };

      const response = await request(app)
        .post('/groups')
        .set('Authorization', `Bearer ${authToken}`)
        .send(groupData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.name).toBe(groupData.name);
      expect(response.body.description).toBe(groupData.description);
      
      groupId = response.body._id;
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .post('/groups')
        .send({
          name: 'Test Group',
          description: 'Test description',
        })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/groups')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Missing name field',
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /groups/my-groups', () => {
    beforeEach(async () => {
      // Create a test group
      const groupResponse = await request(app)
        .post('/groups')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'My Test Group',
          description: 'Test description',
        });
      
      groupId = groupResponse.body._id;
    });

    it('should return user groups', async () => {
      const response = await request(app)
        .get('/groups/my-groups')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].name).toBe('My Test Group');
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/groups/my-groups')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /groups/:groupId', () => {
    beforeEach(async () => {
      // Create a test group
      const groupResponse = await request(app)
        .post('/groups')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Group Details',
          description: 'Test description for details',
        });
      
      groupId = groupResponse.body._id;
    });

    it('should return group details by ID', async () => {
      const response = await request(app)
        .get(`/groups/${groupId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body._id).toBe(groupId);
      expect(response.body.name).toBe('Test Group Details');
    });

    it('should return 404 for non-existent group', async () => {
      const fakeId = '60d5ecb54b24a63f8c8d1234';
      
      const response = await request(app)
        .get(`/groups/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get(`/groups/${groupId}`)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /groups/change-group-info', () => {
    beforeEach(async () => {
      // Create a test group
      const groupResponse = await request(app)
        .post('/groups')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Original Group Name',
          description: 'Original description',
        });
      
      groupId = groupResponse.body._id;
    });

    it('should update group information successfully', async () => {
      const updateData = {
        groupId: groupId,
        name: 'Updated Group Name',
        description: 'Updated description',
      };

      const response = await request(app)
        .put('/groups/change-group-info')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.name).toBe('Updated Group Name');
      expect(response.body.description).toBe('Updated description');
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .put('/groups/change-group-info')
        .send({
          groupId: groupId,
          name: 'Updated Name',
        })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /groups/:groupId', () => {
    beforeEach(async () => {
      // Create a test group
      const groupResponse = await request(app)
        .post('/groups')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Group to Delete',
          description: 'This group will be deleted',
        });
      
      groupId = groupResponse.body._id;
    });

    it('should delete group successfully', async () => {
      const response = await request(app)
        .delete(`/groups/${groupId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('deleted');
    });

    it('should return 404 for non-existent group', async () => {
      const fakeId = '60d5ecb54b24a63f8c8d1234';
      
      const response = await request(app)
        .delete(`/groups/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .delete(`/groups/${groupId}`)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });
});
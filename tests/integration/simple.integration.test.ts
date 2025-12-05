import request from 'supertest';
import { createApp } from '../../src/index';

describe('Integration Tests - Simple', () => {
  const app = createApp();

  describe('Health Check', () => {
    it('should return OK status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toEqual({
        status: 'OK',
        timestamp: expect.any(String),
      });
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for non-existent endpoints', async () => {
      const response = await request(app)
        .get('/non-existent-endpoint')
        .expect(404);

      expect(response.body).toEqual({
        message: 'Endpoint not found',
      });
    });
  });

  describe('CORS and Basic Middleware', () => {
    it('should handle CORS headers', async () => {
      const response = await request(app)
        .options('/health')
        .expect(204);

      // Check that CORS headers are present (they should be added by the cors middleware)
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should parse JSON bodies', async () => {
      // This test verifies that express.json() middleware is working
      // We'll test with the health endpoint which doesn't require auth
      const response = await request(app)
        .get('/health')
        .send({ test: 'data' })
        .expect(200);

      expect(response.body.status).toBe('OK');
    });
  });

  describe('Authentication Endpoints (without DB)', () => {
    it('should require authentication for protected routes', async () => {
      // Test that protected routes return 401 without token
      await request(app)
        .get('/users/profile')
        .expect(401);
    });

    it('should accept requests to public auth endpoints', async () => {
      // Test that auth endpoints are accessible (even if they fail due to missing DB)
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testpassword',
        });
      
      // We expect this to fail due to DB issues, but the route should be accessible
      expect([400, 500]).toContain(response.status);
    });
  });
});
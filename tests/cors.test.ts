import request from 'supertest';
import { app, allowedOrigins } from '../src/index';

describe('CORS Configuration', () => {
  it('should include development and production origins in allowedOrigins by default', () => {
    expect(allowedOrigins).toContain('http://localhost:4200');
    expect(allowedOrigins).toContain('https://orbit.diego-romo-dev.com');
  });

  it('should allow requests from http://localhost:4200 with credentials', async () => {
    const res = await request(app)
      .get('/')
      .set('Origin', 'http://localhost:4200');

    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:4200');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('should allow requests from https://orbit.diego-romo-dev.com with credentials', async () => {
    const res = await request(app)
      .get('/')
      .set('Origin', 'https://orbit.diego-romo-dev.com');

    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('https://orbit.diego-romo-dev.com');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('should handle preflight OPTIONS request from allowed origin', async () => {
    const res = await request(app)
      .options('/')
      .set('Origin', 'http://localhost:4200')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'Content-Type,Authorization');

    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:4200');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
    expect(res.headers['access-control-allow-methods']).toContain('POST');
  });

  it('should not provide Access-Control-Allow-Origin for unauthorized origin', async () => {
    const res = await request(app)
      .get('/')
      .set('Origin', 'http://malicious-website.com');

    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('should allow requests without Origin header (e.g. curl, mobile apps, server-to-server)', async () => {
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');
  });
});

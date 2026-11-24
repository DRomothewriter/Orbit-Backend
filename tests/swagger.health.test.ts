import request from 'supertest';
import path from 'path';
import { app } from '../src/index';

const actualFs = jest.requireActual('fs') as typeof import('fs');
const rootDir = path.resolve(__dirname, '..');

describe('Healthcheck & OpenAPI Specification Endpoints (R3)', () => {
  describe('GET /health', () => {
    it('should return HTTP 200 with { status: "ok", timestamp } as valid ISO-8601 date', async () => {
      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/application\/json/);
      expect(res.body).toEqual(
        expect.objectContaining({
          status: 'ok',
          timestamp: expect.any(String),
        })
      );

      const parsedDate = Date.parse(res.body.timestamp);
      expect(Number.isNaN(parsedDate)).toBe(false);
      expect(res.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('GET /swagger.json', () => {
    it('should return HTTP 200 with application/json OpenAPI specification and non-empty paths', async () => {
      const res = await request(app).get('/swagger.json');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/application\/json/);
      expect(res.body).toBeDefined();
      expect(res.body.openapi).toBe('3.1.0');
      expect(typeof res.body.paths).toBe('object');
      expect(res.body.paths).not.toBeNull();
      expect(Object.keys(res.body.paths).length).toBeGreaterThan(0);
    });
  });

  describe('Runtime Swagger Dependencies & Multi-Stage Config', () => {
    it('package.json includes swagger-jsdoc and swagger-ui-express in dependencies and NOT in devDependencies', () => {
      const pkgPath = path.join(rootDir, 'package.json');
      expect(actualFs.existsSync(pkgPath)).toBe(true);

      const pkg = JSON.parse(actualFs.readFileSync(pkgPath, 'utf8'));

      expect(pkg.dependencies).toHaveProperty('swagger-jsdoc');
      expect(pkg.dependencies).toHaveProperty('swagger-ui-express');
      expect(pkg.devDependencies ?? {}).not.toHaveProperty('swagger-jsdoc');
      expect(pkg.devDependencies ?? {}).not.toHaveProperty('swagger-ui-express');
    });

    it('swagger.config.ts includes ./dist/src/**/*.js in apis for compiled Docker runtime', () => {
      const swaggerConfigPath = path.join(rootDir, 'swagger.config.ts');
      expect(actualFs.existsSync(swaggerConfigPath)).toBe(true);

      const content = actualFs.readFileSync(swaggerConfigPath, 'utf8');
      expect(content).toContain('./dist/src/**/*.js');
    });
  });
});

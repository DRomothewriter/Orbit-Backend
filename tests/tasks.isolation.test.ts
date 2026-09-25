import request from 'supertest';
import swaggerJsDoc from 'swagger-jsdoc';
import swaggerOptions from '../swagger.config';
import { app } from '../src/index';
import fs from 'fs';
import path from 'path';

describe('Tasks Module Isolation & Documentation (TDD - Orbit-0010)', () => {
  let swaggerSpec: any;

  beforeAll(() => {
    swaggerSpec = swaggerJsDoc(swaggerOptions);
  });

  describe('Swagger Documentation Tags [Experimental / v2]', () => {
    const expectedTag = 'Tasks [Experimental / v2]';

    it('should document POST /tasks with [Experimental / v2] tag and summary', () => {
      const postOp = swaggerSpec.paths?.['/tasks']?.post;
      expect(postOp).toBeDefined();
      expect(postOp.tags).toBeDefined();
      expect(postOp.tags).toContain(expectedTag);
      expect(postOp.summary || postOp.description).toMatch(/experimental|v2/i);
    });

    it('should document GET /tasks/{taskId} with [Experimental / v2] tag and summary', () => {
      const getOp = swaggerSpec.paths?.['/tasks/{taskId}']?.get;
      expect(getOp).toBeDefined();
      expect(getOp.tags).toBeDefined();
      expect(getOp.tags).toContain(expectedTag);
      expect(getOp.summary || getOp.description).toMatch(/experimental|v2/i);
    });

    it('should document PUT /tasks/modifyTask with [Experimental / v2] tag and summary', () => {
      const putOp = swaggerSpec.paths?.['/tasks/modifyTask']?.put;
      expect(putOp).toBeDefined();
      expect(putOp.tags).toBeDefined();
      expect(putOp.tags).toContain(expectedTag);
      expect(putOp.summary || putOp.description).toMatch(/experimental|v2/i);
    });

    it('should document DELETE /tasks/{taskId} with [Experimental / v2] tag and summary', () => {
      const deleteOp = swaggerSpec.paths?.['/tasks/{taskId}']?.delete;
      expect(deleteOp).toBeDefined();
      expect(deleteOp.tags).toBeDefined();
      expect(deleteOp.tags).toContain(expectedTag);
      expect(deleteOp.summary || deleteOp.description).toMatch(/experimental|v2/i);
    });
  });

  describe('Architectural Isolation & Non-Interference', () => {
    it('should verify core modules (groups, communities, messages) have no dependency on tasks module', () => {
      const srcDir = path.resolve(__dirname, '../src/app');
      const coreModules = ['groups', 'communities', 'messages', 'auth', 'users'];

      coreModules.forEach((mod) => {
        const modDir = path.join(srcDir, mod);
        if (fs.existsSync(modDir)) {
          const files = fs.readdirSync(modDir);
          files.forEach((file) => {
            if (file.endsWith('.ts')) {
              const content = fs.readFileSync(path.join(modDir, file), 'utf-8');
              expect(content).not.toMatch(/from\s+['"][^'"]*tasks/);
            }
          });
        }
      });
    });
  });

  describe('Authentication Enforcement on Tasks Endpoints', () => {
    it('should reject unauthenticated POST /tasks with 401/403', async () => {
      const res = await request(app).post('/tasks').send({ title: 'Test Task' });
      expect([401, 403]).toContain(res.status);
    });

    it('should reject unauthenticated GET /tasks/:taskId with 401/403', async () => {
      const res = await request(app).get('/tasks/sample-task-id');
      expect([401, 403]).toContain(res.status);
    });

    it('should reject unauthenticated PUT /tasks/modifyTask with 401/403', async () => {
      const res = await request(app).put('/tasks/modifyTask').send({ taskId: 'sample' });
      expect([401, 403]).toContain(res.status);
    });

    it('should reject unauthenticated DELETE /tasks/:taskId with 401/403', async () => {
      const res = await request(app).delete('/tasks/sample-task-id');
      expect([401, 403]).toContain(res.status);
    });
  });
});

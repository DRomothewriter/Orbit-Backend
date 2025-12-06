// 1. Mock de Mongoose PRIMERO (antes de cualquier import)
jest.mock('mongoose', () => ({
  model: jest.fn(),
  Schema: jest.fn().mockImplementation(() => ({})),
  SchemaTypes: {
    ObjectId: 'ObjectId',
    String: 'String',
    Boolean: 'Boolean',
    Date: 'Date',
    Number: 'Number'
  },
  connect: jest.fn(),
  connection: {
    close: jest.fn()
  }
}));

// 2. Mock del modelo User
jest.mock('../src/app/users/user.model', () => ({
  findById: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  updateOne: jest.fn()
}));

// 3. Mock de otros modelos que user.routes pueda necesitar
jest.mock('../src/app/users/friendship.model', () => ({
  find: jest.fn(),
  findOne: jest.fn()
}));

// 4. Mock del middleware S3
jest.mock('../src/app/middlewares/s3', () => ({
  uploadS3: {
    single: jest.fn(() => (req: any, res: any, next: any) => next())
  },
  deleteImageFromS3: jest.fn()
}));

import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import userRoutes from '../src/app/users/user.routes';
import User from '../src/app/users/user.model';

describe('GET /users/my-user - Con authMiddleware', () => {
  let app: express.Application;
  let validToken: string;

  beforeAll(() => {
    // Crear la app de Express
    app = express();
    app.use(express.json());
    app.use('/users', userRoutes);

    // Crear un token válido
    validToken = jwt.sign(
      { id: 'abc123' },
      process.env.JWT_SECRET as string
    );
  });

  it('debería retornar 401 sin token', async () => {
    const response = await request(app)
      .get('/users/my-user');
      // ❌ No enviamos token

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'No token' });
  });

  it('debería retornar 401 con token inválido', async () => {
    const response = await request(app)
      .get('/users/my-user')
      .set('Authorization', 'Bearer tokeninvalido');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Error auth' });
  });

  it('debería retornar el usuario con token válido', async () => {
    const usuarioMock = {
      _id: 'abc123',
      username: 'juan',
      email: 'juan@example.com'
    };

    (User.findById as jest.Mock).mockResolvedValue(usuarioMock);

    const response = await request(app)
      .get('/users/my-user')
      .set('Authorization', `Bearer ${validToken}`);  // ✅ Token válido

    expect(response.status).toBe(200);
    expect(response.body).toEqual(usuarioMock);
  });
});
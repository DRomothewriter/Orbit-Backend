import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import swaggerJsDoc from 'swagger-jsdoc';
import { setup, serve } from 'swagger-ui-express';
import swaggerOptions from '../swagger.config';
import { dbConnect } from './database';

import { Server } from 'socket.io';
import http, { createServer } from 'http';
import routes from './app/routes';
import { setupSocket } from './socket';

const port = process.env.PORT || 3000;

// Función para crear la aplicación (para tests)
export const createApp = () => {
  const app = express();

  // Middlewares
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Configurar Swagger ANTES de las rutas
  const swaggerDocs = swaggerJsDoc(swaggerOptions);
  app.use('/swagger', serve, setup(swaggerDocs));

  // Health check endpoint específico
  app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
  });

  // Ruta raíz
  app.get('/', (req, res) => {
    res.json({ message: 'Orbit API is working!' });
  });

  // Rutas de la API
  app.use('/', routes);

  // 404 handler - debe ir al final
  app.use((req, res) => {
    res.status(404).json({ message: 'Endpoint not found' });
  });

  return app;
};

// Crear la aplicación principal
const app = createApp();
const server: http.Server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:4200',
    methods: ['GET', 'POST','PUT', 'DELETE'],
    credentials: true,
  },
});

app.set('io', io);

// Exportar app para los tests
export { app };

setupSocket(io);

// Solo iniciar el servidor si no estamos en modo test
if (require.main === module) {
  dbConnect()
    .then(() => {
      console.log('✅ Connected to MongoDB successfully');
      server.listen(port, () => {
        console.log(`🚀 Server running on port ${port}`);
        console.log(`📚 API Documentation: http://localhost:${port}/swagger`);
        console.log(`🏠 Health check: http://localhost:${port}/`);
      });
    })
    .catch((error) => {
      console.error('❌ Failed to connect to MongoDB:', error);
      process.exit(1);
    });
}

import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

import swaggerJsDoc from 'swagger-jsdoc';
import { setup, serve } from 'swagger-ui-express';
import swaggerOptions from '../swagger.config';
import { dbConnect } from './database';

import { Server } from 'socket.io';
import http, { createServer } from 'http';
import routes from './app/routes';

const port = process.env.PORT || 3001;

const app = express();
const server = createServer(app);
const io = new Server(server);

app.use(express.json()); //Luego lo pondremos únicamente en las rutas necesarias
app.use(routes);

app.get('', (req, res) => {
	res.json({ message: 'api works' });
});

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/swagger', serve, setup(swaggerDocs));

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    })
})

dbConnect()
	.then(() => {
		server.listen(port, () => {
			console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
			console.log(`📚Servidor corriendo en http://localhost:${port}/swagger/`);
			console.log(`📰 API lista para usar`);
		});
	})
	.catch(() => {
		console.log('Failed to connect to the database');
	});

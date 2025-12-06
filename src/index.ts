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
import { setupSocket } from './socket';
import cors from 'cors';
import {mediasoupService} from './services/mediasoup.service';


const app = express();
app.use(
	cors({
		origin: 'http://localhost:4200',
		credentials: true,
		methods: ['GET', 'POST', 'PUT', 'DELETE'],
	})
);


const server: http.Server = createServer(app);
const io = new Server(server, {
	cors: {
		origin: 'http://localhost:4200',
		methods: ['GET', 'POST','PUT', 'DELETE'],
		credentials: true,
	},
});

app.set('io', io);

app.use(express.json()); //Luego lo pondremos únicamente en las rutas necesarias

app.use(routes);
app.get('', (req, res) => {
	res.json({ message: 'api works. Check Workflow' });
});

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/swagger', serve, setup(swaggerDocs));

setupSocket(io);

const startServer = async () => {
	try{
		await mediasoupService.initialize(2);

		const port = process.env.PORT || 3000;
			server.listen(port, () => {
			console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
			console.log(`📚Servidor corriendo en http://localhost:${port}/swagger/`);
			console.log(`📰 API lista para usar. Prueba workflow`);
		});
	}catch(error){
		console.error('Error al iniciar el servidor:', error);
		process.exit(1);
	}
}


dbConnect()
	.then(() => {
		startServer();
	})
	.catch(() => {
		console.log('Failed to connect to the database');
	});

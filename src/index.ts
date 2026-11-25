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
const mongokey= "mongodb+srv://orbit_user:Mostafeo27@cluster0.8llpish.mongodb.net/orbit?appName=Cluster0"

const defaultAllowedOrigins = [
	'https://orbit.diego-romo-dev.com',
	'http://localhost:4200',
];

const envAllowedOrigins = process.env.ALLOWED_ORIGINS
	? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
	: [];

export const allowedOrigins: string[] = Array.from(
	new Set(
		[
			...envAllowedOrigins,
			process.env.FRONTEND_URL,
			...defaultAllowedOrigins,
		].filter(Boolean) as string[]
	)
);

export const corsOptions: cors.CorsOptions = {
	origin: (origin, callback) => {
		if (!origin || allowedOrigins.includes(origin)) {
			return callback(null, true);
		}
		return callback(null, false);
	},
	credentials: true,
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

const app = express();
app.use(cors(corsOptions));

const server: http.Server = createServer(app);
const io = new Server(server, {
	cors: {
		origin: allowedOrigins,
		methods: ['GET', 'POST', 'PUT', 'DELETE'],
		credentials: true,
	},
});

app.set('io', io);

app.use(express.json()); //Luego lo pondremos únicamente en las rutas necesarias

app.use(routes);
app.get('', (req, res) => {
	res.json({ message: `api works. Frontend en: ${process.env.FRONTEND_URL}` });
});

app.get('/health', (_req, res) => {
	res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.get('/swagger.json', (_req, res) => {
	res.setHeader('Content-Type', 'application/json');
	res.status(200).json(swaggerDocs);
});
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


if (process.env.NODE_ENV !== 'test') {
	dbConnect()
		.then(() => {
			startServer();
		})
		.catch(() => {
			console.log('Failed to connect to the database');
		});
}

export { app, server, io, startServer };


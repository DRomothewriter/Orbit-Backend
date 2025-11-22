import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from './app/users/user.model';

const connectedSockets = [
	//username, socketId, userId
];

export const setupSocket = (io: Server) => {
	io.on('connection', (socket) => {
		const token = socket.handshake.auth.token;
		//Leemos el token para saber qué usuario es
		const groupIds = JSON.parse(socket.handshake.query.groupIds as string);
		const user = JSON.parse(socket.handshake.query.user as string);
		//En teoría el user ya viene con el userId también
		let userId: string;
		if (token) {
			try {
				const decoded = jwt.verify(token, process.env.JWT_SECRET);
				if (typeof decoded !== 'string' && decoded.id) {
					userId = decoded.id;
				}
				//console.log('Usuario conectdado. userId:', userId)
				socket.data.userId = userId;
				socket.join(userId);
				User.findByIdAndUpdate(userId, { status: 'online' }, { new: true })
					.then((updatedUser) => {
						console.log(`User ${userId} status set to online`, updatedUser);
					})
					.catch((err) => {
						console.error('Error setting user online:', err);
					});

				if (user && groupIds) {
					socket.data.groupIds = groupIds;

					//Le hacemos join a todas las salas con los Ids de sus chats
					groupIds.forEach((groupId: string) => {
						socket.join(groupId.toString());
					});
					//console.log('Usuario unido a rooms:', user.chatIds)
				}
			} catch (err) {
				console.log('Token inválido en socket', err.message);
			}
		}

		//Tal vez agregar una confiration

		console.log(
			`Nuevo cliente conectado:${socket.id}. UserId: ${socket.data.userId}`
		);

		connectedSockets.push({
			socketId: socket.id,
			userId: userId,
		});

		//on.('newGroup') join al nuevo id y agregar a mis groupIds

		socket.on('disconnect', () => {
			User.findByIdAndUpdate(userId, { status: 'offline' }, { new: true })
				.then((updatedUser) => {
					console.log(`User ${userId} status set to offline`, updatedUser);
				})
				.catch((err) => {
					console.error('Error setting user online:', err);
				});
				
			console.log('User disconnected:', socket.id);
			const index = connectedSockets.findIndex((s) => s.socketId === socket.id);
			if (index !== -1) {
				connectedSockets.splice(index, 1);
			}
		});

		//WEBRTC VideoLlamadas (signaling server)
	});
};

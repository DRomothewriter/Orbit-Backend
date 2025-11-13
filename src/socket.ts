import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

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
			console.log('User disconnected:', socket.id);
			const index = connectedSockets.findIndex((s) => s.socketId === socket.id);
			if (index !== -1) {
				connectedSockets.splice(index, 1);
			}
		});

		//WEBRTC VideoLlamadas (signaling server)
	});
}

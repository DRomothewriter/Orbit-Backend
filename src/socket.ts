import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from './app/users/user.model';

import { roomService } from './services/room.service';
import { mediasoupService } from './services/mediasoup.service';
import { webRtcTransportOptions } from './config/mediasoup.config';
import { Peer } from './app/interfaces/call';

export const connectedSockets = [
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
						//console.log(`User ${userId} status set to online`, updatedUser);
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
					//console.log(`User ${userId} status set to offline`, updatedUser);
				})
				.catch((err) => {
					console.error('Error setting user online:', err);
				});

			console.log('User disconnected:', socket.id);
			const index = connectedSockets.findIndex((s) => s.socketId === socket.id);
			if (index !== -1) {
				connectedSockets.splice(index, 1);
			}

			//limpiar llamadas
			const rooms = Array.from(roomService['rooms'].values());
			for (const room of rooms) {
				const peer = Array.from(room.peers.values()).find(
					(p) => p.socketId === socket.id
				);
				if (peer) {
					roomService.removePeer(room.id, peer.id);
					socket
						.to(`call-${room.id}`)
						.emit('peerLeftCall', { peerId: peer.id });
					break;
				}
			}
		});

		//WEBRTC VideoLlamadas (signaling server)

		// 1. Unirse a una sala de videollamada
		socket.on('joinCallRoom', async ({ roomId, peerId, group }) => {
			try {
				console.log(`[Call] ${peerId} uniéndose a sala ${roomId}`);

				const room = await roomService.getOrCreateRoom(roomId, socket, group);

				const peer: Peer = {
					id: peerId,
					socketId: socket.id,
					roomId,
					transports: new Map(),
					producers: new Map(),
					consumers: new Map(),
				};

			roomService.addPeer(roomId, peer);
			socket.join(`call-${roomId}`); // Prefijo para diferenciar de chat rooms

			// Emitir a la sala de chat que la llamada está iniciando
			socket.to(roomId).emit('call-starting', { group });

			const rtpCapabilities =
				mediasoupService.getRouterRtpCapabilities(roomId);				// Obtener información de producers existentes de otros peers
				const existingPeers = Array.from(room.peers.values())
					.filter((p) => p.id !== peerId)
					.map((p) => ({
						peerId: p.id,
						producers: Array.from(p.producers.values()).map((producer) => ({
							id: producer.id,
							kind: producer.kind, 
						})),
					}));

				socket.emit('callRoomJoined', {
					rtpCapabilities,
					peers: existingPeers,
				});

				socket.to(`call-${roomId}`).emit('newPeerInCall', { peerId });

				console.log(`[Call] ${peerId} unido a sala ${roomId}`);
			} catch (error) {
				console.error('[Call] Error en joinCallRoom:', error);
				socket.emit('callError', { message: 'Error al unirse a la sala' });
			}
		});

		// 2. Crear WebRTC Transport
		socket.on('createWebRtcTransport', async (data, callback) => {
			try {
				const { roomId, consumer } = data;
				const router = roomService.getRouter(roomId);

				if (!router) {
					throw new Error('Router no encontrado');
				}

				const transport = await router.createWebRtcTransport(
					webRtcTransportOptions
				);

				let peer: Peer | undefined;
				const room = roomService.getRoom(roomId);
				if (room) {
					peer = Array.from(room.peers.values()).find(
						(p) => p.socketId === socket.id
					);
				}

				if (peer) {
					peer.transports.set(transport.id, transport);
				}

				callback({
					id: transport.id,
					iceParameters: transport.iceParameters,
					iceCandidates: transport.iceCandidates,
					dtlsParameters: transport.dtlsParameters,
				});

				console.log(`[Call] Transport creado: ${transport.id}`);
			} catch (error) {
				console.error('[Call] Error en createWebRtcTransport:', error);
				callback({ error: 'Error al crear transport' });
			}
		});

		// 3. Conectar transport
		socket.on('connectTransport', async (data, callback) => {
			try {
				const { transportId, dtlsParameters } = data;

				let transport: any;
				const rooms = Array.from(roomService['rooms'].values());

				for (const room of rooms) {
					const peer = Array.from(room.peers.values()).find(
						(p) => p.socketId === socket.id
					);
					if (peer) {
						transport = peer.transports.get(transportId);
						if (transport) break;
					}
				}

				if (!transport) {
					throw new Error('Transport no encontrado');
				}

				await transport.connect({ dtlsParameters });
				callback({ connected: true });

				console.log(`[Call] Transport conectado: ${transportId}`);
			} catch (error) {
				console.error('[Call] Error en connectTransport:', error);
				callback({ error: 'Error al conectar transport' });
			}
		});

		// 4. Producir (enviar audio/video)
		socket.on('produce', async (data, callback) => {
			try {
				const { transportId, kind, rtpParameters } = data;

				let transport: any;
				let peer: Peer | undefined;
				const rooms = Array.from(roomService['rooms'].values());

				for (const room of rooms) {
					peer = Array.from(room.peers.values()).find(
						(p) => p.socketId === socket.id
					);
					if (peer) {
						transport = peer.transports.get(transportId);
						if (transport) break;
					}
				}

				if (!transport || !peer) {
					throw new Error('Transport o peer no encontrado');
				}

				const producer = await transport.produce({ kind, rtpParameters });
				peer.producers.set(producer.id, producer);

				callback({ id: producer.id });

				socket.to(`call-${peer.roomId}`).emit('newProducer', {
					peerId: peer.id,
					producerId: producer.id,
					kind,
				});

				console.log(`[Call] Producer creado: ${producer.id} (${kind})`);
			} catch (error) {
				console.error('[Call] Error en produce:', error);
				callback({ error: 'Error al producir' });
			}
		});

		// 5. Consumir (recibir audio/video)
		socket.on('consume', async (data, callback) => {
			try {
				const { transportId, producerId, rtpCapabilities } = data;

				let transport: any;
				let peer: Peer | undefined;
				let room: any;
				const rooms = Array.from(roomService['rooms'].values());

				for (const r of rooms) {
					peer = Array.from(r.peers.values()).find(
						(p) => p.socketId === socket.id
					);
					if (peer) {
						room = r;
						transport = peer.transports.get(transportId);
						if (transport) break;
					}
				}

				if (!transport || !peer || !room) {
					throw new Error('Transport, peer o room no encontrado');
				}

				if (!room.router.canConsume({ producerId, rtpCapabilities })) {
					throw new Error('No se puede consumir este producer');
				}

				const consumer = await transport.consume({
					producerId,
					rtpCapabilities,
					paused: true,
				});

				peer.consumers.set(consumer.id, consumer);

				callback({
					id: consumer.id,
					producerId,
					kind: consumer.kind,
					rtpParameters: consumer.rtpParameters,
				});

				console.log(`[Call] Consumer creado: ${consumer.id}`);
			} catch (error) {
				console.error('[Call] Error en consume:', error);
				callback({ error: 'Error al consumir' });
			}
		});

		// 6. Reanudar consumer
		socket.on('resumeConsumer', async ({ consumerId }, callback) => {
			try {
				let consumer: any;
				const rooms = Array.from(roomService['rooms'].values());

				for (const room of rooms) {
					const peer = Array.from(room.peers.values()).find(
						(p) => p.socketId === socket.id
					);
					if (peer) {
						consumer = peer.consumers.get(consumerId);
						if (consumer) break;
					}
				}

				if (!consumer) {
					throw new Error('Consumer no encontrado');
				}

				await consumer.resume();
				callback({ resumed: true });

				console.log(`[Call] Consumer reanudado: ${consumerId}`);
			} catch (error) {
				console.error('[Call] Error en resumeConsumer:', error);
				callback({ error: 'Error al reanudar consumer' });
			}
		});

		// 7. Salir de la llamada
		socket.on('leaveCallRoom', ({ roomId, peerId }) => {
			roomService.removePeer(roomId, peerId);
			socket.to(`call-${roomId}`).emit('peerLeftCall', { peerId });
			socket.leave(`call-${roomId}`);
			console.log(`[Call] ${peerId} salió de sala ${roomId}`);
		});
	});
};

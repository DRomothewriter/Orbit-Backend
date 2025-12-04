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
          .then((_updatedUser) => {
            // User status updated to online
          })
          .catch((_err) => {
            // Error setting user online
          });

        if (user && groupIds) {
          socket.data.groupIds = groupIds;

          //Le hacemos join a todas las salas con los Ids de sus chats
          groupIds.forEach((groupId: string) => {
            socket.join(groupId.toString());
          });
          //console.log('Usuario unido a rooms:', user.chatIds)
        }
      } catch (_err) {
        // Invalid token in socket connection
      }
    }

    //Tal vez agregar una confiration

    // New client connected

    connectedSockets.push({
      socketId: socket.id,
      userId: userId,
    });

    //on.('newGroup') join al nuevo id y agregar a mis groupIds

    socket.on('disconnect', () => {
      User.findByIdAndUpdate(userId, { status: 'offline' }, { new: true })
        .then((_updatedUser) => {
          // User status updated to offline
        })
        .catch((_err) => {
          // Error setting user offline
        });
				
      // User disconnected
      const index = connectedSockets.findIndex((s) => s.socketId === socket.id);
      if (index !== -1) {
        connectedSockets.splice(index, 1);
      }
    });

    //WEBRTC VideoLlamadas (signaling server)
  });
};

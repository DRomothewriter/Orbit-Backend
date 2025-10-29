import { Server } from 'socket.io';

export function setupSocket(io: Server) {
	io.on('connection', (socket) => {
        //Leemos el token para saber qué usuario es
        //Le hacemos join a todas las salas con los Ids de sus chats
		console.log('User connected:', socket.id);
		socket.on('disconnect', () => {
			console.log('User disconnected:', socket.id);
		});
		
        //Tal vaz con acknowledge para avisar cuando lo reciba el otro
        socket.on('sendMessage', () => {

        });

        socket.on('sendNotification', () => {

        });

        socket.on('sendFriendRequest', () => {

        });

        socket.on('acceptFriendRequest', () => {

        });

        //aquí tendría que venir con los userIds y el nuevo chatId para avisarles a los miembros
        socket.on('newCommunity', () => {

        });
        socket.on('newGroup', () => {

        });


        //WEBRTC VideoLlamadas (signaling server)

	});
}

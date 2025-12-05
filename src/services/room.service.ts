import { Router } from 'mediasoup/node/lib/types';
import { mediasoupService } from './mediasoup.service';
import { Room, Peer } from '../app/interfaces/call';
import { Socket } from 'socket.io';
import Group from '../app/groups/group.model';
class RoomService {
	private rooms: Map<string, Room> = new Map();

	async getOrCreateRoom(roomId: string, socket: Socket, group: typeof Group): Promise<Room> {
		let room = this.rooms.get(roomId);

		if (!room) {
			const router = await mediasoupService.createRouter(roomId);
			room = {
				id: roomId,
				router,
				peers: new Map(),
			};
			this.rooms.set(roomId, room);
			console.log(`[Room] Sala creada: ${roomId}`);
		}
		return room;
	}

	getRoom(roomId: string): Room | undefined {
		return this.rooms.get(roomId);
	}

	addPeer(roomId: string, peer: Peer): void {
		const room = this.rooms.get(roomId);
		if (room) {
			room.peers.set(peer.id, peer);
			console.log(`[Room] Peer ${peer.id} agregado a sala ${roomId}`);
		}
	}

	removePeer(roomId: string, peerId: string): void {
		const room = this.rooms.get(roomId);
		if (room) {
			const peer = room.peers.get(peerId);
			if (peer) {
				peer.transports.forEach((transport) => transport.close());
				room.peers.delete(peerId);
				console.log(`[Room] Peer ${peerId} removido de sala ${roomId}`);

				if (room.peers.size === 0) {
					this.closeRoom(roomId);
				}
			}
		}
	}

	getPeer(roomId: string, peerId: string): Peer | undefined {
		const room = this.rooms.get(roomId);
		return room?.peers.get(peerId);
	}

	getOtherPeers(roomId: string, excludePeerId: string): Peer[] {
		const room = this.rooms.get(roomId);
		if (!room) return [];

		return Array.from(room.peers.values()).filter(
			(peer) => peer.id !== excludePeerId
		);
	}

    async closeRoom(roomId: string): Promise<void> {
        const room = this.rooms.get(roomId);
        if(room) {
            room.peers.forEach((peer) => {
                peer.transports.forEach((transport) => transport.close());
            });

            await mediasoupService.closeRouter(roomId);

            this.rooms.delete(roomId);
            console.log(`[Room] Sala cerrada: ${roomId}`)
        }
    }

    getRouter(roomId: string): Router | undefined {
        return this.rooms.get(roomId)?.router;
    }
}

export const roomService = new RoomService();

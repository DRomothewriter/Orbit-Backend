import * as mediasoup from 'mediasoup';
import {Worker, Router} from 'mediasoup/node/lib/types';
import {workerSettings, routerOptions} from '../config/mediasoup.config';

class MediasoupService{
    private workers: Worker[]= [];
    private nextWorkerIndex = 0;
    private routers: Map<string, Router> = new Map();

    async initialize(numWorkers:number = 1): Promise<void> {
        console.log(`[Mediasoup] Inicializando ${numWorkers} worker(s)...`);

        for(let i = 0; i <numWorkers; i++){
            const worker = await mediasoup.createWorker(workerSettings);
            worker.on('died', () => {
                console.error(`[Mediasoup] Worker ${worker.pid} murió, saliendo...`);
                setTimeout(()=> process.exit(1), 2000);
            })
            this.workers.push(worker);
            console.log(`[Mediasoup] Worker ${i + 1} creando (PID: ${worker.pid})`);
        }
        console.log(`[Mediasoup] ${this.workers.length} workers(s) listos`);
    }

    private getNextWorker(): Worker {
        const worker = this.workers[this.nextWorkerIndex];
        this.nextWorkerIndex = (this.nextWorkerIndex + 1) % this.workers.length;
        return worker;
    }

    async createRouter(roomId: string): Promise<Router> {
        const worker = this.getNextWorker();
        const router = await worker.createRouter(routerOptions);
        this.routers.set(roomId, router);
        console.log(`[Mediasoup] Router creado para sala: ${roomId}`);
        return router;
    }

    getRouter(roomId: string): Router | undefined{
        return this.routers.get(roomId);
    }
    async closeRouter(roomId: string): Promise<void>{
        const router = this.routers.get(roomId);
        if(router){
            router.close();
            this.routers.delete(roomId);
            console.log(`[Mediasoup] Router cerrado para sala: ${roomId}`);
        }
    }

    getRouterRtpCapabilities(roomId: string){
        const router = this.getRouter(roomId);
        if(!router) {
            throw new Error(`Router no encontrado para sala: ${roomId}`);
        }
        return router.rtpCapabilities;
    }
}
export const mediasoupService = new MediasoupService();
import { RtpCapabilities, DtlsParameters, IceCandidate, IceParameters } from 'mediasoup/node/lib/types';

export interface Peer{
    id: string;
    socketId: string;
    roomId: string;
    rtpCapabilities?: RtpCapabilities;
    transports: Map<string, any>;
    producers: Map<string, any>;
    consumers: Map<string, any>;
}

export interface Room {
    id: string;
    router: any;
    peers: Map<string, Peer>;
}

export interface CreateWebRtcTransportRequest{
    roomId: string;
    consumer: boolean;
}

export interface CreateWebRtcTransportResponse{
    id: string;
    iceParameters: IceParameters;
    iceCandidates: IceCandidate[];
    dtlsParameters: DtlsParameters;
}

export interface ConnectTransportRequest{
    transportId: string;
    dtlsParameters: DtlsParameters;
}

export interface ProduceRequest {
    transportId: string;
    kind: 'audio' | 'video';
    rtpParameters: any;
}

export interface ProduceResponse {
    id: string;
}

export interface ConsumeRequest {
    trasportId: string;
    producerId: string;
    rtpCapabilities: RTCRtpCapabilities;
}

export interface ConsumeResponse {
    id: string;
    producerId: string;
    kind: 'audio' | 'video';
    rtpParameters: any;
}
import { WorkerLogLevel, WorkerLogTag } from 'mediasoup/node/lib/types';

export const workerSettings = {
	rtcMinPort: parseInt(process.env.MEDIASOUP_MIN_PORT || '10000'),
	rtcMaxPort: parseInt(process.env.MEDIASOUP_MAX_PORT || '10100'),
	logLevel: 'warn' as WorkerLogLevel,
	logTags: ['info', 'ice', 'dtls', 'rtp', 'srtp', 'rtcp'] as WorkerLogTag[],
};

export const routerOptions = {
	mediaCodecs: [
		{
			kind: 'audio' as const,
			mimeType: 'audio/opus',
			clockRate: 48000,
			channels: 2,
		},
		{
			kind: 'video' as const,
			mimeType: 'video/VP8',
			clockRate: 90000,
			parameters: {
				'x-google-start-bitrate': 500, 
				'x-google-max-bitrate': 800,
			},
		},
	],
};

export const getAnnouncedIp = (): string => {
	if (process.env.MEDIASOUP_ANNOUNCED_IP) {
		return process.env.MEDIASOUP_ANNOUNCED_IP;
	}
	if (process.env.NODE_ENV === 'production') {
		console.warn(
			'⚠️ [Mediasoup] MEDIASOUP_ANNOUNCED_IP no está configurada en producción. Se usará 127.0.0.1 como fallback. Para conexiones externas, configure la Elastic IP pública en MEDIASOUP_ANNOUNCED_IP.'
		);
	}
	return '127.0.0.1';
};

export const webRtcTransportOptions = {
	listenInfos: [
		{
			protocol: 'udp' as const,
			ip: process.env.MEDIASOUP_LISTEN_IP || '0.0.0.0',
			announcedAddress: getAnnouncedIp(),
		},
		{
			protocol: 'tcp' as const,
			ip: process.env.MEDIASOUP_LISTEN_IP || '0.0.0.0',
			announcedAddress: getAnnouncedIp(),
		},
	],
    maxIncomingBitrate: 800000,                  
    initialAvailableOutgoingBitrate: 500000,   
};

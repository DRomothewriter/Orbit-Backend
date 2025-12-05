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
				'x-google-start-bitrate': 1000,
			},
		},
	],
};

export const webRtcTransportOptions = {
	listenInfos: [
		{
			protocol: 'udp' as const,
			ip: process.env.MEDIASOUP_LISTEN_IP || '0.0.0.0',
			announcedAddress: process.env.MEDIASOUP_ANNOUNCED_IP || undefined,
		},
		{
			protocol: 'tcp' as const,
			ip: process.env.MEDIASOUP_LISTEN_IP || '0.0.0.0',
			announcedAddress: process.env.MEDIASOUP_ANNOUNCED_IP || undefined,
		},
	],
	maxIncomingBitrate: 1500000,
	initialAvailableOutgoingBitrate: 1000000,
};

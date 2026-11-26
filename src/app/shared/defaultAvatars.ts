export const ASTRONOMICAL_DEFAULT_AVATARS = [
	'assets/avatars/nebula.webp',
	'assets/avatars/galaxy.webp',
	'assets/avatars/ringed-planet.webp',
	'assets/avatars/comet.webp',
	'assets/avatars/constellation.webp',
	'assets/avatars/eclipse.webp',
	'assets/avatars/amethyst-cloud.webp',
	'assets/avatars/star-cluster.webp',
	'assets/avatars/planetary-limb.webp',
	'assets/avatars/golden-nebula.webp',
	'assets/avatars/violet-arc.webp',
	'assets/avatars/deep-zenith.webp',
	'assets/avatars/milky-way-core.webp',
	'assets/avatars/twilight-rift.webp',
	'assets/avatars/lavender-veil.webp',
	'assets/avatars/champagne-dust.webp',
	'assets/avatars/indigo-stars.webp',
	'assets/avatars/starlight-field.webp',
	'assets/avatars/nocturne-mist.webp',
	'assets/avatars/cosmic-drift.webp',
	'assets/avatars/spiral-core.webp',
	'assets/avatars/comet-tail.webp',
	'assets/avatars/crescent-ring.webp',
	'assets/avatars/solar-corona.webp',
] as const;

export const getRandomAstronomicalAvatar = (): string => {
	const index = Math.floor(Math.random() * ASTRONOMICAL_DEFAULT_AVATARS.length);
	return ASTRONOMICAL_DEFAULT_AVATARS[index];
};

export const getShuffledAstronomicalAvatars = (): string[] => {
	const deck = [...ASTRONOMICAL_DEFAULT_AVATARS];
	for (let i = deck.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[deck[i], deck[j]] = [deck[j], deck[i]];
	}
	return deck;
};

export const isDefaultAstronomicalAvatar = (url?: string | null): boolean =>
	typeof url === 'string' && url.startsWith('assets/avatars/');

export const isGoogleHostedAvatar = (url?: string | null): boolean =>
	typeof url === 'string' && url.includes('googleusercontent.com');

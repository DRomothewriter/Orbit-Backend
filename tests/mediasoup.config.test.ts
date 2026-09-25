describe('Mediasoup Configuration (TDD)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('getAnnouncedIp', () => {
    it('should return configured MEDIASOUP_ANNOUNCED_IP when present', () => {
      process.env.MEDIASOUP_ANNOUNCED_IP = '54.210.10.20';
      const { getAnnouncedIp } = require('../src/config/mediasoup.config');
      expect(typeof getAnnouncedIp).toBe('function');
      expect(getAnnouncedIp()).toBe('54.210.10.20');
    });

    it('should fallback to 127.0.0.1 in development/test when MEDIASOUP_ANNOUNCED_IP is missing', () => {
      delete process.env.MEDIASOUP_ANNOUNCED_IP;
      process.env.NODE_ENV = 'development';
      const { getAnnouncedIp } = require('../src/config/mediasoup.config');
      expect(getAnnouncedIp()).toBe('127.0.0.1');
    });

    it('should warn and fallback to 127.0.0.1 in production when MEDIASOUP_ANNOUNCED_IP is missing', () => {
      delete process.env.MEDIASOUP_ANNOUNCED_IP;
      process.env.NODE_ENV = 'production';
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const { getAnnouncedIp } = require('../src/config/mediasoup.config');
      expect(getAnnouncedIp()).toBe('127.0.0.1');
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('MEDIASOUP_ANNOUNCED_IP')
      );

      warnSpy.mockRestore();
    });
  });

  describe('webRtcTransportOptions', () => {
    it('should configure announcedAddress with fallback for both udp and tcp protocols', () => {
      delete process.env.MEDIASOUP_ANNOUNCED_IP;
      process.env.NODE_ENV = 'development';
      const { webRtcTransportOptions } = require('../src/config/mediasoup.config');

      expect(webRtcTransportOptions.listenInfos).toHaveLength(2);
      for (const info of webRtcTransportOptions.listenInfos) {
        expect(info.announcedAddress).toBe('127.0.0.1');
      }
    });

    it('should configure announcedAddress with specified public IP', () => {
      process.env.MEDIASOUP_ANNOUNCED_IP = '54.210.10.20';
      const { webRtcTransportOptions } = require('../src/config/mediasoup.config');

      for (const info of webRtcTransportOptions.listenInfos) {
        expect(info.announcedAddress).toBe('54.210.10.20');
      }
    });
  });

  describe('workerSettings port range', () => {
    it('should use default UDP port range 10000-10100', () => {
      delete process.env.MEDIASOUP_MIN_PORT;
      delete process.env.MEDIASOUP_MAX_PORT;
      const { workerSettings } = require('../src/config/mediasoup.config');

      expect(workerSettings.rtcMinPort).toBe(10000);
      expect(workerSettings.rtcMaxPort).toBe(10100);
    });

    it('should use custom port range if defined in environment variables', () => {
      process.env.MEDIASOUP_MIN_PORT = '20000';
      process.env.MEDIASOUP_MAX_PORT = '20100';
      const { workerSettings } = require('../src/config/mediasoup.config');

      expect(workerSettings.rtcMinPort).toBe(20000);
      expect(workerSettings.rtcMaxPort).toBe(20100);
    });
  });
});

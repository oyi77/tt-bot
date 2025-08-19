const TikTokService = require('../src/services/tiktokService');

describe('TikTokService', () => {
  let service;

  beforeEach(() => {
    service = require('../src/services/tiktokService');
  });

  describe('URL Validation', () => {
    test('should validate correct TikTok URLs', () => {
      const validUrls = [
        'https://www.tiktok.com/@username/video/1234567890',
        'https://tiktok.com/@username/video/1234567890',
        'https://vm.tiktok.com/abc123/',
        'https://vt.tiktok.com/xyz789/',
      ];

      validUrls.forEach(url => {
        expect(service.validateVideoUrl(url)).toBe(true);
      });
    });

    test('should reject invalid URLs', () => {
      const invalidUrls = [
        'https://youtube.com/watch?v=123',
        'https://instagram.com/p/abc123/',
        'not-a-url',
        '',
        null,
        undefined,
      ];

      invalidUrls.forEach(url => {
        expect(service.validateVideoUrl(url)).toBe(false);
      });
    });
  });

  describe('Available Actions', () => {
    test('should return list of available actions', () => {
      const actions = service.getAvailableActions();
      expect(Array.isArray(actions)).toBe(true);
      expect(actions).toContain('views');
      expect(actions).toContain('likes');
      expect(actions).toContain('shares');
      expect(actions).toContain('favorites');
    });
  });

  describe('Available Providers', () => {
    test('should return list of available providers', () => {
      const providers = service.getAvailableProviders();
      expect(Array.isArray(providers)).toBe(true);
      expect(providers).toContain('zefoy');
    });
  });

  describe('Provider Stats', () => {
    test('should return provider statistics', () => {
      const stats = service.getProviderStats();
      expect(typeof stats).toBe('object');
      expect(stats.zefoy).toBeDefined();
      expect(stats.zefoy.providerName).toBe('zefoy');
    });
  });

  describe('Service Stats', () => {
    test('should return service statistics', () => {
      const stats = service.getStats();
      expect(typeof stats).toBe('object');
      expect(stats.providers).toBeDefined();
      expect(stats.tasks).toBeDefined();
      expect(stats.uptime).toBeDefined();
    });
  });

  describe('Task Management', () => {
    test('should return empty active tasks initially', () => {
      const tasks = service.getActiveTasks();
      expect(Array.isArray(tasks)).toBe(true);
      expect(tasks.length).toBe(0);
    });

    test('should return empty task history initially', () => {
      const history = service.getTaskHistory();
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBe(0);
    });
  });
});

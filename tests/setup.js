// Test setup file
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.HEADLESS = 'true';
process.env.LOG_LEVEL = 'error';

// Mock fs-extra to avoid file system operations in tests
jest.mock('fs-extra', () => ({
  pathExists: jest.fn().mockResolvedValue(true),
  ensureDir: jest.fn().mockResolvedValue(undefined),
  readJson: jest.fn().mockResolvedValue({}),
  writeJson: jest.fn().mockResolvedValue(undefined),
  ensureDirSync: jest.fn(),
}));

// Mock winston logger to avoid console output in tests
jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  logTikTokAction: jest.fn(),
  logProviderAction: jest.fn(),
  logSession: jest.fn(),
  logError: jest.fn(),
  stream: {
    write: jest.fn(),
  },
}));

// Mock puppeteer to avoid browser operations in tests
jest.mock('puppeteer', () => ({
  launch: jest.fn().mockResolvedValue({
    newPage: jest.fn().mockResolvedValue({
      setViewport: jest.fn().mockResolvedValue(undefined),
      setUserAgent: jest.fn().mockResolvedValue(undefined),
      goto: jest.fn().mockResolvedValue(undefined),
      waitForSelector: jest.fn().mockResolvedValue(undefined),
      waitForTimeout: jest.fn().mockResolvedValue(undefined),
      $: jest.fn().mockResolvedValue({
        click: jest.fn().mockResolvedValue(undefined),
        type: jest.fn().mockResolvedValue(undefined),
      }),
      cookies: jest.fn().mockResolvedValue([]),
      setCookie: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
      isClosed: jest.fn().mockReturnValue(false),
      process: jest.fn().mockReturnValue({ pid: 12345 }),
    }),
    process: jest.fn().mockReturnValue({ pid: 12345 }),
    close: jest.fn().mockResolvedValue(undefined),
  }),
}));

// Global test timeout
jest.setTimeout(10000);

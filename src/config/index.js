require('dotenv').config();

const config = {
  // Application settings
  app: {
    port: process.env.PORT || 3000,
    environment: process.env.NODE_ENV || 'development',
    debug: process.env.DEBUG === 'true',
  },

  // Puppeteer settings
  puppeteer: {
    headless: process.env.HEADLESS !== 'false',
    slowMo: parseInt(process.env.SLOW_MO, 10) || 100,
    timeout: parseInt(process.env.TIMEOUT, 10) || 30000,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
    ],
  },

  // Third-party providers
  providers: {
    zefoy: {
      baseUrl: 'https://zefoy.com',
      endpoints: {
        views: '/views',
        likes: '/likes',
        shares: '/shares',
        favorites: '/favorites',
        followers: '/followers',
        comments: '/comments',
      },
      delays: {
        betweenActions: parseInt(process.env.ZEFOY_DELAY, 10) || 30000,
        afterSubmit: parseInt(process.env.ZEFOY_SUBMIT_DELAY, 10) || 5000,
      },
    },
    freer: {
      baseUrl: 'https://freer.es',
      endpoints: {
        views: '/views',
        likes: '/likes',
        shares: '/shares',
      },
      delays: {
        betweenActions: parseInt(process.env.FREER_DELAY, 10) || 25000,
        afterSubmit: parseInt(process.env.FREER_SUBMIT_DELAY, 10) || 4000,
      },
    },
  },

  // TikTok settings
  tiktok: {
    maxRetries: parseInt(process.env.MAX_RETRIES, 10) || 3,
    retryDelay: parseInt(process.env.RETRY_DELAY, 10) || 5000,
    maxConcurrentTasks: parseInt(process.env.MAX_CONCURRENT_TASKS, 10) || 1,
    taskTimeout: parseInt(process.env.TASK_TIMEOUT, 10) || 300000, // 5 minutes
  },

  // Session management
  session: {
    cookiePath: process.env.COOKIE_PATH || './data/cookies.json',
    userAgentPath: process.env.USER_AGENT_PATH || './data/user-agents.json',
    proxyPath: process.env.PROXY_PATH || './data/proxies.json',
    sessionTimeout: parseInt(process.env.SESSION_TIMEOUT, 10) || 3600000, // 1 hour
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './data/logs/app.log',
    maxSize: process.env.LOG_MAX_SIZE || '10m',
    maxFiles: process.env.LOG_MAX_FILES || '5',
  },

  // Rate limiting
  rateLimit: {
    maxRequestsPerMinute: parseInt(process.env.MAX_REQUESTS_PER_MINUTE, 10) || 10,
    maxRequestsPerHour: parseInt(process.env.MAX_REQUESTS_PER_HOUR, 10) || 100,
    cooldownPeriod: parseInt(process.env.COOLDOWN_PERIOD, 10) || 3600000, // 1 hour
  },
};

module.exports = config;

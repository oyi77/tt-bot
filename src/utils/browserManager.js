const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');
const config = require('../config');
const logger = require('./logger');

class BrowserManager {
  constructor() {
    this.browsers = new Map();
    this.sessions = new Map();
  }

  /**
   * Launch a new browser instance
   * @param {string} sessionId - Unique session identifier
   * @param {Object} options - Browser launch options
   * @returns {Promise<Object>} Browser instance and page
   */
  async launchBrowser(sessionId, options = {}) {
    try {
      const browserOptions = {
        ...config.puppeteer,
        ...options,
      };

      logger.logSession('launching', sessionId, { options: browserOptions });

      const browser = await puppeteer.launch(browserOptions);
      const page = await browser.newPage();

      // Set default viewport
      await page.setViewport({ width: 1366, height: 768 });

      // Set user agent
      const userAgent = await this.getRandomUserAgent();
      await page.setUserAgent(userAgent);

      // Store browser instance
      this.browsers.set(sessionId, { browser, page, createdAt: Date.now() });

      logger.logSession('launched', sessionId, { userAgent });

      return { browser, page };
    } catch (error) {
      logger.logError(error, { sessionId, action: 'launchBrowser' });
      throw error;
    }
  }

  /**
   * Get browser instance for a session
   * @param {string} sessionId - Session identifier
   * @returns {Object|null} Browser instance or null if not found
   */
  getBrowser(sessionId) {
    return this.browsers.get(sessionId) || null;
  }

  /**
   * Close browser instance for a session
   * @param {string} sessionId - Session identifier
   * @returns {Promise<boolean>} Success status
   */
  async closeBrowser(sessionId) {
    try {
      const browserData = this.browsers.get(sessionId);
      if (!browserData) {
        logger.logSession('close_failed', sessionId, { reason: 'not_found' });
        return false;
      }

      const { browser, page } = browserData;

      if (page && !page.isClosed()) {
        await page.close();
      }

      if (browser && browser.process()) {
        await browser.close();
      }

      this.browsers.delete(sessionId);
      logger.logSession('closed', sessionId);

      return true;
    } catch (error) {
      logger.logError(error, { sessionId, action: 'closeBrowser' });
      return false;
    }
  }

  /**
   * Close all browser instances
   * @returns {Promise<void>}
   */
  async closeAllBrowsers() {
    const closePromises = Array.from(this.browsers.keys()).map((sessionId) => this.closeBrowser(sessionId));

    await Promise.allSettled(closePromises);
    logger.info('All browsers closed');
  }

  /**
   * Load cookies for a session
   * @param {string} sessionId - Session identifier
   * @param {Object} page - Puppeteer page instance
   * @returns {Promise<boolean>} Success status
   */
  async loadCookies(sessionId, page) {
    try {
      const cookiePath = config.session.cookiePath;
      if (!await fs.pathExists(cookiePath)) {
        logger.logSession('cookies_not_found', sessionId);
        return false;
      }

      const cookies = await fs.readJson(cookiePath);
      const sessionCookies = cookies[sessionId];

      if (!sessionCookies || sessionCookies.length === 0) {
        logger.logSession('cookies_empty', sessionId);
        return false;
      }

      await page.setCookie(...sessionCookies);
      logger.logSession('cookies_loaded', sessionId, { count: sessionCookies.length });

      return true;
    } catch (error) {
      logger.logError(error, { sessionId, action: 'loadCookies' });
      return false;
    }
  }

  /**
   * Save cookies for a session
   * @param {string} sessionId - Session identifier
   * @param {Object} page - Puppeteer page instance
   * @returns {Promise<boolean>} Success status
   */
  async saveCookies(sessionId, page) {
    try {
      const cookies = await page.cookies();
      const cookiePath = config.session.cookiePath;

      // Ensure directory exists
      await fs.ensureDir(path.dirname(cookiePath));

      // Load existing cookies or create new file
      let allCookies = {};
      if (await fs.pathExists(cookiePath)) {
        allCookies = await fs.readJson(cookiePath);
      }

      // Update cookies for this session
      allCookies[sessionId] = cookies;

      await fs.writeJson(cookiePath, allCookies, { spaces: 2 });
      logger.logSession('cookies_saved', sessionId, { count: cookies.length });

      return true;
    } catch (error) {
      logger.logError(error, { sessionId, action: 'saveCookies' });
      return false;
    }
  }

  /**
   * Get random user agent from predefined list
   * @returns {Promise<string>} User agent string
   */
  async getRandomUserAgent() {
    try {
      const userAgentPath = config.session.userAgentPath;
      if (!await fs.pathExists(userAgentPath)) {
        // Return default user agent if file doesn't exist
        return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
          + '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
      }

      const userAgents = await fs.readJson(userAgentPath);
      const randomIndex = Math.floor(Math.random() * userAgents.length);
      return userAgents[randomIndex];
    } catch (error) {
      logger.logError(error, { action: 'getRandomUserAgent' });
      // Return default user agent on error
      return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
        + '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    }
  }

  /**
   * Check if browser instance is still valid
   * @param {string} sessionId - Session identifier
   * @returns {boolean} Validity status
   */
  isBrowserValid(sessionId) {
    const browserData = this.browsers.get(sessionId);
    if (!browserData) return false;

    const { browser, page, createdAt } = browserData;

    // Check if browser is still running and not expired
    return browser && browser.process()
      && page && !page.isClosed()
      && (Date.now() - createdAt) < config.session.sessionTimeout;
  }

  /**
   * Get browser statistics
   * @returns {Object} Statistics object
   */
  getStats() {
    const stats = {
      totalBrowsers: this.browsers.size,
      activeSessions: 0,
      expiredSessions: 0,
    };

    for (const [sessionId] of this.browsers) {
      if (this.isBrowserValid(sessionId)) {
        stats.activeSessions += 1;
      } else {
        stats.expiredSessions += 1;
      }
    }

    return stats;
  }

  /**
   * Clean up expired sessions
   * @returns {Promise<number>} Number of cleaned sessions
   */
  async cleanupExpiredSessions() {
    const expiredSessions = [];

    for (const [sessionId, browserData] of this.browsers) {
      if ((Date.now() - browserData.createdAt) >= config.session.sessionTimeout) {
        expiredSessions.push(sessionId);
      }
    }

    const cleanupPromises = expiredSessions.map((sessionId) => this.closeBrowser(sessionId));

    await Promise.allSettled(cleanupPromises);
    logger.info(`Cleaned up ${expiredSessions.length} expired sessions`);

    return expiredSessions.length;
  }
}

module.exports = new BrowserManager();

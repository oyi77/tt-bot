const logger = require('../utils/logger');
const config = require('../config');

class BaseProvider {
  constructor(providerName, providerConfig) {
    this.providerName = providerName;
    this.config = providerConfig;
    this.isAvailable = true;
    this.lastActionTime = 0;
    this.actionCount = 0;
    this.errorCount = 0;
  }

  /**
   * Check if provider is available for actions
   * @returns {boolean} Availability status
   */
  checkAvailability() {
    if (!this.isAvailable) {
      logger.logProviderAction(this.providerName, 'availability_check', 'unavailable');
      return false;
    }

    const now = Date.now();
    const timeSinceLastAction = now - this.lastActionTime;
    const minDelay = this.config.delays.betweenActions;

    if (timeSinceLastAction < minDelay) {
      const remainingTime = minDelay - timeSinceLastAction;
      logger.logProviderAction(this.providerName, 'availability_check', 'rate_limited', { remainingTime });
      return false;
    }

    return true;
  }

  /**
   * Wait for the required delay between actions
   * @returns {Promise<void>}
   */
  async waitForDelay() {
    const delay = this.config.delays.betweenActions;
    logger.logProviderAction(this.providerName, 'waiting', 'delay', { delay });
    
    return new Promise((resolve) => {
      setTimeout(resolve, delay);
    });
  }

  /**
   * Update action statistics
   * @param {boolean} success - Whether the action was successful
   */
  updateStats(success) {
    this.lastActionTime = Date.now();
    this.actionCount += 1;

    if (success) {
      this.errorCount = 0; // Reset error count on success
    } else {
      this.errorCount += 1;
      
      // Disable provider if too many errors
      if (this.errorCount >= config.tiktok.maxRetries) {
        this.isAvailable = false;
        logger.logProviderAction(this.providerName, 'disabled', 'too_many_errors', { errorCount: this.errorCount });
      }
    }
  }

  /**
   * Reset provider availability
   */
  resetAvailability() {
    this.isAvailable = true;
    this.errorCount = 0;
    logger.logProviderAction(this.providerName, 'reset', 'availability_restored');
  }

  /**
   * Get provider statistics
   * @returns {Object} Statistics object
   */
  getStats() {
    return {
      providerName: this.providerName,
      isAvailable: this.isAvailable,
      actionCount: this.actionCount,
      errorCount: this.errorCount,
      lastActionTime: this.lastActionTime,
      timeSinceLastAction: Date.now() - this.lastActionTime,
    };
  }

  /**
   * Validate TikTok video URL
   * @param {string} videoUrl - TikTok video URL
   * @returns {boolean} Validity status
   */
  validateVideoUrl(videoUrl) {
    if (!videoUrl || typeof videoUrl !== 'string') {
      return false;
    }

    // Basic TikTok URL validation
    const tiktokUrlPattern = /^https?:\/\/(www\.)?(tiktok\.com|vm\.tiktok\.com|vt\.tiktok\.com)\/.+/i;
    return tiktokUrlPattern.test(videoUrl);
  }

  /**
   * Extract video ID from TikTok URL
   * @param {string} videoUrl - TikTok video URL
   * @returns {string|null} Video ID or null if not found
   */
  extractVideoId(videoUrl) {
    if (!this.validateVideoUrl(videoUrl)) {
      return null;
    }

    // Try to extract video ID from various TikTok URL formats
    const patterns = [
      /\/@[\w.-]+\/video\/(\d+)/,
      /\/video\/(\d+)/,
      /\/v\/(\d+)/,
      /\/t\/(\w+)/,
    ];

    for (const pattern of patterns) {
      const match = videoUrl.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Abstract method for performing actions - must be implemented by subclasses
   * @param {string} videoUrl - TikTok video URL
   * @param {Object} options - Action options
   * @returns {Promise<Object>} Action result
   */
  async performAction(videoUrl, _options = {}) {
    throw new Error(`performAction method must be implemented by ${this.constructor.name}`);
  }

  /**
   * Abstract method for checking action status - must be implemented by subclasses
   * @param {string} actionId - Action identifier
   * @returns {Promise<Object>} Status result
   */
  async checkActionStatus(_actionId) {
    throw new Error(`checkActionStatus method must be implemented by ${this.constructor.name}`);
  }

  /**
   * Abstract method for solving CAPTCHA - must be implemented by subclasses
   * @param {Object} page - Puppeteer page instance
   * @returns {Promise<boolean>} Success status
   */
  async solveCaptcha(_page) {
    throw new Error(`solveCaptcha method must be implemented by ${this.constructor.name}`);
  }

  /**
   * Wait for element to be present on page
   * @param {Object} page - Puppeteer page instance
   * @param {string} selector - CSS selector
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<Object|null>} Element or null if not found
   */
  async waitForElement(page, selector, timeout = 10000) {
    try {
      await page.waitForSelector(selector, { timeout });
      return await page.$(selector);
    } catch (error) {
      logger.logError(error, {
        provider: this.providerName,
        action: 'waitForElement',
        selector,
      });
      return null;
    }
  }

  /**
   * Wait for element to disappear from page
   * @param {Object} page - Puppeteer page instance
   * @param {string} selector - CSS selector
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<boolean>} Success status
   */
  async waitForElementDisappear(page, selector, timeout = 10000) {
    try {
      await page.waitForFunction(
        /* global document */
        (sel) => !document.querySelector(sel),
        { timeout },
        selector,
      );
      return true;
    } catch (error) {
      logger.logError(error, {
        provider: this.providerName,
        action: 'waitForElementDisappear',
        selector,
      });
      return false;
    }
  }

  /**
   * Take screenshot for debugging
   * @param {Object} page - Puppeteer page instance
   * @param {string} filename - Screenshot filename
   * @returns {Promise<string|null>} Screenshot path or null on error
   */
  async takeScreenshot(page, filename) {
    try {
      const screenshotPath = `./data/screenshots/${filename}_${Date.now()}.png`;
      await page.screenshot({
        path: screenshotPath,
        fullPage: true,
      });
      
      logger.logProviderAction(this.providerName, 'screenshot', 'taken', { path: screenshotPath });
      return screenshotPath;
    } catch (error) {
      logger.logError(error, {
        provider: this.providerName,
        action: 'takeScreenshot',
      });
      return null;
    }
  }
}

module.exports = BaseProvider;

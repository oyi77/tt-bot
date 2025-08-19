const { v4: uuidv4 } = require('uuid');
const BaseProvider = require('./baseProvider');
const browserManager = require('../utils/browserManager');
const logger = require('../utils/logger');
const config = require('../config');

class ZefoyProvider extends BaseProvider {
  constructor() {
    super('zefoy', config.providers.zefoy);
    this.baseUrl = this.config.baseUrl;
    this.endpoints = this.config.endpoints;
    this.delays = this.config.delays;
  }

  /**
   * Perform a TikTok action using Zefoy
   * @param {string} videoUrl - TikTok video URL
   * @param {string} actionType - Type of action (views, likes, shares, etc.)
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Action result
   */
  async performAction(videoUrl, actionType = 'views', options = {}) {
    if (!this.checkAvailability()) {
      return {
        success: false,
        error: 'Provider not available',
        provider: this.providerName,
        actionType,
      };
    }

    if (!this.validateVideoUrl(videoUrl)) {
      return {
        success: false,
        error: 'Invalid TikTok video URL',
        provider: this.providerName,
        actionType,
      };
    }

    const sessionId = uuidv4();
    let page = null;

    try {
      // Launch browser
      const browserData = await browserManager.launchBrowser(sessionId, {
        headless: options.headless !== false,
      });
      // browser = browserData.browser; // Not used in this implementation
      page = browserData.page;

      // Load cookies if available
      await browserManager.loadCookies(sessionId, page);

      // Navigate to Zefoy
      await this.navigateToZefoy(page);

      // Select action type
      const actionSelected = await this.selectAction(page, actionType);
      if (!actionSelected) {
        throw new Error(`Failed to select action type: ${actionType}`);
      }

      // Wait for action form to load
      await this.waitForActionForm(page);

      // Submit video URL
      const urlSubmitted = await this.submitVideoUrl(page, videoUrl);
      if (!urlSubmitted) {
        throw new Error('Failed to submit video URL');
      }

      // Wait for submission delay
      await this.waitForSubmissionDelay();

      // Check for CAPTCHA and solve if needed
      const captchaSolved = await this.handleCaptcha(page);
      if (!captchaSolved) {
        throw new Error('Failed to solve CAPTCHA');
      }

      // Wait for action to complete
      const actionCompleted = await this.waitForActionCompletion(page);
      if (!actionCompleted) {
        throw new Error('Action did not complete successfully');
      }

      // Save cookies for future use
      await browserManager.saveCookies(sessionId, page);

      // Update stats
      this.updateStats(true);

      logger.logTikTokAction(actionType, videoUrl, this.providerName, 'success');

      return {
        success: true,
        provider: this.providerName,
        actionType,
        videoUrl,
        sessionId,
        timestamp: Date.now(),
      };
    } catch (error) {
      logger.logError(error, {
        provider: this.providerName,
        actionType,
        videoUrl,
        sessionId,
      });

      // Update stats
      this.updateStats(false);

      return {
        success: false,
        error: error.message,
        provider: this.providerName,
        actionType,
        videoUrl,
        sessionId,
        timestamp: Date.now(),
      };
    } finally {
      // Close browser
      if (sessionId) {
        await browserManager.closeBrowser(sessionId);
      }
    }
  }

  /**
   * Navigate to Zefoy website
   * @param {Object} page - Puppeteer page instance
   * @returns {Promise<boolean>} Success status
   */
  async navigateToZefoy(page) {
    try {
      logger.logProviderAction(this.providerName, 'navigating', 'started');

      await page.goto(this.baseUrl, {
        waitUntil: 'networkidle2',
        timeout: config.puppeteer.timeout,
      });

      // Wait for page to load completely
      await page.waitForTimeout(2000);

      logger.logProviderAction(this.providerName, 'navigating', 'completed');
      return true;
    } catch (error) {
      logger.logError(error, {
        provider: this.providerName,
        action: 'navigateToZefoy',
      });
      return false;
    }
  }

  /**
   * Select action type on Zefoy
   * @param {Object} page - Puppeteer page instance
   * @param {string} actionType - Type of action to select
   * @returns {Promise<boolean>} Success status
   */
  async selectAction(page, actionType) {
    try {
      const endpoint = this.endpoints[actionType];
      if (!endpoint) {
        throw new Error(`Unknown action type: ${actionType}`);
      }

      // Navigate to specific action page
      const actionUrl = `${this.baseUrl}${endpoint}`;
      await page.goto(actionUrl, {
        waitUntil: 'networkidle2',
        timeout: config.puppeteer.timeout,
      });

      // Wait for action page to load
      await page.waitForTimeout(1000);

      logger.logProviderAction(this.providerName, 'action_selection', 'completed', { actionType });
      return true;
    } catch (error) {
      logger.logError(error, {
        provider: this.providerName,
        action: 'selectAction',
        actionType,
      });
      return false;
    }
  }

  /**
   * Wait for action form to load
   * @param {Object} page - Puppeteer page instance
   * @returns {Promise<boolean>} Success status
   */
  async waitForActionForm(page) {
    try {
      // Wait for the input field to appear
      const inputSelector = 'input[placeholder*="TikTok"]';
      const inputElement = await this.waitForElement(page, inputSelector, 10000);
      
      if (!inputElement) {
        throw new Error('Action form input field not found');
      }

      logger.logProviderAction(this.providerName, 'form_wait', 'completed');
      return true;
    } catch (error) {
      logger.logError(error, {
        provider: this.providerName,
        action: 'waitForActionForm',
      });
      return false;
    }
  }

  /**
   * Submit video URL to Zefoy
   * @param {Object} page - Puppeteer page instance
   * @param {string} videoUrl - TikTok video URL
   * @returns {Promise<boolean>} Success status
   */
  async submitVideoUrl(page, videoUrl) {
    try {
      // Find and fill the input field
      const inputSelector = 'input[placeholder*="TikTok"]';
      const inputElement = await page.$(inputSelector);
      
      if (!inputElement) {
        throw new Error('Input field not found');
      }

      // Clear and fill input
      await inputElement.click({ clickCount: 3 });
      await inputElement.type(videoUrl);

      // Find and click submit button
      const submitSelector = 'button[type="submit"], input[type="submit"], .btn-submit';
      const submitButton = await page.$(submitSelector);
      
      if (!submitButton) {
        throw new Error('Submit button not found');
      }

      await submitButton.click();

      logger.logProviderAction(this.providerName, 'url_submission', 'completed', { videoUrl });
      return true;
    } catch (error) {
      logger.logError(error, {
        provider: this.providerName,
        action: 'submitVideoUrl',
        videoUrl,
      });
      return false;
    }
  }

  /**
   * Wait for submission delay
   * @returns {Promise<void>}
   */
  async waitForSubmissionDelay() {
    const delay = this.delays.afterSubmit;
    logger.logProviderAction(this.providerName, 'waiting', 'submission_delay', { delay });
    
    return new Promise((resolve) => {
      setTimeout(resolve, delay);
    });
  }

  /**
   * Handle CAPTCHA on the page
   * @param {Object} page - Puppeteer page instance
   * @returns {Promise<boolean>} Success status
   */
  async handleCaptcha(page) {
    try {
      // Check if CAPTCHA is present
      const captchaSelectors = [
        'iframe[src*="captcha"]',
        '.captcha',
        '#captcha',
        '[class*="captcha"]',
      ];

      let captchaFound = false;
      for (const selector of captchaSelectors) {
        const captchaElement = await page.$(selector);
        if (captchaElement) {
          captchaFound = true;
          break;
        }
      }

      if (!captchaFound) {
        logger.logProviderAction(this.providerName, 'captcha', 'not_found');
        return true; // No CAPTCHA to solve
      }

      logger.logProviderAction(this.providerName, 'captcha', 'detected');

      // Try to solve CAPTCHA
      const solved = await this.solveCaptcha(page);
      
      if (solved) {
        logger.logProviderAction(this.providerName, 'captcha', 'solved');
        return true;
      }
      logger.logProviderAction(this.providerName, 'captcha', 'failed');
      return false;
    } catch (error) {
      logger.logError(error, {
        provider: this.providerName,
        action: 'handleCaptcha',
      });
      return false;
    }
  }

  /**
   * Wait for action completion
   * @param {Object} page - Puppeteer page instance
   * @returns {Promise<boolean>} Success status
   */
  async waitForActionCompletion(page) {
    try {
      // Wait for success message or completion indicator
      const successSelectors = [
        '.success',
        '.completed',
        '[class*="success"]',
        '[class*="completed"]',
        'text="Success"',
        'text="Completed"',
      ];

      let successFound = false;
      for (const selector of successSelectors) {
        try {
          if (selector.startsWith('text=')) {
            const text = selector.substring(5);
            await page.waitForFunction(
              /* global document */
              (searchText) => document.body.textContent.includes(searchText),
              { timeout: 30000 },
              text,
            );
            successFound = true;
            break;
          } else {
            await this.waitForElement(page, selector, 5000);
            successFound = true;
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      if (successFound) {
        logger.logProviderAction(this.providerName, 'action_completion', 'success');
        return true;
      }

      // If no success indicator found, wait a bit more and assume success
      await page.waitForTimeout(5000);
      logger.logProviderAction(this.providerName, 'action_completion', 'assumed_success');
      return true;
    } catch (error) {
      logger.logError(error, {
        provider: this.providerName,
        action: 'waitForActionCompletion',
      });
      return false;
    }
  }

  /**
   * Solve CAPTCHA (basic implementation - can be enhanced with external services)
   * @param {Object} page - Puppeteer page instance
   * @returns {Promise<boolean>} Success status
   */
  async solveCaptcha(page) {
    try {
      // Basic CAPTCHA handling - wait for user to solve manually
      // In production, this should integrate with a CAPTCHA solving service
      
      logger.logProviderAction(this.providerName, 'captcha_solving', 'manual_mode');
      
      // Wait for manual CAPTCHA solving (timeout after 60 seconds)
      await page.waitForTimeout(60000);
      
      // Check if CAPTCHA is still present
      const captchaSelectors = [
        'iframe[src*="captcha"]',
        '.captcha',
        '#captcha',
        '[class*="captcha"]',
      ];

      for (const selector of captchaSelectors) {
        const captchaElement = await page.$(selector);
        if (captchaElement) {
          logger.logProviderAction(this.providerName, 'captcha_solving', 'still_present');
          return false;
        }
      }

      logger.logProviderAction(this.providerName, 'captcha_solving', 'completed');
      return true;
    } catch (error) {
      logger.logError(error, {
        provider: this.providerName,
        action: 'solveCaptcha',
      });
      return false;
    }
  }

  /**
   * Check action status (not applicable for Zefoy as it's immediate)
   * @param {string} actionId - Action identifier
   * @returns {Promise<Object>} Status result
   */
  async checkActionStatus(actionId) {
    // Zefoy actions are immediate, so we return a default status
    return {
      success: true,
      status: 'completed',
      provider: this.providerName,
      actionId,
      message: 'Zefoy actions are immediate and do not require status checking',
    };
  }
}

module.exports = ZefoyProvider;

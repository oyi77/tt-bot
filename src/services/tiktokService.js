const { v4: uuidv4 } = require('uuid');
const ZefoyProvider = require('./zefoyProvider');
const logger = require('../utils/logger');
const config = require('../config');

class TikTokService {
  constructor() {
    this.providers = new Map();
    this.activeTasks = new Map();
    this.taskHistory = [];
    
    // Initialize providers
    this.initializeProviders();
  }

  /**
   * Initialize all available providers
   */
  initializeProviders() {
    try {
      // Add Zefoy provider
      this.providers.set('zefoy', new ZefoyProvider());
      
      // TODO: Add Freer provider when implemented
      // this.providers.set('freer', new FreerProvider());
      
      logger.info('TikTok service initialized', {
        providerCount: this.providers.size,
        providers: Array.from(this.providers.keys()),
      });
    } catch (error) {
      logger.logError(error, { action: 'initializeProviders' });
    }
  }

  /**
   * Get available action types
   * @returns {Array<string>} List of available action types
   */
  getAvailableActions() {
    return ['views', 'likes', 'shares', 'favorites', 'followers', 'comments'];
  }

  /**
   * Get available providers
   * @returns {Array<string>} List of available provider names
   */
  getAvailableProviders() {
    return Array.from(this.providers.keys());
  }

  /**
   * Get provider statistics
   * @returns {Object} Provider statistics
   */
  getProviderStats() {
    const stats = {};
    
    for (const [name, provider] of this.providers) {
      stats[name] = provider.getStats();
    }
    
    return stats;
  }

  /**
   * Perform a TikTok action
   * @param {string} videoUrl - TikTok video URL
   * @param {string} actionType - Type of action to perform
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Action result
   */
  async performAction(videoUrl, actionType = 'views', options = {}) {
    // Validate inputs
    if (!this.validateVideoUrl(videoUrl)) {
      return {
        success: false,
        error: 'Invalid TikTok video URL',
        timestamp: Date.now(),
      };
    }

    if (!this.getAvailableActions().includes(actionType)) {
      return {
        success: false,
        error: `Invalid action type: ${actionType}`,
        timestamp: Date.now(),
      };
    }

    // Create task
    const taskId = uuidv4();
    const task = {
      id: taskId,
      videoUrl,
      actionType,
      options,
      status: 'pending',
      createdAt: Date.now(),
      attempts: 0,
      maxAttempts: options.maxAttempts || config.tiktok.maxRetries,
    };

    this.activeTasks.set(taskId, task);
    logger.logTikTokAction(actionType, videoUrl, 'system', 'task_created', { taskId });

    try {
      // Find available provider
      const provider = await this.findAvailableProvider(actionType);
      if (!provider) {
        task.status = 'failed';
        task.error = 'No available providers';
        this.completeTask(taskId, task);
        
        return {
          success: false,
          error: 'No available providers for this action',
          taskId,
          timestamp: Date.now(),
        };
      }

      // Update task with provider
      task.provider = provider.providerName;
      task.status = 'running';
      this.activeTasks.set(taskId, task);

      // Perform action
      const result = await this.executeAction(provider, videoUrl, actionType, options);
      
      // Update task with result
      if (result.success) {
        task.status = 'completed';
        task.completedAt = Date.now();
        task.result = result;
      } else {
        task.status = 'failed';
        task.error = result.error;
        task.attempts += 1;
        
        // Retry if possible
        if (task.attempts < task.maxAttempts) {
          task.status = 'retrying';
          logger.logTikTokAction(actionType, videoUrl, provider.providerName, 'retrying', {
            taskId,
            attempt: task.attempts,
            maxAttempts: task.maxAttempts,
          });
          
          // Schedule retry
          setTimeout(() => {
            this.retryTask(taskId);
          }, config.tiktok.retryDelay);
          
          return {
            success: false,
            error: result.error,
            taskId,
            status: 'retrying',
            attempts: task.attempts,
            maxAttempts: task.maxAttempts,
            timestamp: Date.now(),
          };
        }
      }

      this.completeTask(taskId, task);
      return result;
    } catch (error) {
      logger.logError(error, {
        action: 'performAction',
        videoUrl,
        actionType,
        taskId,
      });

      task.status = 'failed';
      task.error = error.message;
      this.completeTask(taskId, task);

      return {
        success: false,
        error: error.message,
        taskId,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Find an available provider for the given action
   * @param {string} actionType - Type of action
   * @returns {Object|null} Available provider or null
   */
  async findAvailableProvider(actionType) {
    const availableProviders = [];

    for (const [, provider] of this.providers) {
      if (provider.checkAvailability()) {
        availableProviders.push(provider);
      }
    }

    if (availableProviders.length === 0) {
      logger.warn('No available providers found', { actionType });
      return null;
    }

    // Sort by error count and last action time (prefer providers with fewer errors and longer time since last action)
    availableProviders.sort((a, b) => {
      const aStats = a.getStats();
      const bStats = b.getStats();
      
      if (aStats.errorCount !== bStats.errorCount) {
        return aStats.errorCount - bStats.errorCount;
      }
      
      return aStats.timeSinceLastAction - bStats.timeSinceLastAction;
    });

    return availableProviders[0];
  }

  /**
   * Execute action with the specified provider
   * @param {Object} provider - Provider instance
   * @param {string} videoUrl - TikTok video URL
   * @param {string} actionType - Type of action
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Action result
   */
  async executeAction(provider, videoUrl, actionType, options) {
    try {
      logger.logTikTokAction(actionType, videoUrl, provider.providerName, 'executing');
      
      const result = await provider.performAction(videoUrl, actionType, options);
      
      logger.logTikTokAction(
        actionType,
        videoUrl,
        provider.providerName,
        result.success ? 'completed' : 'failed',
        { error: result.error },
      );
      
      return result;
    } catch (error) {
      logger.logError(error, {
        provider: provider.providerName,
        action: 'executeAction',
        videoUrl,
        actionType,
      });
      
      return {
        success: false,
        error: error.message,
        provider: provider.providerName,
        actionType,
        videoUrl,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Retry a failed task
   * @param {string} taskId - Task identifier
   */
  async retryTask(taskId) {
    const task = this.activeTasks.get(taskId);
    if (!task || task.status !== 'retrying') {
      return;
    }

    logger.logTikTokAction(task.actionType, task.videoUrl, task.provider, 'retry_started', {
      taskId,
      attempt: task.attempts,
    });

    try {
      const provider = this.providers.get(task.provider);
      if (!provider) {
        throw new Error(`Provider not found: ${task.provider}`);
      }

      const result = await this.executeAction(provider, task.videoUrl, task.actionType, task.options);
      
      if (result.success) {
        task.status = 'completed';
        task.completedAt = Date.now();
        task.result = result;
      } else {
        task.status = 'failed';
        task.error = result.error;
        task.attempts += 1;
      }

      this.completeTask(taskId, task);
    } catch (error) {
      logger.logError(error, {
        action: 'retryTask',
        taskId,
      });

      task.status = 'failed';
      task.error = error.message;
              task.attempts += 1;
      this.completeTask(taskId, task);
    }
  }

  /**
   * Complete a task and move it to history
   * @param {string} taskId - Task identifier
   * @param {Object} task - Task object
   */
  completeTask(taskId, task) {
    this.activeTasks.delete(taskId);
    this.taskHistory.push(task);
    
    // Keep only last 1000 tasks in history
    if (this.taskHistory.length > 1000) {
      this.taskHistory = this.taskHistory.slice(-1000);
    }

    logger.logTikTokAction(
      task.actionType,
      task.videoUrl,
      task.provider || 'system',
      task.status,
      { taskId, duration: Date.now() - task.createdAt },
    );
  }

  /**
   * Get task status
   * @param {string} taskId - Task identifier
   * @returns {Object|null} Task object or null if not found
   */
  getTaskStatus(taskId) {
    // Check active tasks first
    const activeTask = this.activeTasks.get(taskId);
    if (activeTask) {
      return activeTask;
    }

    // Check task history
    return this.taskHistory.find((task) => task.id === taskId) || null;
  }

  /**
   * Get all active tasks
   * @returns {Array<Object>} List of active tasks
   */
  getActiveTasks() {
    return Array.from(this.activeTasks.values());
  }

  /**
   * Get task history
   * @param {number} limit - Maximum number of tasks to return
   * @returns {Array<Object>} List of completed tasks
   */
  getTaskHistory(limit = 100) {
    return this.taskHistory.slice(-limit);
  }

  /**
   * Cancel an active task
   * @param {string} taskId - Task identifier
   * @returns {boolean} Success status
   */
  cancelTask(taskId) {
    const task = this.activeTasks.get(taskId);
    if (!task) {
      return false;
    }

    task.status = 'cancelled';
    task.cancelledAt = Date.now();
    this.completeTask(taskId, task);

    logger.logTikTokAction(task.actionType, task.videoUrl, task.provider || 'system', 'cancelled', { taskId });
    return true;
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
   * Get service statistics
   * @returns {Object} Service statistics
   */
  getStats() {
    const stats = {
      providers: this.getProviderStats(),
      tasks: {
        active: this.activeTasks.size,
        total: this.taskHistory.length + this.activeTasks.size,
        completed: this.taskHistory.filter((t) => t.status === 'completed').length,
        failed: this.taskHistory.filter((t) => t.status === 'failed').length,
        cancelled: this.taskHistory.filter((t) => t.status === 'cancelled').length,
      },
      uptime: Date.now() - this.startTime,
    };

    return stats;
  }

  /**
   * Reset all providers
   */
  resetProviders() {
    for (const [, provider] of this.providers) {
      provider.resetAvailability();
    }
    
    logger.info('All providers reset');
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    // Cancel all active tasks
    for (const taskId of this.activeTasks.keys()) {
      this.cancelTask(taskId);
    }

    logger.info('TikTok service cleanup completed');
  }
}

// Create singleton instance
const tiktokService = new TikTokService();

// Store start time
tiktokService.startTime = Date.now();

module.exports = tiktokService;

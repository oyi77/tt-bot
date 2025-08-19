const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const config = require('./config');
const logger = require('./utils/logger');
const tiktokService = require('./services/tiktokService');
const browserManager = require('./utils/browserManager');

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan('combined', { stream: logger.stream }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.app.environment,
  });
});

// API Routes
app.post('/api/tiktok/action', async (req, res) => {
  try {
    const { videoUrl, actionType, options } = req.body;

    if (!videoUrl) {
      return res.status(400).json({
        success: false,
        error: 'videoUrl is required',
      });
    }

    if (!actionType) {
      return res.status(400).json({
        success: false,
        error: 'actionType is required',
      });
    }

    logger.info('TikTok action request', { videoUrl, actionType, options });

    const result = await tiktokService.performAction(videoUrl, actionType, options);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    logger.logError(error, { action: 'tiktok_action_api' });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

app.get('/api/tiktok/status/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = tiktokService.getTaskStatus(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
    }

    res.json({
      success: true,
      task,
    });
  } catch (error) {
    logger.logError(error, { action: 'get_task_status_api' });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

app.get('/api/tiktok/tasks', async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;
    let tasks;

    if (status === 'active') {
      tasks = tiktokService.getActiveTasks();
    } else {
      tasks = tiktokService.getTaskHistory(parseInt(limit));
    }

    res.json({
      success: true,
      tasks,
      count: tasks.length,
    });
  } catch (error) {
    logger.logError(error, { action: 'get_tasks_api' });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

app.delete('/api/tiktok/tasks/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const cancelled = tiktokService.cancelTask(taskId);

    if (cancelled) {
      res.json({
        success: true,
        message: 'Task cancelled successfully',
        taskId,
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Task not found or already completed',
      });
    }
  } catch (error) {
    logger.logError(error, { action: 'cancel_task_api' });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

app.get('/api/tiktok/stats', async (req, res) => {
  try {
    const stats = tiktokService.getStats();
    const browserStats = browserManager.getStats();

    res.json({
      success: true,
      tiktok: stats,
      browser: browserStats,
    });
  } catch (error) {
    logger.logError(error, { action: 'get_stats_api' });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

app.get('/api/tiktok/actions', async (req, res) => {
  try {
    const actions = tiktokService.getAvailableActions();
    const providers = tiktokService.getAvailableProviders();

    res.json({
      success: true,
      actions,
      providers,
    });
  } catch (error) {
    logger.logError(error, { action: 'get_actions_api' });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

app.post('/api/tiktok/reset', async (req, res) => {
  try {
    tiktokService.resetProviders();
    
    res.json({
      success: true,
      message: 'All providers reset successfully',
    });
  } catch (error) {
    logger.logError(error, { action: 'reset_providers_api' });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.logError(err, { 
    action: 'express_error_middleware',
    url: req.url,
    method: req.method 
  });

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message,
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl,
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  
  try {
    await tiktokService.cleanup();
    await browserManager.closeAllBrowsers();
    
    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.logError(error, { action: 'graceful_shutdown' });
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  
  try {
    await tiktokService.cleanup();
    await browserManager.closeAllBrowsers();
    
    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.logError(error, { action: 'graceful_shutdown' });
    process.exit(1);
  }
});

// Start server
const PORT = config.app.port;
app.listen(PORT, () => {
  logger.info(`Bot Tok server started on port ${PORT}`, {
    environment: config.app.environment,
    port: PORT,
  });
});

module.exports = app;

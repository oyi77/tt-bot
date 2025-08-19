const winston = require('winston');
const path = require('path');
const fs = require('fs-extra');
const config = require('../config');

// Ensure logs directory exists
const logsDir = path.dirname(config.logging.file);
fs.ensureDirSync(logsDir);

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({
    timestamp, level, message, ...meta
  }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      metaStr = ` ${JSON.stringify(meta)}`;
    }
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  }),
);

// Custom format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

// Create logger instance
const logger = winston.createLogger({
  level: config.logging.level,
  format: fileFormat,
  transports: [
    // File transport for all logs
    new winston.transports.File({
      filename: config.logging.file,
      maxsize: config.logging.maxSize,
      maxFiles: config.logging.maxFiles,
    }),
    // Separate file for errors
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: config.logging.maxSize,
      maxFiles: config.logging.maxFiles,
    }),
  ],
});

// Add console transport in development
if (config.app.environment === 'development') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
  }));
}

// Create a stream object for Morgan HTTP logging
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

// Helper methods for specific log types
logger.logTikTokAction = (action, videoUrl, provider, status, details = {}) => {
  logger.info('TikTok Action', {
    action,
    videoUrl,
    provider,
    status,
    ...details,
  });
};

logger.logProviderAction = (provider, action, status, details = {}) => {
  logger.info('Provider Action', {
    provider,
    action,
    status,
    ...details,
  });
};

logger.logSession = (action, sessionId, details = {}) => {
  logger.info('Session', {
    action,
    sessionId,
    ...details,
  });
};

logger.logError = (error, context = {}) => {
  logger.error('Application Error', {
    message: error.message,
    stack: error.stack,
    ...context,
  });
};

module.exports = logger;

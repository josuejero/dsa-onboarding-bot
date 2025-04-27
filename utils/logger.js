import { LOG_CHANNEL } from '../config.js';

/**
 * Log severity levels
 * @readonly
 */
export const LogLevels = Object.freeze({
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  CRITICAL: 'critical'
});

/**
 * Format timestamp for logging
 * @returns {string} Formatted timestamp
 */
function timestamp() {
  return new Date().toISOString();
}

/**
 * Log a message to console and optionally to Discord
 * @param {import('discord.js').Guild} guild - Discord guild
 * @param {string} level - Log level from LogLevels
 * @param {string} message - Log message
 * @param {Object} meta - Additional metadata
 * @returns {Promise<void>}
 */
export async function log(guild, level, message, meta = {}) {
  // Always log to console with timestamp
  const consoleMessage = `[${timestamp()}] [${level.toUpperCase()}] ${message}`;
  
  // Choose console method based on level
  switch (level) {
    case LogLevels.DEBUG:
      console.debug(consoleMessage, meta);
      break;
    case LogLevels.INFO:
      console.info(consoleMessage, meta);
      break;
    case LogLevels.WARN:
      console.warn(consoleMessage, meta);
      break;
    case LogLevels.ERROR:
    case LogLevels.CRITICAL:
      console.error(consoleMessage, meta);
      break;
    default:
      console.log(consoleMessage, meta);
  }
  
  // Log to Discord channel for WARN, ERROR, and CRITICAL levels
  if (
    guild && 
    LOG_CHANNEL && 
    [LogLevels.WARN, LogLevels.ERROR, LogLevels.CRITICAL].includes(level)
  ) {
    try {
      const ch = await guild.channels.fetch(LOG_CHANNEL);
      if (ch?.isTextBased()) {
        // Format emoji based on level
        const emoji = level === LogLevels.WARN ? '⚠️' : 
                     level === LogLevels.ERROR ? '❌' :
                     level === LogLevels.CRITICAL ? '🚨' : '📝';
        
        // Format metadata as string if present
        let metaStr = '';
        if (Object.keys(meta).length > 0) {
          metaStr = '\n```json\n' + JSON.stringify(meta, null, 2) + '\n```';
        }
        
        // Send to channel
        await ch.send(`${emoji} **${level.toUpperCase()}**: ${message}${metaStr}`);
      }
    } catch (e) {
      console.error('Logger failed to send to Discord:', e);
    }
  }
}

// Convenience methods
export const debug = (guild, message, meta) => log(guild, LogLevels.DEBUG, message, meta);
export const info = (guild, message, meta) => log(guild, LogLevels.INFO, message, meta);
export const warn = (guild, message, meta) => log(guild, LogLevels.WARN, message, meta);
export const error = (guild, message, meta) => log(guild, LogLevels.ERROR, message, meta);
export const critical = (guild, message, meta) => log(guild, LogLevels.CRITICAL, message, meta);
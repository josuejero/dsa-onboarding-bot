import { log } from './logger.js';
import { ErrorTypes } from './errorTypes.js';
import { getErrorMessage } from '../config/errorMessages.js';

/**
 * Wraps a handler function with standardized error handling
 * @param {Function} fn - The handler function to wrap
 * @param {Object} options - Options for error handling
 * @param {boolean} options.suppressConsole - Whether to suppress console logging
 * @returns {Function} - The wrapped handler function
 */
export function withErrorHandler(fn, options = {}) {
  return async function(interaction, client) {
    try {
      return await fn(interaction, client);
    } catch (err) {
      // Extract error type and code
      const errorType = err.type || ErrorTypes.UNKNOWN;
      const errorCode = err.code || 'UNKNOWN';
      
      // Determine appropriate user-facing message
      const userMessage = getErrorMessage(errorType, errorCode);
      
      // Log to console (unless suppressed)
      if (!options.suppressConsole) {
        console.error(`[ERROR] ${errorType}:`, err);
      }
      
      // Log to Discord channel
      await log(
        interaction.guild, 
        'error', 
        `[${errorType}] ${err.message} (User: ${interaction.user.tag})`,
        {
          errorType,
          errorCode,
          commandName: interaction.commandName,
          customId: interaction.customId,
          username: interaction.user.tag
        }
      );
      
      // Reply to the user
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ 
          content: userMessage, 
          ephemeral: true 
        }).catch(() => {});
      } else {
        await interaction.reply({ 
          content: userMessage, 
          ephemeral: true 
        }).catch(() => {});
      }
    }
  };
}
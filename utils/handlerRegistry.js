// utils/handlerRegistry.js
/**
 * Central registry for all interaction handlers
 * Provides a consistent interface for registering and retrieving handlers
 */
import { info, error } from './logger.js';
import { withErrorHandler } from './withErrorHandler.js';
import { BotError, ErrorTypes } from './errorTypes.js';

// Handler collections
const buttonHandlers = new Map();
const selectMenuHandlers = new Map();
const modalHandlers = new Map();
const commandHandlers = new Map();

/**
 * Register a button handler
 * @param {string|RegExp} id - Button customId or pattern to match
 * @param {Function} handler - Handler function
 * @param {Object} options - Options for the handler
 */
export function registerButtonHandler(id, handler, options = {}) {
  buttonHandlers.set(id, {
    handler: withErrorHandler(handler, options),
    options
  });
}

/**
 * Register a select menu handler
 * @param {string|RegExp} id - Select menu customId or pattern to match
 * @param {Function} handler - Handler function
 * @param {Object} options - Options for the handler
 */
export function registerSelectMenuHandler(id, handler, options = {}) {
  selectMenuHandlers.set(id, {
    handler: withErrorHandler(handler, options),
    options
  });
}

/**
 * Register a modal handler
 * @param {string|RegExp} id - Modal customId or pattern to match
 * @param {Function} handler - Handler function
 * @param {Object} options - Options for the handler
 */
export function registerModalHandler(id, handler, options = {}) {
  modalHandlers.set(id, {
    handler: withErrorHandler(handler, options),
    options
  });
}

/**
 * Register a command handler
 * @param {string} name - Command name
 * @param {Function} handler - Handler function
 * @param {Object} options - Options for the handler
 */
export function registerCommandHandler(name, handler, options = {}) {
  commandHandlers.set(name, {
    handler: withErrorHandler(handler, options),
    options
  });
}

/**
 * Find handler for a given customId
 * @param {Map} handlers - Map of handlers
 * @param {string} customId - ID to match
 * @returns {Function|null} - Handler function or null if not found
 */
function findHandler(handlers, customId) {
  // First try exact match
  if (handlers.has(customId)) {
    return handlers.get(customId).handler;
  }
  
  // Then try regex patterns
  for (const [pattern, handlerObj] of handlers.entries()) {
    if (pattern instanceof RegExp && pattern.test(customId)) {
      return handlerObj.handler;
    }
  }
  
  return null;
}

/**
 * Get button handler for customId
 * @param {string} customId - Button customId
 * @returns {Function|null} - Handler function or null if not found
 */
export function getButtonHandler(customId) {
  return findHandler(buttonHandlers, customId);
}

/**
 * Get select menu handler for customId
 * @param {string} customId - Select menu customId
 * @returns {Function|null} - Handler function or null if not found
 */
export function getSelectMenuHandler(customId) {
  return findHandler(selectMenuHandlers, customId);
}

/**
 * Get modal handler for customId
 * @param {string} customId - Modal customId
 * @returns {Function|null} - Handler function or null if not found
 */
export function getModalHandler(customId) {
  return findHandler(modalHandlers, customId);
}

/**
 * Get command handler for name
 * @param {string} name - Command name
 * @returns {Function|null} - Handler function or null if not found
 */
export function getCommandHandler(name) {
  if (commandHandlers.has(name)) {
    return commandHandlers.get(name).handler;
  }
  return null;
}

/**
 * Clear all handlers (useful for tests/reloads)
 */
export function clearHandlers() {
  buttonHandlers.clear();
  selectMenuHandlers.clear();
  modalHandlers.clear();
  commandHandlers.clear();
}
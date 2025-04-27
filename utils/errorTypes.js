/**
 * Error types enum to categorize errors
 * @readonly
 */
export const ErrorTypes = Object.freeze({
  PERMISSION: 'permission',
  API: 'api', 
  VALIDATION: 'validation',
  RATE_LIMIT: 'rate_limit',
  DISCORD_API: 'discord_api',
  ROLE_MANAGEMENT: 'role_management',
  CONFIGURATION: 'configuration',
  COMMAND: 'command',
  UNKNOWN: 'unknown'
});

/**
 * Custom error class with type and code
 */
export class BotError extends Error {
  constructor(message, type = ErrorTypes.UNKNOWN, code = null) {
    super(message);
    this.name = 'BotError';
    this.type = type;
    this.code = code;
  }
  
  // Static factory methods for common error types
  static permission(message, code = null) {
    return new BotError(message, ErrorTypes.PERMISSION, code);
  }
  
  static api(message, code = null) {
    return new BotError(message, ErrorTypes.API, code);
  }
  
  static validation(message, code = null) {
    return new BotError(message, ErrorTypes.VALIDATION, code);
  }
  
  static roleManagement(message, code = null) {
    return new BotError(message, ErrorTypes.ROLE_MANAGEMENT, code);
  }
}
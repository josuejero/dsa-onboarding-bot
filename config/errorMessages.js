import { ErrorTypes } from '../utils/errorTypes.js';

/**
 * Get user-facing error message based on type and code
 */
export function getErrorMessage(type, code) {
  // Default fallback message
  const defaultMessage = '❌ There was an error processing your request. Please try again later.';
  
  // Type-specific messages
  const typeMessages = {
    [ErrorTypes.PERMISSION]: '❌ You don\'t have permission to perform this action.',
    [ErrorTypes.API]: '❌ There was an error connecting to an external service. Please try again later.',
    [ErrorTypes.VALIDATION]: '❌ The provided information was invalid. Please check your input and try again.',
    [ErrorTypes.RATE_LIMIT]: '❌ Too many requests. Please wait a moment and try again.',
    [ErrorTypes.DISCORD_API]: '❌ There was an error communicating with Discord. Please try again later.',
    [ErrorTypes.ROLE_MANAGEMENT]: '❌ There was an error managing roles. Please contact an admin.',
    [ErrorTypes.CONFIGURATION]: '❌ There is a configuration issue. Please notify an admin.',
    [ErrorTypes.COMMAND]: '❌ There was an error with this command. Please try again later.',
    [ErrorTypes.UNKNOWN]: defaultMessage
  };
  
  // Specific error code messages
  const codeMessages = {
    // Discord API error codes
    10008: '❌ This message no longer exists.',
    10062: '❌ This interaction has expired.',
    50013: '❌ I don\'t have permission to perform this action.',
    // Custom error codes
    'EMAIL_INVALID': '❌ Please provide a valid email address.',
    'VERIFICATION_FAILED': '❌ Membership verification failed. Please try again or contact an admin.',
  };
  
  // Return specific code message if available
  if (code && codeMessages[code]) {
    return codeMessages[code];
  }
  
  // Return type message if available, otherwise default
  return typeMessages[type] || defaultMessage;
}
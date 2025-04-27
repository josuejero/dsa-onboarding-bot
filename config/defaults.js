// config/defaults.js
export const defaults = {
  // API call rate limiting
  API_RATE_LIMIT: {
    development: {
      MAX_CALLS_PER_MINUTE: 10,
      MINUTE: 60 * 1000,
    },
    production: {
      MAX_CALLS_PER_MINUTE: 30,
      MINUTE: 60 * 1000,
    },
    test: {
      MAX_CALLS_PER_MINUTE: 5,
      MINUTE: 60 * 1000,
    }
  },
  
  // Discord rate limit values
  DISCORD_RATE_LIMIT: {
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000, // Base delay in ms (increases with each retry)
  },
  
  // Logging level
  LOG_LEVEL: {
    development: 'debug',
    production: 'info',
    test: 'debug',
  },
  
  // API Timeouts
  API_TIMEOUT: 10000, // 10 seconds
  
  // Button interaction timeout
  BUTTON_TIMEOUT: 15 * 60 * 1000, // 15 minutes
  
  // Debugging flags
  DEBUG: {
    development: true,
    production: false,
    test: true,
  }
};

// Helper function to get environment-specific defaults
export function getDefaults(nodeEnv = 'development') {
  const env = nodeEnv in defaults.API_RATE_LIMIT ? nodeEnv : 'development';
  
  return {
    API_RATE_LIMIT: defaults.API_RATE_LIMIT[env],
    LOG_LEVEL: defaults.LOG_LEVEL[env],
    DISCORD_RATE_LIMIT: defaults.DISCORD_RATE_LIMIT,
    API_TIMEOUT: defaults.API_TIMEOUT,
    BUTTON_TIMEOUT: defaults.BUTTON_TIMEOUT,
    DEBUG: defaults.DEBUG[env],
  };
}
// services/actionNetwork.js
import axios from 'axios';
import Joi from 'joi';
import config from '../config.js';
import { info, warn, error } from '../utils/logger.js';
import { TokenBucket } from '../utils/rateLimit.js';
import { apiCache } from './cache.js';

// Email validation schema
const emailSchema = Joi.string().email().required();

// Create token bucket: 30 requests max, refills at 1 token per 2 seconds
const rateLimiter = new TokenBucket({
  capacity: config.API_RATE_LIMIT.MAX_CALLS_PER_MINUTE,
  refillRate: config.API_RATE_LIMIT.MAX_CALLS_PER_MINUTE / 60,
  refillInterval: 1000 // refill in 1-second increments
});

// IP rotation if multiple proxies are configured
const PROXY_LIST = config.PROXIES || []; // Add proxy config to your .env
let currentProxyIndex = 0;

function getNextProxy() {
  if (PROXY_LIST.length === 0) return null;
  
  currentProxyIndex = (currentProxyIndex + 1) % PROXY_LIST.length;
  return PROXY_LIST[currentProxyIndex];
}

/**
 * Generate a cache key for Action Network lookups
 * @param {string} email - Email address
 * @returns {string} Cache key
 */
function generateCacheKey(email) {
  // Normalize the email for consistent caching
  return `an_lookup:${email.trim().toLowerCase()}`;
}

/**
 * Look up an email in Action Network with enhanced rate limiting & proxies
 * @param {string} email - Email address
 * @param {Object} options - Options
 * @returns {Promise<boolean>} - Whether email is a DSA member
 */
export async function lookupAN(email, options = {}) {
  const { retries = 2, guildId = null, bypassCache = false } = options;
  
  // Validate email format
  const { error: validationError } = emailSchema.validate(email);
  if (validationError) {
    error(null, `Invalid email format: ${validationError.message}`, { guildId });
    throw new Error(`Invalid email: ${validationError.message}`);
  }
  
  // Normalize email for consistent caching
  const cleanEmail = email.trim().toLowerCase();
  const cacheKey = generateCacheKey(cleanEmail);
  
  // Check cache first (unless bypass requested)
  if (!bypassCache) {
    const cachedResult = apiCache.get(cacheKey);
    if (cachedResult !== null) {
      info(null, `Cache hit for Action Network lookup: ${cleanEmail}`, { guildId });
      return cachedResult;
    }
  }
  
  // Check if we can make an API call
  const canMakeRequest = await rateLimiter.consume(1);
  if (!canMakeRequest) {
    warn(null, `Rate limit exceeded for Action Network API`, { guildId });
    
    if (retries > 0) {
      info(null, `Retrying Action Network lookup in 2 seconds...`, { guildId });
      await new Promise(res => setTimeout(res, 2000));
      return lookupAN(email, { 
        retries: retries - 1,
        guildId,
        bypassCache
      });
    }
    
    throw new Error('API rate limit exceeded. Please try again in a minute.');
  }
  
  const filter = encodeURIComponent(`email_address eq '${cleanEmail}'`);
  const url = `https://actionnetwork.org/api/v2/people?filter=${filter}`;
  
  // Configure request with potential proxy
  const proxy = getNextProxy();
  const requestConfig = {
    headers: { 'OSDI-API-Token': config.AN_TOKEN },
    timeout: config.API_TIMEOUT
  };
  
  if (proxy) {
    requestConfig.proxy = proxy;
  }
  
  try {
    const { data } = await axios.get(url, requestConfig);
    
    const people = data._embedded?.['osdi:people'] || [];
    const isMember = people.some(p => 
      p.custom_fields?.actionkit_is_member_in_good_standing === "True"
    );
    
    // Cache the result
    apiCache.set(cacheKey, isMember, 15 * 60 * 1000); // Cache for 15 minutes
    
    return isMember;
    
  } catch (err) {
    // 429 retry with exponential backoff
    if (err.response?.status === 429 && retries > 0) {
      const retryAfter = Number(err.response.headers['retry-after'] || 5);
      const backoffTime = Math.min(retryAfter * 1000, Math.pow(2, 3 - retries) * 1000);
      
      warn(null, `Rate limited by AN API, backing off for ${backoffTime}ms`, { guildId });
      await new Promise(res => setTimeout(res, backoffTime));
      
      return lookupAN(email, { 
        retries: retries - 1,
        guildId,
        bypassCache
      });
    }
    
    // Log all errors
    if (err.response) {
      error(null, `AN API error (${err.response.status}): ${JSON.stringify(err.response.data)}`, { guildId });
      throw new Error(`Membership verification failed (${err.response.status}): ${err.response.data?.error || 'Unknown error'}`);
    }
    
    if (err.request) {
      error(null, 'AN API no response: ' + err.request, { guildId });
      throw new Error('No response from membership database. Please try again later.');
    }
    
    error(null, 'AN API request error: ' + err.message, { guildId });
    throw new Error(`Verification error: ${err.message}`);
  }
}

/**
 * Clear the Action Network API cache
 */
export function clearANCache() {
  apiCache.clear();
  info(null, 'Action Network cache cleared');
}

/**
 * Get Action Network API cache stats
 */
export function getANCacheStats() {
  return apiCache.getStats();
}
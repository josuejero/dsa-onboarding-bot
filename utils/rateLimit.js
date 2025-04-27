// utils/rateLimit.js
import { error } from './logger.js';

/**
 * Token Bucket Algorithm for rate limiting
 * Handles both API and user/guild rate limiting needs
 */
export class TokenBucket {
  /**
   * Create a new token bucket
   * @param {Object} options
   * @param {number} options.capacity - Maximum tokens
   * @param {number} options.refillRate - Tokens added per interval
   * @param {number} options.refillInterval - Interval in ms
   */
  constructor({ capacity, refillRate, refillInterval = 1000 }) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.refillRate = refillRate;
    this.refillInterval = refillInterval;
    this.lastRefill = Date.now();
    this.userBuckets = new Map();
    this.guildBuckets = new Map();
  }
  
  /**
   * Refill tokens based on elapsed time
   * @private
   */
  _refill() {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const intervalsElapsed = Math.floor(timePassed / this.refillInterval);
    
    if (intervalsElapsed > 0) {
      this.tokens = Math.min(
        this.capacity, 
        this.tokens + (intervalsElapsed * this.refillRate)
      );
      this.lastRefill = now;
    }
  }
  
  /**
   * Consume tokens if available
   * @param {number} count - Tokens to consume
   * @returns {Promise<boolean>} - Whether tokens were consumed
   */
  async consume(count = 1) {
    this._refill();
    
    if (this.tokens >= count) {
      this.tokens -= count;
      return true;
    }
    
    return false;
  }
  
  /**
   * Get a user-specific bucket
   * @param {string} userId 
   * @returns {TokenBucket}
   */
  forUser(userId) {
    if (!this.userBuckets.has(userId)) {
      this.userBuckets.set(userId, new TokenBucket({
        capacity: this.capacity,
        refillRate: this.refillRate,
        refillInterval: this.refillInterval
      }));
    }
    
    return this.userBuckets.get(userId);
  }
  
  /**
   * Get a guild-specific bucket
   * @param {string} guildId 
   * @returns {TokenBucket}
   */
  forGuild(guildId) {
    if (!this.guildBuckets.has(guildId)) {
      this.guildBuckets.set(guildId, new TokenBucket({
        capacity: this.capacity,
        refillRate: this.refillRate,
        refillInterval: this.refillInterval
      }));
    }
    
    return this.guildBuckets.get(guildId);
  }
}

/**
 * Command rate limiter with per-user tracking
 */
export const commandRateLimiter = new TokenBucket({
  capacity: 10,  // 10 commands
  refillRate: 2, // 2 per minute
  refillInterval: 30000 // 30 seconds
});
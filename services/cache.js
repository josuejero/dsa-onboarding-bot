// services/cache.js
import { debug, info } from '../utils/logger.js';

/**
 * Simple in-memory cache with TTL support
 */
class Cache {
  constructor(options = {}) {
    this.cache = new Map();
    this.defaultTTL = options.defaultTTL || 3600000; // Default: 1 hour
    this.maxSize = options.maxSize || 1000;
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0
    };

    // Start cleanup interval
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // Every minute
  }

  /**
   * Get an item from the cache
   * @param {string} key - Cache key
   * @returns {*|null} - Cached value or null if not found/expired
   */
  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      this.stats.misses++;
      return null;
    }
    
    // Check if expired
    if (item.expiry < Date.now()) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }
    
    this.stats.hits++;
    return item.value;
  }

  /**
   * Store an item in the cache
   * @param {string} key - Cache key
   * @param {*} value - Value to store
   * @param {number|null} ttl - TTL in ms, null for default
   */
  set(key, value, ttl = null) {
    // Evict items if we're at capacity
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }
    
    const expiry = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { value, expiry });
    
    debug(null, `Cache: set key "${key}"`);
  }

  /**
   * Remove an item from the cache
   * @param {string} key - Cache key
   */
  delete(key) {
    return this.cache.delete(key);
  }

  /**
   * Check if key exists and isn't expired
   * @param {string} key - Cache key
   * @returns {boolean}
   */
  has(key) {
    const item = this.cache.get(key);
    if (!item) return false;
    if (item.expiry < Date.now()) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Clear all items from the cache
   */
  clear() {
    this.cache.clear();
    debug(null, 'Cache cleared');
  }

  /**
   * Remove expired items
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (item.expiry < now) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      debug(null, `Cache cleanup: removed ${cleaned} expired items`);
    }
  }

  /**
   * Evict the oldest item from the cache
   * @private
   */
  evictOldest() {
    let oldestKey = null;
    let oldestTime = Infinity;
    
    for (const [key, item] of this.cache.entries()) {
      if (item.expiry < oldestTime) {
        oldestTime = item.expiry;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evictions++;
      debug(null, `Cache eviction: removed oldest key "${oldestKey}"`);
    }
  }

  /**
   * Stop the cleanup interval
   */
  dispose() {
    clearInterval(this.cleanupInterval);
  }

  /**
   * Get cache statistics
   * @returns {Object} Stats object
   */
  getStats() {
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses || 1)
    };
  }
}

// Export a singleton instance for Action Network API caching
export const apiCache = new Cache({ 
  defaultTTL: 15 * 60 * 1000, // 15 minutes
  maxSize: 500
});

// Export the class for custom cache instances
export default Cache;
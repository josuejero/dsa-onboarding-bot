// db/models/user.js
import { getDb } from '../index.js';
import { info, error } from '../../utils/logger.js';

/**
 * Get a user by Discord ID
 * @param {string} discordId - Discord user ID
 * @returns {Promise<Object|null>} User data or null if not found
 */
export async function getUser(discordId) {
  try {
    const db = await getDb();
    return await db.get('SELECT * FROM users WHERE discord_id = ?', discordId);
  } catch (err) {
    error(null, `Database error in getUser: ${err.message}`, { discordId });
    return null;
  }
}

/**
 * Create or update a user
 * @param {string} discordId - Discord user ID
 * @param {Object} userData - User data
 * @returns {Promise<boolean>} Success status
 */
export async function saveUser(discordId, userData) {
  try {
    const db = await getDb();
    const { email, is_member, verification_date } = userData;
    
    // Check if user exists
    const existingUser = await getUser(discordId);
    
    if (existingUser) {
      // Update existing user
      await db.run(
        `UPDATE users SET 
          email = COALESCE(?, email),
          is_member = COALESCE(?, is_member),
          verification_date = COALESCE(?, verification_date),
          last_active = CURRENT_TIMESTAMP
        WHERE discord_id = ?`,
        email, is_member, verification_date, discordId
      );
    } else {
      // Create new user
      await db.run(
        `INSERT INTO users 
          (discord_id, email, is_member, verification_date, last_active) 
        VALUES 
          (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        discordId, email, is_member, verification_date
      );
    }
    
    return true;
  } catch (err) {
    error(null, `Database error in saveUser: ${err.message}`, { discordId });
    return false;
  }
}

/**
 * Record user verification status
 * @param {string} discordId - Discord user ID
 * @param {string} email - Email address
 * @param {boolean} isMember - Whether user is a DSA member
 * @returns {Promise<boolean>} Success status
 */
export async function recordVerification(discordId, email, isMember) {
  return await saveUser(discordId, {
    email,
    is_member: isMember ? 1 : 0,
    verification_date: new Date().toISOString()
  });
}

/**
 * Find user by email
 * @param {string} email - Email address
 * @returns {Promise<Object|null>} User data or null if not found
 */
export async function findUserByEmail(email) {
  try {
    const db = await getDb();
    return await db.get('SELECT * FROM users WHERE email = ?', email);
  } catch (err) {
    error(null, `Database error in findUserByEmail: ${err.message}`, { email });
    return null;
  }
}

/**
 * Update last active timestamp
 * @param {string} discordId - Discord user ID
 * @returns {Promise<boolean>} Success status
 */
export async function updateLastActive(discordId) {
  try {
    const db = await getDb();
    await db.run(
      'UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE discord_id = ?',
      discordId
    );
    return true;
  } catch (err) {
    error(null, `Database error in updateLastActive: ${err.message}`, { discordId });
    return false;
  }
}

/**
 * Get recently active users
 * @param {number} days - Number of days
 * @param {number} limit - Maximum number of users to return
 * @returns {Promise<Array>} List of active users
 */
export async function getActiveUsers(days = 30, limit = 100) {
  try {
    const db = await getDb();
    return await db.all(
      `SELECT * FROM users 
      WHERE last_active > datetime('now', '-${days} days') 
      ORDER BY last_active DESC
      LIMIT ?`,
      limit
    );
  } catch (err) {
    error(null, `Database error in getActiveUsers: ${err.message}`);
    return [];
  }
}
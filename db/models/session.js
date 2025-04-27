// db/models/session.js
import { getDb } from '../index.js';
import { info, error } from '../../utils/logger.js';

/**
 * Get a user session
 * @param {string} userId - Discord user ID
 * @returns {Promise<Object|null>} Session data or null if not found
 */
export async function getSession(userId) {
  try {
    const db = await getDb();
    const row = await db.get(
      'SELECT data, updated_at FROM sessions WHERE discord_id = ? ORDER BY updated_at DESC LIMIT 1',
      userId
    );
    
    if (!row) return null;
    
    try {
      return JSON.parse(row.data);
    } catch (parseErr) {
      error(null, `Failed to parse session data: ${parseErr.message}`, { userId });
      return null;
    }
  } catch (err) {
    error(null, `Database error in getSession: ${err.message}`, { userId });
    return null;
  }
}

/**
 * Save a user session
 * @param {string} userId - Discord user ID
 * @param {Object} data - Session data
 * @returns {Promise<boolean>} Success status
 */
export async function saveSession(userId, data) {
  try {
    const db = await getDb();
    
    // Ensure user exists in users table (for foreign key)
    await db.run(
      'INSERT OR IGNORE INTO users (discord_id, created_at) VALUES (?, CURRENT_TIMESTAMP)',
      userId
    );
    
    // Get existing session or create new
    const existingSession = await db.get(
      'SELECT id FROM sessions WHERE discord_id = ? ORDER BY updated_at DESC LIMIT 1',
      userId
    );
    
    if (existingSession) {
      // Update existing session
      await db.run(
        'UPDATE sessions SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        JSON.stringify(data),
        existingSession.id
      );
    } else {
      // Create new session
      await db.run(
        'INSERT INTO sessions (discord_id, data, created_at, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
        userId,
        JSON.stringify(data)
      );
    }
    
    return true;
  } catch (err) {
    error(null, `Database error in saveSession: ${err.message}`, { userId });
    return false;
  }
}

/**
 * Delete a user session
 * @param {string} userId - Discord user ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteSession(userId) {
  try {
    const db = await getDb();
    await db.run('DELETE FROM sessions WHERE discord_id = ?', userId);
    return true;
  } catch (err) {
    error(null, `Database error in deleteSession: ${err.message}`, { userId });
    return false;
  }
}

/**
 * Clean up old sessions
 * @param {number} maxAgeDays - Max age in days
 * @returns {Promise<number>} Number of sessions deleted
 */
export async function cleanupSessions(maxAgeDays = 30) {
  try {
    const db = await getDb();
    const result = await db.run(
      `DELETE FROM sessions WHERE updated_at < datetime('now', '-${maxAgeDays} days')`
    );
    return result.changes;
  } catch (err) {
    error(null, `Database error in cleanupSessions: ${err.message}`);
    return 0;
  }
}

/**
 * SessionStore API compatible with the in-memory version
 */
export const sessionStore = {
  get: async (userId) => {
    return await getSession(userId);
  },
  
  set: async (userId, data) => {
    return await saveSession(userId, data);
  },
  
  update: async (userId, partialData) => {
    const existingData = await getSession(userId) || {};
    return await saveSession(userId, { ...existingData, ...partialData });
  },
  
  delete: async (userId) => {
    return await deleteSession(userId);
  }
};
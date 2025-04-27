// db/models/audit.js
import { getDb } from '../index.js';
import { info, error } from '../../utils/logger.js';

/**
 * Add an entry to the audit log
 * @param {string} discordId - Discord user ID
 * @param {string} eventType - Type of event
 * @param {Object} details - Event details
 * @param {string} guildId - Guild ID
 * @returns {Promise<boolean>} Success status
 */
export async function addAuditEntry(discordId, eventType, details = {}, guildId = null) {
  try {
    const db = await getDb();
    
    await db.run(
      `INSERT INTO audit_log 
        (discord_id, event_type, details, guild_id) 
      VALUES 
        (?, ?, ?, ?)`,
      discordId, eventType, JSON.stringify(details), guildId
    );
    
    return true;
  } catch (err) {
    error(null, `Database error in addAuditEntry: ${err.message}`, { 
      discordId, eventType 
    });
    return false;
  }
}

/**
 * Get audit entries for a user
 * @param {string} discordId - Discord user ID
 * @param {number} limit - Maximum number of entries to return
 * @returns {Promise<Array>} List of audit entries
 */
export async function getUserAuditEntries(discordId, limit = 100) {
  try {
    const db = await getDb();
    
    const entries = await db.all(
      `SELECT * FROM audit_log 
      WHERE discord_id = ? 
      ORDER BY created_at DESC
      LIMIT ?`,
      discordId, limit
    );
    
    // Parse JSON details
    return entries.map(entry => ({
      ...entry,
      details: JSON.parse(entry.details || '{}')
    }));
  } catch (err) {
    error(null, `Database error in getUserAuditEntries: ${err.message}`, { discordId });
    return [];
  }
}

/**
 * Get audit entries by event type
 * @param {string} eventType - Type of event
 * @param {number} limit - Maximum number of entries to return
 * @returns {Promise<Array>} List of audit entries
 */
export async function getAuditEntriesByType(eventType, limit = 100) {
  try {
    const db = await getDb();
    
    const entries = await db.all(
      `SELECT * FROM audit_log 
      WHERE event_type = ? 
      ORDER BY created_at DESC
      LIMIT ?`,
      eventType, limit
    );
    
    // Parse JSON details
    return entries.map(entry => ({
      ...entry,
      details: JSON.parse(entry.details || '{}')
    }));
  } catch (err) {
    error(null, `Database error in getAuditEntriesByType: ${err.message}`, { eventType });
    return [];
  }
}

/**
 * Record role change in audit log
 * @param {string} discordId - Discord user ID
 * @param {string} roleId - Role ID
 * @param {string} guildId - Guild ID
 * @param {'add'|'remove'} action - Whether role was added or removed
 * @returns {Promise<boolean>} Success status
 */
export async function recordRoleChange(discordId, roleId, guildId, action) {
  return await addAuditEntry(
    discordId,
    'ROLE_CHANGE',
    { roleId, action },
    guildId
  );
}

/**
 * Record verification attempt in audit log
 * @param {string} discordId - Discord user ID
 * @param {string} email - Email address
 * @param {string} guildId - Guild ID
 * @param {boolean} success - Whether verification succeeded
 * @param {string} reason - Failure reason (if applicable)
 * @returns {Promise<boolean>} Success status
 */
export async function recordVerificationAttempt(discordId, email, guildId, success, reason = null) {
  return await addAuditEntry(
    discordId,
    success ? 'VERIFICATION_SUCCESS' : 'VERIFICATION_FAILURE',
    { email, reason },
    guildId
  );
}
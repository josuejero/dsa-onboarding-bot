// services/securityAudit.js
import { LOG_CHANNEL } from '../config.js';
import { error, info } from '../utils/logger.js';

// In-memory storage for security events (consider using a database in production)
const securityEvents = [];
const suspiciousUsers = new Map(); // userId -> count of suspicious actions

/**
 * Record a security event
 * @param {Object} event 
 */
export function recordSecurityEvent(event) {
  const { userId, type, details, guildId } = event;
  const timestamp = new Date().toISOString();
  
  const securityEvent = {
    userId,
    type,
    details,
    guildId,
    timestamp
  };
  
  // Add to in-memory log
  securityEvents.push(securityEvent);
  
  // Track suspicious users
  if (event.suspicious) {
    if (!suspiciousUsers.has(userId)) {
      suspiciousUsers.set(userId, 0);
    }
    suspiciousUsers.set(userId, suspiciousUsers.get(userId) + 1);
    
    // Alert if user reaches suspicious threshold
    if (suspiciousUsers.get(userId) >= 3) {
      alertSuspiciousActivity(userId, guildId);
    }
  }
  
  // Limit in-memory storage
  if (securityEvents.length > 1000) {
    securityEvents.shift();
  }
  
  return securityEvent;
}

/**
 * Alert about suspicious user activity
 * @param {string} userId 
 * @param {string} guildId 
 */
async function alertSuspiciousActivity(userId, guildId) {
  try {
    // Log the alert
    error(null, `SECURITY ALERT: User ${userId} has performed multiple suspicious actions`, {
      userId,
      suspiciousCount: suspiciousUsers.get(userId)
    });
    
    // Get user events
    const userEvents = securityEvents.filter(e => e.userId === userId);
    
    // If we have a guild client, send to security log channel
    if (guildId && LOG_CHANNEL) {
      const guild = await global.client?.guilds.fetch(guildId).catch(() => null);
      if (guild) {
        const channel = await guild.channels.fetch(LOG_CHANNEL).catch(() => null);
        if (channel?.isTextBased()) {
          const eventList = userEvents
            .slice(-5)
            .map(e => `- ${e.timestamp}: ${e.type} (${e.details})`)
            .join('\n');
          
          await channel.send(
            `🚨 **SECURITY ALERT**: User <@${userId}> has performed ${suspiciousUsers.get(userId)} suspicious actions!\n\nRecent events:\n${eventList}`
          );
        }
      }
    }
  } catch (err) {
    console.error('Failed to send security alert:', err);
  }
}

/**
 * Record a failed verification attempt
 * @param {string} userId 
 * @param {string} email 
 * @param {string} guildId 
 * @param {string} reason 
 */
export function recordFailedVerification(userId, email, guildId, reason) {
  return recordSecurityEvent({
    userId,
    type: 'FAILED_VERIFICATION',
    details: `Failed verification with email: ${email}. Reason: ${reason}`,
    guildId,
    suspicious: true
  });
}

/**
 * Record a successful verification
 * @param {string} userId 
 * @param {string} email 
 * @param {string} guildId 
 */
export function recordSuccessfulVerification(userId, email, guildId) {
  return recordSecurityEvent({
    userId,
    type: 'SUCCESSFUL_VERIFICATION',
    details: `Verified with email: ${email}`,
    guildId,
    suspicious: false
  });
}

/**
 * Record a role change
 * @param {string} userId 
 * @param {string} roleId 
 * @param {string} guildId 
 * @param {'add'|'remove'} action 
 */
export function recordRoleChange(userId, roleId, guildId, action) {
  return recordSecurityEvent({
    userId,
    type: 'ROLE_CHANGE',
    details: `${action.toUpperCase()}ED role ${roleId}`,
    guildId,
    suspicious: false
  });
}

/**
 * Get all security events for a user
 * @param {string} userId 
 * @returns {Array}
 */
export function getUserEvents(userId) {
  return securityEvents.filter(e => e.userId === userId);
}
// utils/roleManager.js
import { PermissionsBitField } from 'discord.js';
import { info, warn, error } from './logger.js';
import { recordRoleChange } from '../db/models/audit.js';
import { BotError, ErrorTypes } from './errorTypes.js';

/**
 * Safely add or remove a role from a guild member
 * @param {import('discord.js').GuildMember} member - Member to modify
 * @param {string} roleId - Role ID to add/remove
 * @param {'add'|'remove'} operation - Whether to add or remove
 * @param {Object} options - Additional options
 * @returns {Promise<boolean>} - Whether operation succeeded
 */
export async function safeRoleAssignment(member, roleId, operation = 'add', options = {}) {
  const { maxRetries = 3, recordAudit = true } = options;
  const guild = member.guild;

  try {
    // Fetch the role
    const role = await guild.roles.fetch(roleId).catch(() => null);
    if (!role) {
      throw new BotError(
        `Role with ID ${roleId} does not exist`,
        ErrorTypes.ROLE_MANAGEMENT,
        'ROLE_NOT_FOUND'
      );
    }

    // Ensure bot has Manage Roles permission
    const botMember = await guild.members.fetch(guild.client.user.id);
    if (!botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      throw new BotError(
        'Bot lacks required permission: Manage Roles',
        ErrorTypes.PERMISSION,
        'BOT_MISSING_PERMISSION'
      );
    }

    // Check role hierarchy
    if (role.position >= botMember.roles.highest.position) {
      throw new BotError(
        `Cannot modify role ${role.name}: positioned higher than bot's roles`,
        ErrorTypes.PERMISSION,
        'ROLE_HIERARCHY_VIOLATION'
      );
    }

    // If member already has/doesn't have the role, skip operation
    const hasRole = member.roles.cache.has(roleId);
    if ((operation === 'add' && hasRole) || (operation === 'remove' && !hasRole)) {
      return true;
    }

    // Perform role change with retries
    let attempts = 0;
    while (attempts < maxRetries) {
      try {
        if (operation === 'add') {
          await member.roles.add(role);
        } else if (operation === 'remove') {
          await member.roles.remove(role);
        } else {
          throw new BotError(
            `Invalid operation: ${operation}`,
            ErrorTypes.VALIDATION,
            'INVALID_ROLE_OPERATION'
          );
        }
        
        // Record the change if requested
        if (recordAudit) {
          recordRoleChange(member.id, roleId, guild.id, operation);
        }
        
        return true;
      } catch (err) {
        attempts++;
        warn(guild, `Attempt ${attempts}/${maxRetries} failed to ${operation} role ${role.name}:`, {
          userId: member.id,
          roleId,
          error: err.message
        });

        // If rate-limited or transient, wait and retry
        if ([429, 10008, 10029].includes(err.code)) {
          await new Promise(res => setTimeout(res, 1000 * attempts));
          continue;
        }

        // For other errors, do not retry
        throw err;
      }
    }

    throw new BotError(
      `Failed to ${operation} role ${role.name} after ${maxRetries} attempts`,
      ErrorTypes.ROLE_MANAGEMENT,
      'MAX_RETRIES_EXCEEDED'
    );
  } catch (err) {
    if (err instanceof BotError) throw err;
    
    throw new BotError(
      `Error in role management: ${err.message}`,
      ErrorTypes.ROLE_MANAGEMENT,
      err.code
    );
  }
}

/**
 * Update roles in batch (add some, remove others)
 * @param {import('discord.js').GuildMember} member - Member to modify
 * @param {string[]} rolesToAdd - Role IDs to add
 * @param {string[]} rolesToRemove - Role IDs to remove
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - Results of operations
 */
export async function batchUpdateRoles(member, rolesToAdd = [], rolesToRemove = [], options = {}) {
  const { recordAudit = true, maxRetries = 3 } = options;
  const guild = member.guild;

  // Skip if no changes needed
  if (rolesToAdd.length === 0 && rolesToRemove.length === 0) {
    return { added: [], removed: [], failed: [] };
  }
  
  // Log the planned changes
  info(guild, `Batch role update for ${member.user.tag}: +${rolesToAdd.length}/-${rolesToRemove.length} roles`, {
    userId: member.id,
    adding: rolesToAdd,
    removing: rolesToRemove
  });
  
  try {
    // Prepare final role set by getting current roles
    const currentRoleIds = [...member.roles.cache.keys()];
    
    // Create new role set: remove the roles to remove, add the roles to add
    const newRoleIds = currentRoleIds
      .filter(id => !rolesToRemove.includes(id))
      .concat(rolesToAdd.filter(id => !currentRoleIds.includes(id)));
    
    // If no actual changes, skip update
    if (JSON.stringify(currentRoleIds.sort()) === JSON.stringify(newRoleIds.sort())) {
      return { added: [], removed: [], failed: [] };
    }
    
    // Ensure bot has permissions
    const botMember = await guild.members.fetch(guild.client.user.id);
    if (!botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      throw new BotError(
        'Bot lacks required permission: Manage Roles',
        ErrorTypes.PERMISSION,
        'BOT_MISSING_PERMISSION'
      );
    }
    
    // Check role hierarchy for all roles
    const rolesToCheck = [...new Set([...rolesToAdd, ...rolesToRemove])];
    const highestBotRole = botMember.roles.highest.position;
    
    for (const roleId of rolesToCheck) {
      const role = await guild.roles.fetch(roleId).catch(() => null);
      if (!role) {
        warn(guild, `Role ID ${roleId} not found, skipping`, { userId: member.id });
        continue;
      }
      
      if (role.position >= highestBotRole) {
        warn(guild, `Role ${role.name} (${roleId}) positioned higher than bot's roles, skipping`, { userId: member.id });
        continue;
      }
    }
    
    // Attempt the batch update with retries
    let attempts = 0;
    let success = false;
    let lastError = null;
    
    while (attempts < maxRetries && !success) {
      try {
        // Use setRoles for a true atomic operation
        await member.roles.set(newRoleIds);
        success = true;
      } catch (err) {
        attempts++;
        lastError = err;
        warn(guild, `Batch role update failed (attempt ${attempts}/${maxRetries}): ${err.message}`, {
          userId: member.id
        });
        
        // If rate-limited, wait and retry
        if (err.code === 429) {
          const retryAfter = err.httpStatus === 429 ? err.retryAfter : 1;
          await new Promise(res => setTimeout(res, retryAfter * 1000));
          continue;
        }
        
        // For serious errors, bail out and try individual updates
        if (attempts >= maxRetries || ![429, 10008, 10029].includes(err.code)) {
          warn(guild, 'Batch role update failed, falling back to individual updates');
          break;
        }
      }
    }
    
    // If batch update succeeded
    if (success) {
      // Record individual changes for audit log
      if (recordAudit) {
        // Only audit roles that actually changed
        const actuallyAdded = rolesToAdd.filter(id => !currentRoleIds.includes(id));
        const actuallyRemoved = rolesToRemove.filter(id => currentRoleIds.includes(id));
        
        for (const roleId of actuallyAdded) {
          recordRoleChange(member.id, roleId, guild.id, 'add');
        }
        for (const roleId of actuallyRemoved) {
          recordRoleChange(member.id, roleId, guild.id, 'remove');
        }
      }
      
      return {
        added: rolesToAdd,
        removed: rolesToRemove,
        failed: []
      };
    }
    
    // If batch update failed, fall back to individual updates
    warn(guild, 'Falling back to individual role updates', { userId: member.id });
    
    const results = {
      added: [],
      removed: [],
      failed: []
    };
    
    // Process removals first
    for (const roleId of rolesToRemove) {
      try {
        await safeRoleAssignment(member, roleId, 'remove', { recordAudit, maxRetries: 2 });
        results.removed.push(roleId);
      } catch (err) {
        warn(guild, `Failed to remove role ${roleId}:`, {
          userId: member.id,
          error: err.message
        });
        results.failed.push({ roleId, operation: 'remove', error: err.message });
      }
    }

    // Then process additions
    for (const roleId of rolesToAdd) {
      try {
        await safeRoleAssignment(member, roleId, 'add', { recordAudit, maxRetries: 2 });
        results.added.push(roleId);
      } catch (err) {
        warn(guild, `Failed to add role ${roleId}:`, {
          userId: member.id,
          error: err.message
        });
        results.failed.push({ roleId, operation: 'add', error: err.message });
      }
    }
    
    return results;
  } catch (err) {
    if (err instanceof BotError) throw err;
    
    throw new BotError(
      `Batch role update error: ${err.message}`,
      ErrorTypes.ROLE_MANAGEMENT,
      err.code
    );
  }
}

/**
 * Update roles based on keys in a role map
 * @param {import('discord.js').GuildMember} member - Member to modify
 * @param {Object} roleMap - Map of keys to role IDs
 * @param {string[]} selectedKeys - Keys selected by the user
 * @param {string[]} allKeys - All possible keys in this category
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - Results of operations
 */
export async function updateRolesByKeys(member, roleMap, selectedKeys = [], allKeys = [], options = {}) {
  // If allKeys not provided, use all keys from the roleMap
  if (!allKeys.length) {
    allKeys = Object.keys(roleMap);
  }
  
  // Determine which roles to add/remove
  const rolesToAdd = selectedKeys
    .map(key => roleMap[key])
    .filter(Boolean);
    
  const rolesToRemove = allKeys
    .filter(key => !selectedKeys.includes(key))
    .map(key => roleMap[key])
    .filter(Boolean);
  
  // Perform the batch update
  return batchUpdateRoles(member, rolesToAdd, rolesToRemove, options);
}
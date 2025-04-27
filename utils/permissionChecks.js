// utils/permissionChecks.js
import { PermissionsBitField } from 'discord.js';
import { error } from './logger.js';
import { BotError, ErrorTypes } from './errorTypes.js';

/**
 * Command permission requirements map
 */
const COMMAND_PERMISSIONS = {
  'verify': [],
  'onboard': [PermissionsBitField.Flags.ManageGuild],
  'confirm-affiliate': [PermissionsBitField.Flags.ManageRoles],
  'roles': [],
  'rules': [],
  'help': []
};

/**
 * Check if user has required permissions for a command
 * @param {import('discord.js').GuildMember} member 
 * @param {string} commandName 
 * @returns {boolean}
 * @throws {BotError} If permissions check fails
 */
export function checkCommandPermissions(member, commandName) {
  // Default to no special permissions required
  const requiredPermissions = COMMAND_PERMISSIONS[commandName] || [];
  
  // Skip check if no permissions required
  if (requiredPermissions.length === 0) return true;
  
  // Check member permissions
  const missingPermissions = requiredPermissions.filter(
    perm => !member.permissions.has(perm)
  );
  
  if (missingPermissions.length > 0) {
    throw BotError.permission(
      `Missing required permissions for ${commandName}`,
      'MISSING_PERMISSIONS'
    );
  }
  
  return true;
}

/**
 * Check if a button interaction is allowed
 * @param {import('discord.js').ButtonInteraction} interaction 
 * @returns {boolean}
 */
export function canUseButton(interaction) {
  // Admin buttons are prefixed with 'admin_'
  if (interaction.customId.startsWith('admin_')) {
    const hasManageRoles = interaction.member.permissions.has(
      PermissionsBitField.Flags.ManageRoles
    );
    
    if (!hasManageRoles) {
      throw BotError.permission(
        'This button requires Manage Roles permission',
        'ADMIN_BUTTON'
      );
    }
  }
  
  return true;
}

/**
 * Ensures the bot has permission to manage roles in the guild,
 * and returns the bot's highest role position for hierarchy checks.
 * @param {import('discord.js').Guild} guild
 * @returns {Promise<number>} The position of the bot's highest role.
 * @throws {BotError} If the bot lacks Manage Roles permission.
 */
export async function ensureBotHasRolePermissions(guild) {
  try {
    // Fetch the bot as a GuildMember
    const botMember = await guild.members.fetch(guild.client.user.id);

    // Check that the bot has the Manage Roles permission
    if (!botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      throw BotError.permission(
        'Bot lacks required permission: Manage Roles',
        'BOT_MISSING_PERMISSION'
      );
    }

    // Return the position of the bot's highest role for hierarchy comparisons
    return botMember.roles.highest.position;
  } catch (err) {
    if (err instanceof BotError) throw err;
    
    error(guild, `Failed to check bot permissions: ${err.message}`);
    throw BotError.permission(
      'Failed to verify bot permissions',
      'PERMISSION_CHECK_FAILED'
    );
  }
}
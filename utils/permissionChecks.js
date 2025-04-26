// utils/permissionChecks.js
import { PermissionsBitField } from 'discord.js';

/**
 * Ensures the bot has permission to manage roles in the guild,
 * and returns the bot's highest role position for hierarchy checks.
 * @param {import('discord.js').Guild} guild
 * @returns {Promise<number>} The position of the bot's highest role.
 * @throws {Error} If the bot lacks Manage Roles permission.
 */
export async function ensureBotHasRolePermissions(guild) {
  // Fetch the bot as a GuildMember
  const botMember = await guild.members.fetch(guild.client.user.id);

  // Check that the bot has the Manage Roles permission
  if (!botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
    throw new Error('Bot lacks required permission: Manage Roles');
  }

  // Return the position of the bot's highest role for hierarchy comparisons
  return botMember.roles.highest.position;
}

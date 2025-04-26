// utils/roleManager.js
import { PermissionsBitField } from 'discord.js';

/**
 * Safely add or remove a role from a guild member, with retries and hierarchy checks.
 * @param {import('discord.js').GuildMember} member
 * @param {string} roleId – The ID of the role to modify
 * @param {'add'|'remove'} operation – Whether to add or remove the role
 * @param {number} maxRetries – How many times to retry on transient errors
 * @returns {Promise<boolean>} True if the operation succeeded
 * @throws {Error} On invalid parameters, missing permissions, hierarchy violations, or permanent failures
 */
export async function safeRoleAssignment(member, roleId, operation = 'add', maxRetries = 3) {
  const guild = member.guild;

  // Fetch the role and validate it exists
  const role = await guild.roles.fetch(roleId).catch(() => null);
  if (!role) {
    throw new Error(`Role with ID ${roleId} does not exist`);
  }

  // Ensure the bot has Manage Roles permission
  const botMember = await guild.members.fetch(guild.client.user.id);
  if (!botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
    throw new Error('Bot lacks required permission: Manage Roles');
  }

  // Check role hierarchy: bot cannot modify roles at or above its highest role
  if (role.position >= botMember.roles.highest.position) {
    throw new Error(`Cannot modify role ${role.name}: positioned higher than bot's roles`);
  }

  let attempts = 0;
  while (attempts < maxRetries) {
    try {
      if (operation === 'add') {
        await member.roles.add(role);
      } else if (operation === 'remove') {
        await member.roles.remove(role);
      } else {
        throw new Error(`Invalid operation: ${operation}`);
      }
      return true; // success
    } catch (error) {
      attempts++;
      console.error(`Attempt ${attempts}/${maxRetries} failed to ${operation} role ${role.name}:`, error);

      // If rate-limited or transient, wait and retry
      if ([429, 10008, 10029].includes(error.code)) {
        await new Promise(res => setTimeout(res, 1000 * attempts));
        continue;
      }

      // For other errors, do not retry
      throw error;
    }
  }

  throw new Error(`Failed to ${operation} role ${role.name} after ${maxRetries} attempts`);
}

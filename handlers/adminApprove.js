// handlers/adminApprove.js
import { ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { info, warn, error } from '../utils/logger.js';
import { BotError, ErrorTypes } from '../utils/errorTypes.js';
import { safeRoleAssignment } from '../utils/roleManager.js';
import { recordRoleChange } from '../services/securityAudit.js';
import {
  ROLE_AFFILIATE_UNVERIFIED,
  ROLE_AFFILIATE,
  LOG_CHANNEL
} from '../config.js';

export async function handleAdminVerifyApprove(interaction) {
  if (!interaction.member.permissions.has('ManageRoles')) {
    return interaction.reply({ content: '❌ You need Manage Roles permission to approve.', ephemeral: true });
  }
  const parts = interaction.customId.split('_');
  const targetId = parts[parts.length - 1];
  try {
    const member = await interaction.guild.members.fetch(targetId);
    await safeRoleAssignment(member, ROLE_AFFILIATE_UNVERIFIED, 'remove');
    recordRoleChange(targetId, ROLE_AFFILIATE_UNVERIFIED, interaction.guild.id, 'remove');
    await safeRoleAssignment(member, ROLE_AFFILIATE, 'add');
    recordRoleChange(targetId, ROLE_AFFILIATE, interaction.guild.id, 'add');
    info(interaction.guild, `Admin ${interaction.user.tag} approved affiliate ${member.user.tag}`);
    await member.send('✅ Your affiliate status has been approved!').catch(() => {
      warn(interaction.guild, `Could not DM approval to ${member.user.tag}`);
    });
    await interaction.update({ content: `✅ Affiliate approved for ${member.user.tag}`, components: [] });
  } catch (err) {
    error(interaction.guild, `Error approving affiliate: ${err.message}`, { targetId });
    throw new BotError(`Error approving affiliate: ${err.message}`, ErrorTypes.ROLE_MANAGEMENT, err.code);
  }
}

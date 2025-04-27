// handlers/adminConfirmAffiliate.js
import { info, warn } from '../utils/logger.js';
import { BotError, ErrorTypes } from '../utils/errorTypes.js';
import { safeRoleAssignment } from '../utils/roleManager.js';
import { recordRoleChange } from '../services/securityAudit.js';
import {
  ROLE_AFFILIATE_UNVERIFIED,
  ROLE_AFFILIATE,
  LOG_CHANNEL
} from '../config.js';

export async function handleAdminConfirmAffiliate(interaction) {
  if (!interaction.member.permissions.has('ManageRoles')) {
    return interaction.reply({ content: '❌ You need Manage Roles permission to confirm.', ephemeral: true });
  }
  const parts = interaction.customId.split('_');
  const targetId = parts[parts.length - 1];
  try {
    const member = await interaction.guild.members.fetch(targetId);
    if (member.roles.cache.has(ROLE_AFFILIATE_UNVERIFIED)) {
      await safeRoleAssignment(member, ROLE_AFFILIATE_UNVERIFIED, 'remove');
      recordRoleChange(targetId, ROLE_AFFILIATE_UNVERIFIED, interaction.guild.id, 'remove');
    }
    await safeRoleAssignment(member, ROLE_AFFILIATE, 'add');
    recordRoleChange(targetId, ROLE_AFFILIATE, interaction.guild.id, 'add');
    info(interaction.guild, `Admin ${interaction.user.tag} confirmed affiliate ${member.user.tag}`);
    await member.send('✅ You have been confirmed as a chapter affiliate!').catch(()=>{ warn(interaction.guild, `Could not DM confirmation to ${member.user.tag}`); });
    if (LOG_CHANNEL) {
      const ch = await interaction.guild.channels.fetch(LOG_CHANNEL);
      if (ch?.isTextBased()) {
        await ch.send(`✅ Admin ${interaction.user.tag} confirmed ${member.user.tag} as affiliate.`);
      }
    }
    await interaction.update({ content: `✅ ${member.user.tag} is now a chapter affiliate.`, components: [] });
  } catch (err) {
    info(interaction.guild, `Error confirming affiliate: ${err.message}`, { targetId });
    throw new BotError(`Error confirming affiliate: ${err.message}`, ErrorTypes.ROLE_MANAGEMENT, err.code);
  }
}

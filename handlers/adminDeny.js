// handlers/adminDeny.js
import { info, warn, error } from '../utils/logger.js';
import { BotError, ErrorTypes } from '../utils/errorTypes.js';
import { safeRoleAssignment } from '../utils/roleManager.js';
import {
  ROLE_AFFILIATE_UNVERIFIED,
  ROLE_RULES_ACCEPTED
} from '../config.js';

export async function handleAdminVerifyDeny(interaction) {
  if (!interaction.member.permissions.has('ManageRoles')) {
    return interaction.reply({ content: '❌ You need Manage Roles permission to deny.', ephemeral: true });
  }
  const parts = interaction.customId.split('_');
  const targetId = parts[parts.length - 1];
  try {
    const member = await interaction.guild.members.fetch(targetId);
    await safeRoleAssignment(member, ROLE_AFFILIATE_UNVERIFIED, 'remove').catch(()=>{});
    await safeRoleAssignment(member, ROLE_RULES_ACCEPTED, 'remove').catch(()=>{});
    info(interaction.guild, `Admin ${interaction.user.tag} denied affiliate ${member.user.tag}`);
    await member.send('❌ Your affiliate request was denied.').catch(()=>{ warn(interaction.guild, `Could not DM denial to ${member.user.tag}`); });
    await interaction.update({ content: `❌ Affiliate denied for ${member.user.tag}`, components: [] });
  } catch (err) {
    error(interaction.guild, `Error denying affiliate: ${err.message}`, { targetId });
    throw new BotError(`Error denying affiliate: ${err.message}`, ErrorTypes.ROLE_MANAGEMENT, err.code);
  }
}

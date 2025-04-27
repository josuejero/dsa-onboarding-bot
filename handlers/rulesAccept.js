// handlers/rulesAccept.js
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { info, warn, error } from '../utils/logger.js';
import { BotError, ErrorTypes } from '../utils/errorTypes.js';
import { safeRoleAssignment } from '../utils/roleManager.js';
import { recordRoleChange } from '../services/securityAudit.js';
import {
  ROLE_MEMBER_UNVERIFIED,
  ROLE_MEMBER,
  ROLE_AFFILIATE_UNVERIFIED,
  ROLE_RULES_ACCEPTED,
  LOG_CHANNEL
} from '../config.js';

export async function handleRulesAccept(interaction) {
  const isMember = interaction.customId === 'rules_accept_member';
  try {
    if (isMember) {
      // member flow…
      await safeRoleAssignment(interaction.member, ROLE_MEMBER_UNVERIFIED, 'remove');
      recordRoleChange(interaction.user.id, ROLE_MEMBER_UNVERIFIED, interaction.guild.id, 'remove');
      if (!interaction.member.roles.cache.has(ROLE_MEMBER)) {
        await safeRoleAssignment(interaction.member, ROLE_MEMBER, 'add');
        recordRoleChange(interaction.user.id, ROLE_MEMBER, interaction.guild.id, 'add');
      }
      await safeRoleAssignment(interaction.member, ROLE_RULES_ACCEPTED, 'add');
      recordRoleChange(interaction.user.id, ROLE_RULES_ACCEPTED, interaction.guild.id, 'add');
      info(interaction.guild, `User ${interaction.user.tag} granted Member access`);

      if (LOG_CHANNEL) {
        try {
          const ch = await interaction.guild.channels.fetch(LOG_CHANNEL);
          if (ch?.isTextBased()) {
            await ch.send(`✅ User ${interaction.user.tag} has been granted full Member access`);
          }
        } catch (e) { warn(interaction.guild, `Failed to log member access: ${e.message}`); }
      }
      await interaction.update({ 
        content: '🎉 **You\'re in, comrade!** Welcome to Delaware DSA!\n\n' +
          'You now have full access to all member channels. Head to #introductions to introduce yourself to the community, and check out #announcements to see what we\'re working on right now!', 
        components: [] 
      });
    } else {
      // affiliate flow…
      await safeRoleAssignment(interaction.member, ROLE_RULES_ACCEPTED, 'add');
      recordRoleChange(interaction.user.id, ROLE_RULES_ACCEPTED, interaction.guild.id, 'add');
      info(interaction.guild, `Affiliate ${interaction.user.tag} accepted rules`);

      if (LOG_CHANNEL) {
        try {
          const ch = await interaction.guild.channels.fetch(LOG_CHANNEL);
          if (ch?.isTextBased()) {
            const approvalRow = new ActionRowBuilder().addComponents(
              new ButtonBuilder().setCustomId(`admin_verify_approve_${interaction.user.id}`).setLabel('Approve').setStyle(ButtonStyle.Success),
              new ButtonBuilder().setCustomId(`admin_verify_deny_${interaction.user.id}`).setLabel('Deny').setStyle(ButtonStyle.Danger)
            );
            await ch.send({
              content: `🔔 Affiliate ${interaction.user.tag} is awaiting approval.`,
              components: [approvalRow]
            });
          }
        } catch (logErr) {
          warn(interaction.guild, `Failed to log affiliate approval: ${logErr.message}`);
          // fallback DM…
        }
      }
      await interaction.update({ 
        content: '⏳ **Thanks for joining us!** A comrade will review your ally status soon.', 
        components: [] 
      });
    }
  } catch (err) {
    if (err instanceof BotError) throw err;
    throw new BotError(
      `Error handling rules acceptance for ${interaction.user.tag}: ${err.message}`,
      ErrorTypes.ROLE_MANAGEMENT,
      err.code
    );
  }
}

// handlers/rolesAffiliate.js
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { info } from '../utils/logger.js';
import { BotError, ErrorTypes } from '../utils/errorTypes.js';
import { safeRoleAssignment } from '../utils/roleManager.js';
import { recordRoleChange } from '../services/securityAudit.js';
import { sessionChoices } from '../utils/sessionStore.js';
import { affiliateRoleMap } from '../utils/roleMaps.js';

export async function handleRolesDoneAffiliate(interaction) {
  const userId = interaction.user.id;
  const { rolesAff = [] } = sessionChoices.get(userId) || {};

  try {
    const tagKeys = ['affiliate_non_dsa','affiliate_dsa_non_de'];
    const allTags = tagKeys.map(k => affiliateRoleMap[k]).filter(Boolean);

    for (const rid of allTags) {
      if (interaction.member.roles.cache.has(rid)) {
        await safeRoleAssignment(interaction.member, rid, 'remove');
        recordRoleChange(userId, rid, interaction.guild.id, 'remove');
      }
    }
    for (const key of rolesAff) {
      const rid = affiliateRoleMap[key];
      if (rid) {
        await safeRoleAssignment(interaction.member, rid, 'add');
        recordRoleChange(userId, rid, interaction.guild.id, 'add');
      }
    }
    sessionChoices.delete(userId);
    info(interaction.guild, `Affiliate ${interaction.user.tag} completed role selection`, { rolesAff });

    await interaction.update({
      content: '🔒 **Our Community Rules**\n\nPlease click **Accept Rules** below to complete onboarding.',
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('rules_accept_affiliate')
            .setLabel('Accept Rules')
            .setStyle(ButtonStyle.Primary)
        )
      ]
    });
  } catch (err) {
    if (err instanceof BotError) throw err;
    throw new BotError(
      `Error handling affiliate role selection for ${interaction.user.tag}: ${err.message}`,
      ErrorTypes.ROLE_MANAGEMENT,
      err.code
    );
  }
}

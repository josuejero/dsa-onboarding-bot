// handlers/pronounsAffiliate.js
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from 'discord.js';
import { info } from '../utils/logger.js';
import { BotError, ErrorTypes } from '../utils/errorTypes.js';
import { safeRoleAssignment } from '../utils/roleManager.js';
import { recordRoleChange } from '../services/securityAudit.js';
import { sessionChoices } from '../utils/sessionStore.js';
import { affiliateRoleMap, affiliateRoleLabels } from '../utils/roleMaps.js';

export async function handlePronounsDoneAffiliate(interaction) {
  const userId = interaction.user.id;
  const { pronouns = [] } = sessionChoices.get(userId) || {};

  try {
    const allPronouns = [
      affiliateRoleMap.pronoun_he,
      affiliateRoleMap.pronoun_she,
      affiliateRoleMap.pronoun_they,
      affiliateRoleMap.pronoun_any
    ];
    for (const rid of allPronouns) {
      if (interaction.member.roles.cache.has(rid)) {
        await safeRoleAssignment(interaction.member, rid, 'remove');
        recordRoleChange(userId, rid, interaction.guild.id, 'remove');
      }
    }
    for (const key of pronouns) {
      const rid = affiliateRoleMap[key];
      if (rid) {
        await safeRoleAssignment(interaction.member, rid, 'add');
        recordRoleChange(userId, rid, interaction.guild.id, 'add');
      }
    }
    info(interaction.guild, `Affiliate ${interaction.user.tag} completed pronoun selection`, { pronouns });

    const tagKeys = ['affiliate_non_dsa','affiliate_dsa_non_de'];
    const options = tagKeys.map(k => ({ label: affiliateRoleLabels[k], value: k }));
    const menu = new StringSelectMenuBuilder()
      .setCustomId('pick_roles_affiliate')
      .setPlaceholder('Select your affiliate tags…')
      .setMinValues(0)
      .setMaxValues(options.length)
      .addOptions(options);
    await interaction.update({
      content: '🌟 **Step 2:** Tell us a bit more about your connection to the movement! Select any tags that apply, then click **Done** to continue.\n\n' + 
        'Available tags:\n• **Non-DSA Member** - If you\'re not currently a DSA member\n• **DSA Member (Non-DE)** - If you\'re a DSA member from another chapter',
      components: [
        new ActionRowBuilder().addComponents(menu),
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('roles_done_affiliate')
            .setLabel('Done')
            .setStyle(ButtonStyle.Primary)
        )
      ]
    });
  } catch (err) {
    if (err instanceof BotError) throw err;
    throw new BotError(
      `Error handling affiliate pronoun selection for ${interaction.user.tag}: ${err.message}`,
      ErrorTypes.ROLE_MANAGEMENT,
      err.code
    );
  }
}

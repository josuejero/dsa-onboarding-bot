// handlers/affiliateStart.js
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from 'discord.js';
import { info, warn } from '../utils/logger.js';
import { BotError, ErrorTypes } from '../utils/errorTypes.js';
import { safeRoleAssignment } from '../utils/roleManager.js';
import { recordRoleChange } from '../services/securityAudit.js';
import {
  ROLE_PENDING,
  ROLE_AFFILIATE_UNVERIFIED,
  LOG_CHANNEL
} from '../config.js';

export async function handleAffiliateStart(interaction) {
  try {
    // remove pending, add affiliate-unverified
    await safeRoleAssignment(interaction.member, ROLE_PENDING, 'remove');
    recordRoleChange(interaction.user.id, ROLE_PENDING, interaction.guild.id, 'remove');
    await safeRoleAssignment(interaction.member, ROLE_AFFILIATE_UNVERIFIED, 'add');
    recordRoleChange(interaction.user.id, ROLE_AFFILIATE_UNVERIFIED, interaction.guild.id, 'add');
    info(interaction.guild, `User ${interaction.user.tag} started affiliate onboarding`);

    const pronouns = [
      { label: 'HE/HIM',    value: 'pronoun_he'   },
      { label: 'SHE/HER',   value: 'pronoun_she'  },
      { label: 'THEY/THEM', value: 'pronoun_they' },
      { label: 'ANY/ALL',   value: 'pronoun_any'  }
    ];
    const pronounMenu = new StringSelectMenuBuilder()
      .setCustomId('pick_pronouns')
      .setPlaceholder('Select your pronouns…')
      .setMinValues(1)
      .setMaxValues(pronouns.length)
      .addOptions(pronouns);

      await interaction.update({
        content: '🤝 **Welcome, ally!** We\'re excited to have you join our struggle for justice.\n\n' +
          '🏷️ **Step 1:** Let\'s start with pronouns—select yours below (you can choose multiple options), then click **Done** when you\'re ready.\n\n' +
          'Available options:\n• HE/HIM\n• SHE/HER\n• THEY/THEM\n• ANY/ALL',
        components: [
          new ActionRowBuilder().addComponents(pronounMenu),
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('pronouns_done_affiliate')
              .setLabel('Done')
              .setStyle(ButtonStyle.Primary)
          )
        ]
      });

    // log to mod-channel
    if (LOG_CHANNEL) {
      try {
        const logCh = await interaction.guild.channels.fetch(LOG_CHANNEL);
        if (logCh?.isTextBased()) {
          await logCh.send(`📝 ${interaction.user.tag} started affiliate onboarding`);
        }
      } catch (logErr) {
        warn(interaction.guild, `Failed to log affiliate start: ${logErr.message}`);
      }
    }
  } catch (err) {
    if (err instanceof BotError) throw err;
    throw new BotError(
      `Error in affiliate start flow: ${err.message}`,
      ErrorTypes.ROLE_MANAGEMENT,
      err.code
    );
  }
}

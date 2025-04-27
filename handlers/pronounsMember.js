// handlers/pronounsMember.js
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from 'discord.js';
import { info } from '../utils/logger.js';
import { BotError, ErrorTypes } from '../utils/errorTypes.js';
import { safeRoleAssignment } from '../utils/roleManager.js';
import { recordRoleChange } from '../services/securityAudit.js';
import { sessionChoices } from '../utils/sessionStore.js';
import { memberRoleMap, memberRoleLabels } from '../utils/roleMaps.js';

export async function handlePronounsDone(interaction) {
  const userId = interaction.user.id;
  const { pronouns = [] } = sessionChoices.get(userId) || {};

  try {
    // remove all old pronouns
    const allPronouns = [
      memberRoleMap.pronoun_he,
      memberRoleMap.pronoun_she,
      memberRoleMap.pronoun_they,
      memberRoleMap.pronoun_any
    ];
    for (const r of allPronouns) {
      if (interaction.member.roles.cache.has(r)) {
        await safeRoleAssignment(interaction.member, r, 'remove');
        recordRoleChange(userId, r, interaction.guild.id, 'remove');
      }
    }

    // add chosen pronouns
    for (const key of pronouns) {
      const rid = memberRoleMap[key];
      if (rid) {
        await safeRoleAssignment(interaction.member, rid, 'add');
        recordRoleChange(userId, rid, interaction.guild.id, 'add');
      }
    }
    info(interaction.guild, `User ${interaction.user.tag} completed pronoun selection`, { pronouns });

    // prepare committee menu…
    const committeeKeys = [
      'region_north','region_south',
      'communications','membership_engagement',
      'political_education','legislation_tracking',
      'red_rabbits','palestine','migrant_rights',
      'queer_socialists','arts_culture',
      'housing_justice','mutual_aid','ydsa'
    ];
    const options = committeeKeys.map(key => ({
      label: memberRoleLabels[key],
      value: key
    }));
    const menu = new StringSelectMenuBuilder()
      .setCustomId('pick_committees')
      .setPlaceholder('Select your committees & working groups…')
      .setMinValues(0)
      .setMaxValues(options.length)
      .addOptions(options);

    // updated content with descriptions:
    const description = `🔥 **Step 2: Find Your Home in the Movement!** 🔥

    Real change happens when we organize together! Each team below is doing vital work—find where your passion and skills can make the biggest impact:
    
    📣 **Communications** — Amplify our message & build public support
    ✨ **Membership-Engagement** — Welcome comrades & strengthen our community
    📚 **Political-Education** — Deepen understanding of socialist theory & practice
    📋 **Legislation-Tracking** — Monitor the halls of power & identify pressure points
    🛡️ **Red-Rabbits** — Keep our community safe during actions & events
    🇵🇸 **Palestine-Solidarity** — Stand with Palestinians against occupation & apartheid
    🌎 **Migrant-Rights** — Fight for dignity & justice for all, regardless of borders
    🏳️‍🌈 **Queer-Socialists** — Organize for LGBTQ+ liberation within socialist practice
    🎨 **Arts-and-Culture** — Harness creative expression for revolutionary change
    🏘️ **Housing-Justice** — Combat landlord power & fight for housing as a human right
    🤲 **Mutual-Aid** — Build community resilience through direct support networks
    
    Select as many as you're interested in, then click **Done** below!`;
    
    await interaction.update({
      content: description,
      components: [
        new ActionRowBuilder().addComponents(menu),
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('roles_done')
            .setLabel('Done')
            .setStyle(ButtonStyle.Primary)
        )
      ]
    });
  } catch (err) {
    if (err instanceof BotError) throw err;
    throw new BotError(
      `Error handling pronouns selection for ${interaction.user.tag}: ${err.message}`,
      ErrorTypes.ROLE_MANAGEMENT,
      err.code
    );
  }
}

// handlers/rolesMember.js
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { info } from '../utils/logger.js';
import { BotError, ErrorTypes } from '../utils/errorTypes.js';
import { safeRoleAssignment } from '../utils/roleManager.js';
import { recordRoleChange } from '../services/securityAudit.js';
import { sessionChoices } from '../utils/sessionStore.js';
import { memberRoleMap } from '../utils/roleMaps.js';
import { ROLE_MEMBER_UNVERIFIED, ROLE_MEMBER } from '../config.js';


export async function handleRolesDone(interaction) {
  const userId = interaction.user.id;
  const { committees = [] } = sessionChoices.get(userId) || {};

  const isMember = interaction.member.roles.cache.has(ROLE_MEMBER_UNVERIFIED)
               || interaction.member.roles.cache.has(ROLE_MEMBER);
  try {
    const keys = [
      'region_north','region_south',
      'communications','membership_engagement',
      'political_education','legislation_tracking',
      'red_rabbits','palestine','migrant_rights',
      'queer_socialists','arts_culture',
      'housing_justice','mutual_aid','ydsa'
    ];
    const allRoles = keys.map(k => memberRoleMap[k]).filter(Boolean);

    // remove old, add new
    for (const rid of allRoles) {
      if (interaction.member.roles.cache.has(rid)) {
        await safeRoleAssignment(interaction.member, rid, 'remove');
        recordRoleChange(userId, rid, interaction.guild.id, 'remove');
      }
    }
    for (const key of committees) {
      const rid = memberRoleMap[key];
      if (rid) {
        await safeRoleAssignment(interaction.member, rid, 'add');
        recordRoleChange(userId, rid, interaction.guild.id, 'add');
      }
    }
    sessionChoices.delete(userId);
    info(interaction.guild, `User ${interaction.user.tag} completed committee selection`, { committees });

    await interaction.update({
      content: '📜 **Community Agreements**\n\n' +
        'Our power comes from how we treat each other! These agreements help us build a space where everyone can participate fully and respectfully:\n\n' +
        '1️⃣ **Be Respectful** – Engage comradely with fellow members\n' +
        '2️⃣ **No Harassment** – Zero tolerance for hate speech or personal attacks\n' +
        '3️⃣ **Stay On-Topic** – Keep discussions aligned with our socialist mission\n' +
        '4️⃣ **Protect Privacy** – Do not share anyone\'s personal information\n' +
        '5️⃣ **No Spam** – Avoid excessive messages or unsolicited links\n' +
        '6️⃣ **Uphold DSA Values** – Solidarity, equality, and justice in all interactions\n\n' +
        'Ready to join the struggle? Click **Accept Rules** below!',
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(isMember ? 'rules_accept_member' : 'rules_accept_affiliate')
            .setLabel('Accept Rules')
            .setStyle(ButtonStyle.Primary)
        )
      ]
    });
  } catch (err) {
    if (err instanceof BotError) throw err;
    throw new BotError(
      `Error handling committee selection for ${interaction.user.tag}: ${err.message}`,
      ErrorTypes.ROLE_MANAGEMENT,
      err.code
    );
  }
}

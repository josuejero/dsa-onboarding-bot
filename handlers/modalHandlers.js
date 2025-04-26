// handlers/modalHandlers.js
import { lookupAN } from '../services/actionNetwork.js';
import {
  ROLE_MEMBER_UNVERIFIED,
  ROLE_PENDING,
  ROLE_AFFILIATE_UNVERIFIED,
  CHANNEL_RULES
} from '../config.js';
import {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';
import { memberRoleMap, memberRoleLabels } from '../utils/roleMaps.js';

export default {
  name: 'InteractionCreate',
  async execute(interaction, client) {
    if (!interaction.isModalSubmit()) return;
    if (interaction.customId === 'verify_email_modal') {
      await handleVerifyEmailModal(interaction, client);
    }
  }
};

async function handleVerifyEmailModal(interaction, client) {
  const email = interaction.fields.getTextInputValue('email_input').trim();
  console.log(`[verify] ${interaction.user.tag} submitted email: ${email}`);
  await interaction.deferReply({ ephemeral: true });

  try {
    const isMember = await lookupAN(email);

    // Remove the "pending" role
    await interaction.member.roles.remove(ROLE_PENDING).catch(console.error);

    if (isMember) {
      // Assign unverified member role
      await interaction.member.roles.add(ROLE_MEMBER_UNVERIFIED).catch(console.error);

      // Build select menu options
      const options = Object.entries(memberRoleMap).map(([key]) => ({
        label: memberRoleLabels[key],
        value: key
      }));

      const menu = new StringSelectMenuBuilder()
        .setCustomId('pick_roles_member')
        .setPlaceholder('Select pronouns, region & working groups…')
        .setMinValues(0)
        .setMaxValues(options.length)
        .addOptions(options);

      // Prepare lists
      const pronouns = ['1️⃣ HE/HIM', '2️⃣ SHE/HER', '3️⃣ THEY/THEM', '4️⃣ ANY/ALL'];
      const regions = ['⬆️ Northern-Delaware — New Castle County', '⬇️ Southern-Delaware — Kent or Sussex County'];
      const groups = [
        '🎓 YDSA — Delaware YDSA chapter members',
        '📣 Communication Cmte — Help with communications',
        '🎉 Membership-Engagement Cmte — Grow and engage members',
        '📓 Political-Education Cmte — Develop education on socialism',
        '🧾 Legislation-Tracking Cmte — Monitor Delaware laws',
        '🔴 Red-Rabbits Cmte — Event safety and marshaling',
        '🇵🇸 Palestine-Solidarity WG — Support Palestinian liberation',
        '🌎 Migrant-Rights WG — Empowers and protects immigrant communities',
        '🏳️‍🌈 Queer-Socialists WG — Empowers and protects LGBT communities',
        '🖌️ Arts-and-Culture WG — Preserves and promotes leftist art & literature',
        '🏘️ Housing-Justice WG — Fight for safe, affordable, and accessible housing',
        '🤝 Mutual-Aid WG — Sharing resources and fostering collective care'
      ];

      const content = [
        '✅ **Verified!** You’re a DSA member.',
        '',
        'Customize your profile by choosing from the menu below to select the roles that best represent you and help tailor your journey in our community:',
        '',
        '---',
        '**Set Your Pronouns**',
        ...pronouns,
        '',
        '---',
        '**Choose Your Identity & Interests**',
        ...regions,
        ...groups,
        '',
        'Use the menu below to make your selections.',
        ''
      ].join('\n');

      // Add both menu and Done button
      await interaction.editReply({
        content,
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
    } else {
      // Affiliate flow
      await interaction.member.roles.add(ROLE_AFFILIATE_UNVERIFIED).catch(console.error);
      const rulesChannel = client.channels.cache.get(CHANNEL_RULES);
      await interaction.editReply({
        content: `ℹ️ Email not found in our member database. You've been assigned as a chapter affiliate.\n\nPlease visit ${rulesChannel} to accept our rules and wait for moderator approval.`
      });
    }
  } catch (error) {
    console.error('[verify] lookupAN error:', error);
    const msg = error.message.startsWith('Invalid email')
      ? `❌ ${error.message}. Please enter a valid address.`
      : '❌ Verification error. Please try again or contact an admin.';
    await interaction.editReply({ content: msg });
  }
}

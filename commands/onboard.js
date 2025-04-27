// commands/onboard.js
import { PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export const data = {
  name: 'onboard',
  description: 'Trigger onboarding for a user',
  options: [
    { name: 'user', description: 'User to onboard', type: 6, required: true }
  ]
};

export async function execute(interaction) {
  // 1) Acknowledge so we can later send an ephemeral follow-up
  await interaction.deferReply({ ephemeral: true });

  // 2) Permission guard
  if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
    return interaction.deleteReply();
  }

  // 3) Fetch the target member
  const user = interaction.options.getUser('user');
  if (!user) {
    return interaction.deleteReply();
  }
  const member = await interaction.guild.members.fetch(user.id);

  // 4) Send the onboarding prompt **ephemerally** to that user
  await interaction.followUp({
    content: `👋 Welcome <@${member.id}>, to the Delaware DSA Discord Server!\n\n` +
      `We're absolutely thrilled to have you join our vibrant community.\n\n` +
      `Are you a current **Delaware DSA member** or a **chapter-affiliate**?`,
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('verify_start')
          .setLabel('I am a member')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('affiliate_start')
          .setLabel('I’m an affiliate')
          .setStyle(ButtonStyle.Secondary)
      )
    ],
    ephemeral: true
  });
}

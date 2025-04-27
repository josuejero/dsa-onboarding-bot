import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Get help with bot commands');

export async function execute(interaction, client) {
  const embed = new EmbedBuilder()
    .setTitle('🤖 DSA Discord Bot Help')
    .setDescription('Here are the available commands for this server:')
    .setColor('#e63946')
    .addFields([
      {
        name: '/verify',
        value: 'Start the verification process to confirm your DSA membership status'
      },
      {
        name: '/roles',
        value: 'Open the role-selection menu to update your pronouns, region, and working groups'
      },
      {
        name: '/rules',
        value: 'Review the server rules'
      },
      {
        name: '/help',
        value: 'Show this help message'
      }
    ])
    .setFooter({
      text: 'Delaware DSA',
      iconURL: interaction.guild.iconURL() || undefined
    });
  
  // Add moderator commands if user has the right permissions
  if (interaction.member.permissions.has('ManageRoles')) {
    embed.addFields([
      {
        name: '🔧 Moderator Commands',
        value: [
          '`/onboard` - Send onboarding message to a user',
          '`/confirm-affiliate` - Confirm a user as a chapter affiliate'
        ].join('\n')
      }
    ]);
  }
  
  await interaction.reply({
    embeds: [embed],
    ephemeral: true
  });
}
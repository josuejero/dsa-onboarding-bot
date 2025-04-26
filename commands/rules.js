// src/commands/rules.js
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('rules')
  .setDescription('Repost the community rules');

export async function execute(interaction) {
  const rulesEmbed = new EmbedBuilder()
    .setTitle('📜 Community Rules')
    .setDescription([
      'Our **DEDSA Discord Rules** keep us safe, respectful, and energizing for everyone:',
      '1️⃣ **Be Respectful** – Engage comradely.',
      '2️⃣ **No Harassment** – Zero tolerance for hate speech or personal attacks.',
      '3️⃣ **Stay On-Topic** – Keep discussions aligned with our mission.',
      '4️⃣ **Protect Privacy** – Do not share anyone’s personal info.',
      '5️⃣ **No Spam** – Avoid excessive messages or unsolicited links.',
      '6️⃣ **Uphold DSA Values** – Solidarity, equality, and justice in all interactions.',
      '',
      'React with ✅ in the #rules channel once you’ve read and agree.'
    ].join('\n'))
    .setColor('Blue')
    .setFooter({ text: 'Use /rules any time to review these.' });

  await interaction.reply({
    embeds: [rulesEmbed],
    ephemeral: true
  });
}

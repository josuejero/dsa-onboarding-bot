// commands/onboard.js
import { PermissionsBitField } from 'discord.js';
import { sendOnboarding } from '../utils/sendOnboarding.js';

export const data = {
  name: 'onboard',
  description: 'Trigger onboarding for a user',
  options: [
    { name: 'user', description: 'User to onboard', type: 6, required: true }
  ]
};

export async function execute(interaction) {
  // 1) ACK immediately so Discord shows "Bot is thinking..."
  await interaction.deferReply({ ephemeral: true });

  try {
    // 2) Permission guard—if they lack Manage Server, just swallow it
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
      return interaction.deleteReply();
    }

    // 3) Grab the user, fetch the GuildMember
    const user = interaction.options.getUser('user');
    if (!user) {
      return interaction.deleteReply();
    }
    const member = await interaction.guild.members.fetch(user.id);

    // 4) Send your onboarding embed/buttons into #onboarding
    await sendOnboarding(member);
    console.log(`[onboard] ✅ Sent onboarding for ${user.tag}`);

  } catch (err) {
    console.error('[onboard] ❌ Error:', err);
    // (optionally log it somewhere, but do NOT send another ephemeral)
  } finally {
    // 5) Remove the "thinking" indicator so nothing else remains
    await interaction.deleteReply();
  }
}

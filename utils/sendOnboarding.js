// utils/sendOnboarding.js
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { CHANNEL_ONBOARDING } from '../config.js';

export async function sendOnboarding(member) {
  try {
    // Fetch the onboarding channel from the guild
    const channel = await member.guild.channels.fetch(CHANNEL_ONBOARDING);
    if (!channel?.isTextBased()) {
      console.error('Onboarding channel not found or not text-based');
      return null;
    }

    // Send the onboarding prompt into the channel, mention the new member
    const message = await channel.send({
      content: `👋 Welcome <@${member.id}>! Are you a current **Delaware DSA member** or a **chapter-affiliate**?`,
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
      ]
    });

    console.log(`✅ Onboarding sent in #onboarding for ${member.user.tag}`);
    return message;
  } catch (error) {
    console.error('Error sending onboarding to channel:', error);
    return null;
  }
}

// events/guildMemberAdd.js
import { Events } from 'discord.js';
import { sendOnboarding } from '../utils/sendOnboarding.js';

export default {
  name: Events.GuildMemberAdd,
  once: false,
  async execute(member) {
    await sendOnboarding(member);
    console.log(`✅ Onboarding sent to ${member.user.tag}`);
  }
};

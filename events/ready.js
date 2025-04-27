import { Events } from 'discord.js';

export default {
  name: Events.ClientReady,
  once: true,
  /**
   * @param {import('discord.js').Client} client
   */
  async execute(client) {
    console.log(`✅ Bot online as ${client.user.tag}`);

    // Update bot presence
    client.user.setPresence({
      activities: [{ name: 'Delaware DSA', type: 3 }], // "Watching"
      status: 'online'
    });
  }
};

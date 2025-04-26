import { LOG_CHANNEL } from '../config.js';

export async function log(guild, type, message) {
  if (!LOG_CHANNEL) return;
  try {
    const ch = await guild.channels.fetch(LOG_CHANNEL);
    if (ch?.isTextBased()) {
      const emoji = type === 'error' ? '❌' : '✅';
      await ch.send(`${emoji} **${type.toUpperCase()}**: ${message}`);
    }
  } catch (e) {
    console.error('Logger failed:', e);
  }
}

import { log } from './logger.js';

export function withErrorHandler(fn) {
  return async function(interaction, client) {
    try {
      await fn(interaction, client);
    } catch (err) {
      console.error('Handler error:', err);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: '❌ There was an error. Please try again later.', ephemeral: true }).catch(()=>{});
      } else {
        await interaction.reply({ content: '❌ There was an error. Please try again later.', ephemeral: true }).catch(()=>{});
      }
      await log(interaction.guild, 'error', err.message);
    }
  };
}

// runtimeValidation.js
import config from './config.js';
import { info, warn, error } from './utils/logger.js';

/**
 * Confirm that all configured roles & channels actually exist in the guild.
 * @param {import('discord.js').Guild} guild
 * @returns {Promise<boolean>}
 */
export async function validateRuntime(guild) {
  if (config._validated) return true;
  if (!guild) {
    error(null, 'Cannot validate configuration: Guild not provided');
    return false;
  }

  // Collect role and channel IDs
  const roleEntries = Object.entries(config)
    .filter(([k, v]) => k.startsWith('ROLE_') && typeof v === 'string');
  const channelEntries = Object.entries(config)
    .filter(([k, v]) => k.startsWith('CHANNEL_') && typeof v === 'string');

  let hasError = false;
  info(guild, `Validating ${roleEntries.length} roles…`);
  const roles = await guild.roles.fetch();

  for (const [key, id] of roleEntries) {
    if (!roles.has(id)) {
      error(guild, `Role "${key}" (ID ${id}) not found`);
      hasError = true;
    }
  }

  info(guild, `Validating ${channelEntries.length} channels…`);
  for (const [key, id] of channelEntries) {
    if (key === 'MESSAGE_RULES') continue;
    try {
      const ch = await guild.channels.fetch(id);
      if (!ch) {
        error(guild, `Channel "${key}" (ID ${id}) not found`);
        hasError = true;
      }
    } catch (err) {
      error(guild, `Error fetching channel "${key}": ${err.message}`);
      hasError = true;
    }
  }

  // Special: check that the rules message exists
  try {
    const rulesCh = await guild.channels.fetch(config.CHANNEL_RULES);
    if (rulesCh?.isTextBased()) {
      await rulesCh.messages.fetch(config.MESSAGE_RULES);
    }
  } catch (err) {
    error(guild, `Rules message fetch failed: ${err.message}`);
    hasError = true;
  }

  if (hasError) {
    warn(guild, 'Configuration validation encountered issues.');
  } else {
    info(guild, 'Configuration validated successfully!');
    config._validated = true;
  }

  return !hasError;
}

// handlers/selectMenuHandlers.js
import { 
  registerSelectMenuHandler, 
  getSelectMenuHandler 
} from '../utils/handlerRegistry.js';

import { info, error } from '../utils/logger.js';
import { sessionChoices } from '../utils/sessionStore.js';
import { BotError, ErrorTypes } from '../utils/errorTypes.js';
import { commandRateLimiter } from '../utils/rateLimit.js';

/**
 * Handle pronoun selection
 * @param {import('discord.js').StringSelectMenuInteraction} interaction 
 */
async function handlePronounSelect(interaction) {
  const userId = interaction.user.id;
  const prev = sessionChoices.get(userId) || {};
  sessionChoices.set(userId, { ...prev, pronouns: interaction.values });
  
  info(interaction.guild, `User ${interaction.user.tag} selected pronouns: ${interaction.values.join(', ')}`);
  await interaction.deferUpdate();
}

/**
 * Handle committee/working group selection
 * @param {import('discord.js').StringSelectMenuInteraction} interaction 
 */
async function handleCommitteeSelect(interaction) {
  const userId = interaction.user.id;
  const prev = sessionChoices.get(userId) || {};
  sessionChoices.set(userId, { ...prev, committees: interaction.values });
  
  info(interaction.guild, `User ${interaction.user.tag} selected committees: ${interaction.values.join(', ')}`);
  await interaction.deferUpdate();
}

/**
 * Handle affiliate role selection
 * @param {import('discord.js').StringSelectMenuInteraction} interaction 
 */
async function handleAffiliateRoleSelect(interaction) {
  const userId = interaction.user.id;
  const prev = sessionChoices.get(userId) || {};
  sessionChoices.set(userId, { ...prev, rolesAff: interaction.values });
  
  info(interaction.guild, `User ${interaction.user.tag} selected affiliate roles: ${interaction.values.join(', ')}`);
  await interaction.deferUpdate();
}

// Register select menu handlers
registerSelectMenuHandler('pick_pronouns', handlePronounSelect);
registerSelectMenuHandler('pick_committees', handleCommitteeSelect);
registerSelectMenuHandler('pick_roles_affiliate', handleAffiliateRoleSelect);

/**
 * Main entry point for handling select menu interactions
 * @param {import('discord.js').StringSelectMenuInteraction} interaction 
 */
export async function handleSelectMenus(interaction) {
  // Apply rate limiting
  const limiter = commandRateLimiter.forUser(interaction.user.id);
  if (!(await limiter.consume(1))) {
    return interaction.reply({
      content: '⏱️ You\'re selecting options too quickly. Please wait a moment and try again.',
      ephemeral: true
    });
  }
  
  // Log the interaction
  info(interaction.guild, `Select menu: ${interaction.customId} by ${interaction.user.tag}`);
  
  try {
    // Get the appropriate handler
    const handler = getSelectMenuHandler(interaction.customId);
    
    if (!handler) {
      error(interaction.guild, `No handler for select menu: ${interaction.customId}`, {
        userId: interaction.user.id,
        username: interaction.user.tag
      });
      
      return interaction.reply({
        content: '❌ This selection isn\'t implemented. Please contact an administrator.',
        ephemeral: true
      });
    }
    
    // Execute the handler
    await handler(interaction);
    
  } catch (err) {
    // Let the global error handler deal with it
    throw err;
  }
}

// Export individual handlers for testing
export { 
  handlePronounSelect, 
  handleCommitteeSelect, 
  handleAffiliateRoleSelect 
};
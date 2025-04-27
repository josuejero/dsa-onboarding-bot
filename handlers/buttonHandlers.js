// handlers/refactoredButtonHandlers.js
/**
 * Central router for button interactions
 * Uses pattern matching for efficient routing
 */
import { 
  registerButtonHandler, 
  getButtonHandler 
} from '../utils/handlerRegistry.js';

import { info, error, warn } from '../utils/logger.js';
import { BotError, ErrorTypes } from '../utils/errorTypes.js';
import { commandRateLimiter } from '../utils/rateLimit.js';
import { canUseButton } from '../utils/permissionChecks.js';

// Import all handlers
import { handleVerifyStart } from './verifyStart.js';
import { handleAffiliateStart } from './affiliateStart.js';
import { handlePronounsDone } from './pronounsMember.js';
import { handleRolesDone } from './rolesMember.js';
import { handlePronounsDoneAffiliate } from './pronounsAffiliate.js';
import { handleRolesDoneAffiliate } from './rolesAffiliate.js';
import { handleRulesAccept } from './rulesAccept.js';
import { handleAdminVerifyApprove } from './adminApprove.js';
import { handleAdminVerifyDeny } from './adminDeny.js';
import { handleAdminConfirmAffiliate } from './adminConfirmAffiliate.js';

// Register all button handlers
function registerAllHandlers() {
  // Standard handlers with direct customId matching
  registerButtonHandler('verify_start', handleVerifyStart);
  registerButtonHandler('affiliate_start', handleAffiliateStart);
  registerButtonHandler('pronouns_done', handlePronounsDone);
  registerButtonHandler('roles_done', handleRolesDone);
  registerButtonHandler('pronouns_done_affiliate', handlePronounsDoneAffiliate);
  registerButtonHandler('roles_done_affiliate', handleRolesDoneAffiliate);
  
  // Rules accept handlers
  registerButtonHandler('rules_accept_member', handleRulesAccept);
  registerButtonHandler('rules_accept_affiliate', handleRulesAccept);
  
  // Admin handlers with regex patterns for user ID extraction
  registerButtonHandler(/^admin_verify_approve_(\d+)$/, handleAdminVerifyApprove);
  registerButtonHandler(/^admin_verify_deny_(\d+)$/, handleAdminVerifyDeny);
  registerButtonHandler(/^admin_confirm_affiliate_(\d+)$/, handleAdminConfirmAffiliate);
}

// Register handlers on module load
registerAllHandlers();

/**
 * Main entry point for handling button interactions
 * @param {import('discord.js').ButtonInteraction} interaction 
 */
export async function handleButtons(interaction) {
  // Apply rate limiting
  const limiter = commandRateLimiter.forUser(interaction.user.id);
  if (!(await limiter.consume(1))) {
    return interaction.reply({
      content: '⏱️ You\'re interacting too quickly. Please wait a moment and try again.',
      ephemeral: true
    });
  }
  
  // Log the interaction
  info(interaction.guild, `Button click: ${interaction.customId} by ${interaction.user.tag}`);
  
  try {
    // Check if user can use this button
    canUseButton(interaction);
    
    // Get the appropriate handler
    const handler = getButtonHandler(interaction.customId);
    
    if (!handler) {
      error(interaction.guild, `No handler for button: ${interaction.customId}`, {
        userId: interaction.user.id,
        username: interaction.user.tag
      });
      
      return interaction.reply({
        content: '❌ This button isn\'t implemented. Please contact an administrator.',
        ephemeral: true
      });
    }
    
    // Execute the handler
    await handler(interaction);
    
  } catch (err) {
    if (err instanceof BotError && err.type === ErrorTypes.PERMISSION) {
      return interaction.reply({
        content: '❌ You don\'t have permission to use this button.',
        ephemeral: true
      });
    }
    
    // Let the global error handler deal with it
    throw err;
  }
}

// Export the register function for potential reloading
export { registerAllHandlers };
// handlers/refactoredModalHandlers.js
import { 
  registerModalHandler, 
  getModalHandler 
} from '../utils/handlerRegistry.js';

import { ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { info, error, warn } from '../utils/logger.js';
import { BotError, ErrorTypes } from '../utils/errorTypes.js';
import { processModalSubmission } from '../middleware/inputSanitizer.js';
import { commandRateLimiter } from '../utils/rateLimit.js';
import { recordFailedVerification, recordSuccessfulVerification } from '../services/securityAudit.js';
import { lookupAN } from '../services/actionNetwork.js';
import { safeRoleAssignment } from '../utils/roleManager.js';
import { 
  createPronounSelectionMenu, 
  createDoneButton,
  createSelectMenu
} from '../utils/componentFactory.js';

import {
  ROLE_PENDING,
  ROLE_MEMBER_UNVERIFIED,
  ROLE_AFFILIATE_UNVERIFIED
} from '../config.js';

/**
 * Handler for email verification modal
 * @param {import('discord.js').ModalSubmitInteraction} interaction 
 */
async function handleVerifyEmailModal(interaction) {
  try {
    // Validate and sanitize email input
    const fields = processModalSubmission(interaction, {
      'email_input': 'email'
    });
    
    const email = fields.email_input;
    
    info(interaction.guild, `[verify] ${interaction.user.tag} submitted email: ${email}`);
    await interaction.deferReply({ ephemeral: true });

    try {
      const isMember = await lookupAN(email, { 
        guildId: interaction.guild.id 
      });
      
      // Remove pending role regardless of outcome
      await safeRoleAssignment(interaction.member, ROLE_PENDING, 'remove');

      if (isMember) {
        // Record successful verification
        recordSuccessfulVerification(
          interaction.user.id,
          email,
          interaction.guild.id
        );
        
        // Member flow
        await safeRoleAssignment(interaction.member, ROLE_MEMBER_UNVERIFIED, 'add');
        
        // Create UI components
        const pronounMenu = createPronounSelectionMenu();
        const doneButton = createDoneButton('pronouns');

        await interaction.editReply({
          content: '✅ **Membership confirmed!** You\'re officially part of the movement.\n\n' +
            '🏷️ **Step 1:** Let\'s help folks address you correctly! Select your pronouns below (you can choose multiple options), then hit **Done** when you\'re ready.\n\n' +
            'Available options:\n• HE/HIM\n• SHE/HER\n• THEY/THEM\n• ANY/ALL',
          components: [
            new ActionRowBuilder().addComponents(pronounMenu),
            doneButton
          ]
        });

      } else {
        // Record verification outcome (not a member, but not exactly "failed")
        recordFailedVerification(
          interaction.user.id,
          email,
          interaction.guild.id,
          'Not a DSA member'
        );
        
        // Affiliate flow → show pronouns step
        await safeRoleAssignment(interaction.member, ROLE_AFFILIATE_UNVERIFIED, 'add');
        
        // Create UI components
        const pronounMenu = createPronounSelectionMenu();
        const doneButton = createDoneButton('pronouns', true); // true = affiliate

        await interaction.editReply({
          content: '🤝 Thanks for your interest! We don\'t see your email in our member database, but we\'d love to have you as a community ally.\n\n' +
            '🏷️ **Step 1:** Help us get to know you better! Select your pronouns below (you can choose multiple options), then click **Done** when you\'re set.\n\n' +
            'Available options:\n• HE/HIM\n• SHE/HER\n• THEY/THEM\n• ANY/ALL',
          components: [
            new ActionRowBuilder().addComponents(pronounMenu),
            doneButton
          ]
        });
      }
    } catch (error) {
      console.error('[verify] lookupAN error:', error);
      
      // Record the verification failure
      recordFailedVerification(
        interaction.user.id,
        email,
        interaction.guild.id,
        error.message
      );
      
      const msg = error.message.startsWith('Invalid email')
        ? `❌ ${error.message}. Please enter a valid address.`
        : '❌ Verification error. Please try again or contact an admin.';
      
      await interaction.editReply({ content: msg });
    }
  } catch (err) {
    if (err instanceof BotError && err.type === ErrorTypes.VALIDATION) {
      recordFailedVerification(
        interaction.user.id, 
        'invalid-input',
        interaction.guild.id,
        err.message
      );
      
      if (interaction.deferred) {
        return interaction.editReply({ content: `❌ ${err.message}` });
      } else {
        return interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
      }
    }
    
    // Re-throw for global handler
    throw err;
  }
}

// Register modal handlers
registerModalHandler('verify_email_modal', handleVerifyEmailModal);

/**
 * Main entry point for handling modal submissions
 * @param {import('discord.js').ModalSubmitInteraction} interaction 
 */
export async function handleModals(interaction) {
  if (!interaction.isModalSubmit()) return;
  
  // Rate limit check
  const userRateLimiter = commandRateLimiter.forUser(interaction.user.id);
  if (!(await userRateLimiter.consume(1))) {
    return interaction.reply({ 
      content: '⏱️ You\'re submitting forms too quickly. Please wait a moment and try again.',
      ephemeral: true 
    });
  }
  
  // Log the interaction
  info(interaction.guild, `Modal submission: ${interaction.customId} by ${interaction.user.tag}`);
  
  try {
    // Get the appropriate handler
    const handler = getModalHandler(interaction.customId);
    
    if (!handler) {
      error(interaction.guild, `Unknown modal: ${interaction.customId}`, {
        userId: interaction.user.id
      });
      
      return interaction.reply({
        content: '❌ Unknown form submission. Please try again or contact an admin.',
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
export { handleVerifyEmailModal };
// commands/verify.js
import { SlashCommandBuilder } from 'discord.js';
import { createEmailVerificationModal } from '../utils/componentFactory.js';
import { info } from '../utils/logger.js';
import { BotError, ErrorTypes } from '../utils/errorTypes.js';
import { registerCommandHandler } from '../utils/handlerRegistry.js';

// Command definition
export const data = new SlashCommandBuilder()
  .setName('verify')
  .setDescription('Verify your DSA membership by email');

// Command handler
export async function execute(interaction) {
  try {
    // Create the email verification modal
    const modal = createEmailVerificationModal();
    
    // Show the modal to the user
    await interaction.showModal(modal);
    
    // Log the interaction
    info(interaction.guild, `Showing verify modal to ${interaction.user.tag}`);
  } catch (err) {
    throw new BotError(
      `Failed to show modal for ${interaction.user.tag}: ${err.message}`,
      ErrorTypes.DISCORD_API,
      err.code
    );
  }
}

// Register this command with the handler registry
registerCommandHandler('verify', execute);
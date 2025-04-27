// handlers/verifyStart.js
import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} from 'discord.js';
import { info } from '../utils/logger.js';
import { BotError, ErrorTypes } from '../utils/errorTypes.js';

export async function handleVerifyStart(interaction) {
  const modal = new ModalBuilder()
    .setCustomId('verify_email_modal')
    .setTitle('Verify Your DSA Membership');

  const emailInput = new TextInputBuilder()
    .setCustomId('email_input')
    .setLabel('Enter your email you used to sign up for DSA!')
    .setPlaceholder('email@example.com')
    .setRequired(true)
    .setStyle(TextInputStyle.Short);

  modal.addComponents(new ActionRowBuilder().addComponents(emailInput));

  try {
    await interaction.showModal(modal);
    info(interaction.guild, `Showing verify modal to ${interaction.user.tag}`);
  } catch (err) {
    throw new BotError(
      `Failed to show modal for ${interaction.user.tag}: ${err.message}`,
      ErrorTypes.DISCORD_API,
      err.code
    );
  }
}

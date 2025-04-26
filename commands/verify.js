import { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';
import { lookupAN } from '../services/actionNetwork.js';
import { CHANNEL_RULES } from '../config.js';

export const data = new SlashCommandBuilder()
  .setName('verify')
  .setDescription('Verify your DSA membership by email');

export async function execute(interaction, client) {
  // Create a modal for email input
  const modal = new ModalBuilder()
    .setCustomId('verify_email_modal')
    .setTitle('Verify Your DSA Membership');
    
  const emailInput = new TextInputBuilder()
    .setCustomId('email_input')
    .setLabel('Enter your Action Network email')
    .setPlaceholder('email@example.com')
    .setRequired(true)
    .setStyle(TextInputStyle.Short);
    
  const row = new ActionRowBuilder().addComponents(emailInput);
  modal.addComponents(row);
  
  await interaction.showModal(modal);
}
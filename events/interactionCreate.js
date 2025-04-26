// events/interactionCreate.js
import { Events } from 'discord.js';
import { handleButtons } from '../handlers/buttonHandlers.js';
import modalHandler from '../handlers/modalHandlers.js';
import { handleSelectMenus } from '../handlers/selectMenuHandlers.js';

export default {
  name: Events.InteractionCreate,
  /**
   * @param {import('discord.js').Interaction} interaction
   * @param {import('discord.js').Client} client
   */
  async execute(interaction, client) {
      console.log(`[interaction] ${interaction.user.tag} → ${interaction.commandName || interaction.customId}`);

    try {
      // Slash commands
      if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) {
          return interaction.reply({ content: '❌ This command isn’t implemented yet.', ephemeral: true });
        }
        await command.execute(interaction, client);
        return;
      }

      // Buttons
      if (interaction.isButton()) {
        return handleButtons(interaction, client);
      }

      // Select menus
      if (interaction.isStringSelectMenu()) {
        return handleSelectMenus(interaction, client);
      }

      // Modals
      if (interaction.isModalSubmit()) {
        return modalHandler.execute(interaction, client);
      }
    } catch (error) {
      console.error('Error handling interaction:', error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: '❌ There was an error processing your request.', ephemeral: true }).catch(console.error);
      } else {
        await interaction.reply({ content: '❌ There was an error processing your request.', ephemeral: true }).catch(console.error);
      }
    }
  }
};

// events/interactionCreate.js
import { Events } from 'discord.js';
import { handleButtons } from '../handlers/buttonHandlers.js';
import { handleModals }   from '../handlers/modalHandlers.js';
import { handleSelectMenus } from '../handlers/selectMenuHandlers.js';
import { getCommandHandler } from '../utils/handlerRegistry.js';
import { error, info } from '../utils/logger.js';
import { BotError, ErrorTypes } from '../utils/errorTypes.js';
import { getErrorMessage } from '../config/errorMessages.js';

export default {
  name: Events.InteractionCreate,
  
  async execute(interaction, client) {
    try {
      info(
        interaction.guild,
        `Interaction: ${interaction.type} ${interaction.commandName || interaction.customId || 'unknown'} from ${interaction.user.tag}`
      );

      // Slash commands
      if (interaction.isChatInputCommand()) {
        const cmd = client.commands.get(interaction.commandName);
        if (!cmd?.execute) {
          throw new BotError(
            `Command not found: ${interaction.commandName}`,
            ErrorTypes.COMMAND,
            'COMMAND_NOT_FOUND'
          );
        }
      
        // run the module’s execute()
        await cmd.execute(interaction, client);
        return;
      }

      // Buttons
      if (interaction.isButton()) {
        return await handleButtons(interaction);
      }

      // Select menus
      if (interaction.isStringSelectMenu()) {
        return await handleSelectMenus(interaction);
      }

      // Modals
      if (interaction.isModalSubmit()) {
        return await handleModals(interaction);
      }
      
    } catch (err) {
      // Last-resort error handler
      const errorType = err.type || ErrorTypes.UNKNOWN;
      const errorCode = err.code || null;
      
      error(
        interaction.guild,
        `Unhandled error in interaction handler: ${err.message}`,
        { 
          errorType,
          errorCode,
          errorStack: err.stack,
          interactionType: interaction.type,
          interactionId: interaction.customId || interaction.commandName
        }
      );
      
      // Provide a user-friendly error message
      const content = getErrorMessage(errorType, errorCode);
      
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content, ephemeral: true }).catch(() => {});
      } else {
        await interaction.reply({ content, ephemeral: true }).catch(() => {});
      }
    }
  }
};
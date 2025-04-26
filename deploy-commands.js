// deploy-commands.js
import { REST, Routes } from 'discord.js';
import { TOKEN, CLIENT, GUILD } from './config.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// deploy-commands.js - corrected command handling 
for (const file of commandFiles) {
  try {
    const filePath = path.join(commandsPath, file);
    const fileURL = `file://${filePath}`;
    const command = await import(fileURL);
    
    // Properly handle different export patterns
    if (command.data && typeof command.data.toJSON === 'function') {
      // SlashCommandBuilder instance
      commands.push(command.data.toJSON());
    } else if (command.data) {
      // Plain data object
      commands.push(command.data);
    } else if (command.default?.data) {
      // Default export with data property
      const data = command.default.data;
      if (typeof data.toJSON === 'function') {
        commands.push(data.toJSON());
      } else {
        commands.push(data);
      }
    } else {
      console.warn(`Command at ${file} has no valid data property`);
    }
  } catch (error) {
    console.error(`Error loading command ${file}:`, error);
  }
}

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log(`Started refreshing ${commands.length} application commands.`);
    const data = await rest.put(
      Routes.applicationGuildCommands(CLIENT, GUILD),
      { body: commands }
    );
    console.log(`Successfully reloaded ${data.length} application commands.`);
  } catch (error) {
    console.error('Error deploying commands:', error);
  }
})();
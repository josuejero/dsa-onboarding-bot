import { Client, GatewayIntentBits, Partials, Collection } from 'discord.js';
import { TOKEN } from './config.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { globby } from 'globby';

// Determine __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize the Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction
  ]
});

// Dynamic command loading
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  try {
    const filePath = path.join(commandsPath, file);
    const fileURL = pathToFileURL(filePath).href;
    const module = await import(fileURL);
    const cmd = module.default || module;
    if (cmd.data && cmd.execute) {
      client.commands.set(cmd.data.name, cmd);
      console.log(`Loaded command: ${cmd.data.name}`);
    } else {
      console.warn(`Skipping "${file}": missing data or execute export`);
    }
  } catch (error) {
    console.error(`Error loading command "${file}":`, error);
  }
}

// Dynamic event loading
const eventPattern = path.join(__dirname, 'events/*.js');
const eventFiles = await globby(eventPattern);
for (const filePath of eventFiles) {
  try {
    const fileUrl = pathToFileURL(filePath).href;
    const { default: evt } = await import(fileUrl);
    if (evt.once) {
      client.once(evt.name, (...args) => evt.execute(...args, client));
    } else {
      client.on(evt.name, (...args) => evt.execute(...args, client));
    }
    console.log(`Registered event: ${evt.name}`);
  } catch (error) {
    console.error(`Error loading event from ${filePath}:`, error);
  }
}

// Global error handler
process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
});

// Log in to Discord
client.login(TOKEN).catch(err => {
  console.error('Failed login:', err);
  process.exit(1);
});

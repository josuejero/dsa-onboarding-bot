// index.js
import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { TOKEN, CLIENT, GUILD, validateRuntime } from './config.js';
import { info, error } from './utils/logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { globby } from 'globby';

// Create __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize the client with intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions
  ]
});

// Make client globally available for utilities that need it
global.client = client;

// Store commands in a collection
client.commands = new Collection();

// Load commands
async function loadCommands() {
  const commandsPath = path.join(__dirname, 'commands');
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  
  for (const file of commandFiles) {
    try {
      const filePath = path.join(commandsPath, file);
      const module = await import(`file://${filePath}`);
      
      // Handle both export formats
      if (module.execute && module.data) {
        const commandName = module.data.name || (module.data.toJSON ? module.data.toJSON().name : null);
        if (commandName) {
          info(null, `Loaded command: ${commandName}`);
          client.commands.set(commandName, module);
        }
      }
    } catch (err) {
      error(null, `Failed to load command ${file}: ${err.message}`);
    }
  }
  
  info(null, `Loaded ${client.commands.size} commands`);
}

// Register event handlers
async function registerEvents() {
  // Find all event files
  const eventFiles = await globby('events/*.js', { cwd: __dirname });
  
  for (const filePath of eventFiles) {
    try {
      const fullPath = path.join(__dirname, filePath);
      const { default: event } = await import(`file://${fullPath}`);
      
      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
      } else {
        client.on(event.name, (...args) => event.execute(...args, client));
      }
      
      info(null, `Registered event: ${event.name}`);
    } catch (err) {
      error(null, `Failed to register event from ${filePath}: ${err.message}`);
    }
  }
}

// Preload handlers
async function preloadHandlerModules() {
  // These imports initialize the handler registry
  await import('./handlers/buttonHandlers.js');
  await import('./handlers/modalHandlers.js');
  await import('./handlers/selectMenuHandlers.js');
  await import('./handlers/helpButtons.js'); // Add our new help button handlers

  
  info(null, 'Preloaded handler modules');
}

// Run startup sequence
async function startup() {
  try {
    info(null, 'Starting bot...');
    
    // Load commands
    await loadCommands();
    
    // Register events
    await registerEvents();
    
    // Preload handlers
    await preloadHandlerModules();
    
    // Log in to Discord
    await client.login(TOKEN);
    
    info(null, 'Startup sequence completed');
  } catch (err) {
    error(null, `Startup failed: ${err.message}`, { stack: err.stack });
    process.exit(1);
  }
}

// Handle process errors
process.on('unhandledRejection', err => {
  error(null, `Unhandled promise rejection: ${err.message}`, { stack: err.stack });
});

process.on('uncaughtException', err => {
  error(null, `Uncaught exception: ${err.message}`, { stack: err.stack });
  process.exit(1);
});

// Start the bot
startup();
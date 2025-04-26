#!/usr/bin/env node
/**
 * refactor.js
 *
 * Run in your project root:
 *   npm install replace-in-file globby fs-extra
 *   node refactor.js
 */

import { globby } from 'globby';
import { replaceInFile as replace } from 'replace-in-file';
import fs from 'fs-extra';
import path from 'path';

async function run() {
  // 1. Standardize all commands to use named exports (data + execute)
  const cmdFiles = await globby('commands/**/*.js');
  for (const file of cmdFiles) {
    // 1a. Replace `export default { data:` with `export const data =`
    await replace({
      files: file,
      from: /export\s+default\s*{\s*data\s*:/,
      to: 'export const data ='
    });
    // 1b. Convert default execute method into a named function
    await replace({
      files: file,
      from: /export\s+default\s*{[\s\S]*?execute\s*:\s*(async\s+function)?\s*\(([\s\S]*?)\)\s*{([\s\S]*?)}\s*};?/m,
      to: 'export async function execute($2) {$3}'
    });
  }

  // 2. Replace direct process.env destructuring with config.js imports
  const envFiles = await globby([
    'commands/**/*.js',
    'handlers/**/*.js',
    'services/**/*.js'
  ]);
  for (const file of envFiles) {
    await replace({
      files: file,
      from: /const\s*{\s*([A-Z0-9_,\s]+)\s*}\s*=\s*process\.env\s*;\s*/g,
      to: (match, vars) => {
        const imports = vars
          .split(',')
          .map(v => v.trim())
          .join(', ');
        return `import { ${imports} } from '../config.js';\n`;
      }
    });
  }

  // 3. Create utils/logger.js
  const loggerPath = path.join('utils', 'logger.js');
  await fs.ensureDir(path.dirname(loggerPath));
  await fs.writeFile(
    loggerPath,
    `import { LOG_CHANNEL } from '../config.js';

export async function log(guild, type, message) {
  if (!LOG_CHANNEL) return;
  try {
    const ch = await guild.channels.fetch(LOG_CHANNEL);
    if (ch?.isTextBased()) {
      const emoji = type === 'error' ? '❌' : '✅';
      await ch.send(\`\${emoji} **\${type.toUpperCase()}**: \${message}\`);
    }
  } catch (e) {
    console.error('Logger failed:', e);
  }
}
`
  );

  // 4. Create utils/withErrorHandler.js
  const wehPath = path.join('utils', 'withErrorHandler.js');
  await fs.writeFile(
    wehPath,
    `import { log } from './logger.js';

export function withErrorHandler(fn) {
  return async function(interaction, client) {
    try {
      await fn(interaction, client);
    } catch (err) {
      console.error('Handler error:', err);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: '❌ There was an error. Please try again later.', ephemeral: true }).catch(()=>{});
      } else {
        await interaction.reply({ content: '❌ There was an error. Please try again later.', ephemeral: true }).catch(()=>{});
      }
      await log(interaction.guild, 'error', err.message);
    }
  };
}
`
  );

  // 5. Inject Joi-based email validation into services/actionNetwork.js
  const anPath = 'services/actionNetwork.js';
  if (await fs.pathExists(anPath)) {
    await replace({
      files: anPath,
      from: /import axios from 'axios';/,
      to: `import axios from 'axios';
import Joi from 'joi';
const emailSchema = Joi.string().email().required();`
    });
    await replace({
      files: anPath,
      from: /if \(!email \|\| typeof email !== 'string'\)/,
      to: `{
  const { error } = emailSchema.validate(email);
  if (error) {
    throw new Error('Invalid email: ' + error.message);
  }
}`
    });
  }

  // 6. Update index.js to dynamically load events
  const indexJs = 'index.js';
  if (await fs.pathExists(indexJs)) {
    await replace({
      files: indexJs,
      from: /\/\/ Import and register events dynamically or manually as before[\s\S]*$/,
      to: `// Dynamic event loading
import { globby } from 'globby';
const eventFiles = await globby('events/*.js');
for (const file of eventFiles) {
  const { default: evt } = await import(\`file://\${file}\`);
  if (evt.once) {
    client.once(evt.name, (...args) => evt.execute(...args));
  } else {
    client.on(evt.name, (...args) => evt.execute(...args));
  }
}

// start the bot
process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
});
client.login(TOKEN).catch(err => {
  console.error('Failed login:', err);
  process.exit(1);
});`
    });
  }

  console.log('✅ Refactoring complete! Please review any conflicts and adjust paths as needed.');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});

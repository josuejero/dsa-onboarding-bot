// commands/help.js
import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Get help with bot commands')
  .addStringOption(option => 
    option.setName('command')
      .setDescription('Get specific help for a command')
      .setRequired(false)
      .addChoices(
        { name: 'verify', value: 'verify' },
        { name: 'roles', value: 'roles' },
        { name: 'rules', value: 'rules' },
        { name: 'onboard', value: 'onboard' },
        { name: 'confirm-affiliate', value: 'confirm-affiliate' }
      )
  );

export async function execute(interaction, client) {
  // Check if user is requesting specific command help
  const specificCommand = interaction.options.getString('command');
  
  if (specificCommand) {
    return await showCommandHelp(interaction, specificCommand);
  }
  
  // General help embed
  const embed = new EmbedBuilder()
    .setTitle('🤖 DSA Discord Bot Help')
    .setDescription('Here are the available commands for this server:')
    .setColor('#e63946')
    .addFields([
      {
        name: '/verify',
        value: 'Start the verification process to confirm your DSA membership status'
      },
      {
        name: '/roles',
        value: 'Open the role-selection menu to update your pronouns, region, and working groups'
      },
      {
        name: '/rules',
        value: 'Review the server rules'
      },
      {
        name: '/help',
        value: 'Show this help message'
      }
    ])
    .setFooter({
      text: 'Delaware DSA',
      iconURL: interaction.guild.iconURL() || undefined
    });
  
  // Add moderator commands if user has the right permissions
  if (interaction.member.permissions.has('ManageRoles')) {
    embed.addFields([
      {
        name: '🔧 Moderator Commands',
        value: [
          '`/onboard` - Send onboarding message to a user',
          '`/confirm-affiliate` - Confirm a user as a chapter affiliate'
        ].join('\n')
      }
    ]);
  }
  
  // Create interactive buttons for quick command access
  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('help_verify')
        .setLabel('Verify')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('help_roles')
        .setLabel('Roles')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('help_rules')
        .setLabel('Rules')
        .setStyle(ButtonStyle.Primary)
    );
  
  await interaction.reply({
    embeds: [embed],
    components: [row],
    ephemeral: true
  });
}

// Function to show detailed help for a specific command
async function showCommandHelp(interaction, command) {
  let embed;
  
  switch (command) {
    case 'verify':
      embed = new EmbedBuilder()
        .setTitle('Help: /verify')
        .setColor('#e63946')
        .setDescription('Start the verification process to confirm your DSA membership status.')
        .addFields([
          {
            name: 'How It Works',
            value: 'This command opens a form where you can enter your Action Network email to verify your membership status.'
          },
          {
            name: 'After Verification',
            value: 'If your email is found in our database, you\'ll get full member access. Otherwise, you\'ll be assigned as a chapter affiliate pending moderator approval.'
          },
          {
            name: 'Need Help?',
            value: 'If you have trouble with verification, contact a moderator or steering committee member.'
          }
        ]);
      break;
    
    case 'roles':
      embed = new EmbedBuilder()
        .setTitle('Help: /roles')
        .setColor('#e63946')
        .setDescription('Open the role-selection menu to update your pronouns, region, and working groups.')
        .addFields([
          {
            name: 'How It Works',
            value: 'This command opens a menu where you can select:' +
              '\n• Your pronouns' +
              '\n• Your region (Northern/Southern DE)' + 
              '\n• Committees & working groups you want to join'
          },
          {
            name: 'Saved Selections',
            value: 'Your current roles will be pre-selected in the menu. You can add or remove roles anytime by running this command again.'
          }
        ]);
      break;
    
    case 'rules':
      embed = new EmbedBuilder()
        .setTitle('Help: /rules')
        .setColor('#e63946')
        .setDescription('Review the server rules.')
        .addFields([
          {
            name: 'How It Works',
            value: 'This command displays the community rules for the Delaware DSA Discord server.'
          },
          {
            name: 'Accepting Rules',
            value: 'During onboarding, you\'ll need to accept the rules to gain full access to the server.'
          }
        ]);
      break;
    
    case 'onboard':
      // Only show if user has proper permissions
      if (!interaction.member.permissions.has('ManageRoles')) {
        return interaction.reply({
          content: '❌ You don\'t have permission to use the `/onboard` command.',
          ephemeral: true
        });
      }
      
      embed = new EmbedBuilder()
        .setTitle('Help: /onboard')
        .setColor('#e63946')
        .setDescription('Send onboarding message to a user. (Moderator Only)')
        .addFields([
          {
            name: 'How It Works',
            value: 'This command sends an onboarding message to a specified user, allowing them to verify membership or register as an affiliate.'
          },
          {
            name: 'Usage',
            value: '`/onboard user:@username`'
          }
        ]);
      break;
    
    case 'confirm-affiliate':
      // Only show if user has proper permissions
      if (!interaction.member.permissions.has('ManageRoles')) {
        return interaction.reply({
          content: '❌ You don\'t have permission to use the `/confirm-affiliate` command.',
          ephemeral: true
        });
      }
      
      embed = new EmbedBuilder()
        .setTitle('Help: /confirm-affiliate')
        .setColor('#e63946')
        .setDescription('Confirm a user as a chapter affiliate. (Moderator Only)')
        .addFields([
          {
            name: 'How It Works',
            value: 'This command confirms a user as a chapter affiliate, giving them access to affiliate-specific channels and roles.'
          },
          {
            name: 'Usage',
            value: '`/confirm-affiliate user:@username`'
          }
        ]);
      break;
    
    default:
      return interaction.reply({
        content: `❌ Help for command /${command} not found.`,
        ephemeral: true
      });
  }
  
  // Back button to return to main help menu
  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('help_back')
        .setLabel('Back to Help Menu')
        .setStyle(ButtonStyle.Secondary)
    );
  
  await interaction.reply({
    embeds: [embed],
    components: [row],
    ephemeral: true
  });
}
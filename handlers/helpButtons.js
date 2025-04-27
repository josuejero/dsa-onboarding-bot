// handlers/helpButtons.js
import { 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} from 'discord.js';
import { registerButtonHandler } from '../utils/handlerRegistry.js';
import { info } from '../utils/logger.js';
import { BotError, ErrorTypes } from '../utils/errorTypes.js';
import { createSelectMenu } from '../utils/componentFactory.js';
import {
  memberRoleMap,
  memberRoleLabels,
  affiliateRoleMap,
  affiliateRoleLabels
} from '../utils/roleMaps.js';
import { ROLE_AFFILIATE_UNVERIFIED } from '../config.js';

// Help verify button
export async function handleHelpVerify(interaction) {
  info(interaction.guild, `User ${interaction.user.tag} clicked help_verify button`);
  
  const modal = new ModalBuilder()
    .setCustomId('verify_email_modal')
    .setTitle('Verify Your DSA Membership');

  const emailInput = new TextInputBuilder()
    .setCustomId('email_input')
    .setLabel('Enter the email you used to sign up for DSA!')
    .setPlaceholder('email@example.com')
    .setRequired(true)
    .setStyle(TextInputStyle.Short);

  modal.addComponents(new ActionRowBuilder().addComponents(emailInput));

  try {
    await interaction.showModal(modal);
    info(interaction.guild, `Showing verify modal to ${interaction.user.tag} from help button`);
  } catch (err) {
    throw new BotError(
      `Failed to show modal for ${interaction.user.tag} from help button: ${err.message}`,
      ErrorTypes.DISCORD_API,
      err.code
    );
  }
}

// Help roles button
export async function handleHelpRoles(interaction) {
  info(interaction.guild, `User ${interaction.user.tag} clicked help_roles button`);
  
  const member = interaction.member;
  const isAffiliate = member.roles.cache.has(ROLE_AFFILIATE_UNVERIFIED);
  
  // Determine which role map to use based on member type
  const map = isAffiliate ? affiliateRoleMap : memberRoleMap;
  const labels = isAffiliate ? affiliateRoleLabels : memberRoleLabels;

  // Get current roles
  const userRoles = member.roles.cache.map(r => r.id);
  
  // Build select menu options from the centralized maps
  const options = Object.entries(map).map(([key, roleId]) => {
    // Check if user already has this role
    const hasRole = userRoles.includes(roleId);
    
    return {
      label: labels[key],
      value: key,
      default: hasRole // Pre-select if user has this role
    };
  });

  // Create the select menu
  const menu = createSelectMenu(
    isAffiliate ? 'pick_roles_affiliate' : 'pick_roles_member',
    isAffiliate ? 'Select pronouns & affiliate tags…' : 'Select pronouns, region & WGs…',
    options
  );

  // Update the interaction with the menu
  await interaction.update({
    content: '🔧 Role selection menu:',
    components: [new ActionRowBuilder().addComponents(menu)],
    ephemeral: true
  });
}

// Help rules button
export async function handleHelpRules(interaction) {
  info(interaction.guild, `User ${interaction.user.tag} clicked help_rules button`);
  
  const rulesEmbed = new EmbedBuilder()
    .setTitle('📜 Community Rules')
    .setDescription([
      'Our **DEDSA Discord Rules** keep us safe, respectful, and energizing for everyone:',
      '1️⃣ **Be Respectful** – Engage comradely.',
      '2️⃣ **No Harassment** – Zero tolerance for hate speech or personal attacks.',
      '3️⃣ **Stay On-Topic** – Keep discussions aligned with our mission.',
      '4️⃣ **Protect Privacy** – Do not share anyone\'s personal info.',
      '5️⃣ **No Spam** – Avoid excessive messages or unsolicited links.',
      '6️⃣ **Uphold DSA Values** – Solidarity, equality, and justice in all interactions.',
      '',
      'React with ✅ in the #rules channel once you\'ve read and agree.'
    ].join('\n'))
    .setColor('Blue')
    .setFooter({ text: 'Use /rules any time to review these.' });

  await interaction.update({
    content: null,
    embeds: [rulesEmbed],
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('help_back')
          .setLabel('Back to Help Menu')
          .setStyle(ButtonStyle.Secondary)
      )
    ],
    ephemeral: true
  });
}

// Help back button
export async function handleHelpBack(interaction) {
  info(interaction.guild, `User ${interaction.user.tag} clicked help_back button`);
  
  // Go back to main help menu
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
  
  await interaction.update({
    embeds: [embed],
    components: [row],
    ephemeral: true
  });
}

// Register all help button handlers
export function registerHelpButtonHandlers() {
  registerButtonHandler('help_verify', handleHelpVerify);
  registerButtonHandler('help_roles', handleHelpRoles);
  registerButtonHandler('help_rules', handleHelpRules);
  registerButtonHandler('help_back', handleHelpBack);
}

// Auto-register button handlers when this module is imported
registerHelpButtonHandlers();
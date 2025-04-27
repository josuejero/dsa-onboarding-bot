// utils/componentFactory.js
/**
 * Factory for creating Discord UI components with consistent styling
 */
import { 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} from 'discord.js';

/**
 * Create a primary button
 * @param {string} customId - Button customId
 * @param {string} label - Button label
 * @param {ButtonStyle} style - Button style (defaults to PRIMARY)
 * @returns {ButtonBuilder} - Button component
 */
export function createButton(customId, label, style = ButtonStyle.Primary) {
  return new ButtonBuilder()
    .setCustomId(customId)
    .setLabel(label)
    .setStyle(style);
}

/**
 * Create success button
 * @param {string} customId - Button customId
 * @param {string} label - Button label
 * @returns {ButtonBuilder} - Success button
 */
export function createSuccessButton(customId, label) {
  return createButton(customId, label, ButtonStyle.Success);
}

/**
 * Create danger button
 * @param {string} customId - Button customId
 * @param {string} label - Button label
 * @returns {ButtonBuilder} - Danger button
 */
export function createDangerButton(customId, label) {
  return createButton(customId, label, ButtonStyle.Danger);
}

/**
 * Create a row of buttons
 * @param  {...ButtonBuilder} buttons - Buttons to add to row
 * @returns {ActionRowBuilder} - Row of buttons
 */
export function createButtonRow(...buttons) {
  return new ActionRowBuilder().addComponents(buttons);
}

/**
 * Create a string select menu
 * @param {string} customId - Select menu customId
 * @param {string} placeholder - Placeholder text
 * @param {Array} options - Array of options, each with label and value
 * @param {Object} settings - Additional settings like minValues, maxValues
 * @returns {StringSelectMenuBuilder} - Select menu component
 */
export function createSelectMenu(customId, placeholder, options, settings = {}) {
  const { minValues = 0, maxValues = options.length } = settings;
  
  return new StringSelectMenuBuilder()
    .setCustomId(customId)
    .setPlaceholder(placeholder)
    .setMinValues(minValues)
    .setMaxValues(maxValues)
    .addOptions(options);
}

/**
 * Create a modal
 * @param {string} customId - Modal customId
 * @param {string} title - Modal title
 * @param {Array} inputs - Array of input objects with id, label, style, etc.
 * @returns {ModalBuilder} - Modal component
 */
export function createModal(customId, title, inputs) {
  const modal = new ModalBuilder()
    .setCustomId(customId)
    .setTitle(title);
    
  for (const input of inputs) {
    const { id, label, placeholder = '', required = true, style = TextInputStyle.Short, value = null } = input;
    
    const textInput = new TextInputBuilder()
      .setCustomId(id)
      .setLabel(label)
      .setRequired(required)
      .setStyle(style);
      
    if (placeholder) {
      textInput.setPlaceholder(placeholder);
    }
    
    if (value) {
      textInput.setValue(value);
    }
    
    modal.addComponents(new ActionRowBuilder().addComponents(textInput));
  }
  
  return modal;
}

/**
 * Create an email verification modal
 * @returns {ModalBuilder} - Email verification modal
 */
export function createEmailVerificationModal() {
  return createModal(
    'verify_email_modal',
    'Verify Your DSA Membership',
    [
      {
        id: 'email_input',
        label: 'Enter your Action Network email',
        placeholder: 'email@example.com',
        required: true,
        style: TextInputStyle.Short
      }
    ]
  );
}

/**
 * Create onboarding buttons
 * @returns {ActionRowBuilder} - Row with onboarding buttons
 */
export function createOnboardingButtons() {
  return createButtonRow(
    createSuccessButton('verify_start', 'I am a member'),
    createButton('affiliate_start', 'I\'m an affiliate', ButtonStyle.Secondary)
  );
}

/**
 * Create admin approval buttons for a user
 * @param {string} userId - User ID to approve/deny
 * @returns {ActionRowBuilder} - Row with approval buttons
 */
export function createAdminApprovalButtons(userId) {
  return createButtonRow(
    createSuccessButton(`admin_verify_approve_${userId}`, 'Approve'),
    createDangerButton(`admin_verify_deny_${userId}`, 'Deny')
  );
}

/**
 * Create pronoun selection menu
 * @returns {StringSelectMenuBuilder} - Pronoun selection menu
 */
export function createPronounSelectionMenu() {
  return createSelectMenu(
    'pick_pronouns',
    'Select your pronouns…',
    [
      { label: 'HE/HIM',    value: 'pronoun_he'   },
      { label: 'SHE/HER',   value: 'pronoun_she'  },
      { label: 'THEY/THEM', value: 'pronoun_they' },
      { label: 'ANY/ALL',   value: 'pronoun_any'  }
    ],
    { minValues: 1 }
  );
}

/**
 * Create a "Done" button for a specific step
 * @param {string} step - Step name (e.g., 'pronouns', 'roles')
 * @param {boolean} isAffiliate - Whether this is for an affiliate
 * @returns {ActionRowBuilder} - Row with done button
 */
export function createDoneButton(step, isAffiliate = false) {
  const suffix = isAffiliate ? '_affiliate' : '';
  return createButtonRow(
    createButton(`${step}_done${suffix}`, 'Done')
  );
}
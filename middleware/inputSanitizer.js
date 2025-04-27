// middleware/inputSanitizer.js
import { BotError, ErrorTypes } from '../utils/errorTypes.js';
import { error } from '../utils/logger.js';
import Joi from 'joi';

// Validation schemas for different input types
const schemas = {
  email: Joi.string().email().required(),
  userId: Joi.string().pattern(/^\d{17,19}$/).required(),
  roleId: Joi.string().pattern(/^\d{17,19}$/).required(),
  channelId: Joi.string().pattern(/^\d{17,19}$/).required(),
  messageId: Joi.string().pattern(/^\d{17,19}$/).required(),
  commandName: Joi.string().pattern(/^[a-z0-9_-]{1,32}$/).required(),
  customId: Joi.string().max(100).required()
};

/**
 * Sanitize string to prevent injection attacks
 * @param {string} input 
 * @returns {string}
 */
export function sanitizeString(input) {
  if (typeof input !== 'string') return '';
  
  // Strip control chars & escape HTML entities
  return input
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')  // Control chars
    .replace(/[&<>"']/g, char => {                 // HTML entities
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[char];
    });
}

/**
 * Validate input against schema
 * @param {string} input 
 * @param {string} type - Schema type
 * @returns {string} Validated input
 * @throws {BotError} If validation fails
 */
export function validateInput(input, type) {
  const schema = schemas[type];
  if (!schema) {
    throw new Error(`Unknown validation schema: ${type}`);
  }
  
  const { error: validationError, value } = schema.validate(input);
  if (validationError) {
    throw BotError.validation(
      `Invalid ${type}: ${validationError.message}`,
      `INVALID_${type.toUpperCase()}`
    );
  }
  
  return value;
}

/**
 * Process modal submission inputs
 * @param {import('discord.js').ModalSubmitInteraction} interaction 
 * @param {Object} fieldValidations - Map of field IDs to validation schemas
 * @returns {Object} Object with validated values
 */
export function processModalSubmission(interaction, fieldValidations) {
  const result = {};
  
  for (const [fieldId, validationType] of Object.entries(fieldValidations)) {
    try {
      const rawValue = interaction.fields.getTextInputValue(fieldId);
      const sanitizedValue = sanitizeString(rawValue);
      
      if (validationType) {
        result[fieldId] = validateInput(sanitizedValue, validationType);
      } else {
        result[fieldId] = sanitizedValue;
      }
    } catch (err) {
      error(interaction.guild, `Field validation error: ${err.message}`, { 
        fieldId,
        validationType,
        userId: interaction.user.id
      });
      
      throw BotError.validation(
        `Invalid input for field "${fieldId}"`,
        'FIELD_VALIDATION_ERROR'
      );
    }
  }
  
  return result;
}
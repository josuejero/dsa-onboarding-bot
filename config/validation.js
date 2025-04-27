// config/validation.js
import Joi from 'joi';

// Regex pattern for Discord IDs (17-19 digits)
const discordIdPattern = /^\d{17,19}$/;

// Schema for Discord IDs
const discordId = Joi.string().pattern(discordIdPattern).required();

// Schema for optional Discord IDs
const optionalDiscordId = Joi.string().pattern(discordIdPattern).allow(null, '');

// Create a schema for all environment variables
export const envSchema = Joi.object({
  // Bot configuration
  DISCORD_TOKEN: Joi.string().required(),
  CLIENT_ID: discordId,
  GUILD_ID: discordId,
  AN_TOKEN: Joi.string().required(),
  
  // Channels
  CHANNEL_ONBOARDING: discordId,
  CHANNEL_RULES: discordId,
  MESSAGE_RULES: discordId,
  LOG_CHANNEL: optionalDiscordId.default(null),
  
  // Primary roles
  ROLE_PENDING: discordId,
  ROLE_MEMBER_UNVERIFIED: discordId,
  ROLE_AFFILIATE_UNVERIFIED: discordId,
  ROLE_RULES_ACCEPTED: discordId,
  ROLE_MEMBER: discordId,
  ROLE_AFFILIATE: discordId,
  
  // Pronoun roles
  ROLE_PRONOUN_HE: discordId,
  ROLE_PRONOUN_SHE: discordId,
  ROLE_PRONOUN_THEY: discordId,
  ROLE_PRONOUN_ANY: discordId,
  
  // Region roles
  ROLE_NORTH: discordId,
  ROLE_SOUTH: discordId,
  
  // Committee/Working Group roles
  ROLE_COMMUNICATIONS: discordId,
  ROLE_MEMBERSHIP_ENGAGEMENT: discordId,
  ROLE_POLITICAL_EDUCATION: discordId,
  ROLE_LEGISLATION_TRACKING: discordId,
  ROLE_RED_RABBITS: discordId,
  ROLE_PALESTINE: discordId,
  ROLE_MIGRANT_RIGHTS: discordId,
  ROLE_QUEER_SOCIALISTS: discordId,
  ROLE_ARTS_CULTURE: discordId,
  ROLE_HOUSING_JUSTICE: discordId,
  ROLE_MUTUAL_AID: discordId,
  ROLE_YDSA: discordId,
  
  // Affiliate-specific roles
  ROLE_NON_DSA_MEMBER: discordId,
  ROLE_DSA_NON_DE: discordId,
  
  // Runtime environment
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development')
});

// Function to validate environment configuration
export function validateEnv(env) {
  const { error, value } = envSchema.validate(env, {
    allowUnknown: true, // Allow extra env vars
    abortEarly: false, // Show all validation errors at once
  });
  
  if (error) {
    const formattedErrors = error.details.map(detail => `  - ${detail.message}`).join('\n');
    throw new Error(`Environment validation failed:\n${formattedErrors}`);
  }
  
  return value;
}
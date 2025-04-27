// config.js
import validatedEnv, { defaultConfig, NODE_ENV } from './env.js';
import { validateRuntime } from './runtimeValidation.js';

// Build the single config object
const config = {
  NODE_ENV,

  // Bot credentials
  TOKEN:       validatedEnv.DISCORD_TOKEN,
  CLIENT:      validatedEnv.CLIENT_ID,
  GUILD:       validatedEnv.GUILD_ID,
  AN_TOKEN:    validatedEnv.AN_TOKEN,

  // Channels & messages
  CHANNEL_ONBOARDING: validatedEnv.CHANNEL_ONBOARDING,
  CHANNEL_RULES:      validatedEnv.CHANNEL_RULES,
  MESSAGE_RULES:      validatedEnv.MESSAGE_RULES,
  LOG_CHANNEL:        validatedEnv.LOG_CHANNEL,

  // Core roles
  ROLE_PENDING:            validatedEnv.ROLE_PENDING,
  ROLE_MEMBER_UNVERIFIED:  validatedEnv.ROLE_MEMBER_UNVERIFIED,
  ROLE_AFFILIATE_UNVERIFIED: validatedEnv.ROLE_AFFILIATE_UNVERIFIED,
  ROLE_RULES_ACCEPTED:     validatedEnv.ROLE_RULES_ACCEPTED,
  ROLE_MEMBER:             validatedEnv.ROLE_MEMBER,
  ROLE_AFFILIATE:          validatedEnv.ROLE_AFFILIATE,

  // Pronouns, regions, committees, affiliates…
  ROLE_PRONOUN_HE:   validatedEnv.ROLE_PRONOUN_HE,
  ROLE_PRONOUN_SHE:  validatedEnv.ROLE_PRONOUN_SHE,
  ROLE_PRONOUN_THEY: validatedEnv.ROLE_PRONOUN_THEY,
  ROLE_PRONOUN_ANY:  validatedEnv.ROLE_PRONOUN_ANY,

  ROLE_NORTH:        validatedEnv.ROLE_NORTH,
  ROLE_SOUTH:        validatedEnv.ROLE_SOUTH,

  ROLE_COMMUNICATIONS:       validatedEnv.ROLE_COMMUNICATIONS,
  ROLE_MEMBERSHIP_ENGAGEMENT: validatedEnv.ROLE_MEMBERSHIP_ENGAGEMENT,
  ROLE_POLITICAL_EDUCATION:  validatedEnv.ROLE_POLITICAL_EDUCATION,
  ROLE_LEGISLATION_TRACKING: validatedEnv.ROLE_LEGISLATION_TRACKING,
  ROLE_RED_RABBITS:          validatedEnv.ROLE_RED_RABBITS,
  ROLE_PALESTINE:            validatedEnv.ROLE_PALESTINE,
  ROLE_MIGRANT_RIGHTS:       validatedEnv.ROLE_MIGRANT_RIGHTS,
  ROLE_QUEER_SOCIALISTS:     validatedEnv.ROLE_QUEER_SOCIALISTS,
  ROLE_ARTS_CULTURE:         validatedEnv.ROLE_ARTS_CULTURE,
  ROLE_HOUSING_JUSTICE:      validatedEnv.ROLE_HOUSING_JUSTICE,
  ROLE_MUTUAL_AID:           validatedEnv.ROLE_MUTUAL_AID,
  ROLE_YDSA:                 validatedEnv.ROLE_YDSA,

  ROLE_NON_DSA_MEMBER: validatedEnv.ROLE_NON_DSA_MEMBER,
  ROLE_DSA_NON_DE:     validatedEnv.ROLE_DSA_NON_DE,

  // Merge in your environment‐based defaults
  ...defaultConfig,

  // Flag to avoid re‐validating at runtime
  _validated: false,
};

// Default export + runtime validator
export default config;
export { validateRuntime };

// Named exports for backward compatibility
export const {
  TOKEN, CLIENT, GUILD, AN_TOKEN,
  CHANNEL_ONBOARDING, CHANNEL_RULES, MESSAGE_RULES, LOG_CHANNEL,
  ROLE_PENDING, ROLE_MEMBER_UNVERIFIED, ROLE_AFFILIATE_UNVERIFIED,
  ROLE_RULES_ACCEPTED, ROLE_MEMBER, ROLE_AFFILIATE,

  ROLE_PRONOUN_HE, ROLE_PRONOUN_SHE, ROLE_PRONOUN_THEY, ROLE_PRONOUN_ANY,
  ROLE_NORTH, ROLE_SOUTH,

  ROLE_COMMUNICATIONS, ROLE_MEMBERSHIP_ENGAGEMENT,
  ROLE_POLITICAL_EDUCATION, ROLE_LEGISLATION_TRACKING,
  ROLE_RED_RABBITS, ROLE_PALESTINE, ROLE_MIGRANT_RIGHTS,
  ROLE_QUEER_SOCIALISTS, ROLE_ARTS_CULTURE, ROLE_HOUSING_JUSTICE,
  ROLE_MUTUAL_AID, ROLE_YDSA,

  ROLE_NON_DSA_MEMBER, ROLE_DSA_NON_DE
} = config;

import dotenv from 'dotenv';
dotenv.config();

// List of all required environment variables
const required = [
  'DISCORD_TOKEN', 'CLIENT_ID', 'GUILD_ID', 'AN_TOKEN',
  'ROLE_PENDING', 'ROLE_MEMBER_UNVERIFIED', 'ROLE_AFFILIATE_UNVERIFIED',
  'ROLE_RULES_ACCEPTED', 'ROLE_MEMBER', 'ROLE_AFFILIATE',
  'CHANNEL_ONBOARDING', 'CHANNEL_RULES', 'MESSAGE_RULES',
  'ROLE_PRONOUN_HE', 'ROLE_PRONOUN_SHE', 'ROLE_PRONOUN_THEY', 'ROLE_PRONOUN_ANY',
  'ROLE_NORTH', 'ROLE_SOUTH'
];

// Validate all required env vars exist
for (const key of required) {
  if (!process.env[key]) {
    console.error(`Missing environment variable: ${key}`);
    process.exit(1);
  }
}

// Export all environment variables as constants
export const TOKEN = process.env.DISCORD_TOKEN;
export const CLIENT = process.env.CLIENT_ID;
export const GUILD = process.env.GUILD_ID;
export const AN_TOKEN = process.env.AN_TOKEN;

// Roles
export const ROLE_PENDING = process.env.ROLE_PENDING;
export const ROLE_MEMBER_UNVERIFIED = process.env.ROLE_MEMBER_UNVERIFIED;
export const ROLE_AFFILIATE_UNVERIFIED = process.env.ROLE_AFFILIATE_UNVERIFIED;
export const ROLE_RULES_ACCEPTED = process.env.ROLE_RULES_ACCEPTED;
export const ROLE_MEMBER = process.env.ROLE_MEMBER;
export const ROLE_AFFILIATE = process.env.ROLE_AFFILIATE;

// Pronoun roles
export const ROLE_PRONOUN_HE = process.env.ROLE_PRONOUN_HE;
export const ROLE_PRONOUN_SHE = process.env.ROLE_PRONOUN_SHE;
export const ROLE_PRONOUN_THEY = process.env.ROLE_PRONOUN_THEY;
export const ROLE_PRONOUN_ANY = process.env.ROLE_PRONOUN_ANY;

// Region roles
export const ROLE_NORTH = process.env.ROLE_NORTH;
export const ROLE_SOUTH = process.env.ROLE_SOUTH;

// Committee/Working Group roles
export const ROLE_COMMUNICATIONS = process.env.ROLE_COMMUNICATIONS;
export const ROLE_MEMBERSHIP_ENGAGEMENT = process.env.ROLE_MEMBERSHIP_ENGAGEMENT;
export const ROLE_POLITICAL_EDUCATION = process.env.ROLE_POLITICAL_EDUCATION;
export const ROLE_LEGISLATION_TRACKING = process.env.ROLE_LEGISLATION_TRACKING;
export const ROLE_RED_RABBITS = process.env.ROLE_RED_RABBITS;
export const ROLE_PALESTINE = process.env.ROLE_PALESTINE;
export const ROLE_MIGRANT_RIGHTS = process.env.ROLE_MIGRANT_RIGHTS;
export const ROLE_QUEER_SOCIALISTS = process.env.ROLE_QUEER_SOCIALISTS;
export const ROLE_ARTS_CULTURE = process.env.ROLE_ARTS_AND_CULTURE;
export const ROLE_HOUSING_JUSTICE = process.env.ROLE_HOUSING_JUSTICE;
export const ROLE_MUTUAL_AID = process.env.ROLE_MUTUAL_AID;
export const ROLE_YDSA = process.env.ROLE_YDSA;

// Affiliate-specific roles
export const ROLE_NON_DSA_MEMBER = process.env.ROLE_NON_DSA_MEMBER;
export const ROLE_DSA_NON_DE = process.env.ROLE_DSA_NON_DE;

// Channels
export const CHANNEL_ONBOARDING = process.env.CHANNEL_ONBOARDING;
export const CHANNEL_RULES = process.env.CHANNEL_RULES;
export const MESSAGE_RULES = process.env.MESSAGE_RULES;
export const LOG_CHANNEL = process.env.LOG_CHANNEL;
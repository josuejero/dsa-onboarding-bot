// Import all role IDs from config
import {
  ROLE_PRONOUN_HE,
  ROLE_PRONOUN_SHE,
  ROLE_PRONOUN_THEY,
  ROLE_PRONOUN_ANY,
  ROLE_NORTH,
  ROLE_SOUTH,
  ROLE_COMMUNICATIONS,
  ROLE_MEMBERSHIP_ENGAGEMENT,
  ROLE_POLITICAL_EDUCATION,
  ROLE_LEGISLATION_TRACKING,
  ROLE_RED_RABBITS,
  ROLE_PALESTINE,
  ROLE_MIGRANT_RIGHTS,
  ROLE_QUEER_SOCIALISTS,
  ROLE_ARTS_CULTURE,
  ROLE_HOUSING_JUSTICE,
  ROLE_MUTUAL_AID,
  ROLE_YDSA,
  ROLE_NON_DSA_MEMBER,
  ROLE_DSA_NON_DE
} from '../config.js';

/**
 * Role map for DSA members
 * Key: internal role identifier, Value: Discord role ID
 */
export const memberRoleMap = {
  // Pronouns
  pronoun_he: ROLE_PRONOUN_HE,
  pronoun_she: ROLE_PRONOUN_SHE,
  pronoun_they: ROLE_PRONOUN_THEY,
  pronoun_any: ROLE_PRONOUN_ANY,
  
  // Regions
  region_north: ROLE_NORTH,
  region_south: ROLE_SOUTH,
  
  // Committees and Working Groups
  communications: ROLE_COMMUNICATIONS,
  membership_engagement: ROLE_MEMBERSHIP_ENGAGEMENT,
  political_education: ROLE_POLITICAL_EDUCATION,
  legislation_tracking: ROLE_LEGISLATION_TRACKING,
  red_rabbits: ROLE_RED_RABBITS,
  palestine: ROLE_PALESTINE,
  migrant_rights: ROLE_MIGRANT_RIGHTS,
  queer_socialists: ROLE_QUEER_SOCIALISTS,
  arts_culture: ROLE_ARTS_CULTURE,
  housing_justice: ROLE_HOUSING_JUSTICE,
  mutual_aid: ROLE_MUTUAL_AID,
  ydsa: ROLE_YDSA
};

/**
 * Display labels for member roles
 */
export const memberRoleLabels = {
  // Pronouns
  pronoun_he: "HE/HIM",
  pronoun_she: "SHE/HER",
  pronoun_they: "THEY/THEM",
  pronoun_any: "ANY/ALL",
  
  // Regions
  region_north: "Northern-DE",
  region_south: "Southern-DE",
  
  // Committees and Working Groups
  communications: "Communications Cmte",
  membership_engagement: "Membership Engagement Cmte",
  political_education: "Political Education Cmte",
  legislation_tracking: "Legislation Tracking Cmte",
  red_rabbits: "Red Rabbits Cmte",
  palestine: "Palestine Solidarity WG",
  migrant_rights: "Migrant Rights WG",
  queer_socialists: "Queer Socialists WG",
  arts_culture: "Arts & Culture WG",
  housing_justice: "Housing Justice WG",
  mutual_aid: "Mutual Aid WG",
  ydsa: "YDSA"
};

/**
 * Role map for affiliates (non-members)
 * More limited than members
 */
export const affiliateRoleMap = {
  // Pronouns
  pronoun_he: ROLE_PRONOUN_HE,
  pronoun_she: ROLE_PRONOUN_SHE,
  pronoun_they: ROLE_PRONOUN_THEY,
  pronoun_any: ROLE_PRONOUN_ANY,
  
  // Affiliate-specific tags
  affiliate_non_dsa: ROLE_NON_DSA_MEMBER,
  affiliate_dsa_non_de: ROLE_DSA_NON_DE
};

/**
 * Display labels for affiliate roles
 */
export const affiliateRoleLabels = {
  // Pronouns
  pronoun_he: "HE/HIM",
  pronoun_she: "SHE/HER",
  pronoun_they: "THEY/THEM",
  pronoun_any: "ANY/ALL",
  
  // Affiliate-specific tags
  affiliate_non_dsa: "Non-DSA Member",
  affiliate_dsa_non_de: "DSA Member (Non-DE)"
};
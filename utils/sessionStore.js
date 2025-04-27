// utils/sessionStore.js

/**
 * In-memory store for ongoing onboarding selections.
 * Maps userId → { pronouns: string[], committees: string[] }
 */
export const sessionChoices = new Map();

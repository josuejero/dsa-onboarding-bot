// events/messageReactionAdd.js
import { Events } from 'discord.js';
import {
  ROLE_MEMBER_UNVERIFIED,
  ROLE_AFFILIATE_UNVERIFIED,
  ROLE_RULES_ACCEPTED,
  ROLE_MEMBER,
  MESSAGE_RULES,
  LOG_CHANNEL
} from '../config.js';

export default {
  name: Events.MessageReactionAdd,
  /**
   * @param {import('discord.js').MessageReaction} reaction
   * @param {import('discord.js').User} user
   * @param {import('discord.js').Client} client
   */
  async execute(reaction, user, client) {
    // Ignore bot reactions
    if (user.bot) return;

    // Ensure reaction is fully fetched
    if (reaction.partial) {
      try {
        await reaction.fetch();
      } catch (error) {
        console.error('Error fetching partial reaction:', error);
        return;
      }
    }

    // Only proceed if this is a ✅ on the rules message
    if (
      reaction.message.id !== MESSAGE_RULES ||
      reaction.emoji.name !== '✅'
    ) {
      return;
    }

    const guild = reaction.message.guild;
    if (!guild) return;

    // Fetch up-to-date guild member
    const member = await guild.members.fetch(user.id);

    // Helper to log to channel
    async function logToChannel(content) {
      if (!LOG_CHANNEL) return;
      try {
        const logCh = await guild.channels.fetch(LOG_CHANNEL);
        if (logCh?.isTextBased()) {
          await logCh.send(content);
        }
      } catch (err) {
        console.error('Logging error:', err);
      }
    }

    // Grant the "rules accepted" intermediary role
    try {
      await member.roles.add(ROLE_RULES_ACCEPTED);
    } catch (error) {
      console.error('Failed to add rules accepted role:', error);
      await member.send('❌ I had trouble assigning the "rules accepted" role. Please contact a moderator.').catch(console.error);
      await logToChannel(`❌ ERROR: Failed to add RULES_ACCEPTED to ${user.tag}: ${error.message}`);
      return;
    }

    // Handle DSA members (auto-grant full access)
    if (member.roles.cache.has(ROLE_MEMBER_UNVERIFIED)) {
      // Remove unverified roles
      await member.roles.remove([ROLE_MEMBER_UNVERIFIED, ROLE_RULES_ACCEPTED]).catch(console.error);

      // Grant full Member role
      try {
        await member.roles.add(ROLE_MEMBER);
        await member.send("✅ You've accepted the rules and now have full Member access!").catch(console.error);
        await logToChannel(`📝 INFO: ${user.tag} upgraded to full member`);
      } catch (error) {
        console.error('Failed to add member role:', error);
        await member.send('❌ I had trouble assigning your Member role. Please contact a moderator.').catch(console.error);
        await logToChannel(`❌ ERROR: Failed to add MEMBER to ${user.tag}: ${error.message}`);
      }
    }
    // For affiliates, just remove intermediary and notify mods
    else if (member.roles.cache.has(ROLE_AFFILIATE_UNVERIFIED)) {
      await member.roles.remove(ROLE_RULES_ACCEPTED).catch(console.error);

      await member.send('⏳ Thanks for reading the rules. A moderator will review your affiliate access soon.').catch(console.error);

      const alert = `🚨 ALERT: <@&${ROLE_MEMBER}> ${user.tag} is waiting for affiliate approval!`;
      await logToChannel(alert);
    }
  }
};

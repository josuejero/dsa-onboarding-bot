// handlers/buttonHandlers.js
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} from 'discord.js';
import {
  ROLE_PENDING,
  ROLE_AFFILIATE_UNVERIFIED,
  ROLE_MEMBER_UNVERIFIED,
  ROLE_MEMBER
} from '../config.js';

export async function handleButtons(interaction) {
  console.log(`[buttons] click ${interaction.customId} by ${interaction.user.tag}`);
  const handlerMap = {
    'verify_start': handleVerifyStart,
    'affiliate_start': handleAffiliateStart,
    'roles_done': handleRolesDone,
    'rules_accept_member': handleRulesAccept,
    'rules_accept_affiliate': handleRulesAccept
  };

  const handler = handlerMap[interaction.customId];
  if (!handler) {
    console.warn(`[buttons] No handler for ${interaction.customId}`);
    return interaction.reply({ content: '❌ Unexpected button—please contact an admin.', ephemeral: true });
  }

  try {
    await handler(interaction);
  } catch (err) {
    console.error(`[buttons] Error in ${interaction.customId}:`, err);
    if (!interaction.replied) {
      await interaction.reply({ content: '❌ Error handling button—see logs.', ephemeral: true });
    }
  }
}

async function handleVerifyStart(interaction) {
  const modal = new ModalBuilder()
    .setCustomId('verify_email_modal')
    .setTitle('Verify Your DSA Membership');

  const emailInput = new TextInputBuilder()
    .setCustomId('email_input')
    .setLabel('Enter your Action Network email')
    .setPlaceholder('email@example.com')
    .setRequired(true)
    .setStyle(TextInputStyle.Short);

  modal.addComponents(new ActionRowBuilder().addComponents(emailInput));
  console.log(`[buttons] showing verify modal to ${interaction.user.tag}`);
  await interaction.showModal(modal);
}

async function handleAffiliateStart(interaction) {
  await interaction.member.roles.remove(ROLE_PENDING).catch(console.error);
  await interaction.member.roles.add(ROLE_AFFILIATE_UNVERIFIED).catch(console.error);

  await interaction.update({
    content: `ℹ️ You’re set up as an **affiliate**.\n\nWhen you’re ready, click **Accept Rules** below.`,
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('rules_accept_affiliate')
          .setLabel('Accept Rules')
          .setStyle(ButtonStyle.Primary)
      )
    ]
  });
}

async function handleRolesDone(interaction) {
  // Proceed to rules acceptance step
  await interaction.update({
    content: `🔒 **Our Community Rules**\n\nPlease click **Accept Rules** below to complete onboarding.`,
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('rules_accept_member')
          .setLabel('Accept Rules')
          .setStyle(ButtonStyle.Primary)
      )
    ]
  });
}

async function handleRulesAccept(interaction) {
  const isMemberFlow = interaction.customId === 'rules_accept_member';
  if (isMemberFlow) {
    // Remove the intermediary role
    await interaction.member.roles.remove(ROLE_MEMBER_UNVERIFIED).catch(console.error);

    // Add full member role if not already present
    if (interaction.member.roles.cache.has(ROLE_MEMBER)) {
      console.log(`[rulesAccept] ${interaction.user.tag} already has full Member role`);
    } else {
      try {
        await interaction.member.roles.add(ROLE_MEMBER);
      } catch (err) {
        console.error(`[rulesAccept] Failed to add Member role to ${interaction.user.tag}:`, err);
        return interaction.reply({ content: '❌ Could not assign Member role. Please contact an admin.', ephemeral: true });
      }
    }

    // Final confirmation
    await interaction.update({ content: '✅ Welcome aboard! You now have full Member access.', components: [] });
  } else {
    // Affiliate flow: remove intermediary and notify mods
    await interaction.member.roles.remove(ROLE_AFFILIATE_UNVERIFIED).catch(console.error);
    await interaction.update({ content: '⏳ Thanks! A moderator will review your affiliate access.', components: [] });
  }
}

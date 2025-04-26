// commands/roles.js
import { SlashCommandBuilder } from 'discord.js';
import {
  ActionRowBuilder,
  StringSelectMenuBuilder
} from 'discord.js';
import {
  memberRoleMap,
  memberRoleLabels,
  affiliateRoleMap,
  affiliateRoleLabels
} from '../utils/roleMaps.js';
import { ROLE_AFFILIATE_UNVERIFIED } from '../config.js';

export const data = new SlashCommandBuilder()
  .setName('roles')
  .setDescription('Re-open your role-selection menu');

export async function execute(interaction) {
  const member = interaction.member;
  const isAff = member.roles.cache.has(ROLE_AFFILIATE_UNVERIFIED);
  const map = isAff ? affiliateRoleMap : memberRoleMap;
  const labels = isAff ? affiliateRoleLabels : memberRoleLabels;

  // build select menu options from the centralized maps
  const options = Object.entries(map).map(([key, roleId]) => ({
    label: labels[key],
    value: key
  }));

  const menu = new StringSelectMenuBuilder()
    .setCustomId(isAff ? 'pick_roles_affiliate' : 'pick_roles_member')
    .setPlaceholder(isAff
      ? 'Select pronouns & affiliate tags…'
      : 'Select pronouns, region & WGs…'
    )
    .setMinValues(0)
    .setMaxValues(options.length)
    .addOptions(options);

  const row = new ActionRowBuilder().addComponents(menu);

  await interaction.reply({
    content: '🔧 Re-open your role-selection menu:',
    components: [row],
    ephemeral: true
  });
}

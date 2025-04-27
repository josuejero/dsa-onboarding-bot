import { PermissionsBitField } from 'discord.js';

import { ROLE_AFFILIATE_UNVERIFIED, ROLE_AFFILIATE } from '../config.js';
export const data = {
  name: 'confirm-affiliate',
  description: 'Confirm a user as chapter affiliate',
  options: [
    {
      name: 'user',
      description: 'User to confirm',
      type: 6, // USER
      required: true
    }
  ]
};

export async function execute(interaction) {
  // Permission check
  if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
    return interaction.reply({ content: '❌ You lack Manage Roles permission.', ephemeral: true });
  }

  const targetUser = interaction.options.getUser('user');
  if (!targetUser) {
    return interaction.reply({ content: '❌ Please mention a valid user.', ephemeral: true });
  }

  try {
    // Fetch guild member
    const member = await interaction.guild.members.fetch(targetUser.id);

    // Remove "unverified affiliate" and add "affiliate"
    await member.roles.remove(ROLE_AFFILIATE_UNVERIFIED).catch(() => {});
    await member.roles.add(ROLE_AFFILIATE);

    // Confirm to moderator
    await interaction.reply({ content: `✅ ${targetUser.tag} is now a chapter affiliate.`, ephemeral: true });

    // DM the user
    await member.send('✅ You now have **chapter-affiliate** access. Welcome!').catch(console.error);
  } catch (error) {
    console.error('Error confirming affiliate:', error);
    return interaction.reply({ content: '❌ Failed to confirm affiliate. Please try again or contact an admin.', ephemeral: true });
  }
}

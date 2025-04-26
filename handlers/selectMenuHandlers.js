/**
 * Main entry point for handling select menu interactions
 * @param {import('discord.js').StringSelectMenuInteraction} interaction 
 * @param {import('discord.js').Client} client 
 */
export async function handleSelectMenus(interaction, client) {
    console.log(`[select] ${interaction.customId} by ${interaction.user.tag}`);
    const handlerMap = {
      'pick_roles_member':    handleMemberRoleSelect,
      'pick_roles_affiliate': handleAffiliateRoleSelect
    };
    const handler = handlerMap[interaction.customId];
    if (!handler) {
      console.warn(`[select] No handler for ${interaction.customId}`);
      return interaction.reply({ content: '❌ Unexpected menu—please contact an admin.', ephemeral: true });
    }
    try {
      await handler(interaction, client);
    } catch (err) {
      console.error(`[select] Error in ${interaction.customId}:`, err);
      if (!interaction.replied) {
        await interaction.reply({ content: '❌ Error updating roles—see logs.', ephemeral: true });
      }
    }
   }

/**
 * Handle member role selection
 * @param {import('discord.js').StringSelectMenuInteraction} interaction 
 * @param {import('discord.js').Client} client 
 */
async function handleMemberRoleSelect(interaction, client) {
  try {
    const { memberRoleMap } = await import('../utils/roleMaps.js');
    const selected = interaction.values;
    
    // Get all manageable roles defined in the map
    const allRoleIds = Object.values(memberRoleMap);
    const managedRoles = interaction.member.roles.cache.filter(role => 
      allRoleIds.includes(role.id)
    );
    
    // Remove previously selected roles that aren't in the current selection
    await interaction.member.roles.remove(managedRoles);
    
    // Add the newly selected roles
    const rolesToAdd = selected.map(key => memberRoleMap[key]).filter(Boolean);
    if (rolesToAdd.length > 0) {
      await interaction.member.roles.add(rolesToAdd);
    }
    
    await interaction.reply({
      content: '✅ Your roles have been updated!',
      ephemeral: true
    });
  } catch (error) {
    console.error('Error updating member roles:', error);
    await interaction.reply({
      content: '❌ Failed to update roles. Please try again or contact an admin.',
      ephemeral: true
    });
  }
}

/**
 * Handle affiliate role selection
 * @param {import('discord.js').StringSelectMenuInteraction} interaction 
 * @param {import('discord.js').Client} client 
 */
async function handleAffiliateRoleSelect(interaction, client) {
  try {
    const { affiliateRoleMap } = await import('../utils/roleMaps.js');
    const selected = interaction.values;
    
    // Get all manageable roles defined in the map
    const allRoleIds = Object.values(affiliateRoleMap);
    const managedRoles = interaction.member.roles.cache.filter(role => 
      allRoleIds.includes(role.id)
    );
    
    // Remove previously selected roles that aren't in the current selection
    await interaction.member.roles.remove(managedRoles);
    
    // Add the newly selected roles
    const rolesToAdd = selected.map(key => affiliateRoleMap[key]).filter(Boolean);
    if (rolesToAdd.length > 0) {
      await interaction.member.roles.add(rolesToAdd);
    }
    
    await interaction.reply({
      content: '✅ Your affiliate roles have been updated!',
      ephemeral: true
    });
  } catch (error) {
    console.error('Error updating affiliate roles:', error);
    await interaction.reply({
      content: '❌ Failed to update roles. Please try again or contact an admin.',
      ephemeral: true
    });
  }
}
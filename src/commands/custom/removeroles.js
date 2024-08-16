const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
	category: 'custom',
	data: new SlashCommandBuilder()
		.setName('removeroles')
		.setDescription('Removes all FRC roles from the server.')
		.setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
	async execute(interaction) {
		await interaction.deferReply();
		const roles = interaction.guild.roles.cache.filter(role => role.name.includes('|'));
		const deletePromises = roles.map(role => role.delete());
		await Promise.all(deletePromises)
			.then(() => {
				interaction.editReply({ content: 'All FRC roles have been removed.', ephemeral: true });
			})
			.catch(error => {
				console.error('Error deleting roles:', error);
				interaction.editReply({ content: 'There was an error removing the roles.', ephemeral: true });
			});
	},
};
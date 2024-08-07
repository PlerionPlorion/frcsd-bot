const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('removeroles')
		.setDescription('Removes all FRC roles from the server.'),
	async execute(interaction) {
		const roles = interaction.guild.roles.cache.filter(role => role.name.includes('|'));
		const deletePromises = roles.map(role => role.delete());

		await Promise.all(deletePromises)
			.then(() => {
				interaction.reply({ content: 'All FRC roles have been removed.', ephemeral: true });
			})
			.catch(error => {
				console.error('Error deleting roles:', error);
				interaction.reply({ content: 'There was an error removing the roles.', ephemeral: true });
			});
	},
};
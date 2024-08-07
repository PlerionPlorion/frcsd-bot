const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('removeroles')
		.setDescription('Removes all FRC roles from the server.'),
	execute(interaction) {
		const roles = interaction.guild.roles.cache.filter(role => role.name.includes('|'));
		roles.forEach(role => role.delete());
        interaction.reply('All FRC roles have been removed.');
	},
};
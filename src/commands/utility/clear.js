const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('clearbotmessages')
		.setDescription('Clears all messages from the bot sent within the past 5 minutes.')
		.setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages),
	async execute(interaction) {
		const channel = interaction.channel;
		const botId = interaction.client.user.id;
		const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

		try {
			const messages = await channel.messages.fetch({ limit: 100 });
			const botMessages = messages.filter(msg => msg.author.id === botId && msg.createdTimestamp >= fiveMinutesAgo);

			await channel.bulkDelete(botMessages);

			await interaction.reply({ content: 'Cleared all bot messages from the past 5 minutes.', ephemeral: true });
		} catch (error) {
			console.error('Error clearing bot messages:', error);
			await interaction.reply({ content: 'There was an error clearing the bot messages.', ephemeral: true });
		}
	},
};
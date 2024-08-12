const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('user')
		.setDescription('Provides information about you!'),
	async execute(interaction) {
		// interaction.user is the object representing the User who ran the command
		// interaction.member is the GuildMember object, which represents the user in the specific guild
		const joinedTimestamp = Math.floor(interaction.member.joinedAt.getTime() / 1000);
		await interaction.reply(`This command was run by ${interaction.user.username}, who joined <t:${joinedTimestamp}:R>.`);
	},
};
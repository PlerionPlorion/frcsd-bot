const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

function attemptCommandReload(command, commands) {
	delete require.cache[require.resolve(`../${command.category}/${command.data.name}.js`)];
	try {
		commands.delete(command.data.name);
		const newCommand = require(`../${command.category}/${command.data.name}.js`);
		commands.set(newCommand.data.name, newCommand);
		return `Command \`${newCommand.data.name}\` was reloaded!\n`;
	} catch (error) {
		console.error(error);
		return `There was an error while reloading command \`${command.data.name}\`:\n\`${error.message}\``;
	}
}

module.exports = {
	category: 'utility',
	data: new SlashCommandBuilder()
		.setName('reload')
		.setDescription('Reloads a command.')
		.addStringOption(option =>
			option.setName('command')
				.setDescription('The command to reload.')
				.setRequired(false))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
	async execute(interaction) {
		const commandName = interaction.options.getString('command')?.toLowerCase();
		const commands = interaction.client.commands;

		if (!commandName) {
			await interaction.reply(`Reloading Commands...`);
			let message = '';
			
			const oldCommands = commands.clone();
			oldCommands.forEach(async (command) => {
				message += attemptCommandReload(command, commands);
				await interaction.editReply(message);
			});
		} else {
			const command = commands.get(commandName);

			if (!command) {
				return interaction.reply(`There is no command with name \`${commandName}\`!`);
			}

			await interaction.reply(attemptCommandReload(command, commands));
		}
	},
};

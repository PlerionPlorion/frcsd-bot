import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { SlashCommandBuilder } from '@discordjs/builders';
import 'dotenv/config';

// Create a slash command builder
const pingCommand = new SlashCommandBuilder()
	.setName('ping')
	.setDescription('Check if this interaction is responsive');

// Get the raw data that can be sent to Discord
const commands = [pingCommand.toJSON()];

// Initialize REST client
const rest = new REST({ version: '9' }).setToken(process.env.TOKEN);

// Register the slash command with the Discord API
(async () => {
	try {
		console.log('Started refreshing application (/) commands.');

		await rest.put(
			Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
			{ body: commands },
		);

		console.log('Successfully reloaded application (/) commands.');
	} catch (error) {
		console.error(error);
	}
})();
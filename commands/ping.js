import { SlashCommandBuilder } from '@discordjs/builders';

// Create a slash command builder
const pingCommand = new SlashCommandBuilder().setName('ping').setDescription('Check if this interaction is responsive');

// Get the raw data that can be sent to Discord
const rawData = pingCommand.toJSON();

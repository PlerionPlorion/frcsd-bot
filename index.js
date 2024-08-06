import { Client, GatewayIntentBits } from 'discord.js';
import 'dotenv/config';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

// loop through all files in the commands folder and set them up
import fs from 'fs';
import { commands } from './commands';
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = commands[file];
    client.commands.set(command.data.name, command);
}

client.login(process.env.TOKEN);
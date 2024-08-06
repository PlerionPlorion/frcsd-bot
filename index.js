const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const { token } = require('./config.json');

// Create a new client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
    ],
});
client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

client.once(Events.Ready, () => {
	console.log('Ready!');
});

client.on(Events.MessageCreate, async message => {
	if (!message.content.startsWith(prefix) || message.author.bot) return;

	const args = message.content.slice(prefix.length).trim().split(/ +/);
	const commandName = args.shift().toLowerCase();

	const command = client.commands.get(commandName)
		|| client.commands.find(cmd => cmd.data.aliases && cmd.data.aliases.includes(commandName));

	if (!command) return;

	try {
		await command.execute(message, args);
	} catch (error) {
		console.error(error);
		await message.reply('There was an error trying to execute that command!');
	}
});

client.on(Events.GuildMemberAdd, async member => {
	console.log(`New member joined: ${member.user.tag}`);
	
	const channel = member.guild.channels.cache.find(channel => channel.name === 'general');
	if (channel) {
		await channel.send(`Welcome to the server, ${member.user.tag}!`);
	} else {
		console.error('General channel not found');
	}
});

// Log in to Discord with your client's token
client.login(token);
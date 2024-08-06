const { Events } = require('discord.js');

module.exports = {
	name: Events.GuildMemberUpdate,
	async execute(member) {
		console.log(`New member joined: ${member.user.tag}`);
	
		const channel = member.guild.channels.cache.find(channel => channel.name === 'general');
		if (channel) {
			await channel.send(`Welcome to the server, ${member.user.tag}!`);
		} else {
			console.error('General channel not found');
		}
	},
};
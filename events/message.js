const { Events } = require('discord.js');

let url = 'https://www.thebluealliance.com/api/v3/team/frc';
const options = {
	method: 'GET',
	headers: {
		'accept': 'application/json',
		'X-TBA-Auth-Key': require('../config.json').tba
	}
};

module.exports = {
	name: Events.MessageCreate,
	async execute(message) {
		if (message.author.bot) {
			return;
		}

		const regex = /\b\d{1,5}\b/g;
		const matches = message.content.match(regex);

		if (matches) {
			matches.forEach(async number => {
				const role = message.guild.roles.cache.find(role => role.name.startsWith(`${number} |`));
				
				if (role) {
					message.channel.send(`I know team <@&${role.id}>!`);
					
					if (message.member.roles.cache.has(role.id)) {
						message.member.roles.remove(role);
					} else {
						message.member.roles.add(role);
					}
				} else {
					url = `${url}/${number}`;
					const fetch = (await import('node-fetch')).default;
					const response = await fetch(url, options);
					const data = await response.json();

					const teamName = data.nickname;

					if (teamName) {
						message
					}
				}
			});
		}
	},
};
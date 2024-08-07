const { Events } = require('discord.js');

const baseTbaUrl = 'https://www.thebluealliance.com/api/v3/team/frc';
const baseColorUrl = 'https://api.frc-colors.com/v1/team/';

const workingColor = (color) => {
	// Get the contrast of the parameter color against #0f1011
	// If the contrast is really really bad, return false
	// Otherwise, return true
	const colorToHex = (color) => {
		// If the color is already in hex format, return it
		if (color.startsWith('#')) {
			return color;
		}

		// If the color is in rgb format, convert it to hex format
		const rgb = color.match(/\d+/g);
		const hex = rgb.map(channel => {
			const hex = parseInt(channel).toString(16);
			return hex.length === 1 ? `0${hex}` : hex;
		});

		return `#${hex.join('')}`;
	};

	const luminance = (color) => {
		const hex = colorToHex(color);
		const rgb = hex.match(/\w{2}/g).map(channel => parseInt(channel, 16));

		const [r, g, b] = rgb.map(channel => {
			const sChannel = channel / 255;
			return sChannel <= 0.03928 ? sChannel / 12.92 : ((sChannel + 0.055) / 1.055) ** 2.4;
		});

		return 0.2126 * r + 0.7152 * g + 0.0722 * b;
	};

	const contrast = (color1, color2) => {
		const l1 = luminance(color1);
		const l2 = luminance(color2);

		return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
	};
	// if the color is #000000 or #ffffff, return false
	if (color === '#000000' || color === '#ffffff') {
		return false;
	}
	return contrast(color, '#0f1011') >= 4.5;
}

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
					const tbaUrl = `${baseTbaUrl}${number}`;

					const fetch = (await import('node-fetch')).default;
					const response = await fetch(tbaUrl, options);
					const data = await response.json();
					const teamName = data.nickname;

					// get the team's colors from frc-colors API
					const colorUrl = `${baseColorUrl}${number}`;
					const colorResponse = await fetch(colorUrl);
					const colorData = await colorResponse.json();
					const primaryColor = colorData.primaryHex;

					if (teamName && primaryColor) {
						// make a role with that color and team name formatted "number | teamName"
						// and assign it to the user
						message.guild.roles.create({
							name: `${number} | ${teamName}`,
							color: primaryColor,
						}).then(role => {
							console.log(role.color)
							message.member.roles.add(role);
							message.channel.send(`I know team <@&${role.id}>!`);
							if (!workingColor(primaryColor)) {
								message.channel.send('Their color fucking sucks!');
							}
						});
					}
				}
			});
		}
	},
};
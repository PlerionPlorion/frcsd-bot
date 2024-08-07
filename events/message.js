const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, Events} = require('discord.js');
const { betterColor } = require('../utils/colorUtil');

const baseTbaUrl = 'https://www.thebluealliance.com/api/v3/team/frc';
const baseColorUrl = 'https://api.frc-colors.com/v1/team/';

async function createRoles(message, number, teamName, primaryColor, secondaryColor) {
    try {
        const primaryColorRole = await message.guild.roles.create({
            name: `${number} | ${teamName} Primary`,
            color: betterColor(primaryColor),
        });

        const secondaryColorRole = await message.guild.roles.create({
            name: `${number} | ${teamName} Secondary`,
            color: betterColor(secondaryColor),
        });

        return { primaryColorRole, secondaryColorRole };
    } catch (error) {
        console.error('Error creating roles:', error);
        throw error;
    }
}

function createButtonMessage(primaryColorRole, secondaryColorRole) {
    const primaryButton = new ButtonBuilder()
        .setCustomId('primary')
        .setLabel('Primary')
        .setStyle(ButtonStyle.Success);

    const secondaryButton = new ButtonBuilder()
        .setCustomId('secondary')
        .setLabel('Secondary')
        .setStyle(ButtonStyle.Primary);

    const customButton = new ButtonBuilder()
        .setCustomId('custom')
        .setLabel('Custom')
        .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder()
        .addComponents(primaryButton, secondaryButton, customButton);

    return {
        content: `Would you like \n:one: | <@&${primaryColorRole.id}> \n:two: | <@&${secondaryColorRole.id}> \n:three: | A custom hex?`,
        components: [row],
    };
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
					const secondaryColor = colorData.secondaryHex;

					if (teamName && primaryColor) {
						// make a role with that color and team name formatted "number | teamName"
						// and assign it to the user
						console.log(`Primaty color: ${primaryColor}, Better: ${betterColor(primaryColor)}`);
						message.guild.roles.create({
							name: `${number} | ${teamName}`,
							color: "#000000",
						}).then(role => {
							message.member.roles.add(role);
							message.channel.send(`<@&${role.id}> it is! Now, it's time to choose a color.`);
						});

						// make a primary color and secondary color role
						const { primaryColorRole, secondaryColorRole } = await createRoles(message, number, teamName, primaryColor, secondaryColor);
                        const buttonMessage = createButtonMessage(primaryColorRole, secondaryColorRole);

                        await message.channel.send(buttonMessage);
					
					}
				}
			});
		}
	},
};
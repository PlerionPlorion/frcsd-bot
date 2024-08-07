const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, Events} = require('discord.js');
const { betterColor } = require('../utils/colorUtil');

const baseTbaUrl = 'https://www.thebluealliance.com/api/v3/team/frc';
const baseColorUrl = 'https://api.frc-colors.com/v1/team/';


async function fetchTeamData(number) {
    const tbaUrl = `${baseTbaUrl}${number}`;
    const response = await fetch(tbaUrl, options);
    return response.json();
}

async function fetchTeamColors(number) {
	const fetch = (await import('node-fetch')).default;
    const colorUrl = `${baseColorUrl}${number}`;
    const response = await fetch(colorUrl);
    return response.json();
}

async function handleRoleAssignment(message, teamNumber) {
    const role = message.guild.roles.cache.find(role => role.name.startsWith(`${teamNumber} |`));
    if (role) {
        message.channel.send(`I know team <@&${role.id}>!`);
		try {
			if (message.member.roles.cache.has(role.id)) {
				message.member.roles.remove(role);
			} else {
				message.member.roles.add(role);
			}
		} catch (error) {
			console.error('Error modifying role. Does it exist?', error);
		}
    } else {
        const teamData = await fetchTeamData(teamNumber);
        const teamColors = await fetchTeamColors(teamNumber);
        const teamName = teamData.nickname;
        const primaryColor = teamColors.primaryHex;
        const secondaryColor = teamColors.secondaryHex;
        
        if (teamName && primaryColor) {
            const { primaryColorRole, secondaryColorRole } = await createRoles(
                message,
                teamNumber,
                teamName,
                primaryColor,
                secondaryColor
            );
            const buttonMessage = createButtonMessage(
                primaryColorRole,
                secondaryColorRole
            );
            await message.channel.send(buttonMessage);

        }
    }
}

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
        return;
        if (message.author.bot) {
            return;
        }

        const regex = /\b\d{1,5}\b/g;
        const matches = message.content.match(regex);

        if (matches) {
            matches.forEach(async number => {
                await handleRoleAssignment(message, number);
            });
        }
    }
};
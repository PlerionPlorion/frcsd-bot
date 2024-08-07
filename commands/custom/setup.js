const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const { betterColor } = require('../../utils/colorUtil');
const { tba } = require('../../config.json');

const baseTbaUrl = 'https://www.thebluealliance.com/api/v3/team/frc';
const baseColorUrl = 'https://api.frc-colors.com/v1/team/';

async function fetchTeamData(number) {
	const fetch = (await import('node-fetch')).default;
	const tbaUrl = `${baseTbaUrl}${number}`;
	const response = await fetch(tbaUrl, {
		method: 'GET',
		headers: {
			'accept': 'application/json',
			'X-TBA-Auth-Key': tba
		}
	});
	return response.json();
}

async function fetchTeamColors(number) {
	const fetch = (await import('node-fetch')).default;
	const colorUrl = `${baseColorUrl}${number}`;
	const response = await fetch(colorUrl);
	return response.json();
}

async function handleRoleAssignment(interaction, number) {
	const role = interaction.guild.roles.cache.find(role => role.name.startsWith(`${number} |`));
	if (role) {
		await interaction.reply(`I know team <@&${role.id}>!`);
		if (interaction.member.roles.cache.has(role.id)) {
			interaction.member.roles.remove(role);
		} else {
			interaction.member.roles.add(role);
		}
	} else {
		const teamData = await fetchTeamData(number);
		const teamColors = await fetchTeamColors(number);
		const teamName = teamData.nickname;
		const primaryColor = teamColors.primaryHex;
		const secondaryColor = teamColors.secondaryHex;

		if (teamName && primaryColor) {
			const { teamRole, primaryColorRole, secondaryColorRole } = await createRoles(interaction, number, teamName, primaryColor, secondaryColor);
			const buttonMessage = createButtonMessage(teamRole, primaryColorRole, secondaryColorRole);
			await interaction.reply(buttonMessage);
		} else {
			await interaction.reply('Team data or colors not found.');
		}
	}
}

async function createRoles(interaction, number, teamName, primaryColor, secondaryColor) {
	try {
		const teamRole = await interaction.guild.roles.create({
			name: `${number} | ${teamName}`,
		});

		const primaryColorRole = await interaction.guild.roles.create({
			name: `${number} | ${teamName} Primary`,
			color: betterColor(primaryColor),
		});

		const secondaryColorRole = await interaction.guild.roles.create({
			name: `${number} | ${teamName} Secondary`,
			color: betterColor(secondaryColor),
		});

		return { teamRole, primaryColorRole, secondaryColorRole };
	} catch (error) {
		console.error('Error creating roles:', error);
		throw error;
	}
}

function createButtonMessage(teamRole, primaryColorRole, secondaryColorRole) {
	const primaryButton = new ButtonBuilder()
		.setCustomId('primary')
		.setLabel('1️⃣')
		.setStyle(ButtonStyle.Success);

	const secondaryButton = new ButtonBuilder()
		.setCustomId('secondary')
		.setLabel('🟦')
		.setStyle(ButtonStyle.Primary);

	const customButton = new ButtonBuilder()
		.setCustomId('custom')
		.setLabel('3️⃣')
		.setStyle(ButtonStyle.Secondary);

	const row = new ActionRowBuilder()
		.addComponents(primaryButton, secondaryButton, customButton);

	return {
		content: `<@&${teamRole.id}> it is! Now, it's time to choose a color.\nWould you like \n<@&${primaryColorRole.id}> \n:two: | <@&${secondaryColorRole.id}> \nA custom hex?`,
		components: [row],
	};
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('setup')
		.setDescription('Setup command to get you started!')
        .addStringOption(option =>
            option.setName('nickname')
                .setDescription('Your name')
                .setRequired(true))
		.addIntegerOption(option => 
			option.setName('teamnumber')
				.setDescription('The team number')
				.setRequired(true)),
	async execute(interaction) {
		const teamNumber = interaction.options.getInteger('teamnumber');
		await handleRoleAssignment(interaction, teamNumber);
	}
};
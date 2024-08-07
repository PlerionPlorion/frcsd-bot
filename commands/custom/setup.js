const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Collection } = require('discord.js');
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
        content: `<@&${teamRole.id}> it is! Now, it's time to choose a color.\nWould you like:\n<@&${primaryColorRole.id}> \n<@&${secondaryColorRole.id}> \nA custom hex?`,
        components: [row],
    };
}

async function setNickname(member, nickname, teamNumber) {
    try {
        await member.setNickname(`${nickname} | ${teamNumber}`);
    } catch (error) {
        console.error("Error setting nickname. Most likely a permissions issue");
    }
}

async function handleRoleAssignment(interaction, number) {
    const teamData = await fetchTeamData(number);
    const teamColors = await fetchTeamColors(number);
    const teamName = teamData.nickname;
    const primaryColor = teamColors.primaryHex;
    const secondaryColor = teamColors.secondaryHex;

    if (teamName && primaryColor) {
        const { teamRole, primaryColorRole, secondaryColorRole } = await createRoles(interaction, number, teamName, primaryColor, secondaryColor);
        const buttonMessage = createButtonMessage(teamRole, primaryColorRole, secondaryColorRole);
        return {
            interaction: await interaction.reply(buttonMessage),
            teamRole,
            primaryColorRole,
            secondaryColorRole,
        };
    } else {
        return {
            interaction: await interaction.reply(
                "Team data or colors not found."
            ),
        };
    }
}

async function addExistingRole(interaction, role, nickname, teamNumber) {
    try {
        await interaction.member.roles.add(role.id);
        await setNickname(interaction.member, nickname, teamNumber);
        await interaction.reply(`Added you to <@&${role.id}>, <@${interaction.user.id}>!`);
    } catch (error) {
        console.error('Error adding existing role:', error);
        await interaction.reply('There was an error adding you to the existing role.');
    }
}

async function handleConfirmation(interaction, initialResponse, teamRole, primaryColorRole, secondaryColorRole, teamNumber, nickname) {
    const collectorFilter = i => i.user.id === interaction.user.id;
    const chatFilter = m => m.author.id === interaction.user.id;

    try {
        const confirmation = await initialResponse.awaitMessageComponent({ filter: collectorFilter, time: 60_000 });

        if (confirmation.customId === 'primary') {
            await setRoleColor(interaction, teamRole, primaryColorRole, secondaryColorRole, teamNumber, nickname, confirmation);
        } else if (confirmation.customId === 'secondary') {
            await setRoleColor(interaction, teamRole, secondaryColorRole, primaryColorRole, teamNumber, nickname, confirmation);
        } else if (confirmation.customId === 'custom') {
            await handleCustomColor(interaction, teamRole, primaryColorRole, secondaryColorRole, teamNumber, nickname, confirmation, chatFilter);
        }
    } catch (e) {
        console.error(e);
        await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling', components: [] });
    }
}

async function setRoleColor(interaction, teamRole, colorRole, otherColorRole, teamNumber, nickname, confirmation) {
    await teamRole.setColor(colorRole.color);
    await colorRole.delete();
    await otherColorRole.delete();
    await interaction.member.roles.add(teamRole);
    await setNickname(interaction.member, nickname, teamNumber);
    await confirmation.update({ content: `Added you to <@&${teamRole.id}>`, components: [] });
}

async function handleCustomColor(interaction, teamRole, primaryColorRole, secondaryColorRole, teamNumber, nickname, confirmation, chatFilter) {
    await primaryColorRole.delete();
    await secondaryColorRole.delete();
    await confirmation.update({ content: 'Please send a custom hex code in the channel :)', components: [] });

    let tryCount = 1;
    let customHex;
    const messageList = [];

    while (true) {
        const customColor = await confirmation.channel.awaitMessages({ filter: chatFilter, max: 1, time: 120_000 });
        const message = customColor.first().content;
        const hexRegex = /#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})/;
        const hexMatch = message.match(hexRegex);

		if (hexMatch) {
			customHex = hexMatch[1] || hexMatch[0];
			if (customHex.length === 3) {
				customHex = customHex.split('').map(char => char + char).join('');
			}
			customHex = customHex.padEnd(6, customHex);
		
            await interaction.editReply({ content: `Setting color to #${customHex}`, components: [] });
            await customColor.first().delete();
            for (const msg of messageList) {
                await msg.delete();
            }
            break;
        } else {
            await interaction.editReply({ content: `Invalid hex code, please try again (${tryCount})`, components: [] });
            tryCount++;
            messageList.push(customColor.first());
        }
    }

    await teamRole.setColor(`#${customHex}`);
    await interaction.member.roles.add(teamRole);
    await setNickname(interaction.member, nickname, teamNumber);
    await confirmation.followUp({ content: `Added you to <@&${teamRole.id}>`, components: [] });
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
        const nickname = interaction.options.getString('nickname');
        const alreadyARole = interaction.guild.roles.cache.find(role => role.name.startsWith(`${teamNumber} |`));

        if (alreadyARole) {
            await addExistingRole(interaction, alreadyARole, nickname, teamNumber);
            return;
        }

        const { interaction: initialResponse, teamRole, primaryColorRole, secondaryColorRole } = await handleRoleAssignment(interaction, teamNumber);
        await handleConfirmation(interaction, initialResponse, teamRole, primaryColorRole, secondaryColorRole, teamNumber, nickname);
    }
};
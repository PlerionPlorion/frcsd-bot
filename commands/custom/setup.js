const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Collection } = require('discord.js');
const { betterColor } = require('../../utils/colorUtil');
const { tba } = require('../../config.json');
const { createEmbed } = require('../../utils/embedBuilder');

const baseTbaUrl = 'https://www.thebluealliance.com/api/v3/team/frc';
const baseColorUrl = 'https://api.frc-colors.com/v1/team/';


async function fetchTeamData(number) {
    const fetch = (await import('node-fetch')).default;
    const tbaUrl = `${baseTbaUrl}${number}/simple`;
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

function createButtonMessage(teamNumber, teamRole, primaryColorRole, secondaryColorRole) {

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

	const cancelButton = new ButtonBuilder()
		.setCustomId('cancel')
		.setLabel('Cancel')
		.setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder()
        .addComponents(primaryButton, secondaryButton, customButton, cancelButton);

	const embed = createEmbed({
		title: "Team Assignment",
		description: `Welcome <@&${teamRole.id}>!\nYou are the first of your team to join FRCSD`,
		color: primaryColorRole.color,
		fields: [
			{
				name: "Select Color:",
				value: `<@&${primaryColorRole.id}>\n<@&${secondaryColorRole.id}>\nA Custom Hex?`,
				inline: false,
			},
		],
		thumbnailUrl: `https://www.thebluealliance.com/avatar/2024/frc${teamNumber}.png`,
	});

	return {
		components: [row],
		embeds: [embed],
	};
}

async function setNickname(member, nickname, teamNumber) {
    try {
        await member.setNickname(`${nickname} | ${teamNumber}`);
    } catch (error) {
        console.error("Error setting nickname. Most likely a permissions issue");
    }
}

async function handleRoleAssignment(interaction, teamNumber) {
    const teamData = await fetchTeamData(teamNumber);
    const teamColors = await fetchTeamColors(teamNumber);
    const teamName = teamData.nickname;
    const primaryColor = teamColors.primaryHex;
    const secondaryColor = teamColors.secondaryHex;

    if (teamName && primaryColor) {
        const { teamRole, primaryColorRole, secondaryColorRole } = await createRoles(interaction, teamNumber, teamName, primaryColor, secondaryColor);
        const buttonMessage = createButtonMessage(teamNumber, teamRole, primaryColorRole, secondaryColorRole);
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

async function addExistingRole(interaction, teamRole, nickname, teamNumber) {
    try {
        await interaction.member.roles.add(teamRole.id);
        await setNickname(interaction.member, nickname, teamNumber);
        return await interaction.reply({
            embeds: [
                {
                    title: "Team Assignment",
                    description: `Added you to <@&${teamRole.id}>, <@${interaction.user.id}>`,
                    color: `${teamRole.color}`,
                    fields: [],
                    thumbnail: {
                        url: `https://www.thebluealliance.com/avatar/2024/frc${teamNumber}.png`,
                    },
                },
            ],
        });
    } catch (error) {
        console.error('Error adding existing role:', error);
        return await interaction.reply('There was an error adding you to the existing role.');
    }
}

async function handleConfirmation(interaction, initialResponse, teamRole, primaryColorRole, secondaryColorRole, teamNumber, nickname) {
    const collectorFilter = i => i.user.id === interaction.user.id;
    const chatFilter = m => m.author.id === interaction.user.id;

    try {
        const confirmation = await initialResponse.awaitMessageComponent({ filter: collectorFilter, time: 120_000 });

        if (confirmation.customId === 'primary') {
            await setRoleColor(interaction, teamRole, primaryColorRole, secondaryColorRole, teamNumber, nickname, confirmation);
        } else if (confirmation.customId === 'secondary') {
            await setRoleColor(interaction, teamRole, secondaryColorRole, primaryColorRole, teamNumber, nickname, confirmation);
        } else if (confirmation.customId === 'custom') {
            await handleCustomColor(interaction, teamRole, primaryColorRole, secondaryColorRole, teamNumber, nickname, confirmation, chatFilter);
        } else if (confirmation.customId === 'cancel') {
			await interaction.member.roles.remove(teamRole);
			await teamRole.delete();
			await primaryColorRole.delete();
			await secondaryColorRole.delete();
			const embed = createEmbed({
				title: "Operation Cancelled",
				description: "Run /setup to try again",
				color: 16711680,
				thumbnailUrl: `https://www.thebluealliance.com/avatar/2024/frc${teamNumber}.png`
			});
		
			await confirmation.update({ content: '', components: [], embeds: [embed] }).then(() => {
				setTimeout(() => {
					initialResponse.delete();
				}, 10000);
			});
		}
    } catch (e) {
        console.error(e);
		await interaction.member.roles.remove(teamRole);
		await teamRole.delete();
		await primaryColorRole.delete();
		await secondaryColorRole.delete();

		const embed = createEmbed({
            title: "Something went wrong",
            description: `Perhaps a timeout?. Run /setup to try again`,
            color: 16711680,
            fields: [],
            thumbnailUrl: `https://www.thebluealliance.com/avatar/2024/frc${teamNumber}.png`,
        });

        await interaction
            .editReply({
                content: "",
                components: [],
                embeds: [embed],
            })
            .then(() => {
                setTimeout(() => {
                    initialResponse.delete();
                }, 10000);
            });
    }
}

async function setRoleColor(interaction, teamRole, colorRole, otherColorRole, teamNumber, nickname, confirmation) {
    await teamRole.setColor(colorRole.color);
    await colorRole.delete();
    await otherColorRole.delete();
    await interaction.member.roles.add(teamRole);
    await setNickname(interaction.member, nickname, teamNumber);

	const embed = createEmbed({
		title: "Team Assignment",
		description: `Added you to <@&${teamRole.id}>, <@${interaction.user.id}>`,
		color: teamRole.color,
		fields: [],
		thumbnailUrl: `https://www.thebluealliance.com/avatar/2024/frc${teamNumber}.png`,
	});

    await confirmation.update({ content: ``, components: [], embeds: [embed] });
}

async function handleCustomColor(interaction, teamRole, primaryColorRole, secondaryColorRole, teamNumber, nickname, confirmation, chatFilter) {
    await primaryColorRole.delete();
    await secondaryColorRole.delete();

	const embed = createEmbed({
		title: "Custom Color",
		description: `Please enter a hex code for the color you\nwould like to use for <@&${teamRole.id}>`,
		color: teamRole.color,
		fields: [
			{
				name: "",
				value: "Accepted formats are **#RRGGBB**, **RRGGBB**, **#RGB**, and **RGB**",
				inline: false,
			},
		],
		thumbnailUrl: `https://www.thebluealliance.com/avatar/2024/frc${teamNumber}.png`,
	});

    await confirmation.update({ content: '', components: [], embeds: [embed] });

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
		
			const customHexInt = parseInt(customHex, 16);

			const embed = createEmbed({
				title: "Custom Color",
				description: `Please enter a hex code for the color you\nwould like to use for <@&${teamRole.id}>`,
				color: customHexInt,
				fields: [
					{
						name: `Added you to <@&${teamRole.id}>, <@${interaction.user.id}>`,
						value: "",
						inline: false,
					},
				],
				thumbnailUrl: `https://www.thebluealliance.com/avatar/2024/frc${teamNumber}.png`,
			});

			await interaction.editReply({ content: '', components: [], embeds: [embed] });
            await customColor.first().delete();
            for (const msg of messageList) {
                await msg.delete();
            }
            break;
        } else {
			const embed = createEmbed({
				title: "Custom Color",
				description: `Please enter a hex code for the color you\nwould like to use for <@&${teamRole.id}>`,
				color: teamRole.color,
				fields: [
					{
						name: `**Invalid hex code, please try again (${tryCount})**`,
						value: "Accepted formats are **#RRGGBB**, **RRGGBB**, **#RGB**, and **RGB**",
						inline: false,
					},
				],
				thumbnailUrl: `https://www.thebluealliance.com/avatar/2024/frc${teamNumber}.png`,
			});

            await interaction.editReply({ content: '', components: [], embeds: [embed] });
            tryCount++;
            messageList.push(customColor.first());
        }
    }
    await teamRole.setColor(`#${customHex}`);
    await interaction.member.roles.add(teamRole);
    await setNickname(interaction.member, nickname, teamNumber);
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
		// Check if this user already has an interaction with this command happening
		
        const teamNumber = interaction.options.getInteger('teamnumber');
        const nickname = interaction.options.getString('nickname');
        const alreadyARole = interaction.guild.roles.cache.find(role => role.name.startsWith(`${teamNumber} |`));

        if (alreadyARole) {
            await addExistingRole(interaction, alreadyARole, nickname, teamNumber);
				// .then((result) => {
				// 	// Wait five seconds and delete the original message
				// 	setTimeout(() => {
				// 		result.delete();
				// 	}, 10000);
				// });
            return;
        }

        const { interaction: initialResponse, teamRole, primaryColorRole, secondaryColorRole } = await handleRoleAssignment(interaction, teamNumber);
        await handleConfirmation(interaction, initialResponse, teamRole, primaryColorRole, secondaryColorRole, teamNumber, nickname);
		// .then(() => {
		// 	setTimeout(() => {
		// 		initialResponse.delete();
		// 	}, 10000);
		// });
    }
};
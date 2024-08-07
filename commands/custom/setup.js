const {
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Collection,
} = require("discord.js");
const { betterColor } = require("../../utils/colorUtil");
const { tba } = require("../../config.json");
const { createEmbed } = require("../../utils/embedBuilder");

const baseTbaUrl = "https://www.thebluealliance.com/api/v3/team/frc";
const baseColorUrl = "https://api.frc-colors.com/v1/team/";

/**
 * Fetches team data from The Blue Alliance API.
 * @param {number} number - The team number.
 * @returns {Promise<Object>} - A promise that resolves to the team data.
 */
async function fetchTeamData(number) {
    const fetch = (await import("node-fetch")).default;
    const tbaUrl = `${baseTbaUrl}${number}/simple`;
    const response = await fetch(tbaUrl, {
        method: "GET",
        headers: {
            accept: "application/json",
            "X-TBA-Auth-Key": tba,
        },
    });
    return response.json();
}

/**
 * Fetches the team colors for a given number.
 *
 * @param {number} number - The team number.
 * @returns {Promise<Object>} - A promise that resolves to the team colors.
 */
async function fetchTeamColors(number) {
    const fetch = (await import("node-fetch")).default;
    const colorUrl = `${baseColorUrl}${number}`;
    const response = await fetch(colorUrl);
    return response.json();
}

/**
 * Creates roles for a team.
 *
 * @param {Interaction} interaction - The interaction object.
 * @param {number} number - The team number.
 * @param {string} teamName - The team name.
 * @param {string} primaryColor - The primary color of the team.
 * @param {string} secondaryColor - The secondary color of the team.
 * @returns {Object} - An object containing the created roles.
 * @throws {Error} - If there is an error creating the roles.
 */
async function createRoles(
    interaction,
    number,
    teamName,
    primaryColor,
    secondaryColor
) {
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
        console.error("Error creating roles:", error);
        throw error;
    }
}

/**
 * Creates a button message for team assignment.
 *
 * @param {number} teamNumber - The team number.
 * @param {Role} teamRole - The role assigned to the team.
 * @param {Role} primaryColorRole - The role for the primary color.
 * @param {Role} secondaryColorRole - The role for the secondary color.
 * @returns {Object} - The button message object containing components and embeds.
 */
function createButtonMessage(
    teamNumber,
    teamRole,
    primaryColorRole,
    secondaryColorRole
) {
    const primaryButton = new ButtonBuilder()
        .setCustomId("primary")
        .setLabel("Primary")
        .setStyle(ButtonStyle.Success);

    const secondaryButton = new ButtonBuilder()
        .setCustomId("secondary")
        .setLabel("Secondary")
        .setStyle(ButtonStyle.Primary);

    const customButton = new ButtonBuilder()
        .setCustomId("custom")
        .setLabel("Custom")
        .setStyle(ButtonStyle.Secondary);

    const cancelButton = new ButtonBuilder()
        .setCustomId("cancel")
        .setLabel("Cancel")
        .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder().addComponents(
        primaryButton,
        secondaryButton,
        customButton,
        cancelButton
    );

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

/**
 * Sets the nickname of a member.
 * @param {GuildMember} member - The member whose nickname will be set.
 * @param {string} nickname - The new nickname to set.
 * @param {string} teamNumber - The team number to append to the nickname.
 * @returns {Promise<void>} - A promise that resolves when the nickname is set successfully.
 */
async function setNickname(member, nickname, teamNumber) {
    try {
        await member.setNickname(`${nickname} | ${teamNumber}`);
    } catch (error) {
        console.error(
            "Error setting nickname. Most likely a permissions issue"
        );
    }
}

/**
 * Handles role assignment for a given team number.
 *
 * @param {Interaction} interaction - The interaction object.
 * @param {number} teamNumber - The team number.
 * @returns {Promise<Object>} - A promise that resolves to an object containing the interaction and role information.
 */
async function handleRoleAssignment(interaction, teamNumber) {
    const teamData = await fetchTeamData(teamNumber);
    const teamColors = await fetchTeamColors(teamNumber);
    const teamName = teamData.nickname;
    const primaryColor = teamColors.primaryHex;
    const secondaryColor = teamColors.secondaryHex;

    if (teamName && primaryColor) {
        const { teamRole, primaryColorRole, secondaryColorRole } =
            await createRoles(
                interaction,
                teamNumber,
                teamName,
                primaryColor,
                secondaryColor
            );
        const buttonMessage = createButtonMessage(
            teamNumber,
            teamRole,
            primaryColorRole,
            secondaryColorRole
        );
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

/**
 * Adds an existing role to the member and sets their nickname.
 * @param {Interaction} interaction - The interaction object.
 * @param {Role} teamRole - The team role to be added.
 * @param {string} nickname - The nickname to be set.
 * @param {number} teamNumber - The team number.
 * @returns {Promise<Message>} - A promise that resolves to the reply message.
 * @throws {Error} - If there is an error adding the role.
 */
async function addExistingRole(interaction, teamRole, nickname, teamNumber) {
    try {
        await interaction.member.roles.add(teamRole.id);
        await setNickname(interaction.member, nickname, teamNumber);
        const members =
            interaction.guild.members.cache
                .filter(
                    (member) =>
                        member.roles.cache.has(teamRole.id) &&
                        member.id !== interaction.user.id
                )
                .map((member) => `<@${member.id}>`)
                .join("\n") || "You're the first one!";
        return await interaction.reply({
            embeds: [
                {
                    title: "Team Assignment",
                    description: `Added you to <@&${teamRole.id}>, <@${interaction.user.id}>`,
                    color: `${teamRole.color}`,
                    fields: [
                        {
                            name: "Others on your team in the server:",
                            value: members,
                        },
                    ],
                    thumbnail: {
                        url: `https://www.thebluealliance.com/avatar/2024/frc${teamNumber}.png`,
                    },
                },
            ],
        });
    } catch (error) {
        console.error("Error adding existing role:", error);
        return await interaction.reply(
            "There was an error adding you to the existing role."
        );
    }
}

/**
 * Handles the confirmation of a user interaction.
 *
 * @param {Interaction} interaction - The interaction object.
 * @param {MessageComponent} initialResponse - The initial response message component.
 * @param {Role} teamRole - The team role.
 * @param {Role} primaryColorRole - The primary color role.
 * @param {Role} secondaryColorRole - The secondary color role.
 * @param {number} teamNumber - The team number.
 * @param {string} nickname - The nickname.
 * @returns {Promise<void>} - A promise that resolves when the confirmation is handled.
 */
async function handleConfirmation(
    interaction,
    initialResponse,
    teamRole,
    primaryColorRole,
    secondaryColorRole,
    teamNumber,
    nickname
) {
    const collectorFilter = (i) => i.user.id === interaction.user.id;
    const chatFilter = (m) => m.author.id === interaction.user.id;

    try {
        const confirmation = await initialResponse.awaitMessageComponent({
            filter: collectorFilter,
            time: 120_000,
        });

        if (confirmation.customId === "primary") {
            await setRoleColor(
                interaction,
                teamRole,
                primaryColorRole,
                secondaryColorRole,
                teamNumber,
                nickname,
                confirmation
            );
        } else if (confirmation.customId === "secondary") {
            await setRoleColor(
                interaction,
                teamRole,
                secondaryColorRole,
                primaryColorRole,
                teamNumber,
                nickname,
                confirmation
            );
        } else if (confirmation.customId === "custom") {
            await handleCustomColor(
                interaction,
                teamRole,
                primaryColorRole,
                secondaryColorRole,
                teamNumber,
                nickname,
                confirmation,
                chatFilter
            );
        } else if (confirmation.customId === "cancel") {
            await interaction.member.roles.remove(teamRole);
            await teamRole.delete();
            await primaryColorRole.delete();
            await secondaryColorRole.delete();
            const embed = createEmbed({
                title: "Operation Cancelled",
                description: "Run /setup to try again",
                color: 16711680,
                thumbnailUrl: `https://www.thebluealliance.com/avatar/2024/frc${teamNumber}.png`,
            });

            await confirmation
                .update({ content: "", components: [], embeds: [embed] })
                .then(() => {
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

/**
 * Sets the color of a team role, deletes color roles, adds team role to member, and sets member's nickname.
 *
 * @param {Interaction} interaction - The interaction object.
 * @param {Role} teamRole - The team role to set the color for.
 * @param {Role} colorRole - The color role to delete.
 * @param {Role} otherColorRole - The other color role to delete.
 * @param {number} teamNumber - The team number.
 * @param {string} nickname - The nickname to set for the member.
 * @param {Confirmation} confirmation - The confirmation object.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
async function setRoleColor(
    interaction,
    teamRole,
    colorRole,
    otherColorRole,
    teamNumber,
    nickname,
    confirmation
) {
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

/**
 * Handles the custom color setup for a team.
 *
 * @param {Interaction} interaction - The interaction object.
 * @param {Role} teamRole - The team role.
 * @param {Role} primaryColorRole - The primary color role.
 * @param {Role} secondaryColorRole - The secondary color role.
 * @param {number} teamNumber - The team number.
 * @param {string} nickname - The nickname.
 * @param {Message} confirmation - The confirmation message.
 * @param {Function} chatFilter - The chat filter function.
 * @returns {Promise<void>} - A promise that resolves when the custom color setup is complete.
 */
async function handleCustomColor(
    interaction,
    teamRole,
    primaryColorRole,
    secondaryColorRole,
    teamNumber,
    nickname,
    confirmation,
    chatFilter
) {
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

    await confirmation.update({ content: "", components: [], embeds: [embed] });

    let tryCount = 1;
    let customHex;
    const messageList = [];

    while (true) {
        const customColor = await confirmation.channel.awaitMessages({
            filter: chatFilter,
            max: 1,
            time: 120_000,
        });
        const message = customColor.first().content;
        const hexRegex = /#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})/;
        const hexMatch = message.match(hexRegex);

        if (hexMatch) {
            customHex = hexMatch[1] || hexMatch[0];
            if (customHex.length === 3) {
                customHex = customHex
                    .split("")
                    .map((char) => char + char)
                    .join("");
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

            await interaction.editReply({
                content: "",
                components: [],
                embeds: [embed],
            });
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

            await interaction.editReply({
                content: "",
                components: [],
                embeds: [embed],
            });
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
        .setName("setup")
        .setDescription("Setup command to get you started!")
        .addStringOption((option) =>
            option
                .setName("nickname")
                .setDescription("Your name")
                .setRequired(true)
        )
        .addIntegerOption((option) =>
            option
                .setName("teamnumber")
                .setDescription("The team number")
                .setRequired(true)
        ),
    async execute(interaction) {
        // Check if this user already has an interaction with this command happening

        const teamNumber = interaction.options.getInteger("teamnumber");
        const nickname = interaction.options.getString("nickname");
        const alreadyARole = interaction.guild.roles.cache.find((role) =>
            role.name.startsWith(`${teamNumber} |`)
        );

        if (alreadyARole) {
            await addExistingRole(
                interaction,
                alreadyARole,
                nickname,
                teamNumber
            );
            // .then((result) => {
            // 	// Wait five seconds and delete the original message
            // 	setTimeout(() => {
            // 		result.delete();
            // 	}, 10000);
            // });
            return;
        }

        const {
            interaction: initialResponse,
            teamRole,
            primaryColorRole,
            secondaryColorRole,
        } = await handleRoleAssignment(interaction, teamNumber);
        await handleConfirmation(
            interaction,
            initialResponse,
            teamRole,
            primaryColorRole,
            secondaryColorRole,
            teamNumber,
            nickname
        );
        // .then(() => {
        // 	setTimeout(() => {
        // 		initialResponse.delete();
        // 	}, 10000);
        // });
    },
};

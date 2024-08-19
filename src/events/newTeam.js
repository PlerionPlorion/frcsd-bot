const { ComponentType } = require('discord.js');
const { createEmbed } = require('../utils/embedBuilder');
const { tba } = require('../../config.json');
async function getTeamAvatarUrl(teamNumber) {
    return require("../utils/avatarURL")(teamNumber);
}
async function fetchTeamData(number) {
    return require("../utils/tbaData")(number);
}

const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

async function makeEmbed(team) {
	const teamName = team.name;
	const teamNumber = teamName.match(/\d+/)[0];
    const teamData = await fetchTeamData(teamNumber);
	const teamMembersString = team.members.map(member => `<@${member.id}>`).join('\n');
    const avatarURL = await getTeamAvatarUrl(teamNumber);
    const buttons = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId("verifyNewTeam")
                .setLabel("Verify")
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId("denyNewTeam")
                .setLabel("Deny")
                .setStyle(ButtonStyle.Danger)
        );
    return {
        components: [buttons],
        embeds: [createEmbed({
            title: `Team verification | ${teamNumber}`,
            description: `<@&${team.id}> is requesting to be verified.\nThey are from ${teamData.city || "some city"}, ${teamData.state_prov || "some state"} ${teamData.country || "some country"}`,
            fields: [{ name: "Members", value: teamMembersString }],
            color: team.color,
			thumbnailUrl: avatarURL,
        })],
    };
}

async function extractedExecute(team) {
	const teamName = team.name;
    const teamNumber = teamName.match(/\d+/)[0];
	const channel = team.guild.channels.cache.find((channel) => channel.name === "team-verification");
    if (!channel) {
        console.error("Channel not found");
        return
    }
    await channel.messages.fetch();
	// Find a message that has the team name in it
	const existingMessage = channel.messages.cache.find((message) => 
		message.embeds[0]?.title?.includes(teamNumber) && !message.embeds[0]?.description?.includes(" denied ")
    );
	const embed = await makeEmbed(team);
    if (existingMessage) {
		existingMessage.edit(embed);
    } else { 
        channel.send(embed);
    }
    
}

module.exports = {
	name: 'newTeamAdded',
	// team is a Role object
	execute(team) {
		extractedExecute(team);
	},
};
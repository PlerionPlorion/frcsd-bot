const { Events } = require('discord.js');
const { createEmbed } = require('../utils/embedBuilder');
async function getTeamAvatarUrl(teamNumber) {
    return require("../utils/avatarURL")(teamNumber);
}

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
        if (!interaction.isButton()) return;
        if (interaction.customId === 'verifyNewTeam') {
            // get the team by looking at the only role the user that contains the team number
            const teamNumber = interaction.message.embeds[0].title.match(/\d+/)[0];
            const teamRole = interaction.guild.roles.cache.find(role => role.name.includes(teamNumber));
            const members = teamRole.members.map(member => member);
            members.forEach(member => {
                member.roles.remove(interaction.guild.roles.cache.find(role => role.name === 'Not SD'));
            });
            const channel = interaction.message.channel;
            const avatarUrl = await getTeamAvatarUrl(teamNumber);
            await interaction.message.delete().then(() => {
                channel.send({
                    content: `\u200B`,
                    embeds: [
                        createEmbed({
                            title: `Team verification | ${teamNumber}`,
                            description: `<@${interaction.user.id}> verified <@&${teamRole.id}>!`,
                            color: 3211083,
                            inline: false,
                            thumbnailUrl: avatarUrl,
                        })
                    ],
                });
            });
        }
        if (interaction.customId === 'denyNewTeam') {
            // get the team by looking at the only role the user that contains the team number
            const teamNumber = interaction.message.embeds[0].title.match(/\d+/)[0];
            const teamRole = interaction.guild.roles.cache.find(role => role.name.includes(teamNumber));
            const avatarUrl = await getTeamAvatarUrl(teamNumber);
            const channel = interaction.message.channel;
            teamRole.delete();
            await interaction.message.delete().then(() => {
                channel.send({
                    content: `\u200B`,
                    embeds: [
                        createEmbed({
                            title: `Team verification | ${teamNumber}`,
                            description: `<@${interaction.user.id}> denied ${teamRole.name}!`,
                            color: 16711680,
                            inline: false,
                            thumbnailUrl: avatarUrl,
                        })
                    ],
                });
            });
        }
    },
};    
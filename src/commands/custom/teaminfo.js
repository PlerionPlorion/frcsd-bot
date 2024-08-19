const { SlashCommandBuilder } = require("discord.js");
const { createEmbed } = require("../../utils/embedBuilder");

async function getTeamAvatarUrl(teamNumber) {
    return require("../../utils/avatarURL")(teamNumber);
}
async function fetchTeamData(number) {
    return require("../../utils/tbaData")(number);
}

module.exports = {
    category: "custom",
    data: new SlashCommandBuilder()
        .setName("teaminfo")
        .setDescription("Displays info and members of a team")
        .addRoleOption((option) =>
            option
                .setName("team")
                .setDescription("Select the team role")
                .setRequired(true)
        ),
    async execute(interaction) {
        await interaction.deferReply();
        const selectedTeamRole = interaction.options.getRole("team");

        if (!selectedTeamRole.name.includes("|")) {
            interaction.editReply({
                content: "Try again with a team role, not just any silly role 😯",
                ephemeral: true,
            });
        } else {
            const regex = /\d+/;
            const match = selectedTeamRole.name.match(regex);
            const teamNumber = match ? match[0] : null;
            const thumbnailUrl = await getTeamAvatarUrl(teamNumber);

            await interaction.guild.members.fetch();
            const roleMembers = interaction.guild.members.cache.filter(
                (member) => member.roles.cache.has(selectedTeamRole.id)
            );

            const memberCount = roleMembers.size;
            const memberCountString = memberCount + (memberCount === 1 ? " member" : " members");

            const membersList = roleMembers
                .map((member) => {
                    const regex = /.*?(?=\s|\|)/;
                    const match = member.displayName.match(regex);
                    let name = match ? match[0] : member.displayName;
                    return name.charAt(0).toUpperCase() + name.slice(1);
                })
                // alphabetical order
                .sort((a, b) => a.localeCompare(b))
                .join(", ");

            const teamData = await fetchTeamData(teamNumber);

            const embed = createEmbed({
                title: "Team Information",
                description: `<@&${selectedTeamRole.id}>, from ${teamData.city || "some city"}, ${teamData.state_prov || "some state"} (${teamData.country || "some country"}) has ${memberCountString} in this server.\n\n${membersList}`,
                color: selectedTeamRole.color,
                fields: [
                    {
                        name: "Total Members",
                        value: `${memberCount}`,
                        inline: true,
                    },
                    {
                        name: "Team Number",
                        value: `${teamNumber}`,
                        inline: true,
                    },
                ],
                thumbnailUrl: thumbnailUrl,
            });

            await interaction.editReply({ embeds: [embed] });
        }
    },
};

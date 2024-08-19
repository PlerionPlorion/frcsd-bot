const { SlashCommandBuilder } = require("discord.js");
const { createEmbed } = require("../../utils/embedBuilder");

async function getTeamAvatarUrl(teamNumber) {
  return require("../../utils/avatarURL")(teamNumber);
}

module.exports = {
  category: "custom",
  data: new SlashCommandBuilder()
    .setName("teaminfo")
    .setDescription("Shows who is part of a team")
    .addRoleOption((option) =>
      option
        .setName("team")
        .setDescription("Select the team role")
        .setRequired(true)
    ),
  async execute(interaction) {
    await interaction.deferReply();
    const selectedTeamRole = interaction.options.getRole("team");
    const regex = /\d+/;

    const match = selectedTeamRole.name.match(regex);
    const teamNumber = match ? match[0] : null;
    const thumbnailUrl = await getTeamAvatarUrl(teamNumber);

    if (!selectedTeamRole.name.includes("|")) {
      interaction.editReply({
        content: "Not a team role sorry!",
        ephemeral: true,
      });
    } else {
      interaction.guild.members.fetch();
      const roleMembers = interaction.guild.members.cache.filter((member) =>
        member.roles.cache.has(selectedTeamRole.id)
      );
      const memberCount = roleMembers.size;

      let membersList = "";
      roleMembers.each((member) => {
        membersList += `${member.displayName}\n`;
      });

      const embed = createEmbed({
        title: "Team Information",
        description: `Found ${memberCount} member(s) with the <@&${selectedTeamRole.id}> role.\n${membersList}`,
        color: selectedTeamRole.color,
        fields: [
          {
            name: "Total Members:",
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

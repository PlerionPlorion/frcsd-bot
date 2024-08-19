const { SlashCommandBuilder } = require("discord.js");
const { createEmbed } = require("../../utils/embedBuilder");

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

    if (!selectedTeamRole.name.includes("|")) {
      interaction.editReply({
        content: "Not a team role sorry!",
        ephemeral: true,
      });
    } else {
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
        description: `Found ${memberCount} member(s) with the "${selectedTeamRole.name}" role.\n${membersList}`,
        color: selectedTeamRole.color,
        fields: [
          {
            name: "Total Members:",
            value: `${memberCount}`,
            inline: true,
          },
          {
            name: "Team",
            value: `${selectedTeamRole.name}`,
            inline: true,
          },
        ],
      });

      await interaction.editReply({ embeds: [embed] });
    }
  },
};

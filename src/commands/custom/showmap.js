const { SlashCommandBuilder, PermissionsBitField } = require("discord.js");
const { loadReactionMap } = require("../../utils/reactionutils");

module.exports = {
    category: "custom",
    data: new SlashCommandBuilder()
        .setName("showmap")
        .setDescription("Display the current reaction map")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles),
    async execute(interaction) {
        // Convert the reaction map object to a readable JSON string
        let reactionMap = loadReactionMap();
        const mapString = JSON.stringify(reactionMap, null, 2);
        // Reply to the interaction with the reaction map
        await interaction.reply({
            content: `\`\`\`json\n${mapString}\n\`\`\``,
            ephemeral: true,
        });
    },
};

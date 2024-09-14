const { SlashCommandBuilder, PermissionsBitField } = require("discord.js");
const {
    loadReactionMap,
    gitCommit,
    reactionMapPath,
} = require("../../utils/reactionutils");
const fs = require("fs");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("updatemap")
        .setDescription("Update the reaction map")
        .addStringOption((option) =>
            option
                .setName("keyword")
                .setDescription("The keyword to update")
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("emoji")
                .setDescription("The emoji to associate with the keyword")
                .setRequired(true)
        ),
    async execute(interaction) {
        const keyword = interaction.options.getString("keyword");
        const emoji = interaction.options.getString("emoji");

        if (
            !interaction.member.permissions.has(
                PermissionsBitField.Flags.Administrator
            )
        ) {
            return interaction.reply({
                content: "You do not have permission to use this command.",
                ephemeral: true,
            });
        }
        let reactionMap = loadReactionMap();
        try {
            reactionMap[keyword] = emoji;
            fs.writeFileSync(
                reactionMapPath,
                JSON.stringify(reactionMap, null, 2)
            );
            await interaction.reply(
                `Updated Keyword: ${keyword} with Emoji: ${emoji}`
            );
            gitCommit(keyword, emoji);
        } catch (error) {
            console.error("Error updating reactionMap.json", error);
            await interaction.reply("Failed to update the reaction map.");
        }
    },
};

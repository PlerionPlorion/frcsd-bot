const { SlashCommandBuilder, PermissionsBitField } = require("discord.js");
const {
    loadReactionMap,
    gitCommit,
    reactionMapPath,
} = require("../../utils/reactionutils");
const fs = require("fs");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("deletemap")
        .setDescription("Delete a keyword from the reaction map")
        .addStringOption((option) =>
            option
                .setName("keyword")
                .setDescription("The keyword to delete")
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
    async execute(interaction) {
        const keywordToDelete = interaction.options.getString("keyword");

        let reactionMap = loadReactionMap();
        
        // Check if the keyword exists and matches exactly
        if (reactionMap.hasOwnProperty(keywordToDelete)) {
            try {
                delete reactionMap[keywordToDelete]; // Delete the exact matching keyword
                fs.writeFileSync(
                    reactionMapPath,
                    JSON.stringify(reactionMap, null, 2)
                ); // Update the reaction map file
                
                // Send an initial reply and store it in a variable
                await interaction.reply({
                    content: `Deleting Keyword: ${keywordToDelete}...`,
                    fetchReply: true,
                });

                // Attempt git commit and get success status
                const success = await gitCommit(keywordToDelete, "Deleted");

                // Edit the initial reply based on the success status
                const replyMessage = await interaction.fetchReply();
                if (success) {
                    await replyMessage.edit(
                        `Successfully deleted Keyword: ${keywordToDelete}`
                    );
                    await replyMessage.react("✅");
                } else {
                    await replyMessage.edit(
                        `Deleted Keyword: ${keywordToDelete}, but failed to push changes.`
                    );
                    await replyMessage.react("❌");
                }
            } catch (error) {
                console.error("Error deleting keyword:", error);
                const replyMessage = await interaction.fetchReply();
                await replyMessage.edit(
                    `Failed to delete keyword: ${keywordToDelete}. Please try again.`
                );
                await replyMessage.react("❌");
            }
        } else {
            // If the keyword doesn't exist
            await interaction.reply({
                content: `Keyword "${keywordToDelete}" not found in the reaction map.`,
                ephemeral: true,
            });
        }
    },
};

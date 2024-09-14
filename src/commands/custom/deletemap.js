const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { loadReactionMap, gitCommit, reactionMapPath } = require("../../utils/reactionutils");
const fs = require("fs");



module.exports = {
    data: new SlashCommandBuilder()
        .setName('deletemap')
        .setDescription('Delete a keyword from the reaction map')
        .addStringOption(option => 
            option.setName('keyword')
                .setDescription('The keyword to delete')
                .setRequired(true)),
    async execute(interaction) {
        const keywordToDelete = interaction.options.getString('keyword');

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: "You do not have permission to use this command.", ephemeral: true });
        }
        let reactionMap = loadReactionMap();
        // Check if the keyword exists and matches exactly
        if (reactionMap.hasOwnProperty(keywordToDelete)) {
            try {
                delete reactionMap[keywordToDelete]; // Delete the exact matching keyword
                fs.writeFileSync(reactionMapPath, JSON.stringify(reactionMap, null, 2)); // Update the reaction map file
                await interaction.reply(`Deleted Keyword: ${keywordToDelete}`);
                gitCommit(keywordToDelete, "Deleted"); // Push changes to git
            } catch (error) {
                console.error("Error deleting keyword:", error);
                await interaction.reply(`Failed to delete keyword: ${keywordToDelete}. Please try again.`);
            }
        } else {
            // If the keyword doesn't exist
            await interaction.reply({ content: `Keyword "${keywordToDelete}" not found in the reaction map.`, ephemeral: true });
        }
    }
};

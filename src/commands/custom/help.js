const { SlashCommandBuilder } = require("discord.js");
const { createEmbed } = require("../../utils/embedBuilder");

module.exports = {
    category: "custom",
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("Displays non-slash commands"),
    async execute(interaction) {
        await interaction.deferReply();
        const embed = createEmbed({
            title: "Available Commands",
            description:
                "Here's a list of available commands",
            color: 16711680,
            fields: [
                {
                    name: "p?updatemap <keyword> <emoji>",
                    value: "Update the reaction map with a new keyword and emoji. (Admin only)",
                    inline: false,
                },
                {
                    name: "p?delete <keyword>",
                    value: "Delete a keyword from the reaction map. (Admin only)",
                    inline: false,
                },
                {
                    name: "p?showmap",
                    value: "Display the current reaction map. (Admin only)",
                    inline: false,
                },
            ],
        });
        await interaction.editReply({ embeds: [embed] });
    }
}
const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { loadLoreEntries, addLoreEntry } = require("../../utils/loreutils");
const { createEmbed } = require("../../utils/embedBuilder");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lore')
        .setDescription('View or add lore to the database')
        .addStringOption(option => 
            option.setName('message')
                .setDescription('The lore message')
                .setRequired(false)
        ),

    async execute(interaction) {
        const messageContent = interaction.options.getString('message');

        if (messageContent) {
            // Adding a new lore entry
            try {
                const id = Date.now().toString();
                const now = new Date();
                
                const loreEntry = {
                    id,
                    userId: interaction.user.id,
                    username: interaction.user.username,
                    message: messageContent,
                    timestamp: now.toISOString(),
                };
                
                await addLoreEntry(loreEntry);

                await interaction.reply({
                    content: `Lore entry created successfully! Message: ${messageContent}`,
                    ephemeral: true,
                });

            } catch (error) {
                console.error(`Error creating lore entry: ${error}`);
                await interaction.reply({ content: 'An error occurred while adding lore.', ephemeral: true });
            }

        } else {
            // Displaying existing lore entries
            try {
                const loreEntries = await loadLoreEntries(); // Retrieve lore entries from your database
                const entriesPerPage = 1; // Number of entries per page
                let currentPage = 0; // Start on the first page
        
                const totalPages = Math.ceil(loreEntries.length / entriesPerPage);
        
                if (loreEntries.length === 0) {
                    await interaction.reply({
                        content: 'No lore entries found.',
                        ephemeral: true,
                    });
                    return;
                }
        
                // Function to create and send the embed
                const sendLorePage = async (page) => {
                    const start = page * entriesPerPage;
                    const end = start + entriesPerPage;
                    const entriesToShow = loreEntries.slice(start, end);
        
                    const fields = entriesToShow.map(entry => ({
                        name: entry.username,
                        value: entry.message,
                        inline: false,
                    }));
        
                    const embed = createEmbed({
                        title: 'Lore Entries',
                        description: `Page ${page + 1} of ${totalPages}`,
                        color: '#0099ff', // You can adjust this color
                        fields: fields
                    });
        
                    const row = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('prev')
                                .setLabel('Previous')
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(page === 0), // Disable if on the first page
                            new ButtonBuilder()
                                .setCustomId('next')
                                .setLabel('Next')
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(page === totalPages - 1) // Disable if on the last page
                        );

                    // If the interaction has already been replied, use editReply
                    if (currentPage === 0) {
                        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
                    } else {
                        await interaction.editReply({ embeds: [embed], components: [row] });
                    }
                };
        
                await sendLorePage(currentPage); // Send the initial page
        
                // Create a message collector to handle button interactions
                const filter = (btnInt) => {
                    return btnInt.user.id === interaction.user.id; // Only allow the original user to interact
                };
        
                const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });
        
                collector.on('collect', async (btnInt) => {
                    await btnInt.deferUpdate(); // Acknowledge the button press

                    // Disable buttons immediately to prevent multiple clicks
                    btnInt.message.components[0].components.forEach(button => button.setDisabled(true));
                    await btnInt.message.edit({ components: btnInt.message.components });

                    if (btnInt.customId === 'prev') {
                        currentPage = Math.max(currentPage - 1, 0);
                    } else if (btnInt.customId === 'next') {
                        currentPage = Math.min(currentPage + 1, totalPages - 1);
                    }

                    await sendLorePage(currentPage); // Send the updated page
                });
        
                collector.on('end', () => {
                    // Disable buttons after the collector ends
                    interaction.editReply({ components: [] });
                });
        
            } catch (error) {
                console.error(`Error fetching lore entries: ${error}`);
                await interaction.reply({ content: 'An error occurred while fetching lore entries.', ephemeral: true });
            }
        }
    },
};

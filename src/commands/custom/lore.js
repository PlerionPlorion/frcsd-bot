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
                const entries = await loadLoreEntries();

                if (entries.length === 0) {
                    await interaction.reply({ content: 'No lore entries available.', ephemeral: true });
                    return;
                }

                const embeds = entries.map(entry => createEmbed({
                    title: `Lore Entry: ${entry.id}`,
                    description: entry.message,
                    color: 0x00AE86,
                    fields: [
                        { name: 'Author', value: entry.username, inline: true },
                        { name: 'Timestamp', value: new Date(entry.timestamp).toLocaleString(), inline: true }
                    ]
                }));

                const buttonRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('prev')
                            .setLabel('Previous')
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId('next')
                            .setLabel('Next')
                            .setStyle(ButtonStyle.Success),
                        new ButtonBuilder()
                            .setCustomId('stop')
                            .setLabel('Stop')
                            .setStyle(ButtonStyle.Danger)
                    );

                let currentIndex = 0;

                // Send the initial embed
                const replyMessage = await interaction.reply({
                    embeds: [embeds[currentIndex]],
                    components: [buttonRow],
                    fetchReply: true
                });

                // Create a message component collector to handle button interactions
                const collector = replyMessage.createMessageComponentCollector({
                    componentType: 'BUTTON',
                    time: 60000 // 1 minute
                });

                collector.on('collect', async buttonInteraction => {
                    console.log(`Button ${buttonInteraction.customId} clicked`);
                
                    // Check if the button interaction is from the same user
                    if (buttonInteraction.user.id !== interaction.user.id) {
                        await buttonInteraction.reply({ content: "You cannot control this interaction.", ephemeral: true });
                        return;
                    }
                
                    // Acknowledge the interaction
                    await buttonInteraction.deferUpdate();
                
                    switch (buttonInteraction.customId) {
                        case 'prev':
                            currentIndex = (currentIndex - 1 + embeds.length) % embeds.length;
                            break;
                        case 'next':
                            currentIndex = (currentIndex + 1) % embeds.length;
                            break;
                        case 'stop':
                            collector.stop();
                            await replyMessage.edit({ components: [] }); // Disable buttons
                            return;
                    }
                
                    // Update the original message with the new embed
                    await replyMessage.edit({
                        embeds: [embeds[currentIndex]]
                    });
                });

                // End the collector after the timeout
                collector.on('end', async () => {
                    console.log("Collector ended, disabling buttons");
                    await replyMessage.edit({
                        components: [] // Disable buttons after collector ends
                    });
                });

            } catch (error) {
                console.error(`Error fetching lore entries: ${error}`);
                await interaction.reply({ content: 'An error occurred while fetching lore entries.', ephemeral: true });
            }
        }
    },
};

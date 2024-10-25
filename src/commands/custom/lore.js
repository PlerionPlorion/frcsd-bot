const {
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");
const {
    loadLoreEntries,
    addLoreEntry,
    gitCommit,
} = require("../../utils/loreutils");
const { createEmbed } = require("../../utils/embedBuilder");

let collector;

module.exports = {
    data: new SlashCommandBuilder()
        .setName("lore")
        .setDescription("View or add lore to the database (2000 char max)")
        .addStringOption((option) =>
            option
                .setName("lore")
                .setDescription("The lore message to add")
                .setRequired(false)
        )
        .addIntegerOption(
            (option) =>
                option
                    .setName("page")
                    .setDescription("Page number to view")
                    .setRequired(false)
                    .setMinValue(1) // Ensure the page number is at least 1
        ),

    async execute(interaction) {
        const messageContent = interaction.options.getString("lore");
        const requestedPage = interaction.options.getInteger("page");

        if (messageContent) {
            try {
                const id = Date.now().toString();
                const loreEntry = {
                    id,
                    userId: interaction.user.id,
                    username: interaction.user.username,
                    message: messageContent,
                    timestamp: new Date().toISOString(),
                };

                await addLoreEntry(loreEntry);
                await interaction.reply({
                    content: `Lore entry created successfully! Message: ${messageContent}`,
                    ephemeral: true,
                });
                await gitCommit();
            } catch (error) {
                console.error(`Error creating lore entry: ${error}`);
                await interaction.reply({
                    content: "An error occurred while adding lore.",
                    ephemeral: true,
                });
            }
        } else {
            try {
                const loreEntries = await loadLoreEntries();
                const entriesPerPage = 1;
                let currentPage = requestedPage ? requestedPage - 1 : 0; // Adjust for 0-based index
                const totalPages = Math.ceil(
                    loreEntries.length / entriesPerPage
                );
                let isReplied = false;
                let isUpdating = false;

                // Validate the requested page
                if (
                    requestedPage &&
                    (requestedPage < 1 || requestedPage > totalPages)
                ) {
                    await interaction.reply({
                        content: `Invalid page number. Please choose a number between 1 and ${totalPages}.`,
                        ephemeral: true,
                    });
                    return;
                }

                if (loreEntries.length === 0) {
                    await interaction.reply({
                        content: "No lore entries found.",
                        ephemeral: true,
                    });
                    return;
                }

                const sendLorePage = async (page) => {
                    const start = page * entriesPerPage;
                    const entriesToShow = loreEntries.slice(
                        start,
                        start + entriesPerPage
                    );
                    const fields = entriesToShow
                        .map((entry) => {
                            const username = entry.username || "Unknown User"; // Default if username is missing
                            const message =
                                entry.message || "No message provided."; // Default if message is missing
                            const timestamp = new Date(
                                entry.timestamp
                            ).toLocaleString();

                            // Ensure the message length is within limits
                            const trimmedMessage =
                                message.length > 2048
                                    ? `${message.substring(0, 2045)}...`
                                    : message;

                            return {
                                name: username,
                                value: `${trimmedMessage}\n*Timestamp: ${timestamp}*`,
                                inline: false,
                            };
                        })
                        .filter((field) => field.value); // Filter out any fields with empty values

                    if (fields.length === 0) {
                        throw new Error("No valid fields to display.");
                    }

                    const embed = createEmbed({
                        title: "Lore Entries",
                        description: `Page ${page + 1} of ${totalPages}`,
                        color: "#0099ff",
                        fields: fields,
                    });

                    const row = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId("prev")
                            .setLabel("Previous")
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(page === 0),
                        new ButtonBuilder()
                            .setCustomId("next")
                            .setLabel("Next")
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(page === totalPages - 1)
                    );

                    if (!isReplied) {
                        await interaction.reply({
                            embeds: [embed],
                            components: [row],
                            ephemeral: true,
                        });
                        isReplied = true;
                    } else {
                        await interaction.editReply({
                            embeds: [embed],
                            components: [row],
                        });
                    }
                };

                await sendLorePage(currentPage);

                // If there is an existing collector, stop it
                if (collector) {
                    collector.stop();
                }

                const filter = (btnInt) =>
                    btnInt.user.id === interaction.user.id;

                collector = interaction.channel.createMessageComponentCollector(
                    {
                        filter,
                        time: 60000,
                    }
                );

                collector.on("collect", async (btnInt) => {
                    if (isUpdating) return; // Prevent multiple updates at once
                    isUpdating = true;

                    await btnInt.deferUpdate();

                    if (btnInt.customId === "prev")
                        currentPage = Math.max(currentPage - 1, 0);
                    if (btnInt.customId === "next")
                        currentPage = Math.min(currentPage + 1, totalPages - 1);

                    await sendLorePage(currentPage);
                    isUpdating = false; // Allow updates again
                });

                collector.on("end", async () => {
                    await interaction.editReply({ components: [] });
                });
            } catch (error) {
                console.error(`Error fetching lore entries: ${error}`);
                await interaction.reply({
                    content: "An error occurred while fetching lore entries.",
                    ephemeral: true,
                });
            }
        }
    },
};

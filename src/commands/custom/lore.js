const {
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");
const { exec } = require("child_process"); // Import child_process to execute curl commands
const {
    loadLoreEntries,
    addLoreEntry,
    gitCommit,
} = require("../../utils/loreutils");
const { createEmbed } = require("../../utils/embedBuilder");

const PASTEBIN_API_KEY = require("../../../config.json").pastebinapi;

let collector;

// Helper function to upload to Pastebin using curl
async function uploadToPastebin(content) {
    return new Promise((resolve, reject) => {
        // Prepare the curl command with -s for silent mode
        const command = `curl -s -X POST -d "api_dev_key=${PASTEBIN_API_KEY}" -d "api_paste_code=${encodeURIComponent(content)}" -d "api_option=paste" "https://pastebin.com/api/api_post.php"`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error("Error uploading to Pastebin:", error);
                return reject(error);
            }
            if (stderr) {
                console.error("Pastebin stderr:", stderr); // You can keep this for debugging purposes
                return reject(new Error(stderr));
            }
            resolve(stdout.trim()); // Return the response from Pastebin
        });
    });
}


module.exports = {
    data: new SlashCommandBuilder()
        .setName("lore")
        .setDescription("View or add lore to the database")
        .addStringOption((option) =>
            option
                .setName("lore")
                .setDescription("The lore message to add")
                .setRequired(false)
        )
        .addIntegerOption((option) =>
            option
                .setName("page")
                .setDescription("Page number to view")
                .setRequired(false)
                .setMinValue(1)
        ),

    async execute(interaction) {
        const messageContent = interaction.options.getString("lore");
        const requestedPage = interaction.options.getInteger("page");

        if (messageContent) {
            let entryMessage = messageContent;
            // If the message content is too long, upload to Pastebin
            if (messageContent.length > 1500) {
                try {
                    const pastebinUrl = await uploadToPastebin(messageContent);
                    entryMessage = `This entry was too long; view it on Pastebin: ${pastebinUrl}`;
                } catch (error) {
                    await interaction.reply({
                        content: "An error occurred while uploading long lore entry to Pastebin.",
                        ephemeral: true,
                    });
                    return;
                }
            }

            try {
                const id = Date.now().toString();
                const loreEntry = {
                    id,
                    userId: interaction.user.id,
                    username: interaction.user.username,
                    message: entryMessage,
                    timestamp: new Date().toISOString(),
                };

                await addLoreEntry(loreEntry);
                await interaction.reply({
                    content: `Lore entry created successfully! Message: ${entryMessage}`,
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
                let currentPage = requestedPage ? requestedPage - 1 : 0;
                const totalPages = Math.ceil(loreEntries.length / entriesPerPage);
                let isReplied = false;
                let isUpdating = false;

                if (requestedPage && (requestedPage < 1 || requestedPage > totalPages)) {
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
                    const entriesToShow = loreEntries.slice(start, start + entriesPerPage);
                    const fields = entriesToShow.map((entry) => {
                        const username = entry.username || "Unknown User";
                        const message = entry.message || "No message provided.";
                        const timestamp = new Date(entry.timestamp).toLocaleString();

                        const trimmedMessage = message.length > 2048
                            ? `${message.substring(0, 2045)}...`
                            : message;

                        return {
                            name: username,
                            value: `${trimmedMessage}\n*Timestamp: ${timestamp}*`,
                            inline: false,
                        };
                    }).filter((field) => field.value);

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

                if (collector) {
                    collector.stop();
                }

                const filter = (btnInt) => btnInt.user.id === interaction.user.id;

                collector = interaction.channel.createMessageComponentCollector({
                    filter,
                    time: 60000,
                });

                collector.on("collect", async (btnInt) => {
                    if (isUpdating) return;
                    isUpdating = true;

                    await btnInt.deferUpdate();

                    if (btnInt.customId === "prev") currentPage = Math.max(currentPage - 1, 0);
                    if (btnInt.customId === "next") currentPage = Math.min(currentPage + 1, totalPages - 1);

                    await sendLorePage(currentPage);
                    isUpdating = false;
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

const { SlashCommandBuilder, PermissionsBitField } = require("discord.js");
const getLastMatch = require("../../utils/eventCall.js");

let guildId;
let allSentMessages = {};
let monitoredTeams = [];
let eventIdResponse;
module.exports = {
    data: new SlashCommandBuilder()
        .setName("eventmode")
        .setDescription("Starts event mode!")
        .addStringOption((option) =>
            option
                .setName("eventid")
                .setDescription("The TBA event ID")
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages),

    async execute(interaction) {
        eventIdResponse = interaction.options.getString("eventid");
        guildId = interaction.guild.id;
        eventChannelId = interaction.channel.id;


        if (interaction.options.getString("eventid") !== 'stop') {
            await interaction.reply({
                content: "Event mode started!",
                ephemeral: true,
            });

            await monitoredTeamList(interaction.client);

            // Start the interval checker
            startIntervalChecker(interaction);
        } else {
            await interaction.reply({
                content: "Event mode ended!",
                ephemeral: true,
            });
            return;
        }



    },
};

async function monitoredTeamList(client) {
    try {
        // // Get the guild
        // const guild = client.guilds.cache.get(guildId);
        // if (!guild) {
        //     console.error(`Guild with ID ${guildId} not found.`);
        //     return;
        // }

        // // Iterate over each role in the guild
        // for (const role of guild.roles.cache.values()) {
        //     if (role.name.includes(" | ")) {
        //         const [roleId] = role.name.split(" | ");
        //         monitoredTeams.push(roleId);
        //     }
        // }
        const specificTeams = [
            "114", "1148", "1156", "1540", "1678", "1690",
            "2046", "2073", "2288", "254", "2811", "2910",
            "3256", "3310", "3476", "3478", "359", "3647",
            "3663", "4270", "4499", "5199", "5419", "581",
            "5817", "5940", "6036", "604", "6328", "6443",
            "6619", "670", "6800", "694", "7157", "8033",
            "8048", "841", "9084", "9442", "9496", "971",
            "973"
        ];

        // Add all the specific teams to monitoredTeams
        monitoredTeams.push(...specificTeams);
        // console.log(`Populated monitoredTeams list with ${monitoredTeams.length} teams`);
    } catch (error) {
        console.error(`Failed to populate monitoredTeams:`, error);
    }
}

function startIntervalChecker(interaction) {
    // console.log(eventIdResponse);
    // Check every 5 minutes (300000 milliseconds)
    if (interaction.options.getString("eventid") !== 'stop') {
    setInterval(async () => {
        try {
            // Check matches for each monitored team
            for (const teamNumber of monitoredTeams) {
                await checkMatch(
                    interaction.client,
                    teamNumber,
                    eventIdResponse
                );
            }
        } catch (error) {
            console.error("Error in interval checker:", error);
        }
    }, 300000); // 5 minutes
}
}

async function checkMatch(client, teamNumber) {
    try {
        const result = await getLastMatch(`frc${teamNumber}`, eventIdResponse);

        if (!result || !result.messageContent) {
            // console.log(`No matches found for team ${teamNumber}`);
            return;
        }

        const matchKey = result.matchDetails.match_number;

        // Check if either of the monitored teams is in this match
        const isMonitoredInMatch = monitoredTeams.some((otherTeam) =>
            result.matchDetails.alliances[
                result.matchDetails.alliances.blue.team_keys.includes(
                    `frc${otherTeam}`
                )
                    ? "blue"
                    : "red"
            ].team_keys.includes(`frc${otherTeam}`)
        );

        if (!isMonitoredInMatch) {
            // console.log(`No matches found for team ${teamNumber}`);
            return;
        }

        if (allSentMessages[matchKey]) {
            // console.log(`Message for match ${matchKey} has already been sent`);
            return;
        }

        allSentMessages[matchKey] = true;

        const messageContent = result.messageContent;

        const eventChannel = client.channels.cache.get(eventChannelId);
        if (eventChannel?.isTextBased()) {
            await eventChannel.send(messageContent);
        } else {
            console.warn("Event channel not found or is not text-based");
        }

        // console.log(`Sent match update for team ${teamNumber}`);
    } catch (error) {
        console.error(`Error checking match for team ${teamNumber}:`, error);
    }
}

const { Events } = require("discord.js");

// When the client is ready, run this code (only once).
// The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
// It makes some properties non-nullable.

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(`Ready! Logged in as ${client.user.tag}`);
        let intervalId;
        let rolesList = [];
        // const guildID = '1231713772402643035' // test3
        const guildID = "942815054271770654"; // SDFRC (frcsd >>>)

        const guild = client.guilds.cache.get(guildID);
        if (!guild) {
            console.error(`Guild with ID ${guildID} found.`);
            return;
        }
        try {
            // Iterate over each role in the guild
            for (const role of guild.roles.cache.values()) {
                if (role.name.includes(" | ")) {
                    const [roleId] = role.name.split(" | ");
                    rolesList.push(roleId);
                }
            }
        } catch (error) {
            console.error(`Failed to process guild ${guild.id}: `, error);
        }

        if (rolesList.length > 0) {
            // Set presence before 6 hour loop
            function refreshPresence() {
                const randomTeamNumber =
                    rolesList[Math.floor(Math.random() * rolesList.length)];
                client.user.setPresence({
                    activities: [
                        {
                            name: "against " + randomTeamNumber,
                            type: 0,
                            status: "online",
                            afk: false,
                            url: `https://thebluealliance.com/team/${randomTeamNumber}`,
                        },
                    ],
                });
            }
            // run once before the interval
            refreshPresence();
            intervalId = setInterval(() => {
                refreshPresence();
            }, 21600000); // 6 hours
            // Reset timer on bot shutdown
            process.on("SIGINT", () => {
                clearInterval(intervalId);
                process.exit(0);
            });
        }
    },
};

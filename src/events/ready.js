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

        for await (const guild of client.guilds.cache.values()) {
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
        }

        if (rolesList.length > 0) {
            intervalId = setInterval(() => {
                // Update the presence every 60 seconds (you can adjust this time)
                client.user.setPresence({
                    activities: [
                        {
                            name:
                                "against " +
                                rolesList[
                                    Math.floor(Math.random() * rolesList.length)
                                ],
                            type: 0,
                            status: "online",
                            afk: false,
                        },
                    ],
                });
            }, 21600000);

            process.on("SIGINT", () => {
                clearInterval(intervalId);
            });
        }
        // console.log("buh");
    },
};

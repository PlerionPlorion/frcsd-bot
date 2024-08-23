const { Events } = require("discord.js");

// When the client is ready, run this code (only once).
// The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
// It makes some properties non-nullable.

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(`Ready! Logged in as ${client.user.tag}`);

        let rolesList = [];

        for await (const guild of client.guilds.cache.values()) {
            try {
                // Iterate over each role in the guild
                for (const role of guild.roles.cache.values()) {
                    // Check if the role name includes " | "
                    if (role.name.includes(" | ")) {
                        // Split the role name by " | " and take the first part (the number)
                        const [roleId] = role.name.split(" | ");
                        // Add the role number to the list
                        rolesList.push(roleId);
                    }
                }
            } catch (error) {
                console.error(`Failed to process guild ${guild.id}: `, error);
            }
        }

        if (rolesList.length > 0) {
            // const randomIndex = Math.floor(Math.random() * (rolesList.length - 1)) + 1;

            const randomIndex = Math.floor(Math.random() * rolesList.length);

            client.user.setPresence({
                activities: [
                    {
                        name: "against " + rolesList[randomIndex],
                        type: 0, // enum: 0 = playing, 1 = streaming, 2 = listening, 3 = watching, 4 = custom, 5 = competing
                        status: "online",
                        afk: false,
                    },
                ],
            });
        } else {
            console.log("No roles found.");
        }
        // console.log("buh");
    },
};

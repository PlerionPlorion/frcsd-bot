const { Events } = require("discord.js");

const reactionMap = {
    "susan": "💻🐈",
    "cat": "🐈",
    "🐟": "🐟",
    "fish": "🐟",
    "bear": "🐻",
    "krill": "🦐",
    "issue": "☹",
    "254": "🧀💨",
    "1622": "🕷",
    "359": "🏄",
    "🤓": "☝🤓",
    "ackshually": "☝🤓",
    "yippee": 1270243584150474772,
    "terry": 1270243306051342359,
    "jerome": 1270243291715207321,
};

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.author.bot) return;

        for (const [keyword, reaction] of Object.entries(reactionMap)) {
            const regex = new RegExp(`(?:^|[^a-zA-Z0-9])${keyword}(?:$|[^a-zA-Z0-9])`, 'i');
            if (regex.test(message.content)) {
                if (Math.random() < 0.2) {
                    if (typeof reaction === "string") {
                        for (const emoji of reaction) {
                            await message.react(emoji);
                        }
                    } else if (!isNaN(reaction)) {
                        await message.react(reaction);
                    }
                }
            }
        }
    },
};
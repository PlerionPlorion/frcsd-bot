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
};

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.author.bot) return;

        for (const [keyword, reaction] of Object.entries(reactionMap)) {
            const regex = new RegExp(`(?:^|[^a-zA-Z0-9])${keyword}(?:$|[^a-zA-Z0-9])`, 'i');
            if (regex.test(message.content)) {
                if (Math.random() < 0.15) {
                    for (const emoji of reaction) {
                        await message.react(emoji);
                    }
                }
            }
        }
    },
};
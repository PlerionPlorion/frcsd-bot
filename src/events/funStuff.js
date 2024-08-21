const { Events } = require("discord.js");

const reactionMap = {
    "beloved": "💖",
    "susan": "💻🐈",
    "cat": "🐈",
    "🐟": "🐟",
    "fish": "🐟",
    "bear": "🐻",
    "krill": "🦐",
    "issue": "😦",
    "254": "🧀💨",
    "1622": "🕷",
    "359": "🏄",
    "🤓": "☝🤓",
    "ackshually": "☝🤓",
    "yippee": '<:yippee:1270243584150474772>',
    "terry": '<:terry:1270243306051342359>',
    "jerome": '<:jerome:1270243291715207321>',
};

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.author.bot) return;

        for (const [keyword, reaction] of Object.entries(reactionMap)) {
            const regex = new RegExp(`(?:^|[^a-zA-Z0-9])${keyword}(?:$|[^a-zA-Z0-9])`, 'i');
            if (Math.random() < 0.5 && regex.test(message.content)) {
                let emojis = '';
                for (let i = 0; i < reaction.length; i++) {
                    const char = reaction.charAt(i);
                    if (char === '<') {
                        const newIndex = reaction.indexOf('>', i);
                        await message.react(reaction.slice(i, newIndex+1));
                        i = newIndex; // it will ++ at the end of the loop
                    } else {
                        emojis += char;
                    }
                }
                for (const emoji of emojis) {
                    await message.react(emoji);
                }
            }
        }
    },
};
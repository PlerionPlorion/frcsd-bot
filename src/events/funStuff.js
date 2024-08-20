const { Events } = require("discord.js");

const replyMap = {
    "you know what that means": "https://cdn.discordapp.com/attachments/851596893678731267/1231435106242269285/YouKnowWhatThatMeansFRC.gif",
    "yippee": "https://media.discordapp.net/attachments/1228490698932752454/1266526296549363755/Yippee1.gif"
};

const reactionMap = {
    "fish": "🐟",
    "susan": "💻🐈",
    "cat": "🐈",
    "issue": "☹",
};

const REPLY_COOLDOWN = 120_000;
const REACT_COOLDOWN = 30_000;
let lastReply = 0;
let lastReaction = 0;

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.author.bot) return;

        const now = Date.now();
        
        for (const [keyword, url] of Object.entries(replyMap)) {
            if (message.content.toLowerCase().includes(keyword.toLowerCase())) {
                if (now - lastReply > REPLY_COOLDOWN && Math.random() < 0.34) {
                    lastReply = now;
                    setTimeout(async () => {
                        await message.reply(url);
                    }, Math.random() * 3000);
                    break;
                }
            }
        }
        for (const [keyword, reaction] of Object.entries(reactionMap)) {
            if (message.content.toLowerCase().includes(keyword.toLowerCase())) {
                if (now - lastReaction > REACT_COOLDOWN && Math.random() < 0.8) {
                    lastReaction = now;
                    setTimeout(async () => {
                        for (const emoji of reaction) {
                            await message.react(emoji);
                        }
                    }, Math.random() * 3000);
                    break;
                }
            }
        }
    },
};

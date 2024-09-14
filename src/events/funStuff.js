const { Events } = require("discord.js");
const { loadReactionMap } = require("../utils/reactionutils");

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.author.bot) return;
        const reactionMap = loadReactionMap();
        for (const [keyword, reaction] of Object.entries(reactionMap)) {
            const regex = new RegExp(
                `(?:^|[^a-zA-Z0-9])${keyword}(?:$|[^a-zA-Z0-9])`,
                "i"
            );
            if (
                Math.random() < Math.random() * Math.random() &&
                regex.test(message.content)
            ) {
                let emojis = "";
                for (let i = 0; i < reaction.length; i++) {
                    const char = reaction.charAt(i);
                    if (char === "<") {
                        try {
                            const newIndex = reaction.indexOf(">", i);
                            await message.react(
                                reaction.slice(i, newIndex + 1)
                            );
                            i = newIndex; // it will ++ at the end of the loop
                        } catch (error) {
                            console.error("unknown emoji", error);
                        }
                    } else {
                        emojis += char;
                    }
                }
                for (const emoji of emojis) {
                    try {
                        await message.react(emoji);
                    } catch (error) {
                        console.error("unknown emoji", error);
                    }
                }
            }
        }
    },
};

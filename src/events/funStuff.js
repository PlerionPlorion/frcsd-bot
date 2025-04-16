const { Events } = require("discord.js");
const { loadReactionMap } = require("../utils/reactionutils");

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.author.bot || message.author.id == 823233708185354241) { // Austen schizo
            // Ignore messages from bots or other users
            // console.log("Ignoring message from bot or other user");
            return;
        }
        const reactionMap = loadReactionMap();
        for (const [keyword, reaction] of Object.entries(reactionMap)) {
            const regex = new RegExp(
                `(?:^|[^a-zA-Z0-9])${keyword}(?:$|[^a-zA-Z0-9])`,
                "i"
            );
            if (
                Math.random() < 0.334738325528396995 && //gambling!!!
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

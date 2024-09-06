const { Events, PermissionsBitField } = require("discord.js");
const fs = require("fs");
const path = require("path");
const util = require('util');
const exec = util.promisify(require('child_process').exec);

// Path to the reactionMap.json file
const reactionMapPath = path.join(__dirname, "..", "reactionMap.json");
let reactionMap = loadReactionMap();

function loadReactionMap() {
    try {
        const rawData = fs.readFileSync(reactionMapPath, "utf8");
        return JSON.parse(rawData);
    } catch (error) {
        console.error("Error loading reactionMap.json", error);
        return {};
    }
}

async function gitCommit(key, value) {
    try {
        await exec(`git add ${reactionMapPath}`);

        await exec(`git commit -m "Update reactionMap.json: ${key}: ${value}"`);

        await exec("git push origin main");
        console.log(`Pushed changes to remote: ${key}: ${value}`);
    } catch (error) {
        console.error(`exec error: ${error}`);
        return;
    }
}

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.author.bot) return;

        for (const [keyword, reaction] of Object.entries(reactionMap)) {
            const regex = new RegExp(
                `(?:^|[^a-zA-Z0-9])${keyword}(?:$|[^a-zA-Z0-9])`,
                "i"
            );
            if (Math.random() < Math.random()*Math.random() && regex.test(message.content)) {
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
        if (
            message.content.startsWith("p?") &&
            !message.author.bot &&
            message.member.permissions.has(PermissionsBitField.Flags.Administrator)
        ) {
            const commandBody = message.content.slice(2);
            const commandArgs = commandBody.trim().split(/ +/);
            if (commandArgs[0].toLowerCase() === "updatemap") {
                const keyword = commandArgs[1];
                const emoji = commandArgs[2];
                try {
                    reactionMap[keyword] = emoji;

                    fs.writeFileSync(
                        reactionMapPath,
                        JSON.stringify(reactionMap, null, 2)
                    );
                    reactionMap = loadReactionMap();

                    message.channel.send(
                        `Updated Keyword: ${keyword} with Emoji: ${emoji}`
                    );
                    gitCommit(keyword, emoji);
                } catch (error) {
                    console.error("Error reading reactionMap.json", error);
                }
            }
            if (commandArgs[0].toLowerCase() === "delete") {
                const keywordToDelete = commandArgs[1];
                try {
                    delete reactionMap[keywordToDelete];

                    const reactionMapPath = path.join(
                        __dirname,
                        "..",
                        "reactionMap.json"
                    );
                    fs.writeFileSync(
                        reactionMapPath,
                        JSON.stringify(reactionMap, null, 2)
                    );

                    message.channel.send(`Deleted Keyword: ${keywordToDelete}`);
                    gitCommit(keyword, "Deleted");
                } catch (error) {
                    console.error("Error deleting keyword:", error);
                    message.channel.send(
                        `Failed to delete keyword: ${keywordToDelete}. Please try again.`
                    );
                }
            }
            if (commandArgs[0].toLowerCase() === "showmap") {
                const mapString = JSON.stringify(reactionMap, null, 2);
                message.channel.send(`\`\`\`json\n${mapString}\n\`\`\``);
            }
        }
    },
};

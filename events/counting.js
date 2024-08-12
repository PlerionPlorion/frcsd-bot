const { Events } = require('discord.js');
const { generateRandomExpression, randomInt } = require('../utils/expressionGenerator');  

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.channel.name !== 'counting' || message.author.bot) {
            return;
        }
        // Extract the number from the message content
        const number = parseInt(message.content);
        
        // Check if the extracted number is valid
        if (!isNaN(number) && number == 254 && randomInt(1, 50) == 1) {
            // Generate a random mathematical expression that equals incrementedNumber
            const expression = generateRandomExpression(number);

            // Send the generated expression as a reply
            message.reply(`That's a funny way of saying ${expression}`);
            // send a message in the channel with the incrementednumber
        }
    },
};
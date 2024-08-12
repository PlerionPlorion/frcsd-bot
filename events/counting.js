const { Events } = require('discord.js');

function generateRandomExpression(target) {
    const operations = [
        "+",
        "-",
        "*",
        "/",
    ];

    const functions = [
        "sqrt",
        "abs",
        "log",
        "sin",
        "cos",
    ];

    function randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function randomOperation() {
        return operations[randomInt(0, operations.length - 1)];
    }

    function randomFunction() {
        return functions[randomInt(0, functions.length - 1)];
    }

    function buildExpression(target) {
        let current = randomInt(1, 100);
        let message = `${current}`;
        let jsExpression = `${current}`;
        let steps = 0;
        const maxSteps = 12;

        //something 
        
        console.log(`current: ${current}, target: ${target}, eval: ${eval(jsExpression)}`);

        return message;
    }

    return buildExpression(target);
}

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.channel.name === 'counting' && !message.author.bot) {
            // Extract the number from the message content
            const number = parseInt(message.content);
            
            // Check if the extracted number is valid
            if (!isNaN(number)) {
                // Increment the number by 1
                const incrementedNumber = number + 1;

                // Generate a random mathematical expression that equals incrementedNumber
                const expression = generateRandomExpression(incrementedNumber);

                // Send the generated expression as a reply
                message.reply(`c!calc ${expression}`);
                // send a message in the channel with the incrementednumber
            }
        }
    },
};
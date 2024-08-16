const { SlashCommandBuilder } = require('discord.js');
const { generateRandomExpression } = require('../../utils/expressionGenerator');

module.exports = {
	category: 'custom',
    data: new SlashCommandBuilder()
        .setName('count')
        .setDescription('Overcomplicate a number!')
        .addIntegerOption(option => 
            option.setName('number')
                .setDescription('The number to think about for a very... very long time.')
                .setRequired(true)),
    async execute(interaction) {
        const number = interaction.options.getInteger('number');

        const expression = generateRandomExpression(number);
        await interaction.reply({ content: `${expression}`, ephemeral: true });
    },
};
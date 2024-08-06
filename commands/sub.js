const { SlashCommandBuilder } = require('@discordjs/builders');
const { data } = require('./utility/server');

const pointsCommand = new SlashCommandBuilder()
    .setName('points')
    .setDescription('Lists or manages user points')

    // Add a manage group
    .addSubcommandGroup((group) =>
        group
            .setName('manage')
            .setDescription('Shows or manages points in the server')
            .addSubcommand((subcommand) =>
                subcommand
                    .setName('user_points')
                    .setDescription("Alters a user's points")
                    .addUserOption((option) =>
                        option.setName('user').setDescription('The user whose points to alter').setRequired(true),
                    )
                    .addStringOption((option) =>
                        option
                            .setName('action')
                            .setDescription('What action should be taken with the users points?')
                            .addChoices(
                                { name: 'Add points', value: 'add' },
                                { name: 'Remove points', value: 'remove' },
                                { name: 'Reset points', value: 'reset' },
                            )
                            .setRequired(true),
                    )
                    .addIntegerOption((option) => option.setName('points').setDescription('Points to add or remove')),
            ),
    )

    // Add an information group
    .addSubcommandGroup((group) =>
        group
            .setName('info')
            .setDescription('Shows information about points in the guild')
            .addSubcommand((subcommand) =>
                subcommand.setName('total').setDescription('Tells you the total amount of points given in the guild'),
            )
            .addSubcommand((subcommand) =>
                subcommand
                    .setName('user')
                    .setDescription("Lists a user's points")
                    .addUserOption((option) =>
                        option.setName('user').setDescription('The user whose points to list').setRequired(true),
                    ),
            ),
    );

module.exports = {
    data: pointsCommand,
    async execute(interaction) {
        const { options } = interaction;
        if (options.getSubcommandGroup() === 'manage') {
            const user = options.getUser('user');
            const action = options.getString('action');
            const points = options.getInteger('points');

            // Handle the action
            switch (action) {
                case 'add':
                    // Add points to the user
                    break;
                case 'remove':
                    // Remove points from the user
                    break;
                case 'reset':
                    // Reset the user's points
                    break;
            }
        } else if (options.getSubcommandGroup() === 'info') {
            const subcommand = options.getSubcommand();
            if (subcommand === 'total') {
                // Get the total points in the guild
            } else if (subcommand === 'user') {
                const user = options.getUser('user');
                // Get the user's points
            }
        }
    },
};
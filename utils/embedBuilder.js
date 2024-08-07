const { EmbedBuilder } = require('discord.js');

function createEmbed({ title, description, color, fields, thumbnailUrl }) {
    const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(color);

    if (fields) {
        fields.forEach(field => embed.addFields({ name: field.name, value: field.value, inline: field.inline || false }));
    }

    if (thumbnailUrl) {
        embed.setThumbnail(thumbnailUrl);
    }

    return embed;
}

module.exports = { createEmbed };
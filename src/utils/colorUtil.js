const colorToHex = (color) => {
    if (color.startsWith('#')) {
        return color;
    }

    const rgb = color.match(/\d+/g);
    const hex = rgb.map(channel => {
        const hex = parseInt(channel).toString(16);
        return hex.length === 1 ? `0${hex}` : hex;
    });

    return `#${hex.join('')}`;
};

const luminance = (color) => {
    const hex = colorToHex(color);
    const rgb = hex.match(/\w{2}/g).map(channel => parseInt(channel, 16));

    const [r, g, b] = rgb.map(channel => {
        const sChannel = channel / 255;
        return sChannel <= 0.03928 ? sChannel / 12.92 : ((sChannel + 0.055) / 1.055) ** 2.4;
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (color1, color2) => {
    const l1 = luminance(color1);
    const l2 = luminance(color2);

    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
};

const workingColor = (color) => {
    return contrast(color, '#0f1011');
};

const betterColor = (color) => {
    if (color === '#000000') {
        return '#808080';
    } else if (color === '#ffffff') {
        return '#eefffc';
    }

    while (workingColor(color) < 4) {
        const rgb = color.match(/\w{2}/g).map(channel => parseInt(channel, 16));
        rgb[0] = Math.min(255, rgb[0] + 10);
        rgb[1] = Math.min(255, rgb[1] + 10);
        rgb[2] = Math.min(255, rgb[2] + 10);

        color = `#${rgb.map(channel => channel.toString(16).padStart(2, '0')).join('')}`;
    }
    return color;
};

module.exports = { colorToHex, luminance, contrast, workingColor, betterColor };
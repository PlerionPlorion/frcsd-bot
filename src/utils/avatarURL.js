const { exec } = require("child_process");

const currentYear = new Date().getFullYear();

async function getTeamAvatarUrl(teamNumber) {
    let thumbnailUrl = `https://www.thebluealliance.com/avatar/${currentYear}/frc${teamNumber}.png`;

    // Wrap the exec function in a Promise since async logic just makes so much sense
    return new Promise((resolve, reject) => {
        exec(`curl --head --silent ${thumbnailUrl}`, (error, stdout, stderr) => {
            const regex = /HTTP\/\d(?:\.\d)?\s(\d{3})/; // Regex to match the HTTP status code
            if (!(stdout.match(regex) && stdout.match(regex)[1] === "200")) {
                // Endpoint does not exist, use the alternative URL
                thumbnailUrl = "https://www.firstinspires.org/sites/default/files/uploads/resource_library/brand/thumbnails/FIRST-Icon.png";
            }
            resolve(thumbnailUrl); // Resolve the Promise with the final thumbnailUrl value
        });
    });
}

module.exports = getTeamAvatarUrl;
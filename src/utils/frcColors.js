const baseColorUrl = "https://api.frc-colors.com/v1/team/";

/**
 * Fetches the team colors for a given number.
 *
 * @param {number} number - The team number.
 * @returns {Promise<Object>} - A promise that resolves to the team colors.
 */
async function fetchTeamColors(number) {
    const fetch = (await import("node-fetch")).default;
    const colorUrl = `${baseColorUrl}${number}`;
    const response = await fetch(colorUrl);
    if (!response.ok) {
        return {"primaryHex":"#ffffff","secondaryHex":"#000000","verified":false};
    }
    return response.json();
}

module.exports = fetchTeamColors;
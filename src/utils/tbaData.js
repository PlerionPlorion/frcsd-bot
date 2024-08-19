const baseTbaUrl = "https://www.thebluealliance.com/api/v3/team/frc";

/**
 * Fetches team data from The Blue Alliance API.
 * @param {number} number - The team number.
 * @returns {Promise<Object>} - A promise that resolves to the team data.
 */
async function fetchTeamData(number) {
    const fetch = (await import("node-fetch")).default;
    const tbaUrl = `${baseTbaUrl}${number}/simple`;
    const response = await fetch(tbaUrl, {
        method: "GET",
        headers: {
            accept: "application/json",
            "X-TBA-Auth-Key": require("../../config.json").tba,
        },
    });
    if (!response.ok) {
        console.error(response);
    }
    return response.json();
}

module.exports = fetchTeamData;
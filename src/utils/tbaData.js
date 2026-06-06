const baseTbaUrl = "https://www.thebluealliance.com/api/v3/team/frc";

function defaultTeamData(number) {
    return {
        nickname: `Team ${number}`,
        city: null,
        state_prov: null,
        country: null,
    };
}

function missingTeamData() {
    return {
        nickname: null,
        city: null,
        state_prov: null,
        country: null,
    };
}

/**
 * Fetches team data from The Blue Alliance API.
 * @param {number} number - The team number.
 * @returns {Promise<Object>} - A promise that resolves to the team data.
 */
async function fetchTeamData(number) {
    const fetch = (await import("node-fetch")).default;
    const tbaUrl = `${baseTbaUrl}${number}/simple`;
    try {
        const response = await fetch(tbaUrl, {
            method: "GET",
            headers: {
                accept: "application/json",
                "X-TBA-Auth-Key": require("../../config.json").tba,
            },
        });
        if (!response.ok) {
            console.error(`TBA returned ${response.status} for team ${number}`);
            if (response.status === 404) {
                return missingTeamData();
            }
            return defaultTeamData(number);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error fetching TBA data for team ${number}:`, error);
        return defaultTeamData(number);
    }
}

module.exports = fetchTeamData;

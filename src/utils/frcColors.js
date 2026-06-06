const baseColorUrl = "https://api.frc-colors.com/v1/team/";

/**
 * Fetches the team colors for a given number.
 *
 * @param {number} number - The team number.
 * @returns {Promise<Object|null>} - A promise that resolves to the team colors, or null if unavailable.
 */
async function fetchTeamColors(number) {
	const fetch = (await import("node-fetch")).default;
	const colorUrl = `${baseColorUrl}${number}`;

	try {
		const response = await fetch(colorUrl);

		if (!response.ok) {
			console.error(`FRC Colors returned ${response.status} for team ${number}`);
			return null;
		}

		const colors = await response.json();
		if (!colors?.primaryHex || !colors?.secondaryHex) {
			console.error(`FRC Colors returned incomplete colors for team ${number}`);
			return null;
		}

		return colors;
	} catch (error) {
		console.error(`Error fetching colors for team ${number}:`, error);
		return null;
	}
}

module.exports = fetchTeamColors;

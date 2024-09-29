const baseTbaUrl = "https://www.thebluealliance.com/api/v3";

/**
 * Fetches the last match played by a team at an event from The Blue Alliance API.
 * @param {string} teamKey - The team key
 * @param {string} eventKey - The event key.
 * @returns {Promise<Object|null>} - A promise that resolves to an object containing the score and win status, or null if no matches found.
 */
async function getLastMatch(teamKey, eventKey) {
    const fetch = (await import("node-fetch")).default;

    const url = `${baseTbaUrl}/team/${teamKey}/event/${eventKey}/matches`;
    if(eventKey != 'stop') {
    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                accept: "application/json",
                "X-TBA-Auth-Key": require("../../config.json").tba,
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const matches = await response.json();

        if (matches.length === 0) {
            return null;
        }

        const sortedMatches = matches
            // .reverse()
            .filter(
                (match) =>
                    match.alliances.blue.score !== -1 &&
                    match.alliances.red.score !== -1
            )
            .sort((a, b) => b.time - a.time);

        let lastMatch = null;

        for (let i = 0; i < sortedMatches.length; i++) {
            const match = sortedMatches[i];

            const blueAlliance = match.alliances.blue;
            const redAlliance = match.alliances.red;

            // Check if teamKey is in either alliance
            if (blueAlliance.team_keys.includes(teamKey)) {
                // console.log(
                //     `Found match for team ${teamKey}: Match ${match.match_number}`
                // );
                lastMatch = match;
                break;
            } else if (redAlliance.team_keys.includes(teamKey)) {
                // console.log(
                //     `Found match for team ${teamKey}: Match ${match.match_number}`
                // );
                lastMatch = match;
                break;
            }
        }

        if (!lastMatch) {
            // console.log(`No valid matches found for team ${teamKey}`);
            return null;
        }

        // Determine the alliance color
        const allianceColor = lastMatch.alliances.blue.team_keys.includes(
            teamKey
        )
            ? "blue"
            : "red";

        // Prepare the message content
        const alliedTeams = lastMatch.alliances[allianceColor].team_keys
            .filter((key) => key !== teamKey)
            .map((key) => key.replace("frc", ""))
            .join(" and ");
        const opposingTeams = lastMatch.alliances[
            allianceColor === "blue" ? "red" : "blue"
        ].team_keys
            .map((key) => key.replace("frc", ""))
            .join(", ");
        const didWin = lastMatch.winning_alliance === allianceColor;
        const score = lastMatch.alliances[allianceColor].score;
        const opposingScore =
            lastMatch.alliances[allianceColor === "blue" ? "red" : "blue"]
                .score;
        const highlightedTeam = teamKey.replace("frc", "");
        const matchLink = `https://www.thebluealliance.com/match/${lastMatch.key}`;
        const highlightedMatchNumber = `[match ${lastMatch.match_number}](<${matchLink}>)`;
        const messageContent = `Team ${highlightedTeam} ${
            didWin ? "won" : "lost"
        } ${highlightedMatchNumber} with ${alliedTeams} against ${opposingTeams} with a score of ${score} to ${opposingScore}`;

        return {
            matchDetails: lastMatch,
            score:
                lastMatch.alliances.blue.score || lastMatch.alliances.red.score,
            didWin: didWin,
            messageContent: messageContent,
            alliedTeams: alliedTeams,
            opposingTeams: opposingTeams,
        };
    } catch (error) {
        console.error("Error fetching last match:", error);
        return null;
    }
} else {
    return;
}
}
module.exports = getLastMatch;

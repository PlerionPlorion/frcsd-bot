const fs = require("fs").promises;
const path = require("path");
const util = require("util");
const exec = util.promisify(require("child_process").exec);

// Path to the lore.json file
const loreFilePath = path.join(__dirname, "../", "lore.json");

async function loadLoreEntries() {
    try {
        const rawData = await fs.readFile(loreFilePath, "utf8");
        
        if (rawData.trim() === "") {
            // File is empty, initialize with an empty array
            console.warn("lore.json is empty, initializing with an empty array.");
            await fs.writeFile(loreFilePath, "[]", "utf8");
            return [];
        }

        // Attempt to parse the JSON data
        try {
            return JSON.parse(rawData);
        } catch (jsonError) {
            console.error("Error parsing lore.json:", jsonError);
            
            // Optionally, reinitialize the file if it's corrupted
            await fs.writeFile(loreFilePath, "[]", "utf8");
            return [];
        }
        
    } catch (error) {
        if (error.code === "ENOENT") {
            // File doesn't exist, so return an empty array
            console.warn("lore.json not found, creating a new file.");
            await fs.writeFile(loreFilePath, "[]", "utf8");
            return [];
        } else {
            // Handle other potential errors
            console.error("Error loading lore.json:", error);
            throw error;
        }
    }
}

async function saveLoreEntries(entries) {
    try {
        await fs.writeFile(loreFilePath, JSON.stringify(entries, null, 2));
        console.log("Lore entries saved successfully.");
    } catch (error) {
        console.error("Error saving lore.json", error);
        throw error;
    }
}

async function addLoreEntry(entry) {
    const existingEntries = await loadLoreEntries();
    existingEntries.push(entry);
    await saveLoreEntries(existingEntries);
}

async function getLoreEntry(id) {
    const entries = await loadLoreEntries();
    return entries.find((e) => e.id === id);
}

module.exports = {
    loadLoreEntries,
    saveLoreEntries,
    addLoreEntry,
    getLoreEntry,
};

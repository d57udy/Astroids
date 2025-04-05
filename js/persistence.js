const HIGH_SCORES_KEY = 'asteroids_highScores';
const ACHIEVEMENTS_KEY = 'asteroids_achievements';

export class PersistenceManager {
    constructor() {
        if (!this.isLocalStorageAvailable()) {
            console.warn("localStorage is not available. High scores and achievements will not be saved.");
        }
    }

    isLocalStorageAvailable() {
        try {
            const testKey = '__testLocalStorage__';
            localStorage.setItem(testKey, testKey);
            localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            return false;
        }
    }

    saveHighScores(scores) {
        if (!this.isLocalStorageAvailable()) return;
        try {
            localStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(scores));
            console.log("High scores saved.");
        } catch (error) {
            console.error("Error saving high scores:", error);
        }
    }

    loadHighScores() {
        if (!this.isLocalStorageAvailable()) return []; // Return empty if no storage
        try {
            const storedScores = localStorage.getItem(HIGH_SCORES_KEY);
            if (storedScores) {
                const scores = JSON.parse(storedScores);
                // Basic validation: ensure it's an array
                if (Array.isArray(scores)) {
                    console.log("High scores loaded.");
                    return scores;
                }
                console.warn("Invalid high score data found in localStorage.");
            }
        } catch (error) {
            console.error("Error loading high scores:", error);
        }
        return []; // Return empty array on error or if not found
    }

    saveAchievements(unlockedAchievementIds) {
        if (!this.isLocalStorageAvailable()) return;
        try {
            // Store as an array of IDs for simplicity
            localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(Array.from(unlockedAchievementIds)));
            console.log("Achievements saved.");
        } catch (error) {
            console.error("Error saving achievements:", error);
        }
    }

    loadAchievements() {
        if (!this.isLocalStorageAvailable()) return new Set(); // Return empty set
        try {
            const storedAchievements = localStorage.getItem(ACHIEVEMENTS_KEY);
            if (storedAchievements) {
                const ids = JSON.parse(storedAchievements);
                 // Basic validation: ensure it's an array
                if (Array.isArray(ids)) {
                    console.log("Achievements loaded.");
                    return new Set(ids); // Return a Set of unlocked IDs
                }
                 console.warn("Invalid achievement data found in localStorage.");
            }
        } catch (error) {
            console.error("Error loading achievements:", error);
        }
        return new Set(); // Return empty set on error or if not found
    }
} 
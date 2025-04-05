import { Achievements } from './achievements.js';

export class AchievementManager {
    constructor(persistenceManager) {
        this.persistenceManager = persistenceManager;
        this.unlockedAchievementIds = this.persistenceManager ? this.persistenceManager.loadAchievements() : new Set();
        this.definitions = Achievements; // Reference to the definitions

        // Stats tracked *during the current game session*
        // These reset when a new game starts
        this.sessionStats = {
            asteroidsDestroyed: 0,
            ufosDestroyed: 0,
            // Add more stats as needed (e.g., successfulHyperspaceJumps)
        };

        // Track recently unlocked achievements to show notifications
        this.recentlyUnlocked = [];
        this.notificationTimer = 0;
        this.NOTIFICATION_DURATION = 3; // Seconds to show notification

        console.log("AchievementManager initialized. Unlocked:", this.unlockedAchievementIds);
    }

    resetSessionStats() {
        console.log("Resetting achievement session stats.");
        for (const key in this.sessionStats) {
            this.sessionStats[key] = 0;
        }
        this.recentlyUnlocked = [];
        this.notificationTimer = 0;
    }

    // --- Stat Update Methods --- Call these from main game logic ---
    trackAsteroidDestroyed() {
        this.sessionStats.asteroidsDestroyed++;
        this.checkUnlockConditions(); // Check after stat update
    }

    trackUfoDestroyed() {
        this.sessionStats.ufosDestroyed++;
        this.checkUnlockConditions();
    }

    // Call this periodically or when stats change significantly
    checkUnlockConditions(gameState) {
        let newUnlockOccurred = false;
        for (const key in this.definitions) {
            const achievement = this.definitions[key];
            if (!this.unlockedAchievementIds.has(achievement.id)) {
                // Check if conditions are met
                if (this.isConditionMet(achievement.condition, gameState)) {
                    this.unlockAchievement(achievement);
                    newUnlockOccurred = true;
                }
            }
        }
        // If a new achievement was unlocked, save the updated set
        if (newUnlockOccurred && this.persistenceManager) {
            this.persistenceManager.saveAchievements(this.unlockedAchievementIds);
        }
    }

    isConditionMet(condition, gameState) {
        if (!condition) return false;

        switch (condition.type) {
            case 'score':
                return gameState && gameState.score >= condition.value;
            case 'level':
                return gameState && gameState.level >= condition.value;
            case 'stat':
                return this.sessionStats[condition.stat] !== undefined &&
                       this.sessionStats[condition.stat] >= condition.value;
            // Add other condition types like 'event' later
            default:
                return false;
        }
    }

    unlockAchievement(achievement) {
        if (!this.unlockedAchievementIds.has(achievement.id)) {
            console.log(`%cAchievement Unlocked: ${achievement.name}!`, 'color: yellow; font-weight: bold;');
            this.unlockedAchievementIds.add(achievement.id);
            this.recentlyUnlocked.push(achievement);
            this.notificationTimer = this.NOTIFICATION_DURATION;
            // Optionally play a sound
            // audioManager.play('achievementUnlocked');
        }
    }

    // Update notification timer (call from main game loop)
    updateNotifications(deltaTime) {
        if (this.notificationTimer > 0) {
            this.notificationTimer -= deltaTime;
            if (this.notificationTimer <= 0) {
                this.recentlyUnlocked = []; // Clear notifications after timer expires
            }
        }
    }

    // Get notifications for rendering
    getActiveNotifications() {
        return this.notificationTimer > 0 ? this.recentlyUnlocked : [];
    }

    isUnlocked(achievementId) {
        return this.unlockedAchievementIds.has(achievementId);
    }

    getAllAchievementsStatus() {
        const status = [];
        for (const key in this.definitions) {
            const achievement = this.definitions[key];
            status.push({
                ...achievement,
                unlocked: this.isUnlocked(achievement.id)
            });
        }
        // Optionally sort them (e.g., unlocked first or by name)
        status.sort((a, b) => a.name.localeCompare(b.name));
        return status;
    }
} 
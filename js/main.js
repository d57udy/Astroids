import { PlayerShip } from './player.js';
import { Asteroid } from './asteroid.js';
import { Bullet } from './bullet.js';
import { InputHandler } from './input.js';
import { randomRange } from './utils.js';
import { UFO } from './ufo.js';
import { AudioManager } from './audio.js';
import { PersistenceManager } from './persistence.js';
import { AchievementManager } from './achievementManager.js';
import { Achievements } from './achievements.js';

// Game States Enum
const GameState = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    HIGH_SCORES: 'high_scores',
    ACHIEVEMENTS: 'achievements',
    GAME_OVER: 'game_over'
};

// Difficulty Settings
const Difficulty = {
    EASY: {
        id: 'easy',
        name: 'Easy',
        startingAsteroids: 3,
        asteroidSpeedMultiplier: 0.8,
        ufoSpawnMultiplier: 1.5,
        ufoAccuracy: 0.6,
        startingLives: 4,
        scoreMultiplier: 0.75
    },
    MEDIUM: {
        id: 'medium',
        name: 'Medium',
        startingAsteroids: 4,
        asteroidSpeedMultiplier: 1.0,
        ufoSpawnMultiplier: 1.0,
        ufoAccuracy: 0.8,
        startingLives: 3,
        scoreMultiplier: 1.0
    },
    HARD: {
        id: 'hard',
        name: 'Hard',
        startingAsteroids: 5,
        asteroidSpeedMultiplier: 1.2,
        ufoSpawnMultiplier: 0.7, // More frequent UFOs
        ufoAccuracy: 0.95,
        startingLives: 2,
        scoreMultiplier: 1.5
    }
};

// Constants
const MAX_HIGH_SCORES = 10; // Max number of scores to keep
const STARTING_LIVES = 3; // Default lives if not overridden by difficulty
const STARTING_ASTEROIDS = 4;
const RESPAWN_DELAY = 2;
const SAFE_SPAWN_RADIUS = 150;
const UFO_SPAWN_BASE_INTERVAL = 15; // Average seconds between UFO spawns (Added back)
const EXTRA_LIFE_SCORE = 10000;

// Game State Variables
let canvas, ctx;
let inputHandler;
let audioManager;
let persistenceManager;
let achievementManager;
let ship;
let asteroids = [];
let bullets = [];
let ufos = [];
let score = 0;
let lives = Difficulty.MEDIUM.startingLives; // Default before selection
let level = 1;
let currentGameState = GameState.MENU;
let selectedDifficulty = Difficulty.MEDIUM; // Default difficulty
let menuSelectionIndex = 0; // For menu navigation (0: Start, 1: High Scores, 2: Achievements, 3: Easy, 4: Medium, 5: Hard)
const menuOptions = ['Start', 'High Scores', 'Achievements', Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD];
let respawnTimer = 0;
let ufoSpawnTimer = UFO_SPAWN_BASE_INTERVAL;
let finalScore = 0;
let highScores = []; // Initialize high scores array
let nextExtraLifeScore = EXTRA_LIFE_SCORE; // Track the next threshold

// DOM Ready
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Loaded - Initializing Game");
    canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error("Canvas element not found!");
        return;
    }
    ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error("2D Context not available!");
        return;
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize Game Components
    inputHandler = new InputHandler();
    audioManager = new AudioManager();
    persistenceManager = new PersistenceManager();
    achievementManager = new AchievementManager(persistenceManager);

    // Load high scores at start
    highScores = persistenceManager.loadHighScores();
    console.log("Loaded High Scores:", highScores);

    // Add event listener to resume audio context on first user interaction
    const resumeAudio = () => {
        audioManager.resumeContext();
        // Remove listeners after first interaction
        document.removeEventListener('click', resumeAudio);
        document.removeEventListener('keydown', resumeAudio);
    };
    document.addEventListener('click', resumeAudio);
    document.addEventListener('keydown', resumeAudio);

    console.log("Starting Game Loop in Menu State");
    gameLoop();
});

// Resets game variables for a new play session using selected difficulty
function startGame() {
    console.log(`Starting New Game (Difficulty: ${selectedDifficulty.name})`);
    score = 0;
    lives = selectedDifficulty.startingLives;
    level = 1;
    nextExtraLifeScore = EXTRA_LIFE_SCORE; // Reset threshold on new game
    bullets = [];
    asteroids = [];
    ufos = [];
    respawnPlayer(true);
    createLevelAsteroids();
    resetUfoSpawnTimer();
    audioManager.stopThrustSound();
    audioManager.stopUfoHum();
    updateUI();
    currentGameState = GameState.PLAYING;
    achievementManager.resetSessionStats();
}

function resizeCanvas() {
    // Make canvas fill most of the smaller dimension
    const size = Math.min(window.innerWidth, window.innerHeight) * 0.9;
    canvas.width = size;
    canvas.height = size;
    console.log(`Canvas resized to: ${canvas.width}x${canvas.height}`);
    // Could potentially reposition entities if needed after resize
}

function updateUI() {
    const scoreElement = document.getElementById('score');
    const livesElement = document.getElementById('lives');
    const levelElement = document.getElementById('level');

    if (scoreElement) scoreElement.textContent = `Score: ${score}`;
    if (livesElement) livesElement.textContent = `Lives: ${lives}`;
    if (levelElement) levelElement.textContent = `Level: ${level}`;
}

function handleInput(deltaTime) {
    audioManager.resumeContext();
    // console.log(`InputHandler State: Keys=${JSON.stringify(inputHandler.keys)}, SinglePress=${JSON.stringify(inputHandler.singlePressActions)}`); // Optional detailed log

    switch (currentGameState) {
        case GameState.MENU:
            // Diagnostic logs for menu state
            console.log(`MENU Input Check: menuUp=${inputHandler.singlePressActions['menuUp']}, menuDown=${inputHandler.singlePressActions['menuDown']}, menuSelect=${inputHandler.singlePressActions['menuSelect']}`);

            if (inputHandler.consumeAction('menuUp')) {
                console.log("Consumed menuUp"); // Log consumption
                menuSelectionIndex = (menuSelectionIndex - 1 + menuOptions.length) % menuOptions.length;
            }
            if (inputHandler.consumeAction('menuDown')) {
                console.log("Consumed menuDown"); // Log consumption
                menuSelectionIndex = (menuSelectionIndex + 1) % menuOptions.length;
            }
            if (inputHandler.consumeAction('menuSelect')) {
                console.log("Consumed menuSelect"); // Log consumption
                const selection = menuOptions[menuSelectionIndex];
                if (selection === 'Start') startGame();
                else if (selection === 'High Scores') currentGameState = GameState.HIGH_SCORES;
                else if (selection === 'Achievements') currentGameState = GameState.ACHIEVEMENTS;
                else if (typeof selection === 'object') selectedDifficulty = selection;
            }
            break;

        case GameState.PLAYING:
            if (!ship || !ship.isAlive) return;
            if (inputHandler.isPressed('rotateLeft')) ship.rotate(-1, deltaTime);
            if (inputHandler.isPressed('rotateRight')) ship.rotate(1, deltaTime);
            if (inputHandler.isPressed('thrust')) ship.thrust(deltaTime);
            else ship.isThrusting = false;
            if (inputHandler.isPressed('fire')) ship.fire(bullets, audioManager);
            if (inputHandler.consumeAction('hyperspace')) {
                if (ship.hyperspace(canvas.width, canvas.height, asteroids, ufos, audioManager)) {
                    if (!ship.isAlive) handlePlayerDeath(true);
                }
            }
            if (inputHandler.consumeAction('pause')) {
                currentGameState = GameState.PAUSED;
                audioManager.stopThrustSound();
                audioManager.stopUfoHum();
                console.log("Game Paused");
            }
            if (ship.isThrusting && !audioManager.isMuted) audioManager.startThrustSound();
            else audioManager.stopThrustSound();
            break;

        case GameState.PAUSED:
            if (inputHandler.consumeAction('pause')) {
                currentGameState = GameState.PLAYING;
                console.log("Game Resumed");
            }
            break;

        case GameState.HIGH_SCORES:
            if (inputHandler.consumeAction('menuSelect') || inputHandler.consumeAction('escape')) {
                currentGameState = GameState.MENU;
                menuSelectionIndex = 0;
            }
            break;

        case GameState.ACHIEVEMENTS:
            if (inputHandler.consumeAction('menuSelect') || inputHandler.consumeAction('escape')) {
                currentGameState = GameState.MENU;
                menuSelectionIndex = 0;
            }
            break;

        case GameState.GAME_OVER:
            if (inputHandler.consumeAction('menuSelect')) {
                currentGameState = GameState.MENU;
                menuSelectionIndex = 0;
            }
            break;
    }

    // Global Mute Toggle
    if (inputHandler.consumeAction('toggleMute')) {
        audioManager.toggleMute();
    }
}

function updateGame(deltaTime) {
    handleInput(deltaTime); // Handles input based on state

    // Update achievement notifications regardless of game state (except maybe menu?)
    if (currentGameState !== GameState.MENU) {
        achievementManager.updateNotifications(deltaTime);
    }

    if (currentGameState !== GameState.PLAYING) {
        // If not playing, don't update game entities, only handle state transitions via input
        return;
    }

    // --- Game Playing Logic ---

    // Handle respawn timer
    if (respawnTimer > 0) {
        respawnTimer -= deltaTime;
        if (respawnTimer <= 0 && lives > 0 && currentGameState !== GameState.GAME_OVER) {
            respawnPlayer();
        }
        // Don't update game elements while waiting for respawn? Or allow asteroids to move? Let's allow movement.
    }

    if (currentGameState === GameState.GAME_OVER) {
        // Potentially handle restart input here later
        return; // No updates if game is over
    }

    // Update ship
    if (ship && ship.isAlive && respawnTimer <= 0) {
        ship.update(deltaTime, canvas.width, canvas.height, audioManager);
    }

    // Update asteroids
    asteroids.forEach(asteroid => asteroid.update(deltaTime, canvas.width, canvas.height, audioManager));

    // Update bullets
    bullets.forEach(bullet => bullet.update(deltaTime, canvas.width, canvas.height));

    // Update UFOs
    let activeUfoExists = false;
    ufos.forEach(ufo => {
        if(ufo.isAlive) {
             ufo.update(deltaTime, canvas.width, canvas.height, ship, bullets, audioManager, selectedDifficulty);
             activeUfoExists = true;
        }
    });

    // Handle UFO Hum
    if (activeUfoExists && !audioManager.isMuted) audioManager.startUfoHum();
    else audioManager.stopUfoHum();

    checkCollisions();

    // Filter out dead entities
    bullets = bullets.filter(bullet => bullet.isAlive);
    asteroids = asteroids.filter(asteroid => asteroid.isAlive);
    ufos = ufos.filter(ufo => ufo.isAlive);

    updateUfoSpawning(deltaTime);

    // Check level completion
    if (asteroids.length === 0 && ufos.length === 0 && respawnTimer <= 0 && ship && ship.isAlive) {
        levelUp();
    }

    // Pass current game state snapshot for achievement checks
    const currentSnapshot = { score: score, level: level };
    achievementManager.checkUnlockConditions(currentSnapshot);

    updateUI();
}

function renderGame() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    switch (currentGameState) {
        case GameState.MENU:
            // Draw Title
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.font = '48px Arial';
            ctx.fillText("ASTEROIDS", canvas.width / 2, canvas.height / 3);

            // Draw Menu Options
            ctx.font = '24px Arial';
            const menuStartY = canvas.height / 2 - (menuOptions.length / 2 * 40); // Center vertically
            const menuLineHeight = 40;
            menuOptions.forEach((option, index) => {
                const isSelected = index === menuSelectionIndex;
                ctx.fillStyle = isSelected ? 'yellow' : 'white';
                let text = '';
                if (typeof option === 'string') {
                    text = option; // "Start"
                } else { // Difficulty object
                    text = option.name;
                    if (option === selectedDifficulty) {
                        text += " (Selected)"; // Indicate current selection
                        if (!isSelected) ctx.fillStyle = 'cyan'; // Show selected difficulty even if not hovered
                    }
                }
                if (option === 'High Scores') {
                    text = option;
                }
                if (option === 'Achievements') {
                    text = option;
                }
                ctx.fillText(text, canvas.width / 2, menuStartY + index * menuLineHeight);
            });
            break;

        case GameState.PLAYING:
        case GameState.PAUSED: // Render game elements even when paused
            if (ship && ship.isAlive && respawnTimer <= 0) ship.draw(ctx);
            asteroids.forEach(asteroid => asteroid.draw(ctx));
            bullets.forEach(bullet => bullet.draw(ctx));
            ufos.forEach(ufo => ufo.draw(ctx));

            if (currentGameState === GameState.PAUSED) {
                drawCenterText("PAUSED", "Press 'P' to Resume");
            }
            break;

        case GameState.HIGH_SCORES:
            drawHighScores();
            break;

        case GameState.ACHIEVEMENTS:
            drawAchievements();
            break;

        case GameState.GAME_OVER:
            drawCenterText("GAME OVER", `Final Score: ${finalScore}`);
            ctx.font = '20px Arial';
            ctx.fillText("Press Space or Enter for Menu", canvas.width / 2, canvas.height / 2 + 60);
            break;
    }

    // Render achievement notifications on top of everything (except maybe menus?)
    if (currentGameState === GameState.PLAYING || currentGameState === GameState.PAUSED) {
        drawAchievementNotifications();
    }
}

function drawCenterText(line1, line2 = null) {
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.font = '48px Arial';
    ctx.fillText(line1, canvas.width / 2, canvas.height / 2 - (line2 ? 20 : 0));
    if (line2) {
        ctx.font = '24px Arial';
        ctx.fillText(line2, canvas.width / 2, canvas.height / 2 + 20);
    }
}

// The Main Game Loop
let lastTime = 0;
function gameLoop(timestamp = 0) {
    // Calculate deltaTime, capping it to prevent large jumps if tab loses focus
    const rawDeltaTime = (timestamp - lastTime) / 1000; // time in seconds
    const deltaTime = Math.min(rawDeltaTime, 1 / 20); // Cap at ~20 FPS minimum update logic
    lastTime = timestamp;

    updateGame(deltaTime);
    renderGame();

    requestAnimationFrame(gameLoop);
}

// --- Helper Functions ---

function createLevelAsteroids() {
    console.log(`Creating asteroids for level ${level} (Difficulty: ${selectedDifficulty.name})`);
    asteroids = [];
    // Use difficulty setting for number of asteroids
    const baseAsteroids = selectedDifficulty.startingAsteroids;
    const numAsteroids = baseAsteroids + (level - 1) * 2; // Still increase per level

    for (let i = 0; i < numAsteroids; i++) {
        let x, y;
        do {
            // Spawn at edges, ensuring they are outside the safe center radius
            const edge = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
            if (edge === 0) { // Top
                x = randomRange(0, canvas.width);
                y = -Asteroid.Sizes.LARGE.radius;
            } else if (edge === 1) { // Right
                x = canvas.width + Asteroid.Sizes.LARGE.radius;
                y = randomRange(0, canvas.height);
            } else if (edge === 2) { // Bottom
                x = randomRange(0, canvas.width);
                y = canvas.height + Asteroid.Sizes.LARGE.radius;
            } else { // Left
                x = -Asteroid.Sizes.LARGE.radius;
                y = randomRange(0, canvas.height);
            }
        } while (Math.sqrt((x - canvas.width/2)**2 + (y - canvas.height/2)**2) < SAFE_SPAWN_RADIUS);

        asteroids.push(new Asteroid(x, y, Asteroid.Sizes.LARGE, null, selectedDifficulty.asteroidSpeedMultiplier));
    }
}

function checkCollisions() {
    // --- Player Collision Checks (only if alive and not invulnerable) ---
    if (ship && ship.isAlive && !ship.isInvulnerable) {
        // Player-Asteroid
        for (const asteroid of asteroids) {
            if (asteroid.isAlive && ship.collidesWith(asteroid)) {
                console.log("Collision: Ship <-> Asteroid");
                handlePlayerDeath();
                asteroid.split(asteroids, audioManager);
                return;
            }
        }

        // Player-UFO
        for (const ufo of ufos) {
            if (ufo.isAlive && ship.collidesWith(ufo)) {
                console.log("Collision: Ship <-> UFO");
                handlePlayerDeath();
                ufo.destroy(audioManager);
                return; // Ship died
            }
        }

        // Player-UFO Bullet
        for (const bullet of bullets) {
            if (bullet.isAlive && !bullet.isPlayerBullet && ship.collidesWith(bullet)) {
                console.log("Collision: Ship <-> UFO Bullet");
                handlePlayerDeath();
                bullet.destroy();
                return;
            }
        }
    }

    // --- Bullet Collision Checks ---

    // Player Bullet Collisions
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        if (!bullet.isAlive || !bullet.isPlayerBullet) continue; // Only check player bullets here

        // Player Bullet - Asteroid
        let bulletHitAsteroid = false;
        for (let j = asteroids.length - 1; j >= 0; j--) {
            const asteroid = asteroids[j];
            if (!asteroid.isAlive) continue;

            if (bullet.collidesWith(asteroid)) {
                console.log("Collision: Player Bullet <-> Asteroid");
                bullet.destroy();
                const scoreGained = Math.round(asteroid.scoreValue * selectedDifficulty.scoreMultiplier);
                updateScore(scoreGained);
                asteroid.split(asteroids, audioManager);
                achievementManager.trackAsteroidDestroyed();
                bulletHitAsteroid = true;
                break; // Bullet hits one asteroid max
            }
        }
        if (bulletHitAsteroid) continue; // Skip UFO check if asteroid was hit

        // Player Bullet - UFO
        for (let j = ufos.length - 1; j >= 0; j--) {
            const ufo = ufos[j];
            if (!ufo.isAlive) continue;

            if (bullet.collidesWith(ufo)) {
                console.log("Collision: Player Bullet <-> UFO");
                bullet.destroy();
                const scoreGained = Math.round(ufo.scoreValue * selectedDifficulty.scoreMultiplier);
                updateScore(scoreGained);
                ufo.destroy(audioManager);
                return; // Bullet hits one UFO max
            }
        }
    }

    // Note: UFO Bullet vs Asteroid collision is not typically part of classic Asteroids
    // Note: UFO Bullet vs UFO is ignored (handled by bullet loop checking !isPlayerBullet)
}

function handlePlayerDeath(forced = false) {
    // Added forced parameter
    // Ship might already be destroyed (e.g. by hyperspace fail)
    // Use destroy() return value *or* forced flag
    let destroyed = forced;
    if (ship && !forced) {
        destroyed = ship.destroy(audioManager, forced); // Normal destruction check (respects invulnerability)
    }

    if (destroyed) {
        audioManager.stopThrustSound(); // Stop sound on death
        lives--;
        updateUI();
        if (lives <= 0) {
            gameOver();
        } else {
            respawnTimer = RESPAWN_DELAY;
            ship = null;
        }
    }
}

function respawnPlayer(isInitialSpawn = false) {
    // Only respawn if game not over and ship doesn't exist or isn't alive
    if (currentGameState !== GameState.GAME_OVER && (!ship || !ship.isAlive)) {
         console.log("Respawning Player");
         const centerX = canvas.width / 2;
         const centerY = canvas.height / 2;
         ship = new PlayerShip(centerX, centerY);
         // Invulnerability is handled by the PlayerShip constructor
         respawnTimer = 0; // Clear timer

         // Optional: Clear area around spawn point? The invulnerability should handle most cases.
         // clearSpawnArea(centerX, centerY);
    }
}

function levelUp() {
    level++;
    console.log(`Level up to ${level}!`);
    updateUI();
    achievementManager.checkUnlockConditions({ score: score, level: level });
    createLevelAsteroids();
    resetUfoSpawnTimer();
}

function gameOver() {
    console.log("Game Over!");
    finalScore = score; // Store score for display
    currentGameState = GameState.GAME_OVER;
    if(ship) {
        ship.isThrusting = false; // Stop potential thrust sound
    }
    audioManager.stopThrustSound();
    audioManager.stopUfoHum();

    // Check and potentially add score to high scores
    checkAndAddHighScore(finalScore);
}

// Checks if a score is high enough and adds it
function checkAndAddHighScore(currentScore) {
    if (!persistenceManager || currentScore <= 0) return; // Check persistenceManager exists

    // Simple placeholder name for now - FR22 suggests allowing entry
    const playerName = "AAA";

    const newEntry = { name: playerName, score: currentScore };

    // Find the position to insert the new score (maintaining descending order)
    let insertIndex = highScores.findIndex(entry => currentScore > entry.score);

    if (insertIndex === -1) {
        // Score is lower than all existing scores
        if (highScores.length < MAX_HIGH_SCORES) {
            // List is not full, append to the end
            insertIndex = highScores.length;
        } else {
            // List is full and score is not high enough
            console.log(`Score ${currentScore} not high enough for leaderboard.`);
            return; // Score doesn't make the list
        }
    }

    // Add the score if it qualifies
    console.log(`New high score: ${playerName} - ${currentScore} at index ${insertIndex}`);
    highScores.splice(insertIndex, 0, newEntry);

    // Trim the list if it exceeds the maximum size
    if (highScores.length > MAX_HIGH_SCORES) {
        highScores.pop(); // Remove the lowest score
    }

    // Save the updated list
    persistenceManager.saveHighScores(highScores);
}

function resetUfoSpawnTimer() {
    let interval = UFO_SPAWN_BASE_INTERVAL;
    interval *= selectedDifficulty.ufoSpawnMultiplier; // Adjust base interval by difficulty
    interval *= Math.max(0.5, 1 - (level * 0.05)); // Adjust further by level
    ufoSpawnTimer = interval * randomRange(0.75, 1.25); // Add randomness
    console.log(`Next UFO spawn timer set to ~${interval.toFixed(1)}s`);
}

function updateUfoSpawning(deltaTime) {
    if (currentGameState !== GameState.PLAYING || respawnTimer > 0) return; // Don't spawn UFOs during these states

    if (ufos.length >= UFO.MaxActiveUFOs) return; // Don't spawn if max already present

    ufoSpawnTimer -= deltaTime;
    if (ufoSpawnTimer <= 0) {
        // Time to potentially spawn a UFO
        // Could use UFO.SpawnChancePerSecond * deltaTime > Math.random() for probability
        // For simplicity, let's just spawn one when the timer hits 0
        console.log("Attempting to spawn UFO");
        ufos.push(new UFO(canvas.width, canvas.height));
        resetUfoSpawnTimer(); // Reset timer for the next one
    }
}

// Add the function to draw the high scores screen
function drawHighScores() {
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.font = '36px Arial';
    const titleY = canvas.height / 6;
    ctx.fillText("HIGH SCORES", canvas.width / 2, titleY);

    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    const listStartY = titleY + 60;
    const listLineHeight = 30;
    const rankX = canvas.width / 5;
    const nameX = canvas.width / 3;
    const scoreX = canvas.width * 4 / 5;

    if (highScores.length === 0) {
        ctx.textAlign = 'center';
        ctx.fillText("No scores yet!", canvas.width / 2, listStartY);
    } else {
        highScores.forEach((entry, index) => {
            const rank = `${index + 1}.`.padEnd(3);
            const name = entry.name ? entry.name.substring(0, 3).toUpperCase() : "AAA";
            const scoreVal = entry.score;
            ctx.fillText(`${rank}`, rankX, listStartY + index * listLineHeight);
            ctx.fillText(`${name}`, nameX, listStartY + index * listLineHeight);
            ctx.textAlign = 'right';
            ctx.fillText(scoreVal.toString(), scoreX, listStartY + index * listLineHeight);
            ctx.textAlign = 'left';
        });
    }

    ctx.textAlign = 'center';
    ctx.font = '18px Arial';
    ctx.fillText("Press Space/Enter/Esc to return", canvas.width / 2, canvas.height - 40);
}

// Add function to draw Achievements screen
function drawAchievements() {
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.font = '36px Arial';
    const titleY = canvas.height / 8;
    ctx.fillText("ACHIEVEMENTS", canvas.width / 2, titleY);

    ctx.font = '18px Arial';
    ctx.textAlign = 'left';
    const listStartY = titleY + 50;
    const listLineHeight = 45; // More space for description
    const nameX = canvas.width / 8;
    const descX = canvas.width / 8;
    const statusX = canvas.width * 7 / 8;

    const allAchievements = achievementManager.getAllAchievementsStatus();

    allAchievements.forEach((ach, index) => {
        const yPos = listStartY + index * listLineHeight;
        ctx.fillStyle = ach.unlocked ? 'gold' : 'gray';
        ctx.font = 'bold 18px Arial';
        ctx.fillText(ach.name, nameX, yPos);

        ctx.fillStyle = ach.unlocked ? 'white' : '#aaa';
        ctx.font = '16px Arial';
        ctx.fillText(ach.description, descX, yPos + 20);

        // Optional: Draw status icon/text
        // ctx.textAlign = 'right';
        // ctx.font = 'bold 18px Arial';
        // ctx.fillText(ach.unlocked ? "[UNLOCKED]" : "[LOCKED]", statusX, yPos);
        // ctx.textAlign = 'left';
    });

    ctx.textAlign = 'center';
    ctx.font = '18px Arial';
    ctx.fillStyle = 'white';
    ctx.fillText("Press Space/Enter/Esc to return", canvas.width / 2, canvas.height - 40);
}

// Add function to draw unlock notifications
function drawAchievementNotifications() {
    const notifications = achievementManager.getActiveNotifications();
    if (notifications.length > 0) {
        const startY = canvas.height * 0.85;
        const lineHeight = 30;
        ctx.textAlign = 'center';
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'; // Semi-transparent background
        ctx.fillRect(0, startY - 25, canvas.width, notifications.length * lineHeight + 15);

        notifications.forEach((ach, index) => {
            ctx.fillStyle = 'yellow';
            ctx.fillText(`Achievement Unlocked: ${ach.name}`, canvas.width / 2, startY + index * lineHeight);
        });
    }
}

// New function to handle score updates and extra lives
function updateScore(amount) {
    if (amount <= 0) return;
    score += amount;
    // Check for extra life
    if (score >= nextExtraLifeScore) {
        lives++;
        console.log(`Extra Life! Score: ${score}, Lives: ${lives}`);
        // Play extra life sound
        // audioManager.play('extraLife');
        nextExtraLifeScore += EXTRA_LIFE_SCORE; // Set the *next* threshold
    }
    updateUI(); // Update score display immediately
    // Check score-based achievements (might be slightly delayed if done here vs updateGame)
    achievementManager.checkUnlockConditions({ score: score, level: level });
}

// --- TODO ---
// - Implement UFO firing (js/ufo.js, js/main.js collision checks)
// - Implement Hyperspace (FR19)
// - Implement Sound (FR38, FR39)
// - Implement Difficulty Levels (FR36, FR37)
// - Implement High Scores / Persistence (FR28, FR29)
// - Implement Achievements (FR31-FR35)
// - Implement Touch Controls (FR24)
// - Implement Menus (Start, Game Over prompts) (FR21, FR22)
// - Implement Pause function fully (FR25) - Done basic toggle
// - Add extra life logic (FR30)
// - Refine graphics/animations
// - Improve responsiveness / canvas scaling
// - Add Hyperspace visual/audio cues
// - Add UFO fire/explosion audio/visual cues
// - Refine UFO firing patterns/accuracy (difficulty)

// Export necessary functions/variables if using modules elsewhere
// export { canvas, ctx, score, lives, level }; 
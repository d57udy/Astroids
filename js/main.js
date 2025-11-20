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
    PROMPT_USER: 'prompt_user',
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    HIGH_SCORES: 'high_scores',
    ACHIEVEMENTS: 'achievements',
    HELP: 'help',
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
let currentGameState = GameState.PROMPT_USER;
let selectedDifficulty = Difficulty.MEDIUM; // Default difficulty
let menuSelectionIndex = 0; // For menu navigation (0: Start, 1: High Scores, 2: Achievements, 3: Help, 4: Reset Data, 5: Easy, 6: Medium, 7: Hard)
const menuOptionBaseTexts = ['Start', 'High Scores', 'Achievements', 'Help', 'Reset Data', 'Change User'];
let currentMenuOptions = []; // Will be populated based on state
let respawnTimer = 0;
let ufoSpawnTimer = UFO_SPAWN_BASE_INTERVAL;
let finalScore = 0;
let highScores = []; // Holds scores for the *current* user usually
let allHighScores = []; // Holds combined scores for display
let allAchievements = {}; // Holds map of username -> Set of achievement IDs
let nextExtraLifeScore = EXTRA_LIFE_SCORE; // Track the next threshold
let pauseMenuSelectionIndex = 0; // For pause menu navigation
const pauseMenuOptions = ['Resume', 'Restart', 'Main Menu']; // Pause menu items
let pausedGameExists = false; // Flag to track paused game
let currentUser = null; // Track current user
let promptInput = ""; // For user name entry
let usernameInputContainer = null; // HTML container for username input
let usernameInputField = null; // HTML input field
let usernameSubmitBtn = null; // HTML submit button

// --- Initialization ---

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Loaded - Initializing Game");
    canvas = document.getElementById('gameCanvas');
    if (!canvas) { console.error("Canvas element not found!"); return; }
    ctx = canvas.getContext('2d');
    if (!ctx) { console.error("2D Context not available!"); return; }

    // Get username input elements
    usernameInputContainer = document.getElementById('username-input-container');
    usernameInputField = document.getElementById('username-input');
    usernameSubmitBtn = document.getElementById('username-submit-btn');

    // Setup username input handlers
    if (usernameInputField && usernameSubmitBtn) {
        usernameSubmitBtn.addEventListener('click', handleUsernameSubmit);
        usernameInputField.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleUsernameSubmit();
            }
        });
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize Managers
    inputHandler = new InputHandler();
    audioManager = new AudioManager();
    persistenceManager = new PersistenceManager();
    achievementManager = new AchievementManager(persistenceManager);

    // Load current user and their specific data
    currentUser = persistenceManager.getCurrentUser();
    if (currentUser) {
        console.log(`Found existing user: ${currentUser}`);
        loadUserData(currentUser); // Loads user's scores into highScores
        currentGameState = GameState.MENU;
        hideUsernameInput();
    } else {
        console.log("No existing user found, proceeding to prompt.");
        currentGameState = GameState.PROMPT_USER;
        showUsernameInput();
    }
    console.log(`[DOM] Initial GameState set to: ${currentGameState}`); // Log the determined state

    // Audio context resume listener
    const resumeAudio = () => {
        audioManager.resumeContext();
        document.removeEventListener('click', resumeAudio);
        document.removeEventListener('keydown', resumeAudio);
    };
    document.addEventListener('click', resumeAudio);
    document.addEventListener('keydown', resumeAudio);

    console.log(`Starting Game Loop in State: ${currentGameState}`);
    gameLoop();
});

// --- Core Game Functions ---

// Function to handle username submission
function handleUsernameSubmit() {
    if (!usernameInputField) return;

    const username = usernameInputField.value.trim();
    if (username.length >= 3) {
        console.log(`User entered: ${username}`);
        loadUserData(username);
        currentGameState = GameState.MENU;
        usernameInputField.value = ''; // Clear input
        hideUsernameInput();
    } else {
        // Show error or shake animation
        usernameInputField.style.borderColor = 'red';
        setTimeout(() => {
            if (usernameInputField) usernameInputField.style.borderColor = '#666';
        }, 500);
    }
}

// Function to show username input
function showUsernameInput() {
    if (usernameInputContainer) {
        usernameInputContainer.style.display = 'block';
        // Auto-focus on mobile to bring up keyboard
        if (usernameInputField) {
            setTimeout(() => {
                usernameInputField.focus();
            }, 100);
        }
    }
}

// Function to hide username input
function hideUsernameInput() {
    if (usernameInputContainer) {
        usernameInputContainer.style.display = 'none';
    }
}

// Function to load data for a specific user
function loadUserData(username) {
    if (!username) return;
    console.log(`Loading data for user: ${username}`);
    currentUser = username;
    persistenceManager.setCurrentUser(username);
    // Load only the current user's scores into the main highScores variable
    highScores = persistenceManager.loadHighScores(username);
    achievementManager.loadUserAchievements(username);
    menuSelectionIndex = 0;
    pausedGameExists = false;
    // Ensure sounds are stopped
    audioManager.stopThrustSound();
    audioManager.stopUfoHum();
}

// Resets game variables for a new play session using selected difficulty
function startGame() {
    if (!currentUser) {
        console.error("Cannot start game without a user.");
        currentGameState = GameState.PROMPT_USER;
        return;
    }
    console.log(`Starting New Game (User: ${currentUser}, Difficulty: ${selectedDifficulty.name})`);
    score = 0;
    lives = selectedDifficulty.startingLives;
    level = 1;
    nextExtraLifeScore = EXTRA_LIFE_SCORE;
    bullets = [];
    asteroids = [];
    ufos = [];
    respawnPlayer(true); // Call respawn before creating asteroids
    createLevelAsteroids();
    resetUfoSpawnTimer();
    audioManager.stopThrustSound();
    audioManager.stopUfoHum();
    updateUI();
    currentGameState = GameState.PLAYING;
    achievementManager.resetSessionStats();
    pauseMenuSelectionIndex = 0;
    pausedGameExists = false;
}

// Function to handle username prompt input
function handlePromptInput() {
    if (currentGameState !== GameState.PROMPT_USER) return;

    const pressedChar = inputHandler.consumeLastCharKey();
    if (pressedChar && promptInput.length < 10) {
        promptInput += pressedChar;
    }
    if (inputHandler.consumeAction('backspace') && promptInput.length > 0) {
        promptInput = promptInput.slice(0, -1);
    }
    if (inputHandler.consumeAction('enter') && promptInput.trim().length >= 3) { // Require min length 3
        const newUser = promptInput.trim();
        console.log(`User entered: ${newUser}`);
        loadUserData(newUser);
        currentGameState = GameState.MENU;
        promptInput = "";
    }
}

// --- Main Update and Render Loop ---

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
    const userElement = document.getElementById('user-display'); // Get user display element

    if (scoreElement) scoreElement.textContent = `Score: ${score}`;
    if (livesElement) livesElement.textContent = `Lives: ${lives}`;
    if (levelElement) levelElement.textContent = `Level: ${level}`;
    // Update user display, show placeholder if no user
    if (userElement) {
        userElement.textContent = `User: ${currentUser || '---'}`;
        userElement.style.display = (currentGameState === GameState.PROMPT_USER) ? 'none' : 'block'; // Hide in prompt state
    }
}

function handleInput(deltaTime) {
    audioManager.resumeContext();

    if (currentGameState === GameState.PROMPT_USER) {
         // Username input now handled via HTML input field
         // No keyboard handling needed here
         return;
    }

    switch (currentGameState) {
        case GameState.MENU:
             // Regenerate options for current state
            currentMenuOptions = [...menuOptionBaseTexts];
            // Dynamically add difficulty options
            Object.values(Difficulty).forEach(diff => currentMenuOptions.push(diff));

            if (pausedGameExists) currentMenuOptions[0] = 'Resume';
            else currentMenuOptions[0] = 'Start';

            // Adjust index bounds safely
            if (menuSelectionIndex >= currentMenuOptions.length) {
                menuSelectionIndex = 0;
            }

            if (inputHandler.consumeAction('menuUp')) {
                 menuSelectionIndex = (menuSelectionIndex - 1 + currentMenuOptions.length) % currentMenuOptions.length;
            }
            if (inputHandler.consumeAction('menuDown')) {
                 menuSelectionIndex = (menuSelectionIndex + 1) % currentMenuOptions.length;
            }
            if (inputHandler.consumeAction('menuSelect')) {
                const selectedOption = currentMenuOptions[menuSelectionIndex];
                console.log(`Menu index ${menuSelectionIndex} selected: `, selectedOption);

                // Use the index for Start/Resume, then check the string value for others
                if (menuSelectionIndex === 0) { // Start or Resume
                    if (pausedGameExists) {
                        console.log("Resuming paused game...");
                        currentGameState = GameState.PLAYING;
                    } else {
                        console.log("Executing startGame() from menu...");
                        startGame();
                    }
                } else if (typeof selectedOption === 'string') {
                    // Handle string options (High Scores, Achievements, Help, Reset, Change User)
                    switch (selectedOption) {
                        case 'High Scores':
                            // Load combined data when entering the high score screen
                            allHighScores = persistenceManager.loadHighScores(); // Load all
                            allAchievements = persistenceManager.loadAchievements(); // Load all achievements
                            currentGameState = GameState.HIGH_SCORES;
                            break;
                        case 'Achievements':
                            currentGameState = GameState.ACHIEVEMENTS;
                            break;
                        case 'Help':
                            currentGameState = GameState.HELP;
                            break;
                        case 'Reset Data':
                            if (currentUser && confirm(`Are you sure you want to reset all data for user '${currentUser}'?`)) {
                                console.log(`Resetting data for user: ${currentUser}`);
                                persistenceManager.resetUserData(currentUser);
                                highScores = [];
                                achievementManager.loadUserAchievements(currentUser);
                                alert("User data reset.");
                            }
                            break;
                        case 'Change User':
                            currentGameState = GameState.PROMPT_USER;
                            promptInput = "";
                            currentUser = null;
                            persistenceManager.setCurrentUser(null);
                            showUsernameInput();
                            break;
                    }
                } else if (typeof selectedOption === 'object' && selectedOption.id) { // Difficulty object
                    selectedDifficulty = selectedOption;
                    console.log(`Difficulty set to: ${selectedDifficulty.name}`);
                } else {
                     console.warn("Unhandled menu selection:", selectedOption);
                }
            }
            break;

        case GameState.PLAYING:
            if (!currentUser || !ship || !ship.isAlive) return;
            if (inputHandler.isPressed('rotateLeft')) ship.rotate(-1, deltaTime);
            if (inputHandler.isPressed('rotateRight')) ship.rotate(1, deltaTime);
            if (inputHandler.isPressed('thrust')) ship.thrust(deltaTime);
            else ship.isThrusting = false;

            // Log fire button state and then attempt fire
            const firePressed = inputHandler.isPressed('fire');
            console.log(`PLAYING Input Check: firePressed=${firePressed}`); // Keep log active
            if (firePressed) {
                ship.fire(bullets, audioManager);
            }

            if (inputHandler.consumeAction('hyperspace')) {
                if (ship.hyperspace(canvas.width, canvas.height, asteroids, ufos, audioManager)) {
                    if (!ship.isAlive) handlePlayerDeath(true);
                }
            }
            if (inputHandler.consumeAction('pause') || inputHandler.consumeAction('escape')) {
                console.log("Consumed pause/escape (to PAUSED)");
                currentGameState = GameState.PAUSED;
                pauseMenuSelectionIndex = 0; // Reset pause menu selection when pausing
                audioManager.stopThrustSound();
                audioManager.stopUfoHum();
                console.log("Game Paused");
            }
            if (ship.isThrusting && !audioManager.isMuted) audioManager.startThrustSound();
            else audioManager.stopThrustSound();
            break;

        case GameState.PAUSED:
            if (inputHandler.consumeAction('pause') || inputHandler.consumeAction('escape')) {
                console.log("Consumed pause/escape (to PLAYING)");
                currentGameState = GameState.PLAYING;
                console.log("Game Resumed");
                break; // Exit switch after resuming
            }

            if (inputHandler.consumeAction('menuUp')) {
                pauseMenuSelectionIndex = (pauseMenuSelectionIndex - 1 + pauseMenuOptions.length) % pauseMenuOptions.length;
            }
            if (inputHandler.consumeAction('menuDown')) {
                pauseMenuSelectionIndex = (pauseMenuSelectionIndex + 1) % pauseMenuOptions.length;
            }

            if (inputHandler.consumeAction('menuSelect')) {
                const selection = pauseMenuOptions[pauseMenuSelectionIndex];
                console.log(`Pause menu selection: ${selection}`);
                switch (selection) {
                    case 'Resume':
                        currentGameState = GameState.PLAYING;
                        console.log("Game Resumed");
                        break;
                    case 'Restart':
                        startGame();
                        break;
                    case 'Main Menu':
                        currentGameState = GameState.MENU;
                        menuSelectionIndex = 0;
                        pausedGameExists = true; // Set the flag when returning to menu from pause
                        break;
                }
            }
            break;

        case GameState.HIGH_SCORES:
            if (inputHandler.consumeAction('menuSelect') || inputHandler.consumeAction('escape')) {
                currentGameState = GameState.MENU;
                menuSelectionIndex = 0;
                allHighScores = []; // Clear combined data when leaving
                allAchievements = {};
            }
            break;

        case GameState.ACHIEVEMENTS:
            {
                let returnToMenu = false;
                if (inputHandler.consumeAction('escape')) {
                    console.log("Consumed escape (to MENU from Achievements)");
                    returnToMenu = true;
                } else if (inputHandler.consumeAction('menuSelect')) {
                    console.log("Consumed menuSelect (to MENU from Achievements)");
                    returnToMenu = true;
                }
                if (returnToMenu) {
                    currentGameState = GameState.MENU;
                    menuSelectionIndex = 0;
                }
            }
            break;

        case GameState.HELP:
            if (inputHandler.consumeAction('menuSelect') || inputHandler.consumeAction('escape')) {
                currentGameState = GameState.MENU;
                menuSelectionIndex = 0;
            }
            break;

        case GameState.GAME_OVER:
            if (inputHandler.consumeAction('menuSelect')) {
                 currentGameState = GameState.MENU;
                 menuSelectionIndex = 0;
                 pausedGameExists = false;
            }
            break;
    }

    // Global Mute Toggle
    if (inputHandler.consumeAction('toggleMute')) {
        audioManager.toggleMute();
    }
}

function updateGame(deltaTime) {
    handleInput(deltaTime);
    if (currentGameState !== GameState.MENU && currentGameState !== GameState.PROMPT_USER) {
        achievementManager.updateNotifications(deltaTime);
    }
    if (currentGameState !== GameState.PLAYING) {
        return;
    }

    // --- Game Playing Logic ---

    if (respawnTimer > 0) {
        respawnTimer -= deltaTime;
        if (respawnTimer <= 0 && lives > 0 && currentGameState !== GameState.GAME_OVER) {
            console.log("Respawn timer finished, attempting respawn...");
            respawnPlayer();
        }
    }

    if (currentGameState === GameState.GAME_OVER) {
        return; // No updates if game is over
    }

    if (ship && ship.isAlive && respawnTimer <= 0) {
        ship.update(deltaTime, canvas.width, canvas.height, audioManager);
    }

    asteroids.forEach(asteroid => asteroid.update(deltaTime, canvas.width, canvas.height, audioManager));

    bullets.forEach(bullet => bullet.update(deltaTime, canvas.width, canvas.height));

    let activeUfoExists = false;
    ufos.forEach(ufo => {
        if(ufo.isAlive) {
             ufo.update(deltaTime, canvas.width, canvas.height, ship, bullets, audioManager, selectedDifficulty);
             activeUfoExists = true;
        }
    });

    if (activeUfoExists && !audioManager.isMuted) audioManager.startUfoHum();
    else audioManager.stopUfoHum();

    checkCollisions();

    bullets = bullets.filter(bullet => bullet.isAlive);
    asteroids = asteroids.filter(asteroid => asteroid.isAlive);
    ufos = ufos.filter(ufo => ufo.isAlive);

    updateUfoSpawning(deltaTime);

    if (asteroids.length === 0 && ufos.length === 0 && respawnTimer <= 0 && ship && ship.isAlive) {
        levelUp();
    }

    const currentSnapshot = { score: score, level: level, user: currentUser };
    achievementManager.checkUnlockConditions(currentSnapshot);

    updateUI();
}

function renderGame() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // console.log(`[renderGame] Current state: ${currentGameState}`); // Optional: Log state every frame
    switch (currentGameState) {
        case GameState.PROMPT_USER:
            // Username input is now handled via HTML input field
            // Just draw a simple background or nothing
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.font = '24px Arial';
            ctx.fillText("ASTEROIDS", canvas.width / 2, canvas.height / 4);
            break;
        case GameState.MENU:
            console.log("[renderGame] Rendering MENU state"); // Log drawing call
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.font = '48px Arial';
            ctx.fillText("ASTEROIDS", canvas.width / 2, canvas.height / 4);
            ctx.font = '20px Arial';
            const menuStartY = canvas.height * 0.4;
            const menuLineHeight = 30;

            // Regenerate options based on paused state for render
            currentMenuOptions = [...menuOptionBaseTexts];
            if (pausedGameExists) currentMenuOptions[0] = 'Resume';
            else currentMenuOptions[0] = 'Start';
            currentMenuOptions.push(...Object.values(Difficulty)); // Add difficulties

            // Adjust index bounds safely before rendering
             if (menuSelectionIndex >= currentMenuOptions.length) {
                menuSelectionIndex = 0;
             }

            currentMenuOptions.forEach((option, index) => {
                const isSelected = index === menuSelectionIndex;
                ctx.fillStyle = isSelected ? 'yellow' : 'white';
                let text = '';
                if (typeof option === 'string') {
                    text = option;
                } else { // Difficulty object
                    text = option.name;
                    if (option === selectedDifficulty) {
                        text += " (Selected)";
                        if (!isSelected) ctx.fillStyle = 'cyan';
                    }
                }
                ctx.fillText(text, canvas.width / 2, menuStartY + index * menuLineHeight);
            });
            break;

        case GameState.PLAYING:
            if (ship && ship.isAlive && respawnTimer <= 0) ship.draw(ctx);
            asteroids.forEach(asteroid => asteroid.draw(ctx));
            bullets.forEach(bullet => bullet.draw(ctx));
            ufos.forEach(ufo => ufo.draw(ctx));
            drawAchievementNotifications();
            break;

        case GameState.PAUSED:
            ctx.globalAlpha = 0.5;
            if (ship && ship.isAlive && respawnTimer <= 0) ship.draw(ctx);
            asteroids.forEach(asteroid => asteroid.draw(ctx));
            bullets.forEach(bullet => bullet.draw(ctx));
            ufos.forEach(ufo => ufo.draw(ctx));
            ctx.globalAlpha = 1.0;

            drawPauseMenu();
            drawAchievementNotifications();
            break;

        case GameState.HIGH_SCORES:
            drawHighScores(allHighScores, allAchievements);
            break;

        case GameState.ACHIEVEMENTS:
            drawAchievements();
            break;

        case GameState.HELP:
            drawHelpScreen();
            break;

        case GameState.GAME_OVER:
            drawCenterText("GAME OVER", `Final Score: ${finalScore}`);
            ctx.font = '20px Arial';
            ctx.fillText("Press Space or Enter for Menu", canvas.width / 2, canvas.height / 2 + 60);
            break;
        default:
             console.error(`[renderGame] Encountered unknown game state: ${currentGameState}`);
             break;
    }

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
    const rawDeltaTime = (timestamp - lastTime) / 1000;
    const deltaTime = Math.min(rawDeltaTime, 1 / 20);
    lastTime = timestamp;
    updateGame(deltaTime);
    renderGame();
    requestAnimationFrame(gameLoop);
}

// --- Helper Functions ---

function createLevelAsteroids() {
    console.log(`Creating asteroids for level ${level} (Difficulty: ${selectedDifficulty.name})`);
    asteroids = [];
    const baseAsteroids = selectedDifficulty.startingAsteroids;
    const numAsteroids = baseAsteroids + (level - 1) * 2;

    for (let i = 0; i < numAsteroids; i++) {
        let x, y;
        do {
            const edge = Math.floor(Math.random() * 4);
            if (edge === 0) {
                x = randomRange(0, canvas.width);
                y = -Asteroid.Sizes.LARGE.radius;
            } else if (edge === 1) {
                x = canvas.width + Asteroid.Sizes.LARGE.radius;
                y = randomRange(0, canvas.height);
            } else if (edge === 2) {
                x = randomRange(0, canvas.width);
                y = canvas.height + Asteroid.Sizes.LARGE.radius;
            } else {
                x = -Asteroid.Sizes.LARGE.radius;
                y = randomRange(0, canvas.height);
            }
        } while (Math.sqrt((x - canvas.width/2)**2 + (y - canvas.height/2)**2) < SAFE_SPAWN_RADIUS);

        asteroids.push(new Asteroid(x, y, Asteroid.Sizes.LARGE, null, selectedDifficulty.asteroidSpeedMultiplier));
    }
}

function checkCollisions() {
    if (ship && ship.isAlive && !ship.isInvulnerable) {
        for (const asteroid of asteroids) {
            if (asteroid.isAlive && ship.collidesWith(asteroid)) {
                console.log("Collision: Ship <-> Asteroid");
                handlePlayerDeath();
                asteroid.split(asteroids, audioManager);
                return;
            }
        }

        for (const ufo of ufos) {
            if (ufo.isAlive && ship.collidesWith(ufo)) {
                console.log("Collision: Ship <-> UFO");
                handlePlayerDeath();
                ufo.destroy(audioManager);
                return;
            }
        }

        for (const bullet of bullets) {
            if (bullet.isAlive && !bullet.isPlayerBullet && ship.collidesWith(bullet)) {
                console.log("Collision: Ship <-> UFO Bullet");
                handlePlayerDeath();
                bullet.destroy();
                return;
            }
        }
    }

    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        if (!bullet.isAlive || !bullet.isPlayerBullet) continue;
        let bulletHit = false;
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
                bulletHit = true;
                break;
            }
        }
        if (bulletHit) continue;
        for (let j = ufos.length - 1; j >= 0; j--) {
            const ufo = ufos[j];
            if (!ufo.isAlive) continue;
            if (bullet.collidesWith(ufo)) {
                console.log("Collision: Player Bullet <-> UFO");
                bullet.destroy();
                const scoreGained = Math.round(ufo.scoreValue * selectedDifficulty.scoreMultiplier);
                updateScore(scoreGained);
                ufo.destroy(audioManager);
                achievementManager.trackUfoDestroyed();
                break;
            }
        }
    }
}

function handlePlayerDeath(forced = false) {
    let destroyed = forced;
    if (ship && !forced) {
        destroyed = ship.destroy(audioManager, forced);
    }

    if (destroyed) {
        console.log(`Player death handled. Lives left: ${lives - 1}`);
        audioManager.stopThrustSound();
        lives--;
        updateUI();
        if (lives <= 0) {
            gameOver();
        } else {
            console.log(`Starting respawn timer (${RESPAWN_DELAY}s)`);
            respawnTimer = RESPAWN_DELAY;
            ship = null;
        }
    }
}

function respawnPlayer(isInitialSpawn = false) {
    console.log(`respawnPlayer called. isInitialSpawn=${isInitialSpawn}, currentGameState=${currentGameState}, shipExists=${!!ship}, shipAlive=${ship?.isAlive}`);
    if (currentGameState !== GameState.GAME_OVER && (!ship || !ship.isAlive)) {
         console.log("Respawning Player - Conditions Met");
         const centerX = canvas.width / 2;
         const centerY = canvas.height / 2;
         ship = new PlayerShip(centerX, centerY);
         respawnTimer = 0;
         audioManager.stopThrustSound();
    } else {
        console.log("Respawning Player - Conditions NOT Met");
    }
}

function levelUp() {
    level++;
    console.log(`Level up to ${level}!`);
    updateUI();
    achievementManager.checkUnlockConditions({ score: score, level: level, user: currentUser });
    createLevelAsteroids();
    resetUfoSpawnTimer();
}

function gameOver() {
    console.log("Game Over!");
    finalScore = score;
    currentGameState = GameState.GAME_OVER;
    pausedGameExists = false;
    if(ship) {
        ship.isThrusting = false;
    }
    audioManager.stopThrustSound();
    audioManager.stopUfoHum();
    checkAndAddHighScore(finalScore);
}

function checkAndAddHighScore(currentScore) {
    if (!persistenceManager || !currentUser || currentScore <= 0) return;
    const playerName = currentUser.substring(0, 3).toUpperCase();
    const newEntry = { name: playerName, score: currentScore }; // Note: name here is just for display if needed, user is implicit

    // Load current user's scores for comparison
    let currentUserScores = persistenceManager.loadHighScores(currentUser);

    let insertIndex = currentUserScores.findIndex(entry => currentScore > entry.score);
    if (insertIndex === -1 && currentUserScores.length < MAX_HIGH_SCORES) {
        insertIndex = currentUserScores.length;
    }

    if (insertIndex !== -1) {
        console.log(`New high score for ${currentUser}: ${playerName} - ${currentScore}`);
        currentUserScores.splice(insertIndex, 0, newEntry);
        if (currentUserScores.length > MAX_HIGH_SCORES) {
            currentUserScores.pop();
        }
        // Save the updated list for the current user
        persistenceManager.saveHighScores(currentUser, currentUserScores);
        // Update the local copy used by the game state if needed immediately
        highScores = currentUserScores;
    }
}

function resetUfoSpawnTimer() {
    let interval = UFO_SPAWN_BASE_INTERVAL;
    interval *= selectedDifficulty.ufoSpawnMultiplier;
    interval *= Math.max(0.5, 1 - (level * 0.05));
    ufoSpawnTimer = interval * randomRange(0.75, 1.25);
    console.log(`Next UFO spawn timer set to ~${interval.toFixed(1)}s`);
}

function updateUfoSpawning(deltaTime) {
    if (currentGameState !== GameState.PLAYING || respawnTimer > 0) return;

    if (ufos.length >= UFO.MaxActiveUFOs) return;

    ufoSpawnTimer -= deltaTime;
    if (ufoSpawnTimer <= 0) {
        console.log("Attempting to spawn UFO");
        ufos.push(new UFO(canvas.width, canvas.height));
        resetUfoSpawnTimer();
    }
}

function drawHighScores(scoresToDisplay, achievementsMap) {
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.font = '36px Arial';
    const titleY = canvas.height / 6;
    ctx.fillText("HIGH SCORES (ALL USERS)", canvas.width / 2, titleY);

    ctx.font = '20px Arial';
    const listStartY = titleY + 60;
    const listLineHeight = 30;
    const rankX = canvas.width / 6;
    const nameX = canvas.width / 3;
    const scoreX = canvas.width * 4 / 5;
    const achievementSymbol = '*'; // Symbol for achievements

    if (!scoresToDisplay || scoresToDisplay.length === 0) {
        ctx.textAlign = 'center';
        ctx.fillText("No scores yet!", canvas.width / 2, listStartY);
    } else {
        // Limit to MAX_HIGH_SCORES for display
        const scoresToShow = scoresToDisplay.slice(0, MAX_HIGH_SCORES);
        scoresToShow.forEach((entry, index) => {
            ctx.textAlign = 'left';
            const rank = `${index + 1}.`.padEnd(3);
            // entry.user should exist from loadHighScores(null)
            const username = entry.user || "???";
            const nameDisplay = username.substring(0, 3).toUpperCase();
            const scoreVal = entry.score;

            // Check if this user has any achievements
            const userAchievements = achievementsMap[username];
            const hasAchievements = userAchievements && userAchievements.size > 0;
            const displayName = `${nameDisplay}${hasAchievements ? achievementSymbol : ''}`;

            ctx.fillStyle = 'white';
            ctx.fillText(`${rank}`, rankX, listStartY + index * listLineHeight);
            ctx.fillText(displayName, nameX, listStartY + index * listLineHeight);
            ctx.textAlign = 'right';
            ctx.fillText(scoreVal.toString(), scoreX, listStartY + index * listLineHeight);
        });
    }

    ctx.textAlign = 'center';
    ctx.font = '18px Arial';
    ctx.fillStyle = 'white';
    ctx.fillText("Press Space/Enter/Esc to return", canvas.width / 2, canvas.height - 40);
}

function drawAchievements() {
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.font = '36px Arial';
    const titleY = canvas.height / 8;
    ctx.fillText("ACHIEVEMENTS", canvas.width / 2, titleY);

    ctx.font = '18px Arial';
    ctx.textAlign = 'left';
    const listStartY = titleY + 50;
    const listLineHeight = 45;
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
    });

    ctx.textAlign = 'center';
    ctx.font = '18px Arial';
    ctx.fillStyle = 'white';
    ctx.fillText("Press Space/Enter/Esc to return", canvas.width / 2, canvas.height - 40);
}

function drawAchievementNotifications() {
    const notifications = achievementManager.getActiveNotifications();
    if (notifications.length > 0) {
        const startY = canvas.height * 0.85;
        const lineHeight = 30;
        ctx.textAlign = 'center';
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, startY - 25, canvas.width, notifications.length * lineHeight + 15);

        notifications.forEach((ach, index) => {
            ctx.fillStyle = 'yellow';
            ctx.fillText(`Achievement Unlocked: ${ach.name}`, canvas.width / 2, startY + index * lineHeight);
        });
    }
}

function updateScore(amount) {
    if (amount <= 0) return;
    score += amount;
    if (score >= nextExtraLifeScore) {
        lives++;
        console.log(`Extra Life! Score: ${score}, Lives: ${lives}`);
        nextExtraLifeScore += EXTRA_LIFE_SCORE;
    }
    updateUI();
    achievementManager.checkUnlockConditions({ score: score, level: level, user: currentUser });
}

function drawPauseMenu() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(canvas.width * 0.25, canvas.height * 0.25, canvas.width * 0.5, canvas.height * 0.5);

    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.font = '36px Arial';
    const titleY = canvas.height * 0.35;
    ctx.fillText("PAUSED", canvas.width / 2, titleY);

    ctx.font = '24px Arial';
    const pauseStartY = titleY + 60;
    const pauseLineHeight = 40;
    pauseMenuOptions.forEach((option, index) => {
        ctx.fillStyle = index === pauseMenuSelectionIndex ? 'yellow' : 'white';
        ctx.fillText(option, canvas.width / 2, pauseStartY + index * pauseLineHeight);
    });

    ctx.font = '16px Arial';
    ctx.fillStyle = 'lightgray';
    ctx.fillText("(Press P or Esc to Resume)", canvas.width / 2, canvas.height * 0.75 - 20);
}

function drawHelpScreen() {
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.font = '36px Arial';
    const titleY = canvas.height / 8;
    ctx.fillText("HELP - CONTROLS", canvas.width / 2, titleY);

    ctx.font = '18px Arial';
    ctx.textAlign = 'left';
    const helpStartY = titleY + 60;
    const helpLineHeight = 28;
    const controlsX = canvas.width / 6;
    const keysX = canvas.width / 2;

    const controls = [
        { action: 'Rotate Left', keys: 'Left Arrow / A' },
        { action: 'Rotate Right', keys: 'Right Arrow / D' },
        { action: 'Thrust', keys: 'Up Arrow / W' },
        { action: 'Fire', keys: 'Spacebar' },
        { action: 'Hyperspace', keys: 'H' },
        { action: 'Pause/Menu Back', keys: 'P / Escape' },
        { action: 'Menu Navigate', keys: 'Up / Down Arrows' },
        { action: 'Menu Select', keys: 'Enter / Spacebar' },
        { action: 'Toggle Mute', keys: 'M' },
    ];

    controls.forEach((ctrl, index) => {
        ctx.fillText(ctrl.action + ":", controlsX, helpStartY + index * helpLineHeight);
        ctx.fillText(ctrl.keys, keysX, helpStartY + index * helpLineHeight);
    });

    ctx.textAlign = 'center';
    ctx.font = '18px Arial';
    ctx.fillText("Press Space/Enter/Esc to return", canvas.width / 2, canvas.height - 40);
}

function drawUserPrompt() {
    console.log("[drawUserPrompt] Drawing prompt screen"); // Log drawing execution
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.font = '24px Arial';
    ctx.fillText("Enter Username (3-10 chars):", canvas.width / 2, canvas.height / 3);

    ctx.font = '30px Arial';
    ctx.fillStyle = 'yellow';
    const showCursor = Math.floor(Date.now() / 500) % 2 === 0;
    const textToDraw = promptInput + (showCursor ? '_' : '');
    ctx.fillText(textToDraw, canvas.width / 2, canvas.height / 2);

    ctx.font = '18px Arial';
    ctx.fillStyle = 'white';
    ctx.fillText("(Press Enter when done)", canvas.width / 2, canvas.height / 2 + 40);
}

// Export necessary functions/variables if using modules elsewhere
// export { canvas, ctx, score, lives, level }; 
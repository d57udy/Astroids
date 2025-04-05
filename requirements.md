# Classic Asteroids Game - Requirements and Design Document

## 1. Introduction

### 1.1. Overview
This document outlines the requirements and design for a web-based, classic Asteroids-style arcade game. The game will feature a player-controlled spaceship navigating an asteroid field, aiming to destroy asteroids and occasional enemy UFOs while avoiding collisions. The game will incorporate difficulty levels, sound effects, scoring, and an achievement system to enhance player engagement. It will be developed using HTML, CSS, and JavaScript, designed for deployment on GitHub Pages, and playable on both desktop and mobile web browsers.

### 1.2. Goals
*   Recreate the core gameplay loop of the classic Asteroids arcade game.
*   Provide an engaging experience through sounds, scoring, and achievements.
*   Offer variable difficulty levels to cater to different player skills.
*   Ensure playability across modern desktop and mobile web browsers.
*   Utilize standard web technologies (HTML, CSS, JS) suitable for GitHub Pages hosting.
*   Create a fun, retro-inspired gaming experience.

### 1.3. Target Audience
*   Casual gamers.
*   Fans of retro arcade games.
*   Players looking for a quick, challenging web-based game.

## 2. Requirements

### 2.1. Functional Requirements

#### 2.1.1. Core Gameplay
*   **FR1:** Player controls a triangular spaceship in a 2D space.
*   **FR2:** Ship can rotate left and right.
*   **FR3:** Ship can thrust forward in the direction it's facing.
*   **FR4:** Ship exhibits inertia; it continues moving after thrust stops, gradually slowing (optional drag).
*   **FR5:** Ship can fire projectiles (bullets) forward.
*   **FR6:** Limited number of bullets allowed on screen simultaneously.
*   **FR7:** Game space wraps around screen edges (objects exiting one side reappear on the opposite side).
*   **FR8:** Asteroids drift across the screen at various speeds and directions.
*   **FR9:** Asteroids come in different sizes (e.g., Large, Medium, Small).
*   **FR10:** Shooting a Large asteroid breaks it into Medium asteroids.
*   **FR11:** Shooting a Medium asteroid breaks it into Small asteroids.
*   **FR12:** Shooting a Small asteroid destroys it.
*   **FR13:** Collision between the player's ship and an asteroid destroys the ship.
*   **FR14:** Player starts with a set number of lives. Losing a life respawns the ship in the center (after a brief delay, ensuring the center is clear).
*   **FR15:** The game ends when the player runs out of lives (Game Over).
*   **FR16:** Clearing all asteroids on the screen advances the player to the next level.
*   **FR17:** Each subsequent level starts with more/faster asteroids.
*   **FR18:** (Optional but Recommended) Enemy UFOs appear periodically.
    *   **FR18.1:** UFOs move across the screen (e.g., horizontally).
    *   **FR18.2:** UFOs may fire projectiles at the player. UFO firing can vary in accuracy based on difficulty/UFO type.
    *   **FR18.3:** Shooting a UFO destroys it and awards significant points.
    *   **FR18.4:** Collision between the player's ship and a UFO or UFO projectile destroys the ship.
*   **FR19:** (Optional but Recommended) Player ship has a "Hyperspace" ability: instantly relocates the ship to a random position. Using Hyperspace carries a risk of self-destruction or reappearing on top of an asteroid.

#### 2.1.2. Game Interface & Controls
*   **FR20:** Display current score, remaining lives, and current level on screen during gameplay.
*   **FR21:** Provide a Start Menu screen with options to:
    *   Start Game
    *   Select Difficulty (Easy, Medium, Hard)
    *   View High Scores
    *   View Achievements
    *   Toggle Sound (On/Off)
*   **FR22:** Display a Game Over screen showing the final score and prompting to play again or return to the menu. Potentially allow high score entry.
*   **FR23:** Implement keyboard controls for desktop (e.g., Arrows/WASD for rotation/thrust, Space for fire, H/Shift for hyperspace).
*   **FR24:** Implement touch controls for mobile (e.g., on-screen buttons for rotate left/right, thrust, fire, hyperspace).
*   **FR25:** Implement a Pause function during gameplay.

#### 2.1.3. Scoring & Persistence
*   **FR26:** Award points for destroying asteroids (more points for smaller sizes).
*   **FR27:** Award points for destroying UFOs (potentially different points for different UFO types/sizes).
*   **FR28:** Maintain and display a list of high scores (e.g., Top 10).
*   **FR29:** Persist high scores locally in the user's browser (using `localStorage`).
*   **FR30:** Award an extra life at certain score thresholds (e.g., every 10,000 points).

#### 2.1.4. Achievements
*   **FR31:** Define a set of achievements based on gameplay milestones (e.g., score thresholds, levels reached, number of asteroids destroyed, UFOs destroyed, specific maneuvers).
*   **FR32:** Track player progress towards achievements during gameplay.
*   **FR33:** Notify the player visually (and audibly) when an achievement is unlocked.
*   **FR34:** Provide a screen accessible from the main menu to view locked and unlocked achievements.
*   **FR35:** Persist unlocked achievements locally in the user's browser (using `localStorage`).

#### 2.1.5. Difficulty Levels
*   **FR36:** Implement at least three difficulty levels (e.g., Easy, Medium, Hard).
*   **FR37:** Difficulty level affects parameters such as:
    *   Starting number of asteroids.
    *   Maximum asteroid speed.
    *   UFO appearance frequency.
    *   UFO firing accuracy/frequency.
    *   Player starting lives.
    *   Rate at which difficulty scales per level.

#### 2.1.6. Sound
*   **FR38:** Include sound effects for key game events:
    *   Ship thrusting
    *   Firing bullets
    *   Asteroid explosions (different sounds for different sizes?)
    *   Player ship explosion
    *   UFO appearance/flying sound (distinct)
    *   UFO firing sound
    *   UFO explosion
    *   Hyperspace activation
    *   Extra life awarded
    *   Level start/transition
    *   Achievement unlocked
    *   Game Over
*   **FR39:** Provide an option to mute/unmute all game sounds.

### 2.2. Non-Functional Requirements

*   **NFR1:** **Performance:** The game must run smoothly (target 60 FPS) on target browsers/devices.
*   **NFR2:** **Compatibility:** The game must function correctly on the latest versions of major web browsers (Chrome, Firefox, Safari, Edge) on desktop and mobile (iOS, Android).
*   **NFR3:** **Responsiveness:** The game layout and controls must adapt gracefully to different screen sizes, supporting both desktop fullscreen and mobile aspect ratios (primarily landscape mode is recommended for gameplay).
*   **NFR4:** **Usability:** Controls must be intuitive and responsive for both keyboard and touch input. UI elements should be clear and readable.
*   **NFR5:** **Technology:** The game must be built using HTML5 (specifically the Canvas API for rendering), CSS3, and vanilla JavaScript (or minimal, dependency-free libraries if necessary).
*   **NFR6:** **Deployment:** The game must consist of static files (HTML, CSS, JS, assets) deployable directly to GitHub Pages.
*   **NFR7:** **Maintainability:** Code should be well-organized, commented, and follow reasonable coding standards.

## 3. Design

### 3.1. Architecture
A simple component-based or object-oriented approach will be used. Key components/classes include:
*   **`GameManager`:** Controls the main game loop, game states (Menu, Playing, Paused, GameOver), level progression, score tracking, lives, and difficulty settings. Initializes and manages other components.
*   **`Renderer`:** Responsible for drawing all game elements (ship, asteroids, bullets, UFOs, UI text) onto the HTML5 Canvas. Uses vector-style graphics (lines).
*   **`InputHandler`:** Captures and processes keyboard and touch inputs, translating them into game actions (rotate, thrust, fire, hyperspace, pause).
*   **`PhysicsEngine`:** Handles movement updates (position, velocity, rotation), screen wrapping, and collision detection between game objects.
*   **`AudioManager`:** Manages loading and playback of sound effects using the Web Audio API. Handles muting/unmuting.
*   **`Entity` (Base Class/Interface):** Represents a generic game object with properties like position, velocity, rotation, size, and methods like `update()` and `draw()`.
    *   **`PlayerShip` (extends `Entity`):** Represents the player's ship. Includes specific logic for thrust, firing, hyperspace, and handling damage.
    *   **`Asteroid` (extends `Entity`):** Represents an asteroid. Includes properties for size and logic for splitting upon destruction.
    *   **`Bullet` (extends `Entity`):** Represents a player projectile. Includes a limited lifetime.
    *   **`UFO` (extends `Entity`):** Represents an enemy UFO. Includes movement patterns and firing logic.
*   **`UI`:** Manages the display of score, lives, level, menus, game over screen, achievement notifications, and on-screen controls for mobile.
*   **`PersistenceManager`:** Handles saving and loading high scores and achievement status to/from `localStorage`.
*   **`AchievementManager`:** Tracks progress towards achievements and manages their unlocked status.

### 3.2. Technology Stack
*   **HTML5:** Structure (index.html), Canvas element (`<canvas>`).
*   **CSS3:** Styling UI elements, layout, potentially simple animations for menus/buttons.
*   **JavaScript (ES6+):** Core game logic, rendering, input handling, physics, audio. Vanilla JS preferred for simplicity and GitHub Pages compatibility.
*   **Web Audio API:** For sound effect playback.
*   **Browser `localStorage` API:** For persisting high scores and achievements.

### 3.3. Game Elements Design

*   **Player Ship:**
    *   Visuals: Simple triangle shape. Thrust animation (flame at the back). Explosion animation (particle effect).
    *   Physics: Velocity increases with thrust. Optional small constant drag/friction. Max speed limit.
    *   Controls: Smooth rotation. Responsive firing. Hyperspace with visual/audio cue and slight delay/risk.
*   **Asteroids:**
    *   Visuals: Irregular polygons (e.g., 8-12 vertices with random offsets). Different base sizes for Large, Medium, Small. Rotation effect. Explosion animation (break into pieces).
    *   Physics: Spawn outside screen edges with random vectors pointing generally towards the screen center. Constant velocity and rotation speed.
    *   Splitting: Large -> 2 Medium. Medium -> 2 Small. Positions and velocities of new asteroids based on parent.
*   **Bullets:**
    *   Visuals: Small dots or short lines.
    *   Physics: Constant velocity, higher than ship/asteroids. Removed after a fixed time or distance traveled.
*   **UFOs (Optional but Recommended):**
    *   Visuals: Classic saucer shape. Maybe two sizes (Large: slower, less accurate shots; Small: faster, more accurate shots). Explosion animation.
    *   Behavior: Appear at random screen edges. Move typically horizontally across the screen (maybe occasional diagonal or zig-zag for small UFO). Firing logic based on difficulty and type (e.g., fire when player aligns horizontally/vertically).
*   **Screen:** Black background. Game elements drawn with white or single-color lines for a vector look.

### 3.4. Gameplay Mechanics

*   **Game Loop:** Standard `requestAnimationFrame` loop: Handle Input -> Update Game State (Physics, Logic) -> Render Frame.
*   **Collision Detection:** Simple Radius-based collision detection for ship, asteroids, UFOs, and bullets is likely sufficient and performant. Check pairs: Ship-Asteroid, Ship-UFO, Ship-UFO-Bullet, PlayerBullet-Asteroid, PlayerBullet-UFO.
*   **Spawning:** Player ship spawns in the center, initially stationary and invincible for a short period (e.g., 2-3 seconds, visually indicated). Asteroids spawn off-screen. UFOs spawn off-screen at intervals.
*   **Level Progression:** Increase number of initial asteroids, average asteroid speed, and potentially UFO frequency/aggression with each new level.

### 3.5. User Interface (UI) / User Experience (UX)

*   **Layout:** Canvas takes up the main view. Score/Lives/Level displayed unobtrusively (e.g., top corners).
*   **Desktop Controls:** Keyboard (Arrows/WASD, Space, H/Shift, P/Esc). Clear mapping.
*   **Mobile Controls:** On-screen buttons positioned accessibly (e.g., bottom corners). Buttons for Rotate L/R, Thrust, Fire, Hyperspace. Buttons should provide visual feedback on press. Landscape orientation enforced or strongly recommended.
*   **Menus:** Simple, clear screens for Start, Game Over, High Scores, Achievements. Easy navigation.
*   **Feedback:** Visual cues for thrust, firing, explosions, invincibility, hyperspace. Audio cues for major events. Achievement pop-ups.

### 3.6. Sound Design
*   Acquire or generate short, distinct sound effects (.wav or .mp3 format) for all events listed in FR38.
*   Use Web Audio API for low-latency playback. Implement a simple sound manager to load and trigger sounds.
*   Ensure sound toggle works instantly.

### 3.7. Scoring System
*   Large Asteroid: 20 points
*   Medium Asteroid: 50 points
*   Small Asteroid: 100 points
*   Large UFO: 200 points
*   Small UFO: 1000 points
*   Extra Life: Every 10,000 points (configurable).

### 3.8. Achievement System
*   **Data Structure:** Store achievement definitions (ID, name, description, unlock condition) and player status (unlocked: true/false) in JS objects.
*   **Tracking:** Check conditions during gameplay (e.g., after destroying an asteroid, update counter; after scoring points, check score threshold).
*   **Persistence:** Save the set of unlocked achievement IDs to `localStorage`.
*   **Example Achievements:**
    *   `ROCK_BREAKER_1`: Destroy 50 asteroids total.
    *   `SURVIVOR_3`: Reach Level 3.
    *   `SHARPSHOOTER`: Destroy a Small UFO.
    *   `HIGH_SCORE_10K`: Achieve a score of 10,000.
    *   `HYPERSPACE_JUNKIE`: Use Hyperspace 10 times without dying immediately after.
    *   `CLEAN_SWEEP`: Clear a level without losing a life.

### 3.9. Difficulty System
*   Store difficulty parameters (e.g., `startAsteroids`, `maxAsteroidSpeed`, `ufoFrequency`, `ufoAccuracy`, `startLives`) in configuration objects for Easy, Medium, Hard.
*   `GameManager` loads the appropriate configuration based on user selection.
*   Level scaling factors might also differ per difficulty.

### 3.10. Data Persistence
*   Use `localStorage.setItem(key, JSON.stringify(value))` to save high scores (an array of `{name: 'XXX', score: YYY}` objects, sorted) and unlocked achievements (an array or set of achievement IDs).
*   Use `JSON.parse(localStorage.getItem(key))` to load data on game start. Handle cases where no data exists yet (first time playing).
*   Provide simple input for high score name entry (if implemented). Limit name length (e.g., 3 characters like classic arcades, or more).

### 3.11. Deployment
*   Organize code into logical folders (e.g., `js/`, `css/`, `assets/audio/`, `assets/images/`).
*   Ensure `index.html` correctly links all CSS, JS, and loads assets.
*   Commit all files to a GitHub repository.
*   Enable GitHub Pages for the repository (typically from the `main` branch / `root` folder).

## 4. Future Enhancements (Optional)

*   Power-ups (e.g., shield, rapid fire, spread shot).
*   More enemy types with different behaviors.
*   Co-op or competitive multiplayer (would require significant backend changes, likely not suitable for GitHub Pages alone).
*   More sophisticated visual effects (particle systems, shaders if using WebGL instead of 2D Canvas).
*   Background music track(s).
*   Gamepad API support for controllers.
*   Online leaderboards (requires a backend service).
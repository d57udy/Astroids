# CLAUDE.md - AI Assistant Guide for Asteroids Game

This document provides comprehensive guidance for AI assistants (like Claude) working with this codebase. Last updated: 2025-11-20

## Table of Contents
- [Project Overview](#project-overview)
- [Codebase Structure](#codebase-structure)
- [Architecture & Design Patterns](#architecture--design-patterns)
- [Development Workflow](#development-workflow)
- [Key Conventions](#key-conventions)
- [Common Tasks](#common-tasks)
- [Testing & Debugging](#testing--debugging)
- [Deployment](#deployment)

---

## Project Overview

**Name**: Classic Asteroids Game
**Type**: Web-based arcade game
**Tech Stack**: HTML5, CSS3, Vanilla JavaScript (ES6+ modules)
**Deployment**: GitHub Pages
**Live URL**: https://d57udy.github.io/Astroids/

### Purpose
A faithful recreation of the classic Asteroids arcade game featuring:
- Classic arcade gameplay with ship, asteroids, and UFOs
- Multiple difficulty levels (Easy, Medium, Hard)
- User-specific high scores and achievements
- Keyboard and touch controls
- Sound effects and retro vector-style graphics

### Target Audience
Casual gamers, retro arcade fans, mobile and desktop web browsers

---

## Codebase Structure

### File Organization

```
/
├── index.html              # Entry point, canvas element, UI overlay
├── style.css               # All styling, UI overlay, touch controls
├── requirements.md         # Comprehensive design document and requirements
├── README.md              # User-facing documentation
├── CLAUDE.md              # This file - AI assistant guide
└── js/                    # All JavaScript modules
    ├── main.js            # Game manager, state machine, game loop
    ├── entity.js          # Base class for all game objects
    ├── player.js          # PlayerShip class (extends Entity)
    ├── asteroid.js        # Asteroid class (extends Entity)
    ├── bullet.js          # Bullet class (extends Entity)
    ├── ufo.js             # UFO enemy class (extends Entity)
    ├── input.js           # InputHandler - keyboard and touch
    ├── audio.js           # AudioManager - Web Audio API wrapper
    ├── persistence.js     # PersistenceManager - localStorage wrapper
    ├── achievementManager.js  # Achievement tracking and unlocking
    ├── achievements.js    # Achievement definitions (data)
    └── utils.js           # Utility functions (randomRange, etc.)
```

### Module Dependency Graph

```
main.js (entry point)
├── player.js → entity.js, utils.js, bullet.js
├── asteroid.js → entity.js, utils.js
├── bullet.js → entity.js
├── ufo.js → entity.js, utils.js, bullet.js
├── input.js (standalone)
├── audio.js (standalone)
├── persistence.js (standalone)
├── achievementManager.js → achievements.js
└── utils.js (standalone)
```

---

## Architecture & Design Patterns

### 1. Object-Oriented Entity System

**Base Class**: `Entity` (`js/entity.js`)
- Properties: `x, y, velX, velY, rotation, radius, isAlive`
- Methods: `update()`, `draw()`, `collidesWith()`, `destroy()`

**Derived Classes**:
- `PlayerShip` - Player-controlled spaceship
- `Asteroid` - Space rocks in 3 sizes (LARGE, MEDIUM, SMALL)
- `Bullet` - Projectiles (player and UFO bullets)
- `UFO` - Enemy spacecraft

**Key Pattern**: Inheritance with method overriding
- Each subclass overrides `draw()` for custom rendering
- Each subclass may override `update()` for custom behavior
- Each subclass may override `destroy()` for custom effects

### 2. Game State Machine

**States** (defined in `main.js`):
```javascript
GameState = {
    PROMPT_USER: 'prompt_user',      // Username entry
    MENU: 'menu',                    // Main menu
    PLAYING: 'playing',              // Active gameplay
    PAUSED: 'paused',                // Game paused
    HIGH_SCORES: 'high_scores',      // Score display
    ACHIEVEMENTS: 'achievements',     // Achievement display
    HELP: 'help',                    // Controls help
    GAME_OVER: 'game_over'           // Game over screen
}
```

**State Management**:
- Current state tracked in `currentGameState` variable
- `handleInput()` uses switch statement for state-specific input
- `renderGame()` uses switch statement for state-specific rendering
- State transitions triggered by user input or game events

### 3. Component-Based Managers

**Separation of Concerns**:
- `InputHandler` - All keyboard/touch input mapping
- `AudioManager` - Sound effect loading and playback
- `PersistenceManager` - localStorage operations
- `AchievementManager` - Achievement tracking and unlocking

**Benefit**: Encapsulation, testability, maintainability

### 4. Delta-Time Based Physics

**Game Loop** (`main.js:gameLoop()`):
```javascript
const rawDeltaTime = (timestamp - lastTime) / 1000;
const deltaTime = Math.min(rawDeltaTime, 1 / 20); // Cap at 50ms
```

**Critical**: All movement, timers, and physics use `deltaTime`
- Ensures consistent behavior across different frame rates
- Cap prevents spiral of death on lag spikes

### 5. User-Specific Data Model

**Storage Pattern**:
- Each user has separate high scores and achievements
- Key format: `asteroids_highScores_USERNAME`, `asteroids_achievements_USERNAME`
- Current user stored in: `asteroids_currentUser`
- User list maintained in: `asteroids_userList`

**Data Flow**:
1. User enters username → `loadUserData(username)`
2. Load user-specific scores/achievements from localStorage
3. During gameplay, track progress per user
4. Save back to user-specific keys on game over/achievement unlock

---

## Development Workflow

### Local Development Setup

**Requirements**:
- Python 3 (or any local web server)
- Modern web browser (Chrome, Firefox, Safari, Edge)

**Steps**:
1. Clone repository
2. Navigate to project directory
3. Start local server:
   ```bash
   python -m http.server 8000
   ```
4. Open browser to `http://localhost:8000`

**Why Local Server?**: ES6 modules require HTTP/HTTPS protocol (file:// won't work due to CORS)

### Running the Game

**Desktop Controls**:
- Arrow Keys / WASD: Rotate and thrust
- Spacebar: Fire bullets
- H: Hyperspace (risky teleport)
- P / Escape: Pause
- M: Toggle mute

**Mobile Controls**:
- Touch buttons appear on screen < 768px width
- Auto-hidden on larger screens via CSS media query

### File Modification Guidelines

**When editing game logic**:
1. Always consider delta-time scaling for any time-based operations
2. Update both `update()` and `draw()` methods if changing entity behavior
3. Call `audioManager.play()` for new sound effects
4. Update `achievementManager` tracking if adding new player actions

**When adding new game states**:
1. Add to `GameState` enum
2. Add case in `handleInput()` switch
3. Add case in `renderGame()` switch
4. Update state transition logic

**When modifying persistence**:
1. Use `PersistenceManager` methods, never direct localStorage calls
2. Always include username context
3. Handle missing data gracefully (return defaults)

---

## Key Conventions

### Code Style

**Naming Conventions**:
- Classes: PascalCase (`PlayerShip`, `AudioManager`)
- Functions: camelCase (`updateGame`, `checkCollisions`)
- Constants: UPPER_SNAKE_CASE (`MAX_HIGH_SCORES`, `SHIP_THRUST`)
- Files: camelCase (`achievementManager.js`)

**Module Pattern**:
```javascript
// Export classes/functions
export class MyClass { }
export function myFunction() { }

// Import in other files
import { MyClass, myFunction } from './myFile.js';
```

**Note**: Always include `.js` extension in imports (required for browser modules)

### Physics and Math

**Coordinate System**:
- Origin (0,0) is top-left of canvas
- Positive X is right, positive Y is down
- Rotation: 0 radians points right, increases clockwise

**Screen Wrapping** (`utils.js:wrapAroundEdges()`):
- Objects exiting one edge reappear on opposite edge
- Applied in `Entity.update()`

**Collision Detection**:
- Simple radius-based circle collision
- `Entity.collidesWith(otherEntity)` method
- Collision checks in `main.js:checkCollisions()`

### Game Mechanics Constants

Located in `main.js`:
```javascript
MAX_HIGH_SCORES = 10
STARTING_LIVES = 3
STARTING_ASTEROIDS = 4
RESPAWN_DELAY = 2           // seconds
SAFE_SPAWN_RADIUS = 150     // pixels
UFO_SPAWN_BASE_INTERVAL = 15 // seconds
EXTRA_LIFE_SCORE = 10000
```

Located in `player.js`:
```javascript
SHIP_THRUST = 5
SHIP_FRICTION = 0.995
SHIP_TURN_SPEED = 360        // degrees/sec
SHIP_INVULNERABILITY_DURATION = 3  // seconds
```

**Important**: Difficulty settings override some constants (see `Difficulty` object)

### Difficulty System

**Structure** (in `main.js`):
```javascript
Difficulty.EASY = {
    id: 'easy',
    name: 'Easy',
    startingAsteroids: 3,
    asteroidSpeedMultiplier: 0.8,
    ufoSpawnMultiplier: 1.5,
    ufoAccuracy: 0.6,
    startingLives: 4,
    scoreMultiplier: 0.75
}
```

**Usage**:
- Selected in menu, stored in `selectedDifficulty`
- Applied in `startGame()`, asteroid creation, score calculation, UFO behavior

### Audio System

**Sound Files**: Located in `js/audio.js` as data URIs or external files

**Usage Pattern**:
```javascript
// One-shot sounds
audioManager.play('playerShoot');

// Looping sounds
audioManager.startThrustSound();
audioManager.stopThrustSound();

// Mute toggle
audioManager.toggleMute();
```

**Critical**: Web Audio API requires user interaction before playing sounds
- Handled in `main.js` with click/keydown listeners
- Calls `audioManager.resumeContext()`

### Achievement System

**Definition Structure** (`achievements.js`):
```javascript
export const Achievements = {
    ROCK_BREAKER_1: {
        id: 'rock_breaker_1',
        name: 'Rock Breaker',
        description: 'Destroy 50 asteroids',
        condition: {
            type: 'stat',
            stat: 'asteroidsDestroyed',
            value: 50
        }
    }
}
```

**Condition Types**:
- `score`: Based on player score
- `level`: Based on level reached
- `stat`: Based on session stats (asteroidsDestroyed, ufosDestroyed)

**Tracking**:
```javascript
// In main.js collision handler
achievementManager.trackAsteroidDestroyed();
achievementManager.trackUfoDestroyed();

// Periodic check
achievementManager.checkUnlockConditions({ score, level, user });
```

---

## Common Tasks

### Adding a New Entity Type

1. Create new file in `js/` (e.g., `powerup.js`)
2. Import `Entity` and extend it:
   ```javascript
   import { Entity } from './entity.js';
   export class Powerup extends Entity {
       constructor(x, y) {
           super(x, y, radius);
       }
       update(deltaTime, canvasWidth, canvasHeight) {
           super.update(deltaTime, canvasWidth, canvasHeight);
           // Custom logic
       }
       draw(ctx) {
           // Custom rendering
       }
   }
   ```
3. Import in `main.js`
4. Add array to track instances: `let powerups = [];`
5. Add update loop in `updateGame()`
6. Add draw loop in `renderGame()` PLAYING case
7. Add collision checks in `checkCollisions()`

### Adding a New Sound Effect

1. Add sound definition in `audio.js:AudioManager` constructor
2. Load sound file or data URI
3. Play in appropriate location:
   ```javascript
   if (audioManager) audioManager.play('newSound');
   ```

### Adding a New Achievement

1. Add definition to `achievements.js:Achievements` object
2. If new stat needed, add to `achievementManager.js:sessionStats`
3. Add tracking calls in `main.js` where event occurs
4. Achievement auto-checks on `checkUnlockConditions()`

### Adding a New Difficulty Level

1. Add to `Difficulty` object in `main.js`
2. Add menu option rendering (auto-added via `Object.values(Difficulty)`)
3. Test all parameters scale correctly

### Modifying Game States

**Example**: Adding a "Settings" screen

1. Add to GameState enum:
   ```javascript
   const GameState = {
       // ...
       SETTINGS: 'settings'
   }
   ```

2. Add menu option to navigate to it (in `handleInput` MENU case)

3. Add input handling:
   ```javascript
   case GameState.SETTINGS:
       if (inputHandler.consumeAction('escape')) {
           currentGameState = GameState.MENU;
       }
       // Handle settings input
       break;
   ```

4. Add rendering:
   ```javascript
   case GameState.SETTINGS:
       drawSettingsScreen();
       break;
   ```

---

## Testing & Debugging

### Browser Console Logging

The codebase includes extensive `console.log` statements:
- State transitions
- User data loading
- Collision events
- Achievement unlocks
- Input events (especially fire button - see `player.js:60`)

**Tip**: Keep browser console open during testing

### Common Issues

**1. Game doesn't start**
- Check browser console for module loading errors
- Verify running on local server (not file://)
- Check all imports have `.js` extension

**2. Sounds don't play**
- Ensure user interaction occurred (click/key press)
- Check browser console for Audio API errors
- Verify `audioManager.resumeContext()` was called

**3. High scores not saving**
- Check localStorage is enabled in browser
- Verify username is set (not null)
- Check browser console for persistence errors

**4. Input not responding**
- Check `currentGameState` matches expected state
- Verify `inputHandler.consumeAction()` is being called
- Check for event listener conflicts

**5. Physics feels wrong**
- Verify `deltaTime` is being passed correctly
- Check for missing `* deltaTime` multiplications
- Verify constants are reasonable values

### Performance Testing

**Target**: 60 FPS (16.67ms per frame)

**Monitor**:
- Browser DevTools Performance tab
- `requestAnimationFrame` callback time
- Canvas draw calls

**Optimization Areas**:
- Limit active entities (asteroids, bullets, UFOs)
- Use object pooling if entity creation/destruction is frequent
- Minimize canvas state changes (strokeStyle, fillStyle, etc.)

---

## Deployment

### GitHub Pages Configuration

**Current Setup**:
- Repository: `d57udy/Astroids`
- Branch: Main (inferred from git log)
- Folder: Root
- URL: https://d57udy.github.io/Astroids/

**Deployment Process**:
1. Commit changes to main branch
2. Push to GitHub
3. GitHub Pages auto-deploys (usually within 1-2 minutes)
4. Test at live URL

**Important Files for Deployment**:
- `index.html` must be in root
- All paths must be relative
- No server-side code (static files only)
- No build process required (vanilla JS)

### Git Workflow

**Current Branch**: `claude/claude-md-mi6ywgiyjx63qyhg-01U4vGABHbPTxknN2J52wv67`

**Important**:
- Develop on designated Claude branches
- Commit with clear, descriptive messages
- Push to remote: `git push -u origin <branch-name>`
- Branch must start with `claude/` and match session ID

**Recent Commits** (as of analysis):
```
cc6db71 fixing the current user bug
93e4e53 Added README
b802b1d V1 complete with sounds
59d9f23 Fixed user name display
55bd149 User name fixed
```

**Commit Message Style**: Concise, imperative mood, specific feature/fix

---

## AI Assistant Best Practices

### When Analyzing This Codebase

1. **Always check `main.js` first** - It's the central hub
2. **Follow the Entity hierarchy** - Most game objects extend Entity
3. **Understand state flow** - Game behavior is state-dependent
4. **Check `requirements.md`** - Comprehensive design document
5. **Respect user-specific data model** - Always include username context

### When Making Changes

1. **Test locally** before suggesting deployment
2. **Maintain delta-time scaling** for all time-based operations
3. **Update related files** (if changing entity, update collision checks)
4. **Preserve existing patterns** (module structure, naming conventions)
5. **Consider mobile** (touch controls, screen size)
6. **Handle edge cases** (no username, no localStorage, audio blocked)

### When Adding Features

1. **Check `requirements.md`** for alignment with original design
2. **Follow existing architecture** (managers, entities, state machine)
3. **Add appropriate logging** for debugging
4. **Update this CLAUDE.md** if adding new patterns
5. **Test on multiple browsers** (Chrome, Firefox, Safari)

### When Debugging

1. **Check browser console** for errors and logs
2. **Verify game state** matches expected state
3. **Check localStorage** in DevTools Application tab
4. **Monitor deltaTime** for physics issues
5. **Use breakpoints** in browser DevTools

### Communication Style

When explaining code changes to users:
- Reference specific files and line numbers: `main.js:712`
- Explain the "why" not just the "what"
- Mention related files that may be affected
- Warn about potential breaking changes
- Suggest testing steps

---

## Quick Reference

### Essential Files for Common Tasks

| Task | Files to Check |
|------|----------------|
| Gameplay mechanics | `main.js`, `player.js`, entity files |
| Input controls | `input.js`, `main.js:handleInput()` |
| Graphics/rendering | Entity `draw()` methods, `style.css` |
| Sound effects | `audio.js`, `main.js` |
| High scores | `persistence.js`, `main.js` |
| Achievements | `achievementManager.js`, `achievements.js` |
| UI/Menus | `main.js:renderGame()`, `style.css` |
| Difficulty | `main.js:Difficulty`, spawn/scoring logic |

### Key Functions in main.js

| Function | Purpose |
|----------|---------|
| `gameLoop()` | Main update and render loop |
| `handleInput()` | State-specific input handling |
| `updateGame()` | Game logic update (PLAYING state) |
| `renderGame()` | State-specific rendering |
| `startGame()` | Initialize new game session |
| `checkCollisions()` | Collision detection and response |
| `levelUp()` | Progress to next level |
| `gameOver()` | End game, save scores |
| `loadUserData()` | Load user-specific data |

### Important Constants Locations

- Game rules: `main.js` (top-level constants)
- Ship physics: `player.js` (top-level constants)
- Asteroid properties: `asteroid.js` (`Asteroid.Sizes`)
- Bullet properties: `bullet.js` (static properties)
- Achievement definitions: `achievements.js`

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-11-20 | Initial CLAUDE.md creation based on codebase analysis |

---

## Additional Resources

- **Live Game**: https://d57udy.github.io/Astroids/
- **Design Doc**: `requirements.md` - Comprehensive requirements and architecture
- **User Guide**: `README.md` - Player-facing documentation

---

**Last Updated**: 2025-11-20
**Codebase Version**: V1 complete with sounds (commit b802b1d)
**Maintained by**: AI assistants working with this repository

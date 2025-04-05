export class InputHandler {
    constructor() {
        this.keys = {}; // Stores state for continuous actions (thrust, rotate)
        this.singlePressActions = {}; // Stores state for consumable actions (fire, hyper, menu nav)
        this.keyProcessed = {}; // Prevents keyboard auto-repeat for single press
        this.activeTouches = {}; // Tracks active touches on buttons

        // Keyboard handlers
        this._keydownHandler = (e) => this.handleKeyEvent(e, true);
        this._keyupHandler = (e) => this.handleKeyEvent(e, false);
        window.addEventListener('keydown', this._keydownHandler);
        window.addEventListener('keyup', this._keyupHandler);

        // Touch handlers
        this._touchStartHandler = (e) => this.handleTouchEvent(e, true);
        this._touchEndHandler = (e) => this.handleTouchEvent(e, false);
        this._touchCancelHandler = (e) => this.handleTouchEvent(e, false);

        // Define key mappings (Action Name -> Keys)
        this.keyToAction = {
            thrust: ['ArrowUp', 'w', 'W'],
            rotateLeft: ['ArrowLeft', 'a', 'A'],
            rotateRight: ['ArrowRight', 'd', 'D'],
            fire: [' ', 'Space'], // Space bar
            hyperspace: ['h', 'H'],
            pause: ['p', 'P'],
            enter: ['Enter'],
            escape: ['Escape'],
            toggleMute: ['m', 'M'],
            // Menu-specific actions (can overlap with game actions)
            menuUp: ['ArrowUp', 'w', 'W'],
            menuDown: ['ArrowDown', 's', 'S'],
            menuSelect: ['Enter', ' ', 'Space']
        };

        // Reverse map for quick lookup (Key -> Action Name)
        this.actionForKey = {};
        for (const action in this.keyToAction) {
            this.keyToAction[action].forEach(key => {
                // Keys might map to multiple actions (e.g., ArrowUp -> thrust, menuUp)
                if (!this.actionForKey[key]) this.actionForKey[key] = [];
                this.actionForKey[key].push(action);
            });
        }

        // Define which actions are treated as single-press / consumable
        this.singlePressActionNames = new Set([
            'hyperspace', 'pause', 'enter', 'escape', 'toggleMute',
            'menuUp', 'menuDown', 'menuSelect'
        ]);

        // Map touch button IDs to actions
        this.touchMap = {
            'touch-left-btn': 'rotateLeft',
            'touch-right-btn': 'rotateRight',
            'touch-thrust-btn': 'thrust',
            'touch-fire-btn': 'fire',
            'touch-hyper-btn': 'hyperspace'
        };

        // Initialize state for all *possible* actions
        Object.keys(this.keyToAction).forEach(action => {
            this.keys[action] = false;
            this.singlePressActions[action] = false;
        });
        Object.values(this.touchMap).forEach(action => {
            if(action && this.keys[action] === undefined) this.keys[action] = false;
            if(action && this.singlePressActions[action] === undefined) this.singlePressActions[action] = false;
        });

        this.setupTouchListeners();
    }

    setupTouchListeners() {
        Object.keys(this.touchMap).forEach(buttonId => {
            const button = document.getElementById(buttonId);
            if (button) {
                button.addEventListener('touchstart', this._touchStartHandler, { passive: false });
                button.addEventListener('touchend', this._touchEndHandler, { passive: false });
                button.addEventListener('touchcancel', this._touchCancelHandler, { passive: false });
            }
        });
    }

    handleKeyEvent(event, isPressed) {
        const key = event.key;
        const actions = this.actionForKey[key]; // Get all actions for this key

        if (actions) {
            // Prevent default for specific keys/actions
            const shouldPreventDefault = actions.some(action =>
                ['thrust', 'rotateLeft', 'rotateRight', 'fire', 'hyperspace', 'enter', 'menuUp', 'menuDown'].includes(action)
            );
            if (shouldPreventDefault) {
                event.preventDefault();
            }

            actions.forEach(action => {
                if (this.singlePressActionNames.has(action)) {
                    // Handle single-press actions
                    if (isPressed && !this.keyProcessed[action]) {
                        console.log(`[InputHandler] Setting singlePressAction: ${action}`);
                        this.singlePressActions[action] = true;
                        this.keyProcessed[action] = true;
                    }
                    if (!isPressed) {
                        this.keyProcessed[action] = false;
                        // Optional: Reset singlePressActions on key up? Usually consumed.
                        // this.singlePressActions[action] = false;
                    }
                } else {
                    // Handle continuous actions
                    this.keys[action] = isPressed;
                }
            });
        }
    }

    handleTouchEvent(event, isPressed) {
        event.preventDefault();
        const targetId = event.currentTarget.id;
        const action = this.touchMap[targetId];

        if (!action) return;

        if (isPressed) {
            for (let i = 0; i < event.changedTouches.length; i++) {
                const touchId = event.changedTouches[i].identifier;
                this.activeTouches[touchId] = action;
            }
            // Set continuous state
            this.keys[action] = true;
            // Trigger single press immediately
            if (this.singlePressActionNames.has(action)) {
                 this.singlePressActions[action] = true;
            }
        } else {
            let stillPressed = false;
            for (let i = 0; i < event.changedTouches.length; i++) {
                const touchId = event.changedTouches[i].identifier;
                if (this.activeTouches[touchId] === action) {
                    delete this.activeTouches[touchId];
                }
            }
            for (const touchId in this.activeTouches) {
                if (this.activeTouches[touchId] === action) {
                    stillPressed = true;
                    break;
                }
            }
            if (!stillPressed) {
                // Unset continuous state
                this.keys[action] = false;
                // Reset single press state on touch end (it gets consumed anyway)
                if (this.singlePressActionNames.has(action)) {
                    this.singlePressActions[action] = false;
                }
            }
        }
    }

    // Check continuous state
    isPressed(action) {
        return this.keys[action] || false;
    }

    // Check and consume single-press state
    consumeAction(action) {
        if (this.singlePressActions[action]) {
            this.singlePressActions[action] = false; // Consume
            return true;
        }
        return false;
    }

    destroy() {
        window.removeEventListener('keydown', this._keydownHandler);
        window.removeEventListener('keyup', this._keyupHandler);
        Object.keys(this.touchMap).forEach(buttonId => {
            const button = document.getElementById(buttonId);
            if (button) {
                button.removeEventListener('touchstart', this._touchStartHandler);
                button.removeEventListener('touchend', this._touchEndHandler);
                button.removeEventListener('touchcancel', this._touchCancelHandler);
            }
        });
        console.log("Input listeners removed.");
    }
} 
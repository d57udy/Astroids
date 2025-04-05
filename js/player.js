import { Entity } from './entity.js';
import { degToRad, randomRange } from './utils.js';
import { Bullet } from './bullet.js'; // Will create this file next

// Constants for the ship
const SHIP_THRUST = 5; // Acceleration per frame when thrusting
const SHIP_FRICTION = 0.99; // Slowdown factor (closer to 1 = less friction)
const SHIP_TURN_SPEED = 360; // Degrees per second
const SHIP_INVULNERABILITY_DURATION = 3; // Seconds
const SHIP_BLINK_INTERVAL = 0.2; // Seconds per blink
const HYPERSPACE_COOLDOWN = 5; // Seconds before hyperspace can be used again
const HYPERSPACE_SELF_DESTRUCT_CHANCE = 0.1; // 10% chance of dying on jump

export class PlayerShip extends Entity {
    constructor(x, y) {
        super(x, y, 15); // Set radius for collision
        this.rotation = degToRad(-90); // Start facing upwards
        this.isThrusting = false;
        this.thrustForce = { x: 0, y: 0 };
        this.canShoot = true;
        this.shootCooldown = 0.25; // Seconds between shots
        this.shootTimer = 0;
        this.isInvulnerable = false;
        this.invulnerabilityTimer = 0;
        this.blinkOn = true;
        this.blinkTimer = 0;
        this.canHyperspace = true;
        this.hyperspaceCooldownTimer = 0;

        // Make invulnerable on creation (spawn protection)
        this.makeInvulnerable(SHIP_INVULNERABILITY_DURATION);
    }

    makeInvulnerable(duration = SHIP_INVULNERABILITY_DURATION) {
        this.isInvulnerable = true;
        this.invulnerabilityTimer = duration;
        this.blinkTimer = SHIP_BLINK_INTERVAL;
        this.blinkOn = true;
    }

    rotate(direction, deltaTime) {
        // direction should be -1 (left) or 1 (right)
        this.rotation += degToRad(SHIP_TURN_SPEED) * direction * deltaTime;
    }

    thrust(deltaTime) {
        this.isThrusting = true;
        // Calculate thrust vector based on rotation
        this.thrustForce.x = Math.cos(this.rotation) * SHIP_THRUST;
        this.thrustForce.y = Math.sin(this.rotation) * SHIP_THRUST;

        // Apply thrust to velocity (scaled by delta time for consistency)
        // Note: Multiplying force by deltaTime^2 isn't quite right for acceleration,
        // a simpler approach is vel += acceleration * dt
        this.velX += this.thrustForce.x * deltaTime * 60; // Adjust multiplier as needed
        this.velY += this.thrustForce.y * deltaTime * 60;
    }

    fire(bullets, audioManager) {
        if (this.canShoot && this.shootTimer <= 0) {
            const bulletVelX = Math.cos(this.rotation) * Bullet.PLAYER_SPEED;
            const bulletVelY = Math.sin(this.rotation) * Bullet.PLAYER_SPEED;

            // Spawn bullet slightly ahead of the ship's nose
            const noseX = this.x + Math.cos(this.rotation) * (this.radius);
            const noseY = this.y + Math.sin(this.rotation) * (this.radius);

            bullets.push(new Bullet(noseX, noseY, bulletVelX, bulletVelY, true));
            this.shootTimer = this.shootCooldown;

            // Play shoot sound
            if (audioManager) {
                audioManager.play('playerShoot');
            }
        }
    }

    hyperspace(canvasWidth, canvasHeight, asteroids, ufos, audioManager) {
        if (!this.canHyperspace || this.hyperspaceCooldownTimer > 0) {
            console.log("Hyperspace not ready.");
            return false;
        }

        console.log("Attempting Hyperspace!");
        // Play hyperspace start sound (if available)
        // if (audioManager) audioManager.play('hyperspaceStart');

        // Check for self-destruction risk
        if (Math.random() < HYPERSPACE_SELF_DESTRUCT_CHANCE) {
            console.log("Hyperspace failed - Self-destruct!");
            // if (audioManager) audioManager.play('hyperspaceFail');
            this.destroy(audioManager, true); // Pass audioManager and force
            return false;
        }

        // Relocate to a random position
        this.x = randomRange(this.radius, canvasWidth - this.radius);
        this.y = randomRange(this.radius, canvasHeight - this.radius);

        // Stop movement
        this.velX = 0;
        this.velY = 0;

        // Check for immediate collision at new location (optional but recommended by FR19)
        // This makes hyperspace riskier as intended.
        let immediateCollision = false;
        for (const asteroid of asteroids) {
            if (asteroid.isAlive && this.collidesWith(asteroid)) {
                immediateCollision = true;
                break;
            }
        }
        if (!immediateCollision) {
            for (const ufo of ufos) {
                if (ufo.isAlive && this.collidesWith(ufo)) {
                    immediateCollision = true;
                    break;
                }
            }
        }

        if (immediateCollision) {
            console.log("Hyperspace failed - Materialized inside object!");
            // if (audioManager) audioManager.play('hyperspaceFail');
            this.destroy(audioManager, true); // Pass audioManager and force
             return false;
        }

        console.log(`Hyperspace successful to (${this.x.toFixed(0)}, ${this.y.toFixed(0)})`);
        // if (audioManager) audioManager.play('hyperspaceSuccess');

        // Start cooldown
        this.hyperspaceCooldownTimer = HYPERSPACE_COOLDOWN;
        this.canHyperspace = false;

        return true; // Indicate successful jump
    }

    update(deltaTime, canvasWidth, canvasHeight, audioManager) {
        // Update shoot timer
        if (this.shootTimer > 0) {
            this.shootTimer -= deltaTime;
        }

        // Update hyperspace cooldown timer
        if (this.hyperspaceCooldownTimer > 0) {
            this.hyperspaceCooldownTimer -= deltaTime;
            if (this.hyperspaceCooldownTimer <= 0) {
                this.canHyperspace = true;
                console.log("Hyperspace ready.");
            }
        }

        // Apply friction (inertia)
        this.velX *= SHIP_FRICTION;
        this.velY *= SHIP_FRICTION;

        // Reset thrusting flag (will be set by input handler if key is down)
        this.isThrusting = false;

        // Call parent update for movement and wrapping
        super.update(deltaTime, canvasWidth, canvasHeight);

        // Update invulnerability
        if (this.isInvulnerable) {
            this.invulnerabilityTimer -= deltaTime;
            this.blinkTimer -= deltaTime;
            if (this.blinkTimer <= 0) {
                this.blinkOn = !this.blinkOn;
                this.blinkTimer = SHIP_BLINK_INTERVAL;
            }
            if (this.invulnerabilityTimer <= 0) {
                this.isInvulnerable = false;
            }
        }
    }

    draw(ctx) {
        if (!this.isAlive) return;

        // Don't draw if blinking off during invulnerability
        if (this.isInvulnerable && !this.blinkOn) {
            return;
        }

        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1.5;
        ctx.beginPath();

        // Ship vertices relative to center (0,0) assuming radius is half-height
        const angle = this.rotation;
        const noseX = this.x + Math.cos(angle) * this.radius;
        const noseY = this.y + Math.sin(angle) * this.radius;
        const rearLeftX = this.x + Math.cos(angle + degToRad(140)) * this.radius;
        const rearLeftY = this.y + Math.sin(angle + degToRad(140)) * this.radius;
        const rearRightX = this.x + Math.cos(angle - degToRad(140)) * this.radius;
        const rearRightY = this.y + Math.sin(angle - degToRad(140)) * this.radius;

        // Draw triangle
        ctx.moveTo(noseX, noseY);
        ctx.lineTo(rearLeftX, rearLeftY);
        ctx.lineTo(rearRightX, rearRightY);
        ctx.closePath();
        ctx.stroke();

        // Draw thrust flame if thrusting
        if (this.isThrusting) {
            ctx.fillStyle = 'red';
            ctx.strokeStyle = 'orange';
            ctx.lineWidth = 1;
            ctx.beginPath();
            const flameTipX = this.x + Math.cos(angle + Math.PI) * (this.radius * 1.5); // Point backwards
            const flameTipY = this.y + Math.sin(angle + Math.PI) * (this.radius * 1.5);
            ctx.moveTo(flameTipX, flameTipY);
            // Base of flame is between the rear points
            ctx.lineTo((rearLeftX + rearRightX) / 2, (rearLeftY + rearRightY) / 2);
            // Add some randomness for flicker?
            // Draw slightly smaller points for the flame base sides
            const flameRearLeftX = this.x + Math.cos(angle + degToRad(160)) * this.radius * 0.8;
            const flameRearLeftY = this.y + Math.sin(angle + degToRad(160)) * this.radius * 0.8;
            const flameRearRightX = this.x + Math.cos(angle - degToRad(160)) * this.radius * 0.8;
            const flameRearRightY = this.y + Math.sin(angle - degToRad(160)) * this.radius * 0.8;
            ctx.lineTo(flameRearLeftX, flameRearLeftY);
            ctx.moveTo(flameTipX, flameTipY);
            ctx.lineTo(flameRearRightX, flameRearRightY);

            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }

        // Reset stroke style
        ctx.lineWidth = 1;
    }

    destroy(audioManager, force = false) {
        if (!force && this.isInvulnerable) return false;

        const wasAlive = this.isAlive; // Store current state
        const destroyed = super.destroy(); // Call base destroy first

        if (destroyed) { // Only play sound etc. if it was actually destroyed now
            // Play explosion sound
            if (audioManager) {
                audioManager.play('playerExplode');
            }
            console.log(`Player ship destroyed! ${force ? '(Forced)' : ''}`);
        }
        return destroyed; // Return whether destruction happened in this call
    }

    // Method to stop any sounds specific to this entity (if needed)
    stopSounds(audioManager) {
        // Currently thrust sound is managed in main.js based on isThrusting flag
        // If other player-specific loops were added, stop them here.
        // e.g., if (audioManager) audioManager.stop('somePlayerSound');
    }
} 
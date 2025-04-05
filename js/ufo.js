import { Entity } from './entity.js';
import { randomRange } from './utils.js';
import { Bullet } from './bullet.js'; // Need this now

const UFOSize = {
    // Define different sizes later if needed (e.g., Large vs Small)
    STANDARD: { radius: 15, speed: 100, score: 200, fireRate: 2, bulletSpeed: Bullet.UFO_SPEED } // Add bullet speed ref
};

// Remove global accuracy constant
// const UFO_ACCURACY = 0.8;

export class UFO extends Entity {
    constructor(canvasWidth, canvasHeight) {
        const size = UFOSize.STANDARD;
        // Spawn off-screen left or right
        const spawnLeft = Math.random() < 0.5;
        const x = spawnLeft ? -size.radius : canvasWidth + size.radius;
        const y = randomRange(size.radius, canvasHeight - size.radius);

        super(x, y, size.radius);

        this.sizeInfo = size;
        this.scoreValue = size.score;
        this.velX = spawnLeft ? size.speed : -size.speed;
        this.velY = 0; // Simple horizontal movement for now
        this.fireTimer = size.fireRate * randomRange(0.5, 1.5); // Start with variable delay

        console.log(`UFO spawned at (${x.toFixed(0)}, ${y.toFixed(0)}) moving ${spawnLeft ? 'right' : 'left'}`);
    }

    update(deltaTime, canvasWidth, canvasHeight, playerShip, bullets, audioManager, difficulty) {
        super.update(deltaTime, canvasWidth, canvasHeight); // Basic movement

        // Despawn if it goes fully off the other side
        if ((this.velX > 0 && this.x > canvasWidth + this.radius * 2) ||
            (this.velX < 0 && this.x < -this.radius * 2)) {
            console.log("UFO despawned off-screen");
            this.isAlive = false;
        }

        // Firing logic
        this.fireTimer -= deltaTime;
        if (this.fireTimer <= 0 && this.isAlive) {
            this.fire(playerShip, bullets, audioManager, difficulty); // Pass difficulty to fire
            this.fireTimer = this.sizeInfo.fireRate * randomRange(0.8, 1.2);
        }

        // UFO Hum is handled in main.js
    }

    fire(playerShip, bullets, audioManager, difficulty) {
        if (!playerShip || !playerShip.isAlive) return;

        console.log("UFO Firing!");

        // Use accuracy from difficulty settings
        const accuracy = difficulty ? difficulty.ufoAccuracy : 0.8; // Default if missing

        // Calculate base angle towards player
        const angleToPlayer = Math.atan2(playerShip.y - this.y, playerShip.x - this.x);

        // Add inaccuracy
        const angleOffset = (1 - accuracy) * Math.PI;
        const finalAngle = angleToPlayer + randomRange(-angleOffset, angleOffset);

        // Calculate velocity vector
        const bulletSpeed = this.sizeInfo.bulletSpeed;
        const bulletVelX = Math.cos(finalAngle) * bulletSpeed;
        const bulletVelY = Math.sin(finalAngle) * bulletSpeed;

        // Create the bullet (flagged as not a player bullet)
        bullets.push(new Bullet(this.x, this.y, bulletVelX, bulletVelY, false));

        // Play UFO fire sound
        if (audioManager) {
            audioManager.play('ufoShoot');
        }
    }

    draw(ctx) {
        if (!this.isAlive) return;

        ctx.strokeStyle = 'lime'; // Distinct color
        ctx.lineWidth = 1.5;
        ctx.beginPath();

        // Draw simple saucer shape
        const r = this.radius;
        ctx.moveTo(this.x - r, this.y);
        ctx.lineTo(this.x + r, this.y); // Base line

        ctx.moveTo(this.x - r * 0.7, this.y - r * 0.4);
        ctx.lineTo(this.x + r * 0.7, this.y - r * 0.4); // Upper deck base

        ctx.moveTo(this.x - r * 0.4, this.y - r * 0.8);
        ctx.lineTo(this.x + r * 0.4, this.y - r * 0.8); // Top dome base

        // Connect with arcs or lines for a saucer shape
        // Base ellipse
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, r, r * 0.3, 0, 0, Math.PI * 2);
        ctx.stroke();
        // Upper deck ellipse
        ctx.beginPath();
        ctx.ellipse(this.x, this.y - r * 0.4, r * 0.7, r * 0.2, 0, 0, Math.PI * 2);
        ctx.stroke();
        // Top dome
        ctx.beginPath();
        ctx.arc(this.x, this.y - r * 0.5, r * 0.4, Math.PI, 0); // Semicircle
        ctx.closePath();
        ctx.stroke();
    }

    destroy(audioManager) {
        const destroyed = super.destroy();
        if (destroyed) {
            console.log("UFO destroyed!");
            // Play explosion sound
            if (audioManager) {
                // Stop the hum sound if it was playing for *this* specific UFO? No, main handles it.
                audioManager.play('ufoExplode');
            }
        }
        return destroyed;
    }

    // Static properties for spawning logic
    static get SpawnChancePerSecond() {
        return 0.05; // e.g., 5% chance per second (adjust based on level/difficulty)
    }
    static get MaxActiveUFOs() {
        return 1; // Only allow one UFO at a time initially
    }
} 
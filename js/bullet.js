import { Entity } from './entity.js';

// Constants for the bullet
const PLAYER_BULLET_SPEED = 500;
const UFO_BULLET_SPEED = 350; // UFO bullets slightly slower?
const BULLET_LIFETIME = 1.2; // Slightly longer lifetime to cross screen?
const BULLET_RADIUS = 2;

export class Bullet extends Entity {
    constructor(x, y, velX, velY, isPlayerBullet = true) {
        super(x, y, BULLET_RADIUS);
        this.velX = velX;
        this.velY = velY;
        this.lifeTimer = BULLET_LIFETIME;
        this.isPlayerBullet = isPlayerBullet; // Flag to identify bullet source
    }

    // Expose speed constants if needed elsewhere
    static get PLAYER_SPEED() {
        return PLAYER_BULLET_SPEED;
    }
    static get UFO_SPEED() {
        return UFO_BULLET_SPEED;
    }

    update(deltaTime, canvasWidth, canvasHeight) {
        super.update(deltaTime, canvasWidth, canvasHeight); // Handles movement

        // Decrease lifetime
        this.lifeTimer -= deltaTime;
        if (this.lifeTimer <= 0) {
            this.isAlive = false;
        }

        // Bullets do not wrap around edges in classic Asteroids
        if (this.x < 0 || this.x > canvasWidth || this.y < 0 || this.y > canvasHeight) {
             this.isAlive = false;
        }
    }

    draw(ctx) {
        if (!this.isAlive) return;

        ctx.fillStyle = this.isPlayerBullet ? 'white' : 'lime'; // Different color for UFO bullets
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    // Override destroy - bullets just disappear
    destroy() {
        this.isAlive = false;
    }
} 
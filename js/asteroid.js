import { Entity } from './entity.js';
import { randomRange, degToRad } from './utils.js';

const AsteroidSize = {
    LARGE: { radius: 40, points: 10, speedMultiplier: 1, score: 20 },
    MEDIUM: { radius: 20, points: 8, speedMultiplier: 1.5, score: 50 },
    SMALL: { radius: 10, points: 6, speedMultiplier: 2, score: 100 },
};

const ASTEROID_BASE_SPEED = 30; // Base speed pixels per second
const ASTEROID_VERTICES_JAGGEDNESS = 0.4; // How irregular the shape is (0 = circle, 1 = very jagged)
const ASTEROID_ROTATION_SPEED_MAX = 90; // Max degrees per second rotation

export class Asteroid extends Entity {
    constructor(x, y, size = AsteroidSize.LARGE, initialVel = null, speedMultiplier = 1.0) {
        super(x, y, size.radius);
        this.sizeInfo = size;
        this.rotationSpeed = degToRad(randomRange(-ASTEROID_ROTATION_SPEED_MAX, ASTEROID_ROTATION_SPEED_MAX));
        this.scoreValue = size.score;

        // Generate random shape vertices
        this.shapeVertices = this.generateShape();

        // Set initial velocity if not provided
        if (initialVel) {
            this.velX = initialVel.x;
            this.velY = initialVel.y;
        } else {
            const angle = randomRange(0, Math.PI * 2);
            // Apply the base speed multiplier AND the size-specific multiplier
            const speed = ASTEROID_BASE_SPEED * speedMultiplier * this.sizeInfo.speedMultiplier;
            this.velX = Math.cos(angle) * speed;
            this.velY = Math.sin(angle) * speed;
        }
    }

    generateShape() {
        const vertices = [];
        const numVertices = this.sizeInfo.points;
        const angleStep = (Math.PI * 2) / numVertices;

        for (let i = 0; i < numVertices; i++) {
            const angle = i * angleStep;
            // Add randomness to the radius for jaggedness
            const radiusOffset = 1 - Math.random() * ASTEROID_VERTICES_JAGGEDNESS;
            const currentRadius = this.radius * radiusOffset;
            vertices.push({
                x: Math.cos(angle) * currentRadius,
                y: Math.sin(angle) * currentRadius,
            });
        }
        return vertices;
    }

    update(deltaTime, canvasWidth, canvasHeight, audioManager) {
        // Apply rotation
        this.rotation += this.rotationSpeed * deltaTime;

        // Call parent update for movement and wrapping
        super.update(deltaTime, canvasWidth, canvasHeight);
    }

    draw(ctx) {
        if (!this.isAlive) return;

        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1.5;
        ctx.beginPath();

        // Translate and rotate canvas context to draw the asteroid shape
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Draw the custom shape
        ctx.moveTo(this.shapeVertices[0].x, this.shapeVertices[0].y);
        for (let i = 1; i < this.shapeVertices.length; i++) {
            ctx.lineTo(this.shapeVertices[i].x, this.shapeVertices[i].y);
        }
        ctx.closePath();
        ctx.stroke();

        // Reset transformation
        ctx.rotate(-this.rotation);
        ctx.translate(-this.x, -this.y);

        // Optionally draw collision radius for debugging
        // super.draw(ctx); // Uncomment to see the red circle/line from Entity
    }

    split(newAsteroidsArray, audioManager) {
        if (!this.isAlive) return [];

        // Play explosion sound for the asteroid being split
        if (audioManager) {
            audioManager.playAsteroidExplosion(this.sizeInfo);
        }

        let children = [];
        let nextSize = null;

        if (this.sizeInfo === AsteroidSize.LARGE) {
            nextSize = AsteroidSize.MEDIUM;
        } else if (this.sizeInfo === AsteroidSize.MEDIUM) {
            nextSize = AsteroidSize.SMALL;
        }

        if (nextSize) {
            // Create two smaller asteroids
            for (let i = 0; i < 2; i++) {
                // Give them slightly divergent velocities based on original + a kick
                const angleKick = randomRange(-Math.PI / 4, Math.PI / 4);
                const speedKick = randomRange(1.1, 1.5);
                const newVel = {
                    x: (this.velX + Math.cos(angleKick) * 20) * speedKick,
                    y: (this.velY + Math.sin(angleKick) * 20) * speedKick
                };

                const child = new Asteroid(this.x, this.y, nextSize, newVel);
                children.push(child);
                newAsteroidsArray.push(child);
            }
        }
        // If size is SMALL, it just gets destroyed (no children)

        this.destroy(); // Mark the parent asteroid as not alive
        return children; // Return the newly created asteroids (if any)
    }

    destroy() {
        super.destroy();
        // Trigger explosion sound/effect here
    }

    // Expose sizes for use elsewhere (e.g., spawning)
    static get Sizes() {
        return AsteroidSize;
    }
} 
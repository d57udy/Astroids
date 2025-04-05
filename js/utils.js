/**
 * Wraps the position of an entity around the screen edges.
 * @param {object} entity - The entity object (must have x, y properties).
 * @param {number} canvasWidth - The width of the canvas.
 * @param {number} canvasHeight - The height of the canvas.
 */
export function wrapAroundEdges(entity, canvasWidth, canvasHeight) {
    if (entity.x < 0) {
        entity.x = canvasWidth;
    }
    if (entity.x > canvasWidth) {
        entity.x = 0;
    }
    if (entity.y < 0) {
        entity.y = canvasHeight;
    }
    if (entity.y > canvasHeight) {
        entity.y = 0;
    }
}

/**
 * Converts degrees to radians.
 * @param {number} degrees
 * @returns {number} radians
 */
export function degToRad(degrees) {
    return degrees * (Math.PI / 180);
}

/**
 * Generates a random number within a range.
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function randomRange(min, max) {
    return Math.random() * (max - min) + min;
} 
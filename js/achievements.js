// Define achievement data structure
// Conditions can be simple values or functions to check complex states
export const Achievements = {
    SCORE_10K: {
        id: 'SCORE_10K',
        name: 'Score Milestone I',
        description: 'Achieve a score of 10,000 points.',
        condition: { type: 'score', value: 10000 }
    },
    SCORE_50K: {
        id: 'SCORE_50K',
        name: 'Score Milestone II',
        description: 'Achieve a score of 50,000 points.',
        condition: { type: 'score', value: 50000 }
    },
    LEVEL_3: {
        id: 'LEVEL_3',
        name: 'Getting Started',
        description: 'Reach Level 3.',
        condition: { type: 'level', value: 3 }
    },
    LEVEL_10: {
        id: 'LEVEL_10',
        name: 'Veteran Pilot',
        description: 'Reach Level 10.',
        condition: { type: 'level', value: 10 }
    },
    ASTEROIDS_50: {
        id: 'ASTEROIDS_50',
        name: 'Rock Breaker',
        description: 'Destroy 50 total asteroids (any size).',
        // Condition type 'stat' would be checked against tracked stats
        condition: { type: 'stat', stat: 'asteroidsDestroyed', value: 50 }
    },
    ASTEROIDS_250: {
        id: 'ASTEROIDS_250',
        name: 'Pebble Pusher',
        description: 'Destroy 250 total asteroids (any size).',
        condition: { type: 'stat', stat: 'asteroidsDestroyed', value: 250 }
    },
    UFO_DESTROY_1: {
        id: 'UFO_DESTROY_1',
        name: 'Saucer Slayer',
        description: 'Destroy your first UFO.',
        condition: { type: 'stat', stat: 'ufosDestroyed', value: 1 }
    },
    UFO_DESTROY_10: {
        id: 'UFO_DESTROY_10',
        name: 'Alien Hunter',
        description: 'Destroy 10 UFOs.',
        condition: { type: 'stat', stat: 'ufosDestroyed', value: 10 }
    },
    // Example for a more complex one (maybe later)
    // CLEAN_SWEEP: {
    //     id: 'CLEAN_SWEEP',
    //     name: 'Clean Sweep',
    //     description: 'Clear a level without losing a life.',
    //     condition: { type: 'event', event: 'levelClearNoDeaths' }
    // },
    // HYPERSPACE_SURVIVOR: {
    //     id: 'HYPERSPACE_SURVIVOR',
    //     name: 'Hyperspace Survivor',
    //     description: 'Use Hyperspace 5 times without dying.',
    //     condition: { type: 'stat', stat: 'successfulHyperspaceJumps', value: 5 }
    // }
}; 
export class AudioManager {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.sounds = {}; // Store loaded audio buffers
        this.isMuted = false;
        this.masterGain = this.audioContext.createGain();
        this.masterGain.connect(this.audioContext.destination);

        // List of sound files to load (paths relative to index.html)
        // NOTE: Actual sound files need to be created/obtained and placed in assets/audio/
        this.soundFiles = {
            playerShoot: 'assets/audio/player_shoot.wav',
            playerThrust: 'assets/audio/player_thrust.wav', // Loop this one
            playerExplode: 'assets/audio/player_explode.wav',
            asteroidExplodeS: 'assets/audio/asteroid_explode_small.wav',
            asteroidExplodeM: 'assets/audio/asteroid_explode_medium.wav',
            asteroidExplodeL: 'assets/audio/asteroid_explode_large.wav',
            ufoHum: 'assets/audio/ufo_hum.wav', // Loop this one
            ufoShoot: 'assets/audio/ufo_shoot.wav',
            ufoExplode: 'assets/audio/ufo_explode.wav',
            // hyperspace: 'assets/audio/hyperspace.wav', // Add later
            // extraLife: 'assets/audio/extra_life.wav', // Add later
        };

        this.thrustSoundSource = null; // To control the looping thrust sound
        this.ufoHumSource = null; // To control the looping UFO hum

        this.loadSounds();
    }

    async loadSounds() {
        console.log("Loading sounds...");
        for (const key in this.soundFiles) {
            try {
                const response = await fetch(this.soundFiles[key]);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                this.sounds[key] = audioBuffer;
                console.log(`Loaded sound: ${key}`);
            } catch (error) {
                console.error(`Error loading sound ${key}:`, error);
                // You might want to handle this more gracefully, e.g., use a default sound or disable the sound.
                this.sounds[key] = null; // Mark as failed
            }
        }
        console.log("Sound loading complete.");
    }

    play(soundName, loop = false, volume = 1.0) {
        if (this.isMuted || !this.sounds[soundName] || this.audioContext.state === 'suspended') {
            return null;
        }

        const source = this.audioContext.createBufferSource();
        source.buffer = this.sounds[soundName];

        // Optional Gain node per sound for individual volume control
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = volume;

        source.connect(gainNode);
        gainNode.connect(this.masterGain);

        source.loop = loop;
        source.start(0);
        return source; // Return the source node for potential control (e.g., stopping loops)
    }

    // Specific function for looping thrust sound
    startThrustSound() {
        if (!this.thrustSoundSource && !this.isMuted && this.sounds.playerThrust) {
            this.thrustSoundSource = this.play('playerThrust', true, 0.5); // Lower volume for loop
        }
    }

    stopThrustSound() {
        if (this.thrustSoundSource) {
            this.thrustSoundSource.stop(0);
            this.thrustSoundSource = null;
        }
    }

    // Specific function for looping UFO hum
    startUfoHum() {
        if (!this.ufoHumSource && !this.isMuted && this.sounds.ufoHum) {
            this.ufoHumSource = this.play('ufoHum', true, 0.4); // Lower volume
        }
    }

    stopUfoHum() {
        if (this.ufoHumSource) {
            this.ufoHumSource.stop(0);
            this.ufoHumSource = null;
        }
    }

    // Specific function to play asteroid explosion based on size
    playAsteroidExplosion(sizeInfo) {
        let soundName = 'asteroidExplodeS'; // Default to small
        if (sizeInfo && sizeInfo.radius > 30) { // Approx Large size radius
            soundName = 'asteroidExplodeL';
        } else if (sizeInfo && sizeInfo.radius > 15) { // Approx Medium size radius
            soundName = 'asteroidExplodeM';
        }
        this.play(soundName);
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            this.masterGain.gain.setValueAtTime(0, this.audioContext.currentTime);
            // Stop any active loops immediately
            this.stopThrustSound();
            this.stopUfoHum();
        } else {
            this.masterGain.gain.setValueAtTime(1, this.audioContext.currentTime);
            // Loops will need to be restarted by the game logic if they should resume
        }
        console.log("Audio Muted:", this.isMuted);
        return this.isMuted;
    }

    // Resume audio context if suspended (e.g., by browser auto-play policy)
    resumeContext() {
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume().then(() => {
                console.log("AudioContext resumed successfully.");
            }).catch(e => console.error("Error resuming AudioContext:", e));
        }
    }
} 
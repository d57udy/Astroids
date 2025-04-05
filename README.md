# Classic Asteroids Game

A web-based implementation of the classic arcade game Asteroids, built with HTML, CSS, and vanilla JavaScript.

## Gameplay

Control a spaceship navigating a dangerous asteroid field. Your goal is to survive as long as possible by destroying asteroids and occasional enemy UFOs while avoiding collisions.

-   Rotate your ship left and right.
-   Thrust forward to move, but beware of inertia!
-   Fire bullets to destroy asteroids. Large asteroids break into medium ones, medium ones break into small ones, and small ones disintegrate.
-   Watch out for enemy UFOs that appear periodically and shoot back.
-   Use the risky Hyperspace jump to escape tight situations (but you might reappear in a worse spot or self-destruct!).
-   Clear levels by destroying all asteroids.
-   Earn points for destroying asteroids and UFOs, and gain extra lives.
-   Compete for high scores and unlock achievements!

## Features

*   Classic Asteroids gameplay loop.
*   Multiple difficulty levels (Easy, Medium, Hard).
*   Persistent high scores per user.
*   Achievement system.
*   Keyboard and Touch controls.
*   Sound effects (requires user interaction to enable).
*   Retro vector-style graphics using HTML Canvas.

## Play the Game

You can play the game directly in your browser here:

[https://d57udy.github.io/Astroids/](https://d57udy.github.io/Astroids/)

## Running Locally

1.  Clone or download the repository.
2.  Ensure you have Python installed.
3.  Navigate to the project directory in your terminal.
4.  Start a simple local web server: `python -m http.server`
5.  Open your browser and go to `http://localhost:8000`.

*(Note: Running directly from the `file://` protocol may cause issues with loading game modules due to browser security restrictions.)* 
# Multiplayer Snake Game

A simple 2D top-down multiplayer Snake game built with Node.js, WebSocket, and HTML5 Canvas.

## How to Play

1. Use the arrow keys or WASD to control your snake
2. Eat the red food to grow longer and earn points
3. Avoid hitting walls or yourself
4. Compete with other players in real-time!

## Running the Game Locally

1. Install dependencies:
   ```
   npm install
   ```

2. Start the server:
   ```
   npm start
   ```

3. Open your browser and go to `http://localhost:3000`

## Deploying to Replit

1. Create a new Repl
2. Choose "Import from GitHub" and use this repository
3. Run the Repl - it should automatically detect and run the server
4. Click "Open in New Tab" to play the game

## Deploying to Render

1. Fork this repository to your GitHub account
2. Create a new Web Service on Render
3. Connect it to your forked repository
4. Set the build command to `npm install`
5. Set the start command to `npm start`
6. Add an environment variable `NODE_VERSION` with value `18.17.1`

## Game Features

- Real-time multiplayer gameplay
- Simple controls (arrow keys or WASD)
- Score tracking
- Visual distinction between players
- Automatic reconnect on connection loss
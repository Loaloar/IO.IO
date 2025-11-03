# .io Game

A real-time multiplayer .io game built with Node.js, WebSocket, and HTML5 Canvas.

## Features

- Real-time multiplayer gameplay
- Smooth player movement with WASD or arrow keys
- Food collection mechanics
- Responsive design that works on different screen sizes
- Deployable on Render

## Project Structure

```
io.io/
├── package.json
├── render.yaml
├── server/
│   └── server.js
└── public/
    ├── index.html
    └── js/
        └── game.js
```

## Local Development

1. Install Node.js (version 18 or higher)
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```
4. Open your browser and go to `http://localhost:3000`

## Deployment on Render

This project is configured for deployment on Render.

1. Fork this repository to your GitHub account
2. Log in to your Render account
3. Click "New+" and select "Web Service"
4. Connect your GitHub repository
5. Configure the service:
   - Name: Choose a name for your service
   - Runtime: Node
   - Build command: `npm install`
   - Start command: `npm start`
6. Click "Create Web Service"

Render will automatically deploy your application and provide a URL where you can access it.

## Game Controls

- Move your player using WASD keys or Arrow Keys
- Collect red food items to play the game

## Technical Details

### Server

The server is built with Node.js and uses WebSocket for real-time communication between clients. It maintains the game state and broadcasts updates to all connected clients.

### Client

The client is built with HTML5 Canvas and JavaScript. It handles rendering, user input, and WebSocket communication with the server.

### WebSocket Messages

The game uses several types of WebSocket messages:

- `init`: Sent to a new client when they connect
- `playerJoin`: Broadcast when a new player joins the game
- `playerLeave`: Broadcast when a player leaves the game
- `move`: Broadcast when a player moves
- `eatFood`: Broadcast when a player eats food

## Customization

You can customize the game by modifying the following files:

- `server/server.js`: Game logic and WebSocket handling
- `public/index.html`: Game interface and styling
- `public/js/game.js`: Client-side game logic and rendering

## License

This project is open source and available under the MIT License.
const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files from public directory
app.use(express.static('public'));

// Game state
const gameState = {
  players: {},
  food: {},
  width: 40,
  height: 30
};

// Generate random position
function randomPosition() {
  return {
    x: Math.floor(Math.random() * gameState.width),
    y: Math.floor(Math.random() * gameState.height)
  };
}

// Generate food at random position
function generateFood() {
  gameState.food = randomPosition();
}

// Initialize game
generateFood();

// Handle WebSocket connections
wss.on('connection', (ws) => {
  // Assign unique ID to player
  const playerId = Date.now() + Math.random();
  gameState.players[playerId] = {
    id: playerId,
    snake: [{ x: Math.floor(gameState.width / 2), y: Math.floor(gameState.height / 2) }],
    direction: 'right',
    score: 0,
    alive: true
  };

  // Send initial game state to new player
  ws.send(JSON.stringify({
    type: 'init',
    playerId: playerId,
    gameState: gameState
  }));

  // Broadcast new player to all clients
  const joinMessage = {
    type: 'playerJoined',
    player: gameState.players[playerId]
  };
  
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(joinMessage));
    }
  });

  // Handle messages from client
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'changeDirection':
          if (gameState.players[data.playerId]) {
            // Prevent 180-degree turns
            const currentDir = gameState.players[data.playerId].direction;
            if (
              (data.direction === 'up' && currentDir !== 'down') ||
              (data.direction === 'down' && currentDir !== 'up') ||
              (data.direction === 'left' && currentDir !== 'right') ||
              (data.direction === 'right' && currentDir !== 'left')
            ) {
              gameState.players[data.playerId].direction = data.direction;
            }
          }
          break;
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });

  // Handle client disconnect
  ws.on('close', () => {
    // Remove player from game state
    delete gameState.players[playerId];
    
    // Notify all clients that player left
    const leaveMessage = {
      type: 'playerLeft',
      playerId: playerId
    };
    
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(leaveMessage));
      }
    });
  });
});

// Game loop
setInterval(() => {
  // Update game state
  Object.values(gameState.players).forEach(player => {
    if (!player.alive) return;
    
    // Get head position
    const head = { ...player.snake[0] };
    
    // Move head based on direction
    switch (player.direction) {
      case 'up':
        head.y -= 1;
        break;
      case 'down':
        head.y += 1;
        break;
      case 'left':
        head.x -= 1;
        break;
      case 'right':
        head.x += 1;
        break;
    }
    
    // Check wall collision
    if (head.x < 0 || head.x >= gameState.width || head.y < 0 || head.y >= gameState.height) {
      player.alive = false;
      return;
    }
    
    // Check self collision
    for (let i = 0; i < player.snake.length; i++) {
      if (player.snake[i].x === head.x && player.snake[i].y === head.y) {
        player.alive = false;
        return;
      }
    }
    
    // Add new head
    player.snake.unshift(head);
    
    // Check food collision
    if (head.x === gameState.food.x && head.y === gameState.food.y) {
      // Increase score
      player.score += 10;
      // Generate new food
      generateFood();
    } else {
      // Remove tail if no food eaten
      player.snake.pop();
    }
  });
  
  // Send updated game state to all clients
  const updateMessage = {
    type: 'gameUpdate',
    gameState: gameState
  };
  
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(updateMessage));
    }
  });
}, 150);

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log('Server running on port ' + PORT);
});

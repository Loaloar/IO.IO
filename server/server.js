const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files from the public directory
app.use(express.static('public'));

// Game state
const gameState = {
  players: {},
  food: []
};

// Generate a random ID
function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

// Create food at random positions
function createFood() {
  return {
    id: generateId(),
    x: Math.random() * 800,
    y: Math.random() * 600
  };
}

// Initialize some food
for (let i = 0; i < 50; i++) {
  gameState.food.push(createFood());
}

// Handle WebSocket connections
wss.on('connection', (ws) => {
  const playerId = generateId();
  
  // Add new player to game state
  gameState.players[playerId] = {
    id: playerId,
    x: Math.random() * 800,
    y: Math.random() * 600,
    size: 20,
    color: '#' + Math.floor(Math.random()*16777215).toString(16)
  };
  
  // Send initial game state to the new player
  ws.send(JSON.stringify({
    type: 'init',
    playerId: playerId,
    gameState: gameState
  }));
  
  // Broadcast new player to all clients
  const playerJoinMessage = JSON.stringify({
    type: 'playerJoin',
    player: gameState.players[playerId]
  });
  
  wss.clients.forEach(client => {
    if (client !== ws && client.readyState === WebSocket.OPEN) {
      client.send(playerJoinMessage);
    }
  });
  
  // Handle messages from client
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'move':
          // Update player position
          if (gameState.players[playerId]) {
            gameState.players[playerId].x = data.x;
            gameState.players[playerId].y = data.y;
            
            // Broadcast movement to all other clients
            const moveMessage = JSON.stringify({
              type: 'move',
              playerId: playerId,
              x: data.x,
              y: data.y
            });
            
            wss.clients.forEach(client => {
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(moveMessage);
              }
            });
          }
          break;
          
        case 'eatFood':
          // Remove eaten food and create new one
          gameState.food = gameState.food.filter(food => food.id !== data.foodId);
          gameState.food.push(createFood());
          
          // Broadcast food eaten to all clients
          const eatMessage = JSON.stringify({
            type: 'eatFood',
            foodId: data.foodId
          });
          
          wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(eatMessage);
            }
          });
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
    
    // Broadcast player leave to all clients
    const playerLeaveMessage = JSON.stringify({
      type: 'playerLeave',
      playerId: playerId
    });
    
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(playerLeaveMessage);
      }
    });
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});
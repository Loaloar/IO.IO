// Game variables
let canvas, ctx;
let gameState = {
  players: {},
  food: {},
  width: 40,
  height: 30
};
let playerId = null;
let cellSize = 20;

// DOM elements
let statusElement;
let scoreBoardElement;

// WebSocket connection
let ws;

// Initialize game
function init() {
  canvas = document.getElementById('game-canvas');
  ctx = canvas.getContext('2d');
  statusElement = document.getElementById('status');
  scoreBoardElement = document.getElementById('score-board');
  
  // Connect to WebSocket server
  connect();
  
  // Handle keyboard input
  document.addEventListener('keydown', handleKeyDown);
  
  // Adjust canvas size based on game dimensions
  cellSize = Math.min(canvas.width / gameState.width, canvas.height / gameState.height);
}

// Connect to WebSocket server
function connect() {
  // Use the current host for WebSocket connection
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}`;
  
  ws = new WebSocket(wsUrl);
  
  ws.onopen = () => {
    statusElement.textContent = 'Connected! Waiting for players...';
    statusElement.style.color = 'green';
  };
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    switch (data.type) {
      case 'init':
        playerId = data.playerId;
        gameState = data.gameState;
        statusElement.textContent = 'Game started! Use arrow keys to move.';
        break;
        
      case 'gameUpdate':
        gameState = data.gameState;
        render();
        updateScoreBoard();
        break;
        
      case 'playerJoined':
        gameState.players[data.player.id] = data.player;
        break;
        
      case 'playerLeft':
        delete gameState.players[data.playerId];
        break;
    }
  };
  
  ws.onclose = () => {
    statusElement.textContent = 'Disconnected. Reconnecting...';
    statusElement.style.color = 'red';
    
    // Try to reconnect after 2 seconds
    setTimeout(connect, 2000);
  };
  
  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    statusElement.textContent = 'Connection error. Please refresh the page.';
    statusElement.style.color = 'red';
  };
}

// Handle keyboard input
function handleKeyDown(event) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  
  let direction = null;
  
  switch (event.key) {
    case 'ArrowUp':
    case 'w':
    case 'W':
      direction = 'up';
      break;
    case 'ArrowDown':
    case 's':
    case 'S':
      direction = 'down';
      break;
    case 'ArrowLeft':
    case 'a':
    case 'A':
      direction = 'left';
      break;
    case 'ArrowRight':
    case 'd':
    case 'D':
      direction = 'right';
      break;
    default:
      return; // Ignore other keys
  }
  
  // Send direction change to server
  ws.send(JSON.stringify({
    type: 'changeDirection',
    playerId: playerId,
    direction: direction
  }));
  
  // Prevent default behavior (scrolling)
  event.preventDefault();
}

// Render game state
function render() {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Calculate offset to center the game
  const offsetX = (canvas.width - gameState.width * cellSize) / 2;
  const offsetY = (canvas.height - gameState.height * cellSize) / 2;
  
  // Draw food
  if (gameState.food) {
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(
      offsetX + gameState.food.x * cellSize,
      offsetY + gameState.food.y * cellSize,
      cellSize,
      cellSize
    );
  }
  
  // Draw players
  Object.values(gameState.players).forEach(player => {
    // Draw snake
    player.snake.forEach((segment, index) => {
      // Head is a different color
      if (index === 0) {
        ctx.fillStyle = player.id === playerId ? '#00ff00' : '#0066cc';
      } else {
        ctx.fillStyle = player.id === playerId ? '#90ee90' : '#6495ed';
      }
      
      ctx.fillRect(
        offsetX + segment.x * cellSize,
        offsetY + segment.y * cellSize,
        cellSize,
        cellSize
      );
      
      // Add border to segments
      ctx.strokeStyle = '#000';
      ctx.strokeRect(
        offsetX + segment.x * cellSize,
        offsetY + segment.y * cellSize,
        cellSize,
        cellSize
      );
    });
  });
}

// Update score board
function updateScoreBoard() {
  // Clear score board
  scoreBoardElement.innerHTML = '';
  
  // Add score for each player
  Object.values(gameState.players).forEach(player => {
    const scoreElement = document.createElement('div');
    scoreElement.className = 'player-score';
    scoreElement.textContent = `${player.id === playerId ? 'You' : 'Player'}: ${player.score}`;
    
    if (player.id === playerId) {
      scoreElement.classList.add('you');
    }
    
    scoreBoardElement.appendChild(scoreElement);
  });
}

// Start the game when page loads
window.onload = init;
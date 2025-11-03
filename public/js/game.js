class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.players = {};
    this.food = [];
    this.playerId = null;
    this.keys = {};
    
    // Set canvas size
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    
    // Set up keyboard input
    this.setupInput();
    
    // Connect to WebSocket server
    this.connect();
    
    // Start game loop
    this.lastTime = 0;
    this.gameLoop = this.gameLoop.bind(this);
    requestAnimationFrame(this.gameLoop);
  }
  
  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
  
  setupInput() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key] = true;
    });
    
    window.addEventListener('keyup', (e) => {
      this.keys[e.key] = false;
    });
  }
  
  connect() {
    // Connect to WebSocket server
    // Use relative URL for production, localhost for development
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = protocol + '//' + host;
    
    this.ws = new WebSocket(wsUrl);
    
    this.ws.onopen = () => {
      console.log('Connected to server');
    };
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'init':
          this.playerId = data.playerId;
          this.players = data.gameState.players;
          this.food = data.gameState.food;
          break;
          
        case 'playerJoin':
          this.players[data.player.id] = data.player;
          this.updatePlayerCount();
          break;
          
        case 'playerLeave':
          delete this.players[data.playerId];
          this.updatePlayerCount();
          break;
          
        case 'move':
          if (this.players[data.playerId]) {
            this.players[data.playerId].x = data.x;
            this.players[data.playerId].y = data.y;
          }
          break;
          
        case 'eatFood':
          this.food = this.food.filter(food => food.id !== data.foodId);
          // In a real game, we would add new food here from server message
          break;
      }
    };
    
    this.ws.onclose = () => {
      console.log('Disconnected from server');
      // Try to reconnect after 1 second
      setTimeout(() => this.connect(), 1000);
    };
  }
  
  updatePlayerCount() {
    document.getElementById('gameInfo').textContent = 'Players: ' + Object.keys(this.players).length;
  }
  
  update(deltaTime) {
    // Only update if we have a player ID
    if (!this.playerId || !this.players[this.playerId]) return;
    
    // Handle player movement
    const player = this.players[this.playerId];
    const speed = 200; // pixels per second
    
    let dx = 0;
    let dy = 0;
    
    // Check for movement keys
    if (this.keys['w'] || this.keys['ArrowUp']) dy -= 1;
    if (this.keys['s'] || this.keys['ArrowDown']) dy += 1;
    if (this.keys['a'] || this.keys['ArrowLeft']) dx -= 1;
    if (this.keys['d'] || this.keys['ArrowRight']) dx += 1;
    
    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
      dx *= 0.7071; // 1/sqrt(2)
      dy *= 0.7071;
    }
    
    // Update player position
    if (dx !== 0 || dy !== 0) {
      player.x += dx * speed * deltaTime;
      player.y += dy * speed * deltaTime;
      
      // Send position update to server
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'move',
          x: player.x,
          y: player.y
        }));
      }
    }
    
    // Check for food collision
    this.checkFoodCollision();
  }
  
  checkFoodCollision() {
    const player = this.players[this.playerId];
    if (!player) return;
    
    for (let i = 0; i < this.food.length; i++) {
      const food = this.food[i];
      const dx = player.x - food.x;
      const dy = player.y - food.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // If player collides with food
      if (distance < player.size / 2 + 5) {
        // Send eat message to server
        if (this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({
            type: 'eatFood',
            foodId: food.id
          }));
        }
        break;
      }
    }
  }
  
  render() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw food
    this.food.forEach(food => {
      this.ctx.beginPath();
      this.ctx.arc(food.x, food.y, 5, 0, Math.PI * 2);
      this.ctx.fillStyle = '#ff6b6b';
      this.ctx.fill();
    });
    
    // Draw players
    Object.values(this.players).forEach(player => {
      // Draw player
      this.ctx.beginPath();
      this.ctx.arc(player.x, player.y, player.size / 2, 0, Math.PI * 2);
      this.ctx.fillStyle = player.color;
      this.ctx.fill();
      
      // Draw player ID for non-local players
      if (player.id !== this.playerId) {
        this.ctx.fillStyle = '#000';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(player.id.substring(0, 5), player.x, player.y - 20);
      }
    });
    
    // Draw local player indicator
    if (this.playerId && this.players[this.playerId]) {
      const player = this.players[this.playerId];
      this.ctx.beginPath();
      this.ctx.arc(player.x, player.y, player.size / 2 + 3, 0, Math.PI * 2);
      this.ctx.strokeStyle = '#000';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }
  }
  
  gameLoop(timestamp) {
    // Calculate delta time in seconds
    const deltaTime = Math.min((timestamp - this.lastTime) / 1000, 0.1); // Cap at 100ms
    this.lastTime = timestamp;
    
    this.update(deltaTime);
    this.render();
    
    requestAnimationFrame(this.gameLoop);
  }
}

// Start the game when the page loads
window.addEventListener('load', () => {
  new Game();
});
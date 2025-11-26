<template>
  <div class="snake-game" tabindex="0" @keydown="handleKeyDown">
    <div class="game-header">
      <div class="score">
        Score: {{ score }} | High: {{ highScore }}
      </div>
      <div class="controls-hint">
        Use Arrow Keys to move
      </div>
    </div>

    <canvas
      ref="canvas"
      :width="canvasWidth"
      :height="canvasHeight"
      class="game-canvas"
    ></canvas>

    <div class="game-footer">
      <button class="amiga-button" @click="togglePause" v-if="isPlaying">
        {{ isPaused ? 'Resume' : 'Pause' }}
      </button>
      <button class="amiga-button" @click="startGame" v-if="!isPlaying">
        Start Game
      </button>
      <button class="amiga-button" @click="resetGame">Reset</button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue';

const canvas = ref<HTMLCanvasElement | null>(null);
const canvasWidth = 600;
const canvasHeight = 400;
const gridSize = 20;
const cols = canvasWidth / gridSize;
const rows = canvasHeight / gridSize;

const score = ref(0);
const highScore = ref(0);
const isPaused = ref(false);
const isPlaying = ref(false);

let ctx: CanvasRenderingContext2D | null = null;
let animationId: number | null = null;
let lastUpdateTime = 0;
const UPDATE_INTERVAL = 100; // Game speed in milliseconds

interface Point {
  x: number;
  y: number;
}

const snake = ref<Point[]>([
  { x: 10, y: 10 },
  { x: 9, y: 10 },
  { x: 8, y: 10 }
]);

const food = ref<Point>({ x: 15, y: 10 });
const direction = ref<Point>({ x: 1, y: 0 });
const nextDirection = ref<Point>({ x: 1, y: 0 });

onMounted(() => {
  if (canvas.value) {
    ctx = canvas.value.getContext('2d');
    if (ctx) {
      draw();
      // Load high score from localStorage
      const savedHighScore = localStorage.getItem('snake-high-score');
      if (savedHighScore) {
        highScore.value = parseInt(savedHighScore);
      }
    }
  }
});

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
});

const handleKeyDown = (e: KeyboardEvent) => {
  const key = e.key.toLowerCase();

  // Prevent opposite direction
  if (key === 'arrowup' && direction.value.y === 0) {
    nextDirection.value = { x: 0, y: -1 };
  } else if (key === 'arrowdown' && direction.value.y === 0) {
    nextDirection.value = { x: 0, y: 1 };
  } else if (key === 'arrowleft' && direction.value.x === 0) {
    nextDirection.value = { x: -1, y: 0 };
  } else if (key === 'arrowright' && direction.value.x === 0) {
    nextDirection.value = { x: 1, y: 0 };
  }

  e.preventDefault();
};

const startGame = () => {
  isPlaying.value = true;
  isPaused.value = false;
  lastUpdateTime = performance.now();

  if (animationId) {
    cancelAnimationFrame(animationId);
  }

  gameLoop();
};

// Using requestAnimationFrame for smoother performance
const gameLoop = (currentTime: number = performance.now()) => {
  if (!isPlaying.value) return;

  animationId = requestAnimationFrame(gameLoop);

  if (isPaused.value) return;

  // Throttle game updates to UPDATE_INTERVAL for consistent speed
  const deltaTime = currentTime - lastUpdateTime;
  if (deltaTime >= UPDATE_INTERVAL) {
    update();
    lastUpdateTime = currentTime - (deltaTime % UPDATE_INTERVAL);
  }

  // Always draw for smooth visuals
  draw();
};

const update = () => {
  // Update direction
  direction.value = { ...nextDirection.value };

  // Move snake
  const head = { ...snake.value[0] };
  head.x += direction.value.x;
  head.y += direction.value.y;

  // Check wall collision
  if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows) {
    gameOver();
    return;
  }

  // Check self collision
  if (snake.value.some(segment => segment.x === head.x && segment.y === head.y)) {
    gameOver();
    return;
  }

  snake.value.unshift(head);

  // Check food collision
  if (head.x === food.value.x && head.y === food.value.y) {
    score.value += 10;
    if (score.value > highScore.value) {
      highScore.value = score.value;
      localStorage.setItem('snake-high-score', highScore.value.toString());
    }
    spawnFood();
  } else {
    snake.value.pop();
  }
};

const draw = () => {
  if (!ctx) return;

  // Clear canvas
  ctx.fillStyle = '#a0a0a0';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Draw grid
  ctx.strokeStyle = '#909090';
  ctx.lineWidth = 1;
  for (let i = 0; i <= cols; i++) {
    ctx.beginPath();
    ctx.moveTo(i * gridSize, 0);
    ctx.lineTo(i * gridSize, canvasHeight);
    ctx.stroke();
  }
  for (let i = 0; i <= rows; i++) {
    ctx.beginPath();
    ctx.moveTo(0, i * gridSize);
    ctx.lineTo(canvasWidth, i * gridSize);
    ctx.stroke();
  }

  // Draw snake
  snake.value.forEach((segment, index) => {
    ctx!.fillStyle = index === 0 ? '#0055aa' : '#0088cc';
    ctx!.fillRect(
      segment.x * gridSize + 1,
      segment.y * gridSize + 1,
      gridSize - 2,
      gridSize - 2
    );

    // Amiga-style border
    ctx!.strokeStyle = '#ffffff';
    ctx!.lineWidth = 2;
    ctx!.strokeRect(
      segment.x * gridSize + 2,
      segment.y * gridSize + 2,
      gridSize - 4,
      gridSize - 4
    );
  });

  // Draw food
  ctx.fillStyle = '#ff0000';
  ctx.beginPath();
  ctx.arc(
    food.value.x * gridSize + gridSize / 2,
    food.value.y * gridSize + gridSize / 2,
    gridSize / 2 - 2,
    0,
    Math.PI * 2
  );
  ctx.fill();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();
};

const spawnFood = () => {
  let newFood: Point;
  do {
    newFood = {
      x: Math.floor(Math.random() * cols),
      y: Math.floor(Math.random() * rows)
    };
  } while (snake.value.some(segment => segment.x === newFood.x && segment.y === newFood.y));

  food.value = newFood;
};

const gameOver = () => {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  isPlaying.value = false;
  alert(`Game Over! Score: ${score.value}`);
};

const togglePause = () => {
  isPaused.value = !isPaused.value;
};

const resetGame = () => {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }

  snake.value = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 }
  ];
  direction.value = { x: 1, y: 0 };
  nextDirection.value = { x: 1, y: 0 };
  score.value = 0;
  isPaused.value = false;
  isPlaying.value = false;
  spawnFood();
  draw();
};
</script>

<style scoped>
.snake-game {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #808080;
  font-family: 'Press Start 2P', monospace;
  outline: none;
}

.game-header {
  background: #a0a0a0;
  padding: 12px;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
}

.score {
  font-size: 10px;
  color: #000000;
  text-align: center;
  margin-bottom: 8px;
}

.controls-hint {
  font-size: 7px;
  color: #555555;
  text-align: center;
}

.game-canvas {
  flex: 1;
  border: 3px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  margin: 0;
  display: block;
  background: #a0a0a0;
}

.game-footer {
  background: #a0a0a0;
  padding: 12px;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  display: flex;
  justify-content: center;
  gap: 12px;
}

.amiga-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 6px 16px;
  font-size: 9px;
  cursor: pointer;
  color: #000000;
  font-family: 'Press Start 2P', monospace;
  transition: all 0.1s;
}

.amiga-button:hover {
  background: #b0b0b0;
}

.amiga-button:active {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}
</style>

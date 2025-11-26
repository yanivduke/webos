<template>
  <div class="tetris-game" tabindex="0" @keydown="handleKeyDown">
    <div class="game-header">
      <div class="score">
        Score: {{ score }} | Lines: {{ lines }} | Level: {{ level }}
      </div>
      <div class="controls-hint">
        ← → Move | ↑ Rotate | ↓ Drop
      </div>
    </div>

    <div class="game-content">
      <canvas
        ref="canvas"
        :width="canvasWidth"
        :height="canvasHeight"
        class="game-canvas"
      ></canvas>

      <div class="side-panel">
        <div class="next-piece-label">Next:</div>
        <canvas
          ref="nextCanvas"
          :width="100"
          :height="100"
          class="next-canvas"
        ></canvas>
      </div>
    </div>

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
const nextCanvas = ref<HTMLCanvasElement | null>(null);
const canvasWidth = 300;
const canvasHeight = 400;
const cellSize = 20;
const cols = canvasWidth / cellSize;
const rows = canvasHeight / cellSize;

const score = ref(0);
const lines = ref(0);
const level = ref(1);
const isPaused = ref(false);
const isPlaying = ref(false);

let ctx: CanvasRenderingContext2D | null = null;
let nextCtx: CanvasRenderingContext2D | null = null;
let animationId: number | null = null;
let lastDropTime = 0;

interface Position {
  x: number;
  y: number;
}

interface Tetromino {
  shape: number[][];
  color: string;
  x: number;
  y: number;
}

// Tetromino shapes
const SHAPES = {
  I: [[1, 1, 1, 1]],
  O: [[1, 1], [1, 1]],
  T: [[0, 1, 0], [1, 1, 1]],
  S: [[0, 1, 1], [1, 1, 0]],
  Z: [[1, 1, 0], [0, 1, 1]],
  J: [[1, 0, 0], [1, 1, 1]],
  L: [[0, 0, 1], [1, 1, 1]]
};

const COLORS = {
  I: '#00ffff',
  O: '#ffff00',
  T: '#aa00ff',
  S: '#00ff00',
  Z: '#ff0000',
  J: '#0055aa',
  L: '#ff8800'
};

const board = ref<string[][]>([]);
let currentPiece: Tetromino | null = null;
let nextPiece: Tetromino | null = null;

onMounted(() => {
  if (canvas.value && nextCanvas.value) {
    ctx = canvas.value.getContext('2d');
    nextCtx = nextCanvas.value.getContext('2d');
    if (ctx && nextCtx) {
      initBoard();
      draw();
    }
  }
});

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
});

const initBoard = () => {
  board.value = Array(rows).fill(null).map(() => Array(cols).fill(''));
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (!isPlaying.value || isPaused.value || !currentPiece) return;

  const key = e.key.toLowerCase();

  if (key === 'arrowleft') {
    movePiece(-1, 0);
  } else if (key === 'arrowright') {
    movePiece(1, 0);
  } else if (key === 'arrowdown') {
    movePiece(0, 1);
  } else if (key === 'arrowup') {
    rotatePiece();
  }

  e.preventDefault();
};

const createPiece = (): Tetromino => {
  const shapeKeys = Object.keys(SHAPES) as (keyof typeof SHAPES)[];
  const randomKey = shapeKeys[Math.floor(Math.random() * shapeKeys.length)];

  return {
    shape: SHAPES[randomKey],
    color: COLORS[randomKey],
    x: Math.floor(cols / 2) - 1,
    y: 0
  };
};

const getDropInterval = (): number => {
  return Math.max(100, 600 - level.value * 50);
};

const startGame = () => {
  isPlaying.value = true;
  isPaused.value = false;
  initBoard();
  currentPiece = createPiece();
  nextPiece = createPiece();
  lastDropTime = performance.now();

  if (animationId) {
    cancelAnimationFrame(animationId);
  }

  gameLoop();
};

// Using requestAnimationFrame for smoother performance
const gameLoop = (currentTime: number = performance.now()) => {
  if (!isPlaying.value) return;

  animationId = requestAnimationFrame(gameLoop);

  if (isPaused.value) {
    draw();
    drawNext();
    return;
  }

  // Throttle piece drops based on level speed
  const dropInterval = getDropInterval();
  const deltaTime = currentTime - lastDropTime;
  if (deltaTime >= dropInterval) {
    update();
    lastDropTime = currentTime - (deltaTime % dropInterval);
  }

  // Always draw for smooth visuals
  draw();
  drawNext();
};

const update = () => {
  if (!currentPiece) return;

  if (canMove(currentPiece, 0, 1)) {
    currentPiece.y++;
  } else {
    // Lock piece
    lockPiece();
    clearLines();

    // Spawn next piece
    currentPiece = nextPiece;
    nextPiece = createPiece();

    // Check game over
    if (!canMove(currentPiece, 0, 0)) {
      gameOver();
      return;
    }
  }
  // Note: draw is handled by gameLoop for consistent frame timing
};

const movePiece = (dx: number, dy: number) => {
  if (!currentPiece) return;

  if (canMove(currentPiece, dx, dy)) {
    currentPiece.x += dx;
    currentPiece.y += dy;
    // Note: draw is handled by gameLoop for consistent frame timing
  }
};

const rotatePiece = () => {
  if (!currentPiece) return;

  const rotated = {
    ...currentPiece,
    shape: rotateMatrix(currentPiece.shape)
  };

  if (canMove(rotated, 0, 0)) {
    currentPiece.shape = rotated.shape;
    // Note: draw is handled by gameLoop for consistent frame timing
  }
};

const rotateMatrix = (matrix: number[][]): number[][] => {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const rotated: number[][] = [];

  for (let col = 0; col < cols; col++) {
    rotated[col] = [];
    for (let row = rows - 1; row >= 0; row--) {
      rotated[col][rows - 1 - row] = matrix[row][col];
    }
  }

  return rotated;
};

const canMove = (piece: Tetromino, dx: number, dy: number): boolean => {
  for (let row = 0; row < piece.shape.length; row++) {
    for (let col = 0; col < piece.shape[row].length; col++) {
      if (piece.shape[row][col]) {
        const newX = piece.x + col + dx;
        const newY = piece.y + row + dy;

        if (
          newX < 0 ||
          newX >= cols ||
          newY >= rows ||
          (newY >= 0 && board.value[newY][newX])
        ) {
          return false;
        }
      }
    }
  }
  return true;
};

const lockPiece = () => {
  if (!currentPiece) return;

  for (let row = 0; row < currentPiece.shape.length; row++) {
    for (let col = 0; col < currentPiece.shape[row].length; col++) {
      if (currentPiece.shape[row][col]) {
        const y = currentPiece.y + row;
        const x = currentPiece.x + col;
        if (y >= 0) {
          board.value[y][x] = currentPiece.color;
        }
      }
    }
  }
};

const clearLines = () => {
  let linesCleared = 0;

  for (let row = rows - 1; row >= 0; row--) {
    if (board.value[row].every(cell => cell !== '')) {
      board.value.splice(row, 1);
      board.value.unshift(Array(cols).fill(''));
      linesCleared++;
      row++; // Check the same row again
    }
  }

  if (linesCleared > 0) {
    lines.value += linesCleared;
    score.value += [0, 40, 100, 300, 1200][linesCleared] * level.value;

    // Level up every 10 lines - speed increases dynamically via getDropInterval()
    const newLevel = Math.floor(lines.value / 10) + 1;
    if (newLevel > level.value) {
      level.value = newLevel;
      // Speed is automatically adjusted in gameLoop via getDropInterval()
    }
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
    ctx.moveTo(i * cellSize, 0);
    ctx.lineTo(i * cellSize, canvasHeight);
    ctx.stroke();
  }
  for (let i = 0; i <= rows; i++) {
    ctx.beginPath();
    ctx.moveTo(0, i * cellSize);
    ctx.lineTo(canvasWidth, i * cellSize);
    ctx.stroke();
  }

  // Draw board
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (board.value[row][col]) {
        drawCell(ctx, col, row, board.value[row][col]);
      }
    }
  }

  // Draw current piece
  if (currentPiece) {
    for (let row = 0; row < currentPiece.shape.length; row++) {
      for (let col = 0; col < currentPiece.shape[row].length; col++) {
        if (currentPiece.shape[row][col]) {
          drawCell(ctx, currentPiece.x + col, currentPiece.y + row, currentPiece.color);
        }
      }
    }
  }
};

const drawNext = () => {
  if (!nextCtx || !nextPiece) return;

  // Clear canvas
  nextCtx.fillStyle = '#a0a0a0';
  nextCtx.fillRect(0, 0, 100, 100);

  // Center the next piece
  const offsetX = (100 - nextPiece.shape[0].length * cellSize) / 2;
  const offsetY = (100 - nextPiece.shape.length * cellSize) / 2;

  for (let row = 0; row < nextPiece.shape.length; row++) {
    for (let col = 0; col < nextPiece.shape[row].length; col++) {
      if (nextPiece.shape[row][col]) {
        const x = offsetX + col * cellSize;
        const y = offsetY + row * cellSize;

        nextCtx.fillStyle = nextPiece.color;
        nextCtx.fillRect(x, y, cellSize - 2, cellSize - 2);

        // Amiga-style border
        nextCtx.strokeStyle = '#ffffff';
        nextCtx.lineWidth = 2;
        nextCtx.strokeRect(x, y, cellSize - 2, cellSize - 2);
      }
    }
  }
};

const drawCell = (context: CanvasRenderingContext2D, x: number, y: number, color: string) => {
  context.fillStyle = color;
  context.fillRect(x * cellSize + 1, y * cellSize + 1, cellSize - 2, cellSize - 2);

  // Amiga-style 3D border
  context.strokeStyle = '#ffffff';
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(x * cellSize, y * cellSize + cellSize);
  context.lineTo(x * cellSize, y * cellSize);
  context.lineTo(x * cellSize + cellSize, y * cellSize);
  context.stroke();

  context.strokeStyle = '#000000';
  context.beginPath();
  context.moveTo(x * cellSize + cellSize, y * cellSize);
  context.lineTo(x * cellSize + cellSize, y * cellSize + cellSize);
  context.lineTo(x * cellSize, y * cellSize + cellSize);
  context.stroke();
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

  score.value = 0;
  lines.value = 0;
  level.value = 1;
  isPaused.value = false;
  isPlaying.value = false;
  initBoard();
  currentPiece = null;
  nextPiece = null;
  draw();
};
</script>

<style scoped>
.tetris-game {
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
  font-size: 9px;
  color: #000000;
  text-align: center;
  margin-bottom: 8px;
}

.controls-hint {
  font-size: 7px;
  color: #555555;
  text-align: center;
}

.game-content {
  display: flex;
  flex: 1;
  gap: 10px;
  padding: 10px;
  background: #808080;
}

.game-canvas {
  border: 3px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  display: block;
  background: #a0a0a0;
}

.side-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.next-piece-label {
  font-size: 10px;
  color: #000000;
  background: #a0a0a0;
  padding: 8px;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  text-align: center;
}

.next-canvas {
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
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

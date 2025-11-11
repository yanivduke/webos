<template>
  <div class="minesweeper-game" tabindex="0" @keydown="handleKeyDown">
    <div class="game-header">
      <div class="score">
        Mines: {{ minesLeft }} | Time: {{ formatTime(timer) }} | Difficulty: {{ difficulty }}
      </div>
      <div class="controls-hint">
        Left Click: Reveal | Right Click: Flag
      </div>
    </div>

    <canvas
      ref="canvas"
      :width="canvasWidth"
      :height="canvasHeight"
      class="game-canvas"
      @click="handleClick"
      @contextmenu="handleRightClick"
    ></canvas>

    <div class="game-footer">
      <button class="amiga-button" @click="startGame('easy')">
        Easy (9x9)
      </button>
      <button class="amiga-button" @click="startGame('medium')">
        Medium (16x16)
      </button>
      <button class="amiga-button" @click="startGame('hard')">
        Hard (16x30)
      </button>
      <button class="amiga-button" @click="resetGame">Reset</button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue';

const canvas = ref<HTMLCanvasElement | null>(null);
const canvasWidth = ref(600);
const canvasHeight = ref(400);

const minesLeft = ref(0);
const timer = ref(0);
const difficulty = ref('Easy');
const isPlaying = ref(false);

let ctx: CanvasRenderingContext2D | null = null;
let timerInterval: number | null = null;

interface Cell {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborMines: number;
}

let grid: Cell[][] = [];
let rows = 0;
let cols = 0;
let mineCount = 0;
let cellSize = 0;
let firstClick = true;

const difficultySettings = {
  easy: { rows: 9, cols: 9, mines: 10 },
  medium: { rows: 16, cols: 16, mines: 40 },
  hard: { rows: 16, cols: 30, mines: 99 }
};

onMounted(() => {
  if (canvas.value) {
    ctx = canvas.value.getContext('2d');
    if (ctx) {
      draw();
    }
  }
});

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval);
  }
});

const handleKeyDown = (e: KeyboardEvent) => {
  const key = e.key.toLowerCase();
  if (key === 'r') {
    resetGame();
  }
};

const handleClick = (e: MouseEvent) => {
  if (!isPlaying.value || !canvas.value) return;

  const rect = canvas.value.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const col = Math.floor(x / cellSize);
  const row = Math.floor(y / cellSize);

  if (row >= 0 && row < rows && col >= 0 && col < cols) {
    if (firstClick) {
      // Ensure first click is safe
      initMines(row, col);
      firstClick = false;
      startTimer();
    }

    revealCell(row, col);
    draw();
    checkWin();
  }
};

const handleRightClick = (e: MouseEvent) => {
  e.preventDefault();
  if (!isPlaying.value || !canvas.value || firstClick) return;

  const rect = canvas.value.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const col = Math.floor(x / cellSize);
  const row = Math.floor(y / cellSize);

  if (row >= 0 && row < rows && col >= 0 && col < cols) {
    const cell = grid[row][col];
    if (!cell.isRevealed) {
      cell.isFlagged = !cell.isFlagged;
      minesLeft.value += cell.isFlagged ? -1 : 1;
      draw();
    }
  }
};

const startGame = (level: 'easy' | 'medium' | 'hard') => {
  const settings = difficultySettings[level];
  rows = settings.rows;
  cols = settings.cols;
  mineCount = settings.mines;
  minesLeft.value = mineCount;
  difficulty.value = level.charAt(0).toUpperCase() + level.slice(1);

  cellSize = Math.min(
    Math.floor(580 / cols),
    Math.floor(380 / rows)
  );

  canvasWidth.value = cols * cellSize + 20;
  canvasHeight.value = rows * cellSize + 20;

  // Initialize grid without mines
  grid = [];
  for (let row = 0; row < rows; row++) {
    grid[row] = [];
    for (let col = 0; col < cols; col++) {
      grid[row][col] = {
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        neighborMines: 0
      };
    }
  }

  isPlaying.value = true;
  firstClick = true;
  timer.value = 0;

  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  draw();
};

const initMines = (safeRow: number, safeCol: number) => {
  let placedMines = 0;

  while (placedMines < mineCount) {
    const row = Math.floor(Math.random() * rows);
    const col = Math.floor(Math.random() * cols);

    // Don't place mine on first click or its neighbors
    const isSafe = Math.abs(row - safeRow) <= 1 && Math.abs(col - safeCol) <= 1;

    if (!grid[row][col].isMine && !isSafe) {
      grid[row][col].isMine = true;
      placedMines++;
    }
  }

  // Calculate neighbor mines
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (!grid[row][col].isMine) {
        grid[row][col].neighborMines = countNeighborMines(row, col);
      }
    }
  }
};

const countNeighborMines = (row: number, col: number): number => {
  let count = 0;

  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;

      const newRow = row + dr;
      const newCol = col + dc;

      if (
        newRow >= 0 && newRow < rows &&
        newCol >= 0 && newCol < cols &&
        grid[newRow][newCol].isMine
      ) {
        count++;
      }
    }
  }

  return count;
};

const revealCell = (row: number, col: number) => {
  const cell = grid[row][col];

  if (cell.isRevealed || cell.isFlagged) return;

  cell.isRevealed = true;

  if (cell.isMine) {
    gameOver(false);
    return;
  }

  // If no neighboring mines, reveal neighbors
  if (cell.neighborMines === 0) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;

        const newRow = row + dr;
        const newCol = col + dc;

        if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
          revealCell(newRow, newCol);
        }
      }
    }
  }
};

const checkWin = () => {
  let revealedCount = 0;
  let totalNonMines = rows * cols - mineCount;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (grid[row][col].isRevealed && !grid[row][col].isMine) {
        revealedCount++;
      }
    }
  }

  if (revealedCount === totalNonMines) {
    gameOver(true);
  }
};

const gameOver = (won: boolean) => {
  isPlaying.value = false;

  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  // Reveal all mines
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (grid[row][col].isMine) {
        grid[row][col].isRevealed = true;
      }
    }
  }

  draw();

  setTimeout(() => {
    if (won) {
      alert(`You Won! Time: ${formatTime(timer.value)}`);
    } else {
      alert('Game Over! You hit a mine!');
    }
  }, 100);
};

const startTimer = () => {
  timerInterval = window.setInterval(() => {
    timer.value++;
  }, 1000);
};

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const draw = () => {
  if (!ctx) return;

  // Clear canvas
  ctx.fillStyle = '#a0a0a0';
  ctx.fillRect(0, 0, canvasWidth.value, canvasHeight.value);

  const offsetX = 10;
  const offsetY = 10;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cell = grid[row][col];
      const x = offsetX + col * cellSize;
      const y = offsetY + row * cellSize;

      if (cell.isRevealed) {
        // Revealed cell
        ctx.fillStyle = '#cccccc';
        ctx.fillRect(x, y, cellSize, cellSize);

        if (cell.isMine) {
          // Draw mine
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.arc(x + cellSize / 2, y + cellSize / 2, cellSize / 4, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ff0000';
          ctx.beginPath();
          ctx.arc(x + cellSize / 2, y + cellSize / 2, cellSize / 6, 0, Math.PI * 2);
          ctx.fill();
        } else if (cell.neighborMines > 0) {
          // Draw number
          const colors = ['', '#0000ff', '#008000', '#ff0000', '#000080', '#800000', '#008080', '#000000', '#808080'];
          ctx.fillStyle = colors[cell.neighborMines];
          ctx.font = `${cellSize / 2}px "Press Start 2P"`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(cell.neighborMines.toString(), x + cellSize / 2, y + cellSize / 2);
        }

        // Border
        ctx.strokeStyle = '#999999';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, cellSize, cellSize);
      } else {
        // Unrevealed cell - 3D button effect
        ctx.fillStyle = '#a0a0a0';
        ctx.fillRect(x, y, cellSize, cellSize);

        // 3D border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y + cellSize);
        ctx.lineTo(x, y);
        ctx.lineTo(x + cellSize, y);
        ctx.stroke();

        ctx.strokeStyle = '#555555';
        ctx.beginPath();
        ctx.moveTo(x + cellSize, y);
        ctx.lineTo(x + cellSize, y + cellSize);
        ctx.lineTo(x, y + cellSize);
        ctx.stroke();

        // Draw flag
        if (cell.isFlagged) {
          ctx.fillStyle = '#ff0000';
          ctx.beginPath();
          ctx.moveTo(x + cellSize / 3, y + cellSize / 4);
          ctx.lineTo(x + cellSize * 0.75, y + cellSize / 2.5);
          ctx.lineTo(x + cellSize / 3, y + cellSize / 2);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x + cellSize / 3, y + cellSize / 4);
          ctx.lineTo(x + cellSize / 3, y + cellSize * 0.75);
          ctx.stroke();
        }
      }
    }
  }
};

const resetGame = () => {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  isPlaying.value = false;
  timer.value = 0;
  grid = [];
  rows = 0;
  cols = 0;

  canvasWidth.value = 600;
  canvasHeight.value = 400;

  draw();
};
</script>

<style scoped>
.minesweeper-game {
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
  font-size: 8px;
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
  margin: 10px auto;
  display: block;
  background: #a0a0a0;
  cursor: pointer;
}

.game-footer {
  background: #a0a0a0;
  padding: 12px;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}

.amiga-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 6px 12px;
  font-size: 8px;
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

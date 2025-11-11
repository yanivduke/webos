<template>
  <div class="game-2048" tabindex="0" @keydown="handleKeyDown">
    <div class="game-header">
      <div class="score-display">
        <div class="score-item">
          <div class="score-label">Score</div>
          <div class="score-value">{{ score }}</div>
        </div>
        <div class="score-item">
          <div class="score-label">Best</div>
          <div class="score-value">{{ bestScore }}</div>
        </div>
      </div>
      <div class="controls-hint">
        Use Arrow Keys to move tiles
      </div>
    </div>

    <canvas
      ref="canvas"
      :width="canvasWidth"
      :height="canvasHeight"
      class="game-canvas"
    ></canvas>

    <div class="game-footer">
      <button class="amiga-button" @click="startGame" v-if="!isPlaying">
        New Game
      </button>
      <button class="amiga-button" @click="resetGame">Reset</button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue';

const canvas = ref<HTMLCanvasElement | null>(null);
const canvasWidth = 440;
const canvasHeight = 440;

const score = ref(0);
const bestScore = ref(0);
const isPlaying = ref(false);

let ctx: CanvasRenderingContext2D | null = null;

interface Tile {
  value: number;
  row: number;
  col: number;
  isNew?: boolean;
  isMerged?: boolean;
}

const gridSize = 4;
const tileSize = 100;
const tileGap = 10;
let grid: (Tile | null)[][] = [];

const tileColors: { [key: number]: string } = {
  2: '#eee4da',
  4: '#ede0c8',
  8: '#f2b179',
  16: '#f59563',
  32: '#f67c5f',
  64: '#f65e3b',
  128: '#edcf72',
  256: '#edcc61',
  512: '#edc850',
  1024: '#edc53f',
  2048: '#edc22e',
  4096: '#3c3a32',
  8192: '#3c3a32'
};

const tileTextColors: { [key: number]: string } = {
  2: '#776e65',
  4: '#776e65',
  8: '#f9f6f2',
  16: '#f9f6f2',
  32: '#f9f6f2',
  64: '#f9f6f2',
  128: '#f9f6f2',
  256: '#f9f6f2',
  512: '#f9f6f2',
  1024: '#f9f6f2',
  2048: '#f9f6f2',
  4096: '#f9f6f2',
  8192: '#f9f6f2'
};

onMounted(() => {
  if (canvas.value) {
    ctx = canvas.value.getContext('2d');
    if (ctx) {
      const saved = localStorage.getItem('2048-best-score');
      if (saved) bestScore.value = parseInt(saved);
      draw();
    }
  }
});

onUnmounted(() => {});

const initGrid = () => {
  grid = [];
  for (let row = 0; row < gridSize; row++) {
    grid[row] = [];
    for (let col = 0; col < gridSize; col++) {
      grid[row][col] = null;
    }
  }
  addRandomTile();
  addRandomTile();
};

const addRandomTile = () => {
  const emptyCells: { row: number; col: number }[] = [];

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (!grid[row][col]) {
        emptyCells.push({ row, col });
      }
    }
  }

  if (emptyCells.length > 0) {
    const { row, col } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const value = Math.random() < 0.9 ? 2 : 4;
    grid[row][col] = { value, row, col, isNew: true };

    setTimeout(() => {
      if (grid[row][col]) {
        grid[row][col]!.isNew = false;
      }
    }, 200);
  }
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (!isPlaying.value) return;

  const key = e.key.toLowerCase();
  let moved = false;

  if (key === 'arrowup') moved = move('up');
  else if (key === 'arrowdown') moved = move('down');
  else if (key === 'arrowleft') moved = move('left');
  else if (key === 'arrowright') moved = move('right');

  if (moved) {
    addRandomTile();
    draw();

    if (isGameOver()) {
      setTimeout(() => {
        alert(`Game Over! Score: ${score.value}`);
        isPlaying.value = false;
      }, 300);
    }
  }

  if (key.startsWith('arrow')) {
    e.preventDefault();
  }
};

const move = (direction: 'up' | 'down' | 'left' | 'right'): boolean => {
  let moved = false;

  // Clear merged flags
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (grid[row][col]) {
        grid[row][col]!.isMerged = false;
      }
    }
  }

  if (direction === 'up') {
    for (let col = 0; col < gridSize; col++) {
      const tiles: Tile[] = [];
      for (let row = 0; row < gridSize; row++) {
        if (grid[row][col]) tiles.push(grid[row][col]!);
      }

      const merged = mergeTiles(tiles);
      for (let row = 0; row < gridSize; row++) {
        const newTile = merged[row] || null;
        if (grid[row][col] !== newTile) moved = true;
        grid[row][col] = newTile;
        if (newTile) newTile.row = row;
      }
    }
  } else if (direction === 'down') {
    for (let col = 0; col < gridSize; col++) {
      const tiles: Tile[] = [];
      for (let row = gridSize - 1; row >= 0; row--) {
        if (grid[row][col]) tiles.push(grid[row][col]!);
      }

      const merged = mergeTiles(tiles);
      for (let row = gridSize - 1, i = 0; row >= 0; row--, i++) {
        const newTile = merged[i] || null;
        if (grid[row][col] !== newTile) moved = true;
        grid[row][col] = newTile;
        if (newTile) newTile.row = row;
      }
    }
  } else if (direction === 'left') {
    for (let row = 0; row < gridSize; row++) {
      const tiles: Tile[] = [];
      for (let col = 0; col < gridSize; col++) {
        if (grid[row][col]) tiles.push(grid[row][col]!);
      }

      const merged = mergeTiles(tiles);
      for (let col = 0; col < gridSize; col++) {
        const newTile = merged[col] || null;
        if (grid[row][col] !== newTile) moved = true;
        grid[row][col] = newTile;
        if (newTile) newTile.col = col;
      }
    }
  } else if (direction === 'right') {
    for (let row = 0; row < gridSize; row++) {
      const tiles: Tile[] = [];
      for (let col = gridSize - 1; col >= 0; col--) {
        if (grid[row][col]) tiles.push(grid[row][col]!);
      }

      const merged = mergeTiles(tiles);
      for (let col = gridSize - 1, i = 0; col >= 0; col--, i++) {
        const newTile = merged[i] || null;
        if (grid[row][col] !== newTile) moved = true;
        grid[row][col] = newTile;
        if (newTile) newTile.col = col;
      }
    }
  }

  return moved;
};

const mergeTiles = (tiles: Tile[]): (Tile | null)[] => {
  const result: (Tile | null)[] = [];
  let i = 0;

  while (i < tiles.length) {
    if (i + 1 < tiles.length && tiles[i].value === tiles[i + 1].value) {
      // Merge tiles
      const newValue = tiles[i].value * 2;
      result.push({
        value: newValue,
        row: tiles[i].row,
        col: tiles[i].col,
        isMerged: true
      });

      score.value += newValue;
      if (score.value > bestScore.value) {
        bestScore.value = score.value;
        localStorage.setItem('2048-best-score', bestScore.value.toString());
      }

      i += 2;
    } else {
      result.push({ ...tiles[i] });
      i++;
    }
  }

  return result;
};

const isGameOver = (): boolean => {
  // Check if there are empty cells
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (!grid[row][col]) return false;
    }
  }

  // Check if any adjacent tiles can merge
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const current = grid[row][col]!.value;

      if (row < gridSize - 1 && grid[row + 1][col]!.value === current) return false;
      if (col < gridSize - 1 && grid[row][col + 1]!.value === current) return false;
    }
  }

  return true;
};

const draw = () => {
  if (!ctx) return;

  // Clear canvas
  ctx.fillStyle = '#bbada0';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Draw grid background
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const x = col * (tileSize + tileGap) + tileGap;
      const y = row * (tileSize + tileGap) + tileGap;

      ctx.fillStyle = '#cdc1b4';
      ctx.fillRect(x, y, tileSize, tileSize);
    }
  }

  // Draw tiles
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const tile = grid[row][col];
      if (tile) {
        const x = col * (tileSize + tileGap) + tileGap;
        const y = row * (tileSize + tileGap) + tileGap;

        // Tile background
        ctx.fillStyle = tileColors[tile.value] || '#3c3a32';
        ctx.fillRect(x, y, tileSize, tileSize);

        // Tile text
        ctx.fillStyle = tileTextColors[tile.value] || '#f9f6f2';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const fontSize = tile.value < 100 ? 40 : tile.value < 1000 ? 32 : 24;
        ctx.font = `${fontSize}px "Press Start 2P"`;
        ctx.fillText(tile.value.toString(), x + tileSize / 2, y + tileSize / 2);

        // New tile animation (subtle scale effect through border)
        if (tile.isNew) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 4;
          ctx.strokeRect(x + 2, y + 2, tileSize - 4, tileSize - 4);
        }

        // Merged tile animation
        if (tile.isMerged) {
          ctx.strokeStyle = '#ffaa00';
          ctx.lineWidth = 4;
          ctx.strokeRect(x + 2, y + 2, tileSize - 4, tileSize - 4);

          setTimeout(() => {
            if (grid[row][col]) {
              grid[row][col]!.isMerged = false;
              draw();
            }
          }, 150);
        }
      }
    }
  }
};

const startGame = () => {
  isPlaying.value = true;
  score.value = 0;
  initGrid();
  draw();
};

const resetGame = () => {
  score.value = 0;
  isPlaying.value = false;
  grid = [];
  for (let row = 0; row < gridSize; row++) {
    grid[row] = [];
    for (let col = 0; col < gridSize; col++) {
      grid[row][col] = null;
    }
  }
  draw();
};
</script>

<style scoped>
.game-2048 {
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

.score-display {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 8px;
}

.score-item {
  background: #8f7a66;
  padding: 8px 16px;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  min-width: 80px;
}

.score-label {
  font-size: 7px;
  color: #eee4da;
  text-align: center;
  margin-bottom: 4px;
}

.score-value {
  font-size: 12px;
  color: #ffffff;
  text-align: center;
}

.controls-hint {
  font-size: 7px;
  color: #555555;
  text-align: center;
}

.game-canvas {
  margin: 10px auto;
  border: 3px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  display: block;
  background: #bbada0;
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

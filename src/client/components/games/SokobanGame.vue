<template>
  <div class="sokoban-game" tabindex="0" @keydown="handleKeyDown">
    <div class="game-header">
      <div class="score">
        Level: {{ currentLevel + 1 }} | Moves: {{ moves }} | Pushes: {{ pushes }}
      </div>
      <div class="controls-hint">
        Arrow Keys to move | R to restart level
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
        Start Game
      </button>
      <button class="amiga-button" @click="restartLevel">Restart Level</button>
      <button class="amiga-button" @click="previousLevel" :disabled="currentLevel === 0">
        Prev Level
      </button>
      <button class="amiga-button" @click="nextLevel" :disabled="currentLevel >= levels.length - 1">
        Next Level
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue';

const canvas = ref<HTMLCanvasElement | null>(null);
const canvasWidth = 600;
const canvasHeight = 400;
const cellSize = 40;

const moves = ref(0);
const pushes = ref(0);
const currentLevel = ref(0);
const isPlaying = ref(false);

let ctx: CanvasRenderingContext2D | null = null;

interface Position {
  x: number;
  y: number;
}

// Level format: # = wall, @ = player, $ = box, . = target, * = box on target, + = player on target
const levels = [
  [
    "########",
    "#  .   #",
    "#  $   #",
    "#  @   #",
    "#      #",
    "########"
  ],
  [
    "  ######",
    "###    #",
    "#  .$. #",
    "# $.@$ #",
    "#  .$. #",
    "##     #",
    " #######"
  ],
  [
    " ######",
    " #    #",
    " # $$ #",
    "## $  ##",
    "#  $$ .#",
    "# @  ..#",
    "########"
  ],
  [
    "########",
    "#   .  #",
    "# $.$  #",
    "#  $ $.#",
    "# @  . #",
    "########"
  ],
  [
    " ########",
    " #      #",
    "## $$$  #",
    "#  . . .##",
    "#  @    #",
    "#########"
  ]
];

let grid: string[][] = [];
let playerPos: Position = { x: 0, y: 0 };
let boxes: Position[] = [];
let targets: Position[] = [];

onMounted(() => {
  if (canvas.value) {
    ctx = canvas.value.getContext('2d');
    if (ctx) {
      loadLevel(currentLevel.value);
      draw();
    }
  }
});

onUnmounted(() => {});

const loadLevel = (levelIndex: number) => {
  const level = levels[levelIndex];
  grid = [];
  boxes = [];
  targets = [];

  for (let y = 0; y < level.length; y++) {
    grid[y] = [];
    for (let x = 0; x < level[y].length; x++) {
      const char = level[y][x];

      switch (char) {
        case '#':
          grid[y][x] = '#';
          break;
        case '@':
          playerPos = { x, y };
          grid[y][x] = ' ';
          break;
        case '$':
          boxes.push({ x, y });
          grid[y][x] = ' ';
          break;
        case '.':
          targets.push({ x, y });
          grid[y][x] = '.';
          break;
        case '*':
          boxes.push({ x, y });
          targets.push({ x, y });
          grid[y][x] = '.';
          break;
        case '+':
          playerPos = { x, y };
          targets.push({ x, y });
          grid[y][x] = '.';
          break;
        default:
          grid[y][x] = ' ';
      }
    }
  }

  moves.value = 0;
  pushes.value = 0;
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (!isPlaying.value) return;

  const key = e.key.toLowerCase();
  let dx = 0, dy = 0;

  if (key === 'arrowup') dy = -1;
  else if (key === 'arrowdown') dy = 1;
  else if (key === 'arrowleft') dx = -1;
  else if (key === 'arrowright') dx = 1;
  else if (key === 'r') {
    restartLevel();
    return;
  }

  if (dx !== 0 || dy !== 0) {
    tryMove(dx, dy);
    e.preventDefault();
  }
};

const tryMove = (dx: number, dy: number) => {
  const newX = playerPos.x + dx;
  const newY = playerPos.y + dy;

  // Check if out of bounds or wall
  if (!grid[newY] || !grid[newY][newX] || grid[newY][newX] === '#') {
    return;
  }

  // Check if there's a box
  const boxIndex = boxes.findIndex(b => b.x === newX && b.y === newY);

  if (boxIndex !== -1) {
    // Try to push box
    const boxNewX = newX + dx;
    const boxNewY = newY + dy;

    // Check if box can be pushed
    if (!grid[boxNewY] || !grid[boxNewY][boxNewX] || grid[boxNewY][boxNewX] === '#') {
      return;
    }

    // Check if another box is in the way
    if (boxes.some(b => b.x === boxNewX && b.y === boxNewY)) {
      return;
    }

    // Push box
    boxes[boxIndex] = { x: boxNewX, y: boxNewY };
    pushes.value++;
  }

  // Move player
  playerPos = { x: newX, y: newY };
  moves.value++;

  draw();

  // Check win condition
  if (checkWin()) {
    setTimeout(() => {
      alert(`Level Complete! Moves: ${moves.value}, Pushes: ${pushes.value}`);
      if (currentLevel.value < levels.length - 1) {
        currentLevel.value++;
        loadLevel(currentLevel.value);
        draw();
      } else {
        alert('Congratulations! You completed all levels!');
        isPlaying.value = false;
      }
    }, 100);
  }
};

const checkWin = (): boolean => {
  return boxes.every(box =>
    targets.some(target => target.x === box.x && target.y === box.y)
  );
};

const draw = () => {
  if (!ctx) return;

  // Clear canvas
  ctx.fillStyle = '#a0a0a0';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Calculate offset to center the level
  const levelWidth = grid[0] ? grid[0].length * cellSize : 0;
  const levelHeight = grid.length * cellSize;
  const offsetX = (canvasWidth - levelWidth) / 2;
  const offsetY = (canvasHeight - levelHeight) / 2;

  // Draw grid
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      const px = offsetX + x * cellSize;
      const py = offsetY + y * cellSize;

      // Draw floor
      ctx.fillStyle = '#808080';
      ctx.fillRect(px, py, cellSize, cellSize);

      // Draw walls
      if (grid[y][x] === '#') {
        ctx.fillStyle = '#555555';
        ctx.fillRect(px, py, cellSize, cellSize);

        // 3D effect
        ctx.strokeStyle = '#888888';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(px, py + cellSize);
        ctx.lineTo(px, py);
        ctx.lineTo(px + cellSize, py);
        ctx.stroke();

        ctx.strokeStyle = '#333333';
        ctx.beginPath();
        ctx.moveTo(px + cellSize, py);
        ctx.lineTo(px + cellSize, py + cellSize);
        ctx.lineTo(px, py + cellSize);
        ctx.stroke();
      }

      // Draw targets
      if (grid[y][x] === '.') {
        ctx.fillStyle = '#ffaa00';
        ctx.beginPath();
        ctx.arc(px + cellSize / 2, py + cellSize / 2, cellSize / 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ff8800';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Grid lines
      ctx.strokeStyle = '#666666';
      ctx.lineWidth = 1;
      ctx.strokeRect(px, py, cellSize, cellSize);
    }
  }

  // Draw boxes
  boxes.forEach(box => {
    const px = offsetX + box.x * cellSize;
    const py = offsetY + box.y * cellSize;

    const isOnTarget = targets.some(t => t.x === box.x && t.y === box.y);

    ctx!.fillStyle = isOnTarget ? '#00ff00' : '#aa5500';
    ctx!.fillRect(px + 4, py + 4, cellSize - 8, cellSize - 8);

    // 3D effect
    ctx!.strokeStyle = '#ffffff';
    ctx!.lineWidth = 3;
    ctx!.beginPath();
    ctx!.moveTo(px + 4, py + cellSize - 4);
    ctx!.lineTo(px + 4, py + 4);
    ctx!.lineTo(px + cellSize - 4, py + 4);
    ctx!.stroke();

    ctx!.strokeStyle = '#000000';
    ctx!.beginPath();
    ctx!.moveTo(px + cellSize - 4, py + 4);
    ctx!.lineTo(px + cellSize - 4, py + cellSize - 4);
    ctx!.lineTo(px + 4, py + cellSize - 4);
    ctx!.stroke();
  });

  // Draw player
  const px = offsetX + playerPos.x * cellSize;
  const py = offsetY + playerPos.y * cellSize;

  ctx.fillStyle = '#0055aa';
  ctx.beginPath();
  ctx.arc(px + cellSize / 2, py + cellSize / 2, cellSize / 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Player face
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(px + cellSize / 2 - 5, py + cellSize / 2 - 3, 2, 0, Math.PI * 2);
  ctx.arc(px + cellSize / 2 + 5, py + cellSize / 2 - 3, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(px + cellSize / 2, py + cellSize / 2 + 2, 5, 0, Math.PI);
  ctx.stroke();
};

const startGame = () => {
  isPlaying.value = true;
  loadLevel(currentLevel.value);
  draw();
};

const restartLevel = () => {
  loadLevel(currentLevel.value);
  draw();
};

const previousLevel = () => {
  if (currentLevel.value > 0) {
    currentLevel.value--;
    loadLevel(currentLevel.value);
    draw();
  }
};

const nextLevel = () => {
  if (currentLevel.value < levels.length - 1) {
    currentLevel.value++;
    loadLevel(currentLevel.value);
    draw();
  }
};
</script>

<style scoped>
.sokoban-game {
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
  gap: 8px;
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

.amiga-button:hover:not(:disabled) {
  background: #b0b0b0;
}

.amiga-button:active:not(:disabled) {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}

.amiga-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>

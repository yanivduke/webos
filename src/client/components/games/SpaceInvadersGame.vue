<template>
  <div class="space-invaders-game" tabindex="0" @keydown="handleKeyDown" @keyup="handleKeyUp">
    <div class="game-header">
      <div class="score">
        Score: {{ score }} | High: {{ highScore }} | Lives: {{ lives }} | Wave: {{ wave }}
      </div>
      <div class="score-multiplier" v-if="multiplier > 1">
        {{ multiplier }}x COMBO!
      </div>
      <div class="controls-hint">
        ← → Move | SPACE Fire
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

const score = ref(0);
const highScore = ref(0);
const lives = ref(3);
const wave = ref(1);
const multiplier = ref(1);
const isPaused = ref(false);
const isPlaying = ref(false);

let ctx: CanvasRenderingContext2D | null = null;
let animationId: number | null = null;

interface Vector {
  x: number;
  y: number;
}

interface Alien {
  x: number;
  y: number;
  type: number; // 0=bottom (10pts), 1=middle (20pts), 2=top (30pts)
  alive: boolean;
}

interface Bullet {
  x: number;
  y: number;
  velocity: number;
}

interface Barrier {
  x: number;
  y: number;
  blocks: boolean[][];
}

interface ScorePopup {
  x: number;
  y: number;
  text: string;
  life: number;
}

const player = {
  x: canvasWidth / 2 - 15,
  y: canvasHeight - 40,
  width: 30,
  height: 20,
  speed: 4
};

const aliens = ref<Alien[]>([]);
const playerBullets = ref<Bullet[]>([]);
const alienBullets = ref<Bullet[]>([]);
const barriers = ref<Barrier[]>([]);
const scorePopups = ref<ScorePopup[]>([]);

let alienDirection = 1;
let alienSpeed = 0.5;
let alienDropDistance = 20;
let lastAlienShot = 0;
let lastPlayerShot = 0;
let comboTimer = 0;

const keys = {
  left: false,
  right: false,
  fire: false
};

onMounted(() => {
  if (canvas.value) {
    ctx = canvas.value.getContext('2d');
    if (ctx) {
      const saved = localStorage.getItem('space-invaders-high-score');
      if (saved) highScore.value = parseInt(saved);
      draw();
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
  if (key === 'arrowleft') keys.left = true;
  if (key === 'arrowright') keys.right = true;
  if (key === ' ') keys.fire = true;
  e.preventDefault();
};

const handleKeyUp = (e: KeyboardEvent) => {
  const key = e.key.toLowerCase();
  if (key === 'arrowleft') keys.left = false;
  if (key === 'arrowright') keys.right = false;
  if (key === ' ') keys.fire = false;
};

const startGame = () => {
  isPlaying.value = true;
  isPaused.value = false;
  initAliens();
  initBarriers();
  gameLoop();
};

const gameLoop = () => {
  if (!isPaused.value && isPlaying.value) {
    update();
    draw();
  }
  animationId = requestAnimationFrame(gameLoop);
};

const initAliens = () => {
  aliens.value = [];
  const rows = 5;
  const cols = 11;
  const spacing = 40;
  const offsetX = 50;
  const offsetY = 60;

  for (let row = 0; row < rows; row++) {
    const type = row < 1 ? 2 : row < 3 ? 1 : 0;
    for (let col = 0; col < cols; col++) {
      aliens.value.push({
        x: offsetX + col * spacing,
        y: offsetY + row * spacing,
        type,
        alive: true
      });
    }
  }
};

const initBarriers = () => {
  barriers.value = [];
  const barrierY = canvasHeight - 100;
  const barrierWidth = 60;
  const barrierHeight = 40;

  for (let i = 0; i < 4; i++) {
    const x = 80 + i * 130;
    const blocks: boolean[][] = [];

    for (let row = 0; row < 4; row++) {
      blocks[row] = [];
      for (let col = 0; col < 6; col++) {
        // Create barrier shape
        if (row === 3 && (col === 2 || col === 3)) {
          blocks[row][col] = false; // Gap at bottom
        } else {
          blocks[row][col] = true;
        }
      }
    }

    barriers.value.push({ x, y: barrierY, blocks });
  }
};

const update = () => {
  // Move player
  if (keys.left) {
    player.x = Math.max(0, player.x - player.speed);
  }
  if (keys.right) {
    player.x = Math.min(canvasWidth - player.width, player.x + player.speed);
  }

  // Player fire
  const now = Date.now();
  if (keys.fire && now - lastPlayerShot > 500) {
    playerBullets.value.push({
      x: player.x + player.width / 2,
      y: player.y,
      velocity: -5
    });
    lastPlayerShot = now;
  }

  // Move aliens
  let changeDirection = false;
  const aliveAliens = aliens.value.filter(a => a.alive);

  for (const alien of aliveAliens) {
    alien.x += alienDirection * alienSpeed * wave.value;

    if (alien.x <= 0 || alien.x >= canvasWidth - 30) {
      changeDirection = true;
    }

    // Check if aliens reached player
    if (alien.y + 30 >= player.y) {
      gameOver();
      return;
    }
  }

  if (changeDirection) {
    alienDirection *= -1;
    for (const alien of aliveAliens) {
      alien.y += alienDropDistance;
    }
  }

  // Aliens fire
  if (aliveAliens.length > 0 && now - lastAlienShot > 1000) {
    const randomAlien = aliveAliens[Math.floor(Math.random() * aliveAliens.length)];
    alienBullets.value.push({
      x: randomAlien.x + 15,
      y: randomAlien.y + 30,
      velocity: 3
    });
    lastAlienShot = now;
  }

  // Update bullets
  playerBullets.value.forEach(bullet => {
    bullet.y += bullet.velocity;
  });

  alienBullets.value.forEach(bullet => {
    bullet.y += bullet.velocity;
  });

  // Remove off-screen bullets
  playerBullets.value = playerBullets.value.filter(b => b.y > 0);
  alienBullets.value = alienBullets.value.filter(b => b.y < canvasHeight);

  // Check bullet-alien collisions
  for (let i = playerBullets.value.length - 1; i >= 0; i--) {
    const bullet = playerBullets.value[i];
    for (const alien of aliveAliens) {
      if (
        bullet.x > alien.x &&
        bullet.x < alien.x + 30 &&
        bullet.y > alien.y &&
        bullet.y < alien.y + 30
      ) {
        alien.alive = false;
        playerBullets.value.splice(i, 1);

        // Score with multiplier
        const baseScore = [10, 20, 30][alien.type];
        const earnedScore = baseScore * multiplier.value;
        score.value += earnedScore;

        // Score popup
        scorePopups.value.push({
          x: alien.x,
          y: alien.y,
          text: `+${earnedScore}`,
          life: 30
        });

        // Increase multiplier
        if (multiplier.value < 5) {
          multiplier.value++;
        }
        comboTimer = 120; // 2 seconds to maintain combo

        // Update high score
        if (score.value > highScore.value) {
          highScore.value = score.value;
          localStorage.setItem('space-invaders-high-score', highScore.value.toString());
        }

        break;
      }
    }
  }

  // Check bullet-barrier collisions
  for (let i = playerBullets.value.length - 1; i >= 0; i--) {
    const bullet = playerBullets.value[i];
    if (checkBarrierCollision(bullet, barriers.value)) {
      playerBullets.value.splice(i, 1);
    }
  }

  for (let i = alienBullets.value.length - 1; i >= 0; i--) {
    const bullet = alienBullets.value[i];
    if (checkBarrierCollision(bullet, barriers.value)) {
      alienBullets.value.splice(i, 1);
    }
  }

  // Check alien bullet-player collision
  for (const bullet of alienBullets.value) {
    if (
      bullet.x > player.x &&
      bullet.x < player.x + player.width &&
      bullet.y > player.y &&
      bullet.y < player.y + player.height
    ) {
      lives.value--;
      alienBullets.value = [];
      multiplier.value = 1;

      if (lives.value <= 0) {
        gameOver();
      }
      break;
    }
  }

  // Update combo timer
  if (comboTimer > 0) {
    comboTimer--;
  } else if (multiplier.value > 1) {
    multiplier.value = 1;
  }

  // Update score popups
  scorePopups.value = scorePopups.value.filter(popup => {
    popup.y -= 1;
    popup.life--;
    return popup.life > 0;
  });

  // Check wave complete
  if (aliveAliens.length === 0) {
    wave.value++;
    initAliens();
    alienSpeed += 0.1;
  }
};

const checkBarrierCollision = (bullet: Bullet, barriers: Barrier[]): boolean => {
  for (const barrier of barriers) {
    for (let row = 0; row < barrier.blocks.length; row++) {
      for (let col = 0; col < barrier.blocks[row].length; col++) {
        if (barrier.blocks[row][col]) {
          const blockX = barrier.x + col * 10;
          const blockY = barrier.y + row * 10;

          if (
            bullet.x > blockX &&
            bullet.x < blockX + 10 &&
            bullet.y > blockY &&
            bullet.y < blockY + 10
          ) {
            barrier.blocks[row][col] = false;
            return true;
          }
        }
      }
    }
  }
  return false;
};

const draw = () => {
  if (!ctx) return;

  // Clear canvas
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Draw stars
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 30; i++) {
    const x = (i * 37) % canvasWidth;
    const y = (i * 71) % canvasHeight;
    ctx.fillRect(x, y, 1, 1);
  }

  // Draw aliens
  const aliveAliens = aliens.value.filter(a => a.alive);
  aliveAliens.forEach(alien => {
    const colors = ['#00ff00', '#ffff00', '#ff0000'];
    ctx!.fillStyle = colors[alien.type];

    // Simple alien shape
    ctx!.fillRect(alien.x + 5, alien.y, 20, 20);
    ctx!.fillRect(alien.x, alien.y + 10, 30, 10);
    ctx!.fillRect(alien.x + 5, alien.y + 20, 5, 10);
    ctx!.fillRect(alien.x + 20, alien.y + 20, 5, 10);
  });

  // Draw barriers
  ctx.fillStyle = '#00ff00';
  barriers.value.forEach(barrier => {
    for (let row = 0; row < barrier.blocks.length; row++) {
      for (let col = 0; col < barrier.blocks[row].length; col++) {
        if (barrier.blocks[row][col]) {
          ctx!.fillRect(barrier.x + col * 10, barrier.y + row * 10, 10, 10);
        }
      }
    }
  });

  // Draw player
  ctx.fillStyle = '#0055aa';
  ctx.fillRect(player.x, player.y, player.width, player.height);
  ctx.fillRect(player.x + 12, player.y - 8, 6, 8);

  // Draw bullets
  ctx.fillStyle = '#ffffff';
  playerBullets.value.forEach(bullet => {
    ctx!.fillRect(bullet.x - 1, bullet.y, 2, 10);
  });

  ctx.fillStyle = '#ff0000';
  alienBullets.value.forEach(bullet => {
    ctx!.fillRect(bullet.x - 1, bullet.y, 2, 10);
  });

  // Draw score popups
  ctx.fillStyle = '#ffff00';
  ctx.font = '10px "Press Start 2P"';
  ctx.textAlign = 'center';
  scorePopups.value.forEach(popup => {
    ctx!.globalAlpha = popup.life / 30;
    ctx!.fillText(popup.text, popup.x + 15, popup.y);
  });
  ctx.globalAlpha = 1;
};

const gameOver = () => {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  isPlaying.value = false;
  alert(`Game Over! Final Score: ${score.value}`);
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
  lives.value = 3;
  wave.value = 1;
  multiplier.value = 1;
  alienSpeed = 0.5;
  isPaused.value = false;
  isPlaying.value = false;
  playerBullets.value = [];
  alienBullets.value = [];
  scorePopups.value = [];
  player.x = canvasWidth / 2 - 15;
  draw();
};
</script>

<style scoped>
.space-invaders-game {
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
  margin-bottom: 4px;
}

.score-multiplier {
  font-size: 10px;
  color: #ff0000;
  text-align: center;
  margin-bottom: 4px;
  animation: pulse 0.5s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
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
  background: #000000;
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

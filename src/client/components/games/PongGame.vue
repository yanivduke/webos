<template>
  <div class="pong-game" tabindex="0" @keydown="handleKeyDown" @keyup="handleKeyUp">
    <div class="game-header">
      <div class="score">
        <span>Player: {{ playerScore }}</span>
        <span class="separator">|</span>
        <span>Computer: {{ computerScore }}</span>
      </div>
      <div class="controls-hint">
        Use W/S or Arrow Up/Down to move
      </div>
    </div>

    <canvas
      ref="canvas"
      :width="canvasWidth"
      :height="canvasHeight"
      class="game-canvas"
    ></canvas>

    <div class="game-footer">
      <button class="amiga-button" @click="togglePause">
        {{ isPaused ? 'Resume' : 'Pause' }}
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

const playerScore = ref(0);
const computerScore = ref(0);
const isPaused = ref(false);

let ctx: CanvasRenderingContext2D | null = null;
let animationId: number | null = null;

// Game objects
const paddle = {
  width: 10,
  height: 80,
  x: 20,
  y: canvasHeight / 2 - 40,
  speed: 5,
  dy: 0
};

const computerPaddle = {
  width: 10,
  height: 80,
  x: canvasWidth - 30,
  y: canvasHeight / 2 - 40,
  speed: 3
};

const ball = {
  x: canvasWidth / 2,
  y: canvasHeight / 2,
  radius: 6,
  dx: 4,
  dy: 4,
  speed: 4
};

const keys = {
  w: false,
  s: false,
  arrowUp: false,
  arrowDown: false
};

onMounted(() => {
  if (canvas.value) {
    ctx = canvas.value.getContext('2d');
    if (ctx) {
      startGame();
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
  if (key === 'w') keys.w = true;
  if (key === 's') keys.s = true;
  if (key === 'arrowup') keys.arrowUp = true;
  if (key === 'arrowdown') keys.arrowDown = true;
  e.preventDefault();
};

const handleKeyUp = (e: KeyboardEvent) => {
  const key = e.key.toLowerCase();
  if (key === 'w') keys.w = false;
  if (key === 's') keys.s = false;
  if (key === 'arrowup') keys.arrowUp = false;
  if (key === 'arrowdown') keys.arrowDown = false;
};

const startGame = () => {
  gameLoop();
};

const gameLoop = () => {
  if (!isPaused.value) {
    update();
    draw();
  }
  animationId = requestAnimationFrame(gameLoop);
};

const update = () => {
  // Move player paddle
  if (keys.w || keys.arrowUp) {
    paddle.y = Math.max(0, paddle.y - paddle.speed);
  }
  if (keys.s || keys.arrowDown) {
    paddle.y = Math.min(canvasHeight - paddle.height, paddle.y + paddle.speed);
  }

  // Simple AI for computer paddle
  const paddleCenter = computerPaddle.y + computerPaddle.height / 2;
  if (paddleCenter < ball.y - 10) {
    computerPaddle.y = Math.min(canvasHeight - computerPaddle.height, computerPaddle.y + computerPaddle.speed);
  } else if (paddleCenter > ball.y + 10) {
    computerPaddle.y = Math.max(0, computerPaddle.y - computerPaddle.speed);
  }

  // Move ball
  ball.x += ball.dx;
  ball.y += ball.dy;

  // Ball collision with top and bottom
  if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvasHeight) {
    ball.dy *= -1;
  }

  // Ball collision with player paddle
  if (
    ball.x - ball.radius < paddle.x + paddle.width &&
    ball.y > paddle.y &&
    ball.y < paddle.y + paddle.height
  ) {
    ball.dx = Math.abs(ball.dx);
    const hitPoint = (ball.y - paddle.y) / paddle.height;
    ball.dy = (hitPoint - 0.5) * 8;
  }

  // Ball collision with computer paddle
  if (
    ball.x + ball.radius > computerPaddle.x &&
    ball.y > computerPaddle.y &&
    ball.y < computerPaddle.y + computerPaddle.height
  ) {
    ball.dx = -Math.abs(ball.dx);
    const hitPoint = (ball.y - computerPaddle.y) / computerPaddle.height;
    ball.dy = (hitPoint - 0.5) * 8;
  }

  // Score points
  if (ball.x - ball.radius < 0) {
    computerScore.value++;
    resetBall();
  }
  if (ball.x + ball.radius > canvasWidth) {
    playerScore.value++;
    resetBall();
  }
};

const draw = () => {
  if (!ctx) return;

  // Clear canvas with Amiga gray
  ctx.fillStyle = '#a0a0a0';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Draw center line
  ctx.strokeStyle = '#000000';
  ctx.setLineDash([10, 5]);
  ctx.beginPath();
  ctx.moveTo(canvasWidth / 2, 0);
  ctx.lineTo(canvasWidth / 2, canvasHeight);
  ctx.stroke();
  ctx.setLineDash([]);

  // Draw paddles
  ctx.fillStyle = '#0055aa';
  ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
  ctx.fillRect(computerPaddle.x, computerPaddle.y, computerPaddle.width, computerPaddle.height);

  // Draw ball
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fill();

  // Draw paddle borders (Amiga style)
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.strokeRect(paddle.x, paddle.y, paddle.width, paddle.height);
  ctx.strokeRect(computerPaddle.x, computerPaddle.y, computerPaddle.width, computerPaddle.height);
};

const resetBall = () => {
  ball.x = canvasWidth / 2;
  ball.y = canvasHeight / 2;
  ball.dx = (Math.random() > 0.5 ? 1 : -1) * ball.speed;
  ball.dy = (Math.random() - 0.5) * 6;
};

const togglePause = () => {
  isPaused.value = !isPaused.value;
};

const resetGame = () => {
  playerScore.value = 0;
  computerScore.value = 0;
  paddle.y = canvasHeight / 2 - 40;
  computerPaddle.y = canvasHeight / 2 - 40;
  resetBall();
  isPaused.value = false;
};
</script>

<style scoped>
.pong-game {
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
  font-size: 11px;
  color: #000000;
  text-align: center;
  margin-bottom: 8px;
}

.separator {
  margin: 0 12px;
  color: #555555;
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

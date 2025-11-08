<template>
  <div class="breakout-game" tabindex="0" @keydown="handleKeyDown" @keyup="handleKeyUp" @mousemove="handleMouseMove">
    <div class="game-header">
      <div class="score">
        Score: {{ score }} | Lives: {{ lives }} | Level: {{ level }}
      </div>
      <div class="controls-hint">
        Use Mouse or Arrow Keys to move paddle
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
const lives = ref(3);
const level = ref(1);
const isPaused = ref(false);
const isPlaying = ref(false);

let ctx: CanvasRenderingContext2D | null = null;
let animationId: number | null = null;

interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  hits: number;
  color: string;
}

const paddle = {
  width: 80,
  height: 12,
  x: canvasWidth / 2 - 40,
  y: canvasHeight - 30,
  speed: 8,
  dx: 0
};

const ball = {
  x: canvasWidth / 2,
  y: canvasHeight - 50,
  radius: 6,
  dx: 3,
  dy: -3,
  speed: 3
};

const bricks = ref<Brick[]>([]);
const brickRowCount = 5;
const brickColumnCount = 8;
const brickWidth = 65;
const brickHeight = 20;
const brickPadding = 5;
const brickOffsetTop = 50;
const brickOffsetLeft = 20;

const keys = {
  left: false,
  right: false
};

onMounted(() => {
  if (canvas.value) {
    ctx = canvas.value.getContext('2d');
    if (ctx) {
      initBricks();
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
  e.preventDefault();
};

const handleKeyUp = (e: KeyboardEvent) => {
  const key = e.key.toLowerCase();
  if (key === 'arrowleft') keys.left = false;
  if (key === 'arrowright') keys.right = false;
};

const handleMouseMove = (e: MouseEvent) => {
  if (!canvas.value || !isPlaying.value) return;
  const rect = canvas.value.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  paddle.x = Math.max(0, Math.min(canvasWidth - paddle.width, mouseX - paddle.width / 2));
};

const initBricks = () => {
  bricks.value = [];
  const colors = ['#ff0000', '#ff8800', '#ffff00', '#00ff00', '#0055aa'];

  for (let row = 0; row < brickRowCount; row++) {
    for (let col = 0; col < brickColumnCount; col++) {
      bricks.value.push({
        x: col * (brickWidth + brickPadding) + brickOffsetLeft,
        y: row * (brickHeight + brickPadding) + brickOffsetTop,
        width: brickWidth,
        height: brickHeight,
        hits: brickRowCount - row,
        color: colors[row % colors.length]
      });
    }
  }
};

const startGame = () => {
  isPlaying.value = true;
  isPaused.value = false;
  gameLoop();
};

const gameLoop = () => {
  if (!isPaused.value && isPlaying.value) {
    update();
    draw();
  }
  animationId = requestAnimationFrame(gameLoop);
};

const update = () => {
  // Move paddle
  if (keys.left) {
    paddle.x = Math.max(0, paddle.x - paddle.speed);
  }
  if (keys.right) {
    paddle.x = Math.min(canvasWidth - paddle.width, paddle.x + paddle.speed);
  }

  // Move ball
  ball.x += ball.dx;
  ball.y += ball.dy;

  // Ball collision with walls
  if (ball.x - ball.radius < 0 || ball.x + ball.radius > canvasWidth) {
    ball.dx *= -1;
  }
  if (ball.y - ball.radius < 0) {
    ball.dy *= -1;
  }

  // Ball collision with paddle
  if (
    ball.y + ball.radius > paddle.y &&
    ball.y - ball.radius < paddle.y + paddle.height &&
    ball.x > paddle.x &&
    ball.x < paddle.x + paddle.width
  ) {
    ball.dy = -Math.abs(ball.dy);
    // Add spin based on where ball hits paddle
    const hitPos = (ball.x - paddle.x) / paddle.width;
    ball.dx = (hitPos - 0.5) * 6;
  }

  // Ball collision with bricks
  for (let i = bricks.value.length - 1; i >= 0; i--) {
    const brick = bricks.value[i];
    if (
      ball.x > brick.x &&
      ball.x < brick.x + brick.width &&
      ball.y > brick.y &&
      ball.y < brick.y + brick.height
    ) {
      ball.dy *= -1;
      brick.hits--;

      if (brick.hits <= 0) {
        score.value += 10 * level.value;
        bricks.value.splice(i, 1);
      } else {
        score.value += 5 * level.value;
      }

      // Check if level complete
      if (bricks.value.length === 0) {
        levelUp();
      }
      break;
    }
  }

  // Ball falls below paddle
  if (ball.y - ball.radius > canvasHeight) {
    lives.value--;
    if (lives.value <= 0) {
      gameOver();
    } else {
      resetBall();
    }
  }
};

const draw = () => {
  if (!ctx) return;

  // Clear canvas
  ctx.fillStyle = '#a0a0a0';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Draw bricks
  bricks.value.forEach(brick => {
    // Brick fill
    ctx!.fillStyle = brick.color;
    ctx!.fillRect(brick.x, brick.y, brick.width, brick.height);

    // Amiga-style 3D border
    ctx!.strokeStyle = '#ffffff';
    ctx!.lineWidth = 2;
    ctx!.beginPath();
    ctx!.moveTo(brick.x, brick.y + brick.height);
    ctx!.lineTo(brick.x, brick.y);
    ctx!.lineTo(brick.x + brick.width, brick.y);
    ctx!.stroke();

    ctx!.strokeStyle = '#000000';
    ctx!.beginPath();
    ctx!.moveTo(brick.x + brick.width, brick.y);
    ctx!.lineTo(brick.x + brick.width, brick.y + brick.height);
    ctx!.lineTo(brick.x, brick.y + brick.height);
    ctx!.stroke();

    // Draw hit indicator
    if (brick.hits > 1) {
      ctx!.fillStyle = '#ffffff';
      ctx!.font = '10px "Press Start 2P"';
      ctx!.textAlign = 'center';
      ctx!.fillText(brick.hits.toString(), brick.x + brick.width / 2, brick.y + brick.height / 2 + 4);
    }
  });

  // Draw paddle
  ctx.fillStyle = '#0055aa';
  ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);

  // Paddle border
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.strokeRect(paddle.x, paddle.y, paddle.width, paddle.height);

  // Draw ball
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#0055aa';
  ctx.lineWidth = 2;
  ctx.stroke();
};

const resetBall = () => {
  ball.x = canvasWidth / 2;
  ball.y = canvasHeight - 50;
  ball.dx = 3 * (Math.random() > 0.5 ? 1 : -1);
  ball.dy = -3;
  isPaused.value = true;
  setTimeout(() => {
    isPaused.value = false;
  }, 1000);
};

const levelUp = () => {
  level.value++;
  ball.speed += 0.5;
  ball.dx = ball.dx > 0 ? ball.speed : -ball.speed;
  ball.dy = -ball.speed;
  initBricks();
  resetBall();
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
  level.value = 1;
  ball.speed = 3;
  paddle.x = canvasWidth / 2 - 40;
  isPaused.value = false;
  isPlaying.value = false;
  initBricks();
  resetBall();
  draw();
};
</script>

<style scoped>
.breakout-game {
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
  cursor: none;
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

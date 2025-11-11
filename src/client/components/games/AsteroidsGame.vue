<template>
  <div class="asteroids-game" tabindex="0" @keydown="handleKeyDown" @keyup="handleKeyUp">
    <div class="game-header">
      <div class="score">
        Score: {{ score }} | Lives: {{ lives }} | Level: {{ level }}
      </div>
      <div class="controls-hint">
        ← → Rotate | ↑ Thrust | SPACE Fire
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

interface Vector {
  x: number;
  y: number;
}

interface Ship {
  x: number;
  y: number;
  angle: number;
  velocity: Vector;
  radius: number;
}

interface Asteroid {
  x: number;
  y: number;
  velocity: Vector;
  radius: number;
  points: Vector[];
  size: 'large' | 'medium' | 'small';
}

interface Bullet {
  x: number;
  y: number;
  velocity: Vector;
  life: number;
}

const ship: Ship = {
  x: canvasWidth / 2,
  y: canvasHeight / 2,
  angle: 0,
  velocity: { x: 0, y: 0 },
  radius: 15
};

const asteroids = ref<Asteroid[]>([]);
const bullets = ref<Bullet[]>([]);

const keys = {
  left: false,
  right: false,
  thrust: false,
  fire: false
};

let invulnerable = false;
let fireDelay = 0;

onMounted(() => {
  if (canvas.value) {
    ctx = canvas.value.getContext('2d');
    if (ctx) {
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
  if (key === 'arrowup') keys.thrust = true;
  if (key === ' ') keys.fire = true;
  e.preventDefault();
};

const handleKeyUp = (e: KeyboardEvent) => {
  const key = e.key.toLowerCase();
  if (key === 'arrowleft') keys.left = false;
  if (key === 'arrowright') keys.right = false;
  if (key === 'arrowup') keys.thrust = false;
  if (key === ' ') keys.fire = false;
};

const startGame = () => {
  isPlaying.value = true;
  isPaused.value = false;
  resetShip();
  createAsteroids(3 + level.value);
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
  // Rotate ship
  if (keys.left) ship.angle -= 0.1;
  if (keys.right) ship.angle += 0.1;

  // Thrust
  if (keys.thrust) {
    ship.velocity.x += Math.cos(ship.angle) * 0.3;
    ship.velocity.y += Math.sin(ship.angle) * 0.3;
  }

  // Apply friction
  ship.velocity.x *= 0.99;
  ship.velocity.y *= 0.99;

  // Move ship
  ship.x += ship.velocity.x;
  ship.y += ship.velocity.y;

  // Wrap around screen
  ship.x = (ship.x + canvasWidth) % canvasWidth;
  ship.y = (ship.y + canvasHeight) % canvasHeight;

  // Fire bullets
  if (keys.fire && fireDelay <= 0) {
    bullets.value.push({
      x: ship.x + Math.cos(ship.angle) * ship.radius,
      y: ship.y + Math.sin(ship.angle) * ship.radius,
      velocity: {
        x: Math.cos(ship.angle) * 8 + ship.velocity.x,
        y: Math.sin(ship.angle) * 8 + ship.velocity.y
      },
      life: 60
    });
    fireDelay = 10;
  }
  if (fireDelay > 0) fireDelay--;

  // Update bullets
  bullets.value = bullets.value.filter(bullet => {
    bullet.x += bullet.velocity.x;
    bullet.y += bullet.velocity.y;
    bullet.x = (bullet.x + canvasWidth) % canvasWidth;
    bullet.y = (bullet.y + canvasHeight) % canvasHeight;
    bullet.life--;
    return bullet.life > 0;
  });

  // Update asteroids
  asteroids.value.forEach(asteroid => {
    asteroid.x += asteroid.velocity.x;
    asteroid.y += asteroid.velocity.y;
    asteroid.x = (asteroid.x + canvasWidth) % canvasWidth;
    asteroid.y = (asteroid.y + canvasHeight) % canvasHeight;
  });

  // Check bullet-asteroid collisions
  for (let i = bullets.value.length - 1; i >= 0; i--) {
    for (let j = asteroids.value.length - 1; j >= 0; j--) {
      const bullet = bullets.value[i];
      const asteroid = asteroids.value[j];

      if (bullet && asteroid && distance(bullet, asteroid) < asteroid.radius) {
        // Remove bullet and asteroid
        bullets.value.splice(i, 1);
        const destroyedAsteroid = asteroids.value.splice(j, 1)[0];

        // Add score
        const scoreValues = { large: 20, medium: 50, small: 100 };
        score.value += scoreValues[destroyedAsteroid.size];

        // Split asteroid
        if (destroyedAsteroid.size === 'large') {
          createAsteroidFragments(destroyedAsteroid, 'medium', 2);
        } else if (destroyedAsteroid.size === 'medium') {
          createAsteroidFragments(destroyedAsteroid, 'small', 2);
        }

        break;
      }
    }
  }

  // Check ship-asteroid collisions
  if (!invulnerable) {
    for (const asteroid of asteroids.value) {
      if (distance(ship, asteroid) < ship.radius + asteroid.radius) {
        lives.value--;
        if (lives.value <= 0) {
          gameOver();
        } else {
          resetShip();
          invulnerable = true;
          setTimeout(() => { invulnerable = false; }, 2000);
        }
        break;
      }
    }
  }

  // Level complete
  if (asteroids.value.length === 0 && isPlaying.value) {
    level.value++;
    createAsteroids(3 + level.value);
  }
};

const draw = () => {
  if (!ctx) return;

  // Clear canvas
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Draw stars
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 50; i++) {
    const x = (i * 123) % canvasWidth;
    const y = (i * 456) % canvasHeight;
    ctx.fillRect(x, y, 1, 1);
  }

  // Draw ship
  if (!invulnerable || Math.floor(Date.now() / 100) % 2 === 0) {
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.strokeStyle = '#0055aa';
    ctx.fillStyle = '#0055aa';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ship.radius, 0);
    ctx.lineTo(-ship.radius, -ship.radius / 2);
    ctx.lineTo(-ship.radius / 2, 0);
    ctx.lineTo(-ship.radius, ship.radius / 2);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();

    // Thrust flame
    if (keys.thrust) {
      ctx.fillStyle = '#ff8800';
      ctx.beginPath();
      ctx.moveTo(-ship.radius / 2, -ship.radius / 4);
      ctx.lineTo(-ship.radius - 8, 0);
      ctx.lineTo(-ship.radius / 2, ship.radius / 4);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  // Draw asteroids
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  asteroids.value.forEach(asteroid => {
    ctx!.save();
    ctx!.translate(asteroid.x, asteroid.y);
    ctx!.beginPath();
    ctx!.moveTo(asteroid.points[0].x, asteroid.points[0].y);
    for (let i = 1; i < asteroid.points.length; i++) {
      ctx!.lineTo(asteroid.points[i].x, asteroid.points[i].y);
    }
    ctx!.closePath();
    ctx!.stroke();
    ctx!.restore();
  });

  // Draw bullets
  ctx.fillStyle = '#ffffff';
  bullets.value.forEach(bullet => {
    ctx!.beginPath();
    ctx!.arc(bullet.x, bullet.y, 2, 0, Math.PI * 2);
    ctx!.fill();
  });
};

const createAsteroids = (count: number) => {
  for (let i = 0; i < count; i++) {
    createAsteroid('large');
  }
};

const createAsteroid = (size: 'large' | 'medium' | 'small') => {
  const radiusMap = { large: 40, medium: 25, small: 15 };
  const radius = radiusMap[size];

  // Random position away from ship
  let x, y;
  do {
    x = Math.random() * canvasWidth;
    y = Math.random() * canvasHeight;
  } while (distance({ x, y }, ship) < 100);

  const points: Vector[] = [];
  const numPoints = 8 + Math.floor(Math.random() * 4);
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2;
    const r = radius + (Math.random() - 0.5) * radius * 0.4;
    points.push({
      x: Math.cos(angle) * r,
      y: Math.sin(angle) * r
    });
  }

  asteroids.value.push({
    x,
    y,
    velocity: {
      x: (Math.random() - 0.5) * 2,
      y: (Math.random() - 0.5) * 2
    },
    radius,
    points,
    size
  });
};

const createAsteroidFragments = (
  parent: Asteroid,
  size: 'medium' | 'small',
  count: number
) => {
  const radiusMap = { medium: 25, small: 15 };
  const radius = radiusMap[size];

  for (let i = 0; i < count; i++) {
    const points: Vector[] = [];
    const numPoints = 6 + Math.floor(Math.random() * 3);
    for (let j = 0; j < numPoints; j++) {
      const angle = (j / numPoints) * Math.PI * 2;
      const r = radius + (Math.random() - 0.5) * radius * 0.4;
      points.push({
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r
      });
    }

    asteroids.value.push({
      x: parent.x,
      y: parent.y,
      velocity: {
        x: (Math.random() - 0.5) * 3,
        y: (Math.random() - 0.5) * 3
      },
      radius,
      points,
      size
    });
  }
};

const distance = (a: { x: number; y: number }, b: { x: number; y: number }): number => {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
};

const resetShip = () => {
  ship.x = canvasWidth / 2;
  ship.y = canvasHeight / 2;
  ship.angle = 0;
  ship.velocity = { x: 0, y: 0 };
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
  isPaused.value = false;
  isPlaying.value = false;
  asteroids.value = [];
  bullets.value = [];
  resetShip();
  draw();
};
</script>

<style scoped>
.asteroids-game {
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

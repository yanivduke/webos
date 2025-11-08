<template>
  <div class="game-runner">
    <div v-if="loading" class="loading-screen">
      <div class="loading-text">Loading {{ gameName }}...</div>
    </div>
    <div v-else-if="error" class="error-screen">
      <div class="error-text">{{ error }}</div>
      <button class="amiga-button" @click="$emit('close')">Close</button>
    </div>
    <component v-else :is="gameComponent" :data="gameData" />
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed, markRaw } from 'vue';
import type { Component } from 'vue';
import PongGame from './PongGame.vue';
import SnakeGame from './SnakeGame.vue';
import BreakoutGame from './BreakoutGame.vue';
import TetrisGame from './TetrisGame.vue';
import AsteroidsGame from './AsteroidsGame.vue';
import SpaceInvadersGame from './SpaceInvadersGame.vue';
import SokobanGame from './SokobanGame.vue';
import Game2048 from './Game2048.vue';
import MinesweeperGame from './MinesweeperGame.vue';

interface Props {
  data?: {
    game?: any;
    filePath?: string;
    meta?: {
      name?: string;
      gameId?: string;
      component?: string;
    };
  };
}

const props = defineProps<Props>();

const loading = ref(true);
const error = ref<string | null>(null);
const gameComponent = ref<Component | null>(null);

const gameName = computed(() => {
  return props.data?.meta?.name || props.data?.game?.name || 'Game';
});

const gameData = computed(() => {
  return props.data?.game || {};
});

// Map component names to actual components
const componentMap: { [key: string]: Component } = {
  'PongGame': markRaw(PongGame),
  'SnakeGame': markRaw(SnakeGame),
  'BreakoutGame': markRaw(BreakoutGame),
  'TetrisGame': markRaw(TetrisGame),
  'AsteroidsGame': markRaw(AsteroidsGame),
  'SpaceInvadersGame': markRaw(SpaceInvadersGame),
  'SokobanGame': markRaw(SokobanGame),
  'Game2048': markRaw(Game2048),
  'MinesweeperGame': markRaw(MinesweeperGame)
};

onMounted(async () => {
  try {
    const componentName = props.data?.game?.component || props.data?.meta?.component;

    if (!componentName) {
      throw new Error('No game component specified');
    }

    // Load the component
    const component = componentMap[componentName];

    if (!component) {
      throw new Error(`Game component "${componentName}" not found`);
    }

    gameComponent.value = component;
    loading.value = false;
  } catch (err) {
    console.error('Failed to load game:', err);
    error.value = err instanceof Error ? err.message : 'Failed to load game';
    loading.value = false;
  }
});
</script>

<style scoped>
.game-runner {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #a0a0a0;
}

.loading-screen,
.error-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.loading-text,
.error-text {
  font-family: 'Press Start 2P', monospace;
  font-size: 10px;
  color: #000000;
  text-align: center;
  margin-bottom: 20px;
}

.error-text {
  color: #ff0000;
}

.amiga-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 8px 20px;
  font-size: 10px;
  cursor: pointer;
  color: #000000;
  font-family: 'Press Start 2P', monospace;
}

.amiga-button:hover {
  background: #b0b0b0;
}

.amiga-button:active {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}
</style>

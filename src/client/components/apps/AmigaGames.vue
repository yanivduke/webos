<template>
  <div class="games-browser">
    <div class="games-header">
      <div class="header-info">
        <span class="games-count">{{ availableGames.length }} games available</span>
        <span class="theme-indicator">Theme: {{ currentThemeName }}</span>
      </div>
    </div>

    <div class="games-grid">
      <div
        v-for="game in availableGames"
        :key="game.id"
        class="game-item"
        :class="{ selected: selectedGame === game.id }"
        @click="selectGame(game.id)"
        @dblclick="launchGame(game)"
      >
        <div class="game-icon">
          <div class="icon-emoji">{{ game.icon }}</div>
        </div>
        <div class="game-name">{{ game.name }}</div>
      </div>
    </div>

    <div class="games-footer">
      <div class="game-info" v-if="selectedGameInfo">
        <div class="info-line">
          <strong>{{ selectedGameInfo.name }}</strong>
        </div>
        <div class="info-line">
          {{ selectedGameInfo.description }}
        </div>
        <div class="info-line type-info">
          Type: {{ selectedGameInfo.type }}
        </div>
      </div>
      <div class="game-actions">
        <button
          class="amiga-button"
          :disabled="!selectedGame"
          @click="launchSelectedGame"
        >
          Play Game
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { getGamesForTheme, getGameById, type Game } from '../../utils/games-config';
import desktopCustomizer from '../../utils/desktop-customizer';

interface Props {
  data?: {
    themeOverride?: string;
  };
}

const props = defineProps<Props>();
const emit = defineEmits(['launchGame']);

const selectedGame = ref<string | null>(null);
const currentTheme = ref('workbench-31');
const currentThemeName = ref('Workbench 3.1');

// Get available games based on current theme
const availableGames = computed(() => {
  const themeId = props.data?.themeOverride || currentTheme.value;
  return getGamesForTheme(themeId);
});

const selectedGameInfo = computed(() => {
  if (!selectedGame.value) return null;
  return getGameById(selectedGame.value);
});

onMounted(() => {
  // Get current theme
  const theme = desktopCustomizer.getCurrentTheme();
  currentTheme.value = theme.id;
  currentThemeName.value = theme.name;

  console.log('Games loaded for theme:', currentTheme.value);
  console.log('Available games:', availableGames.value.length);
});

const selectGame = (gameId: string) => {
  selectedGame.value = gameId;
};

const launchGame = (game: Game) => {
  console.log('Launching game:', game.name);
  emit('launchGame', game);
};

const launchSelectedGame = () => {
  if (selectedGame.value) {
    const game = getGameById(selectedGame.value);
    if (game) {
      launchGame(game);
    }
  }
};
</script>

<style scoped>
.games-browser {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #a0a0a0;
  font-family: 'Press Start 2P', 'Courier New', monospace;
}

.games-header {
  background: #ffffff;
  border-bottom: 2px solid #000000;
  padding: 8px 12px;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
}

.header-info {
  display: flex;
  justify-content: space-between;
  font-size: 9px;
  color: #000000;
}

.games-count {
  color: #0055aa;
  font-weight: bold;
}

.theme-indicator {
  color: #555555;
}

.games-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(95px, 1fr));
  gap: 24px;
  padding: 24px;
  overflow-y: auto;
  align-content: start;
}

.game-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  padding: 12px;
  border: 2px solid transparent;
  transition: all 0.15s ease;
  user-select: none;
  border-radius: 2px;
}

.game-item:hover {
  background: rgba(0, 85, 170, 0.15);
  border: 2px solid;
  border-color: rgba(255, 255, 255, 0.6) rgba(0, 0, 0, 0.3) rgba(0, 0, 0, 0.3) rgba(255, 255, 255, 0.6);
  transform: translateY(-3px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.game-item.selected {
  background: rgba(0, 85, 170, 0.4);
  border: 2px solid;
  border-color: #0066cc #003388 #003388 #0066cc;
  box-shadow: inset 0 1px 3px rgba(255, 255, 255, 0.2), 0 3px 6px rgba(0, 0, 0, 0.3);
  transform: scale(1.05);
}

.game-icon {
  width: 70px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #999999 0%, #888888 50%, #777777 100%);
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  margin-bottom: 10px;
  transition: all 0.15s ease;
  box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.game-item:hover .game-icon {
  transform: scale(1.1) rotateZ(2deg);
  box-shadow: 3px 3px 6px rgba(0, 0, 0, 0.4);
}

.game-item.selected .game-icon {
  border-color: #ffaa00 #ff6600 #ff6600 #ffaa00;
  background: linear-gradient(135deg, #aaaaaa 0%, #999999 50%, #888888 100%);
}

.icon-emoji {
  font-size: 36px;
  transition: transform 0.15s ease;
}

.game-item:hover .icon-emoji {
  transform: scale(1.15);
}

.game-name {
  font-size: 8px;
  text-align: center;
  color: #000000;
  word-break: break-word;
  max-width: 90px;
  padding: 3px 6px;
  background: rgba(255, 255, 255, 0.85);
  border-radius: 2px;
  transition: all 0.15s ease;
  line-height: 1.4;
  text-shadow: none;
}

.game-item:hover .game-name {
  background: rgba(255, 255, 255, 0.95);
  transform: scale(1.05);
}

.game-item.selected .game-name {
  color: #ffffff;
  background: rgba(0, 85, 170, 0.8);
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
}

.games-footer {
  background: #ffffff;
  border-top: 2px solid #000000;
  padding: 12px;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
}

.game-info {
  margin-bottom: 12px;
  min-height: 60px;
  padding: 8px;
  background: #a0a0a0;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
}

.info-line {
  font-size: 8px;
  color: #000000;
  margin-bottom: 4px;
  line-height: 1.4;
}

.type-info {
  color: #555555;
  margin-top: 4px;
}

.game-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.amiga-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 6px 16px;
  font-size: 10px;
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
  color: #808080;
  cursor: not-allowed;
  background: #999999;
}

/* Scrollbar styling */
.games-grid::-webkit-scrollbar {
  width: 16px;
}

.games-grid::-webkit-scrollbar-track {
  background: #808080;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
}

.games-grid::-webkit-scrollbar-thumb {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
}

.games-grid::-webkit-scrollbar-thumb:hover {
  background: #b0b0b0;
}
</style>

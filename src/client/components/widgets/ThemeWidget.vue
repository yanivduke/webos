<template>
  <div class="theme-widget-content">
    <div class="theme-info">
      <div class="info-row">
        <span class="label">Current Theme:</span>
        <span class="value">{{ currentTheme === 'bright' ? 'Bright' : 'Dark' }}</span>
      </div>
      <div class="theme-icon">
        <svg v-if="currentTheme === 'bright'" viewBox="0 0 64 64" class="sun-icon">
          <circle cx="32" cy="32" r="12" fill="#ffaa00"/>
          <line x1="32" y1="8" x2="32" y2="16" stroke="#ffaa00" stroke-width="3"/>
          <line x1="32" y1="48" x2="32" y2="56" stroke="#ffaa00" stroke-width="3"/>
          <line x1="8" y1="32" x2="16" y2="32" stroke="#ffaa00" stroke-width="3"/>
          <line x1="48" y1="32" x2="56" y2="32" stroke="#ffaa00" stroke-width="3"/>
          <line x1="16" y1="16" x2="22" y2="22" stroke="#ffaa00" stroke-width="3"/>
          <line x1="42" y1="42" x2="48" y2="48" stroke="#ffaa00" stroke-width="3"/>
          <line x1="42" y1="22" x2="48" y2="16" stroke="#ffaa00" stroke-width="3"/>
          <line x1="16" y1="48" x2="22" y2="42" stroke="#ffaa00" stroke-width="3"/>
        </svg>
        <svg v-else viewBox="0 0 64 64" class="moon-icon">
          <path d="M 40 12 A 20 20 0 1 0 40 52 A 16 16 0 1 1 40 12" fill="#6699ff"/>
          <circle cx="36" cy="22" r="2" fill="#334466"/>
          <circle cx="30" cy="30" r="2" fill="#334466"/>
          <circle cx="36" cy="40" r="2" fill="#334466"/>
        </svg>
      </div>
    </div>

    <div class="theme-buttons">
      <button
        class="amiga-button theme-button"
        :class="{ active: currentTheme === 'bright' }"
        @click="setTheme('bright')"
      >
        <span class="button-icon">☀</span>
        <span class="button-label">Bright</span>
      </button>
      <button
        class="amiga-button theme-button"
        :class="{ active: currentTheme === 'dark' }"
        @click="setTheme('dark')"
      >
        <span class="button-icon">☾</span>
        <span class="button-label">Dark</span>
      </button>
    </div>

    <div class="theme-description">
      <p v-if="currentTheme === 'bright'">
        Classic Workbench bright theme with traditional Amiga gray.
      </p>
      <p v-else>
        Dark mode for comfortable night-time computing.
      </p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useTheme } from '../../composables/useTheme';

const { currentTheme, setTheme } = useTheme();
</script>

<style scoped>
.theme-widget-content {
  min-width: 220px;
}

.theme-info {
  margin-bottom: 12px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 9px;
}

.label {
  color: var(--theme-text);
  opacity: 0.8;
}

.value {
  color: var(--theme-highlight);
  font-weight: bold;
}

.theme-icon {
  width: 64px;
  height: 64px;
  margin: 12px auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sun-icon,
.moon-icon {
  width: 100%;
  height: 100%;
  filter: drop-shadow(2px 2px 3px var(--theme-shadow));
}

.theme-buttons {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.theme-button {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 4px;
  min-height: 60px;
  background: var(--theme-background);
  border: 2px solid;
  border-color: var(--theme-borderLight) var(--theme-borderDark) var(--theme-borderDark) var(--theme-borderLight);
  cursor: pointer;
  transition: all 0.1s;
  color: var(--theme-text);
}

.theme-button:hover {
  background: var(--theme-border);
}

.theme-button:active {
  border-color: var(--theme-borderDark) var(--theme-borderLight) var(--theme-borderLight) var(--theme-borderDark);
  transform: translateY(1px);
}

.theme-button.active {
  background: var(--theme-highlight);
  color: var(--theme-highlightText);
  border-color: var(--theme-borderDark) var(--theme-borderLight) var(--theme-borderLight) var(--theme-borderDark);
}

.button-icon {
  font-size: 20px;
  line-height: 1;
  font-family: Arial, sans-serif;
}

.button-label {
  font-size: 8px;
}

.theme-description {
  padding: 8px;
  background: rgba(0, 0, 0, 0.1);
  border: 1px solid var(--theme-border);
  border-radius: 2px;
  font-size: 8px;
  line-height: 1.4;
  color: var(--theme-text);
  text-align: center;
}

.theme-description p {
  margin: 0;
}
</style>

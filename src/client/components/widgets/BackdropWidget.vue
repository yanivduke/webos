<template>
  <div class="backdrop-widget-content">
    <!-- Current Pattern Info -->
    <div class="backdrop-info">
      <div class="info-row">
        <span class="label">Current Pattern:</span>
        <span class="value">{{ formatPatternName(currentSettings.pattern) }}</span>
      </div>
    </div>

    <!-- Pattern Selector Grid -->
    <div class="pattern-section">
      <div class="section-title">Pattern</div>
      <div class="pattern-grid">
        <div
          v-for="pattern in patterns"
          :key="pattern.id"
          class="pattern-preview"
          :class="{ active: currentSettings.pattern === pattern.id }"
          @click="selectPattern(pattern.id)"
          :title="pattern.name"
        >
          <div class="pattern-box" :style="getPatternPreviewStyle(pattern.id)"></div>
          <div class="pattern-name">{{ pattern.name }}</div>
        </div>
      </div>
    </div>

    <!-- Color Presets -->
    <div class="color-section">
      <div class="section-title">Color Presets</div>
      <div class="color-grid">
        <div
          v-for="preset in colorPresets"
          :key="preset.name"
          class="color-preset"
          :class="{ active: currentSettings.color === preset.color }"
          @click="selectColor(preset.color)"
          :title="preset.name"
        >
          <div class="color-box" :style="{ background: preset.color }"></div>
        </div>
      </div>
    </div>

    <!-- Custom Color Picker -->
    <div class="custom-color-section">
      <div class="section-title">Custom Color</div>
      <div class="color-picker-row">
        <input
          type="color"
          v-model="customColor"
          @change="selectColor(customColor)"
          class="color-input"
        />
        <div class="color-value">{{ currentSettings.color }}</div>
      </div>
    </div>

    <!-- Opacity Slider -->
    <div class="opacity-section">
      <div class="section-title">Opacity: {{ Math.round(currentSettings.opacity * 100) }}%</div>
      <input
        type="range"
        min="0"
        max="100"
        :value="currentSettings.opacity * 100"
        @input="handleOpacityChange"
        class="opacity-slider"
      />
    </div>

    <!-- Action Buttons -->
    <div class="action-buttons">
      <button class="amiga-button" @click="resetToDefault">
        Reset to Default
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { useBackdrop, type BackdropPattern } from '../../composables/useBackdrop';

const { currentSettings, setPattern, setColor, setOpacity, resetToDefault, colorPresets } = useBackdrop();

// Custom color value for the color picker
const customColor = ref(currentSettings.value.color);

// Available patterns
const patterns = [
  { id: 'solid' as BackdropPattern, name: 'Solid' },
  { id: 'checkerboard' as BackdropPattern, name: 'Checker' },
  { id: 'diagonal' as BackdropPattern, name: 'Diagonal' },
  { id: 'dots' as BackdropPattern, name: 'Dots' },
  { id: 'grid' as BackdropPattern, name: 'Grid' },
  { id: 'copper' as BackdropPattern, name: 'Copper' }
];

const formatPatternName = (pattern: BackdropPattern): string => {
  return patterns.find(p => p.id === pattern)?.name || pattern;
};

const selectPattern = (pattern: BackdropPattern) => {
  setPattern(pattern);
};

const selectColor = (color: string) => {
  setColor(color);
  customColor.value = color;
};

const getPatternPreviewStyle = (pattern: BackdropPattern): Record<string, string> => {
  const color = '#0055aa'; // Preview color (Amiga blue)
  const darkerColor = '#003377';
  const lighterColor = '#2277cc';

  switch (pattern) {
    case 'solid':
      return { background: color };

    case 'checkerboard':
      return {
        background: `
          repeating-conic-gradient(
            ${color} 0% 25%,
            ${darkerColor} 0% 50%
          ) 0 0 / 10px 10px
        `
      };

    case 'diagonal':
      return {
        background: `
          repeating-linear-gradient(
            45deg,
            ${color},
            ${color} 5px,
            ${darkerColor} 5px,
            ${darkerColor} 10px
          )
        `
      };

    case 'dots':
      return {
        background: `
          radial-gradient(circle, ${darkerColor} 1px, transparent 1px) 0 0 / 8px 8px,
          ${color}
        `
      };

    case 'grid':
      return {
        backgroundImage: `
          linear-gradient(${darkerColor} 1px, transparent 1px),
          linear-gradient(90deg, ${darkerColor} 1px, transparent 1px)
        `,
        backgroundSize: '10px 10px',
        backgroundColor: color
      };

    case 'copper':
      return {
        background: `
          linear-gradient(
            to bottom,
            ${color} 0%,
            ${lighterColor} 25%,
            ${darkerColor} 50%,
            ${lighterColor} 75%,
            ${color} 100%
          )
        `
      };

    default:
      return { background: color };
  }
};

const handleOpacityChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  setOpacity(parseInt(target.value) / 100);
};
</script>

<style scoped>
.backdrop-widget-content {
  min-width: 280px;
  max-width: 320px;
}

.backdrop-info {
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

.section-title {
  font-size: 9px;
  color: var(--theme-text);
  margin-bottom: 8px;
  font-weight: bold;
}

/* Pattern Grid */
.pattern-section {
  margin-bottom: 12px;
}

.pattern-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.pattern-preview {
  cursor: pointer;
  border: 2px solid;
  border-color: var(--theme-borderLight) var(--theme-borderDark) var(--theme-borderDark) var(--theme-borderLight);
  background: var(--theme-background);
  padding: 4px;
  transition: all 0.1s;
}

.pattern-preview:hover {
  border-color: var(--theme-highlight);
}

.pattern-preview.active {
  border-color: var(--theme-borderDark) var(--theme-borderLight) var(--theme-borderLight) var(--theme-borderDark);
  background: var(--theme-highlight);
}

.pattern-preview.active .pattern-name {
  color: var(--theme-highlightText);
}

.pattern-box {
  width: 100%;
  height: 50px;
  border: 1px solid var(--theme-borderDark);
  margin-bottom: 4px;
}

.pattern-name {
  font-size: 7px;
  text-align: center;
  color: var(--theme-text);
}

/* Color Grid */
.color-section {
  margin-bottom: 12px;
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}

.color-preset {
  cursor: pointer;
  border: 2px solid;
  border-color: var(--theme-borderLight) var(--theme-borderDark) var(--theme-borderDark) var(--theme-borderLight);
  padding: 2px;
  background: var(--theme-background);
  transition: all 0.1s;
}

.color-preset:hover {
  border-color: var(--theme-highlight);
}

.color-preset.active {
  border-color: var(--theme-borderDark) var(--theme-borderLight) var(--theme-borderLight) var(--theme-borderDark);
  box-shadow: inset 0 0 0 2px var(--theme-highlight);
}

.color-box {
  width: 100%;
  height: 30px;
  border: 1px solid var(--theme-borderDark);
}

/* Custom Color Picker */
.custom-color-section {
  margin-bottom: 12px;
}

.color-picker-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.color-input {
  width: 60px;
  height: 32px;
  border: 2px solid;
  border-color: var(--theme-borderLight) var(--theme-borderDark) var(--theme-borderDark) var(--theme-borderLight);
  cursor: pointer;
  background: var(--theme-background);
  padding: 2px;
}

.color-value {
  flex: 1;
  font-size: 9px;
  color: var(--theme-text);
  font-family: monospace;
}

/* Opacity Slider */
.opacity-section {
  margin-bottom: 12px;
}

.opacity-slider {
  width: 100%;
  height: 20px;
  -webkit-appearance: none;
  appearance: none;
  background: var(--theme-background);
  border: 2px solid;
  border-color: var(--theme-borderDark) var(--theme-borderLight) var(--theme-borderLight) var(--theme-borderDark);
  outline: none;
  cursor: pointer;
}

.opacity-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: var(--theme-highlight);
  border: 1px solid var(--theme-borderDark);
  cursor: pointer;
}

.opacity-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: var(--theme-highlight);
  border: 1px solid var(--theme-borderDark);
  cursor: pointer;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 8px;
}

.amiga-button {
  flex: 1;
  background: var(--theme-background);
  border: 2px solid;
  border-color: var(--theme-borderLight) var(--theme-borderDark) var(--theme-borderDark) var(--theme-borderLight);
  padding: 6px 8px;
  font-size: 8px;
  cursor: pointer;
  color: var(--theme-text);
  font-family: 'Press Start 2P', monospace;
  transition: all 0.1s;
}

.amiga-button:hover {
  background: var(--theme-border);
}

.amiga-button:active {
  border-color: var(--theme-borderDark) var(--theme-borderLight) var(--theme-borderLight) var(--theme-borderDark);
  transform: translateY(1px);
}
</style>

<template>
  <div class="theme-selector">
    <div class="selector-header">
      <h3>Choose Theme</h3>
      <p class="description">Select a retro OS theme to customize your desktop</p>
    </div>

    <div v-if="isLoading" class="loading">
      Loading themes...
    </div>

    <div v-else-if="error" class="error">
      {{ error }}
    </div>

    <div v-else class="theme-grid">
      <div
        v-for="theme in availableThemes"
        :key="theme.id"
        class="theme-card"
        :class="{ active: currentTheme?.id === theme.id }"
        @click="selectTheme(theme.id)"
      >
        <div class="theme-preview" :data-theme="theme.id">
          <div class="preview-titlebar"></div>
          <div class="preview-content"></div>
        </div>
        <div class="theme-info">
          <div class="theme-name">{{ theme.name }}</div>
          <div class="theme-description">{{ theme.description }}</div>
        </div>
        <div v-if="currentTheme?.id === theme.id" class="active-indicator">
          ✓ Active
        </div>
      </div>
    </div>

    <div class="selector-footer">
      <div class="current-theme-info" v-if="currentTheme">
        Current: <strong>{{ currentTheme.name }}</strong>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue';
import { useTheme } from '../composables/useTheme';

const {
  currentTheme,
  availableThemes,
  isLoading,
  error,
  fetchThemeList,
  switchTheme
} = useTheme();

onMounted(async () => {
  if (availableThemes.value.length === 0) {
    await fetchThemeList();
  }
});

const selectTheme = async (themeId: string) => {
  const success = await switchTheme(themeId);
  if (!success) {
    console.error(`Failed to switch to theme: ${themeId}`);
  }
};
</script>

<style scoped>
.theme-selector {
  padding: 20px;
  background: var(--window-content-bg);
  color: var(--color-text);
  font-family: var(--font-family);
  height: 100%;
  overflow-y: auto;
}

.selector-header {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid var(--color-border);
}

.selector-header h3 {
  font-size: var(--font-size-large);
  margin-bottom: 8px;
  color: var(--color-text);
}

.description {
  font-size: var(--font-size-small);
  color: var(--color-text-secondary);
  line-height: 1.4;
}

.loading,
.error {
  text-align: center;
  padding: 40px 20px;
  font-size: var(--font-size-base);
}

.error {
  color: var(--color-error);
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.theme-card {
  border: 2px solid;
  border-color: var(--color-border-light) var(--color-border-dark) var(--color-border-dark) var(--color-border-light);
  background: var(--color-surface);
  cursor: pointer;
  transition: all var(--animation-duration);
  position: relative;
  padding: 8px;
}

.theme-card:hover {
  background: var(--button-hover-bg);
  transform: translateY(-2px);
}

.theme-card.active {
  border-color: var(--color-accent);
  border-width: 3px;
  background: var(--color-selection);
  opacity: 0.9;
}

.theme-preview {
  width: 100%;
  height: 80px;
  margin-bottom: 8px;
  border: 1px solid var(--color-border);
  position: relative;
  overflow: hidden;
}

.preview-titlebar {
  height: 20px;
  background: var(--color-primary);
  border-bottom: 1px solid var(--color-border-dark);
}

.preview-content {
  height: calc(100% - 20px);
  background: var(--window-content-bg);
}

/* Theme-specific preview colors */
.theme-preview[data-theme="amiga"] .preview-titlebar {
  background: #a0a0a0;
}
.theme-preview[data-theme="amiga"] .preview-content {
  background: #ffffff;
}

.theme-preview[data-theme="commodore64"] .preview-titlebar {
  background: #5340bf;
}
.theme-preview[data-theme="commodore64"] .preview-content {
  background: #3e31a2;
}

.theme-preview[data-theme="atari-tos"] .preview-titlebar {
  background: #000000;
}
.theme-preview[data-theme="atari-tos"] .preview-content {
  background: #ffffff;
}

.theme-preview[data-theme="apple-iic"] .preview-titlebar {
  background: #1a1a1a;
}
.theme-preview[data-theme="apple-iic"] .preview-content {
  background: #0a0a0a;
}

.theme-preview[data-theme="apple-lisa"] .preview-titlebar {
  background: #ffffff;
}
.theme-preview[data-theme="apple-lisa"] .preview-content {
  background: #f0f0f0;
}

.theme-preview[data-theme="classic-mac"] .preview-titlebar {
  background: #dddddd;
}
.theme-preview[data-theme="classic-mac"] .preview-content {
  background: #cccccc;
}

.theme-info {
  padding: 4px 0;
}

.theme-name {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  margin-bottom: 4px;
  color: var(--color-text);
}

.theme-description {
  font-size: var(--font-size-small);
  color: var(--color-text-secondary);
  line-height: 1.3;
  min-height: 40px;
}

.active-indicator {
  position: absolute;
  top: 8px;
  right: 8px;
  background: var(--color-success);
  color: var(--color-border-light);
  padding: 2px 6px;
  font-size: var(--font-size-small);
  border-radius: 3px;
  font-weight: var(--font-weight-bold);
}

.selector-footer {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 2px solid var(--color-border);
  font-size: var(--font-size-small);
}

.current-theme-info {
  color: var(--color-text-secondary);
}

.current-theme-info strong {
  color: var(--color-primary);
  font-weight: var(--font-weight-bold);
}
</style>

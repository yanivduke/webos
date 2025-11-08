<template>
  <div class="shortcuts-widget-content">
    <div class="shortcuts-header">
      <div class="header-info">
        <span class="shortcut-count">{{ shortcutCount }} shortcuts available</span>
      </div>
    </div>

    <div class="shortcuts-tabs">
      <button
        v-for="category in categories"
        :key="category.id"
        class="tab-button"
        :class="{ active: activeCategory === category.id }"
        @click="activeCategory = category.id"
      >
        {{ category.label }}
      </button>
    </div>

    <div class="shortcuts-list">
      <div
        v-for="shortcut in filteredShortcuts"
        :key="shortcut.description"
        class="shortcut-item"
      >
        <div class="shortcut-description">{{ shortcut.description }}</div>
        <div class="shortcut-keys">{{ formatShortcut(shortcut) }}</div>
      </div>
      <div v-if="filteredShortcuts.length === 0" class="no-shortcuts">
        No shortcuts in this category
      </div>
    </div>

    <div class="shortcuts-footer">
      <div class="footer-note">
        Press Esc to close menus and dialogs
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { useGlobalKeyboardShortcuts, formatShortcut } from '../../composables/useKeyboardShortcuts';

const { getAllShortcuts, getShortcutsByCategory } = useGlobalKeyboardShortcuts();

const activeCategory = ref<string>('all');

const categories = [
  { id: 'all', label: 'All' },
  { id: 'file', label: 'File' },
  { id: 'window', label: 'Window' },
  { id: 'navigation', label: 'Navigate' },
  { id: 'menu', label: 'Menu' },
  { id: 'tools', label: 'Tools' }
];

const filteredShortcuts = computed(() => {
  if (activeCategory.value === 'all') {
    return getAllShortcuts();
  }
  return getShortcutsByCategory(activeCategory.value);
});

const shortcutCount = computed(() => getAllShortcuts().length);
</script>

<style scoped>
.shortcuts-widget-content {
  min-width: 300px;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.shortcuts-header {
  padding-bottom: 8px;
  border-bottom: 2px solid var(--theme-border);
}

.header-info {
  font-size: 9px;
  color: var(--theme-text);
  text-align: center;
}

.shortcut-count {
  color: var(--theme-highlight);
  font-weight: bold;
}

.shortcuts-tabs {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.tab-button {
  flex: 1;
  min-width: 60px;
  padding: 6px 8px;
  font-size: 8px;
  background: var(--theme-background);
  border: 2px solid;
  border-color: var(--theme-borderLight) var(--theme-borderDark) var(--theme-borderDark) var(--theme-borderLight);
  color: var(--theme-text);
  cursor: pointer;
  transition: all 0.1s;
  font-family: 'Press Start 2P', monospace;
}

.tab-button:hover {
  background: var(--theme-border);
}

.tab-button:active {
  border-color: var(--theme-borderDark) var(--theme-borderLight) var(--theme-borderLight) var(--theme-borderDark);
  transform: translateY(1px);
}

.tab-button.active {
  background: var(--theme-highlight);
  color: var(--theme-highlightText);
  border-color: var(--theme-borderDark) var(--theme-borderLight) var(--theme-borderLight) var(--theme-borderDark);
}

.shortcuts-list {
  max-height: 300px;
  overflow-y: auto;
  padding: 4px;
  background: rgba(0, 0, 0, 0.05);
  border: 2px solid;
  border-color: var(--theme-borderDark) var(--theme-borderLight) var(--theme-borderLight) var(--theme-borderDark);
}

.shortcut-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  margin-bottom: 2px;
  background: var(--theme-background);
  border: 1px solid var(--theme-border);
  gap: 12px;
}

.shortcut-item:hover {
  background: var(--theme-border);
}

.shortcut-description {
  flex: 1;
  font-size: 8px;
  color: var(--theme-text);
  line-height: 1.3;
}

.shortcut-keys {
  font-size: 8px;
  font-weight: bold;
  color: var(--theme-highlight);
  white-space: nowrap;
  padding: 2px 6px;
  background: rgba(0, 0, 0, 0.1);
  border: 1px solid var(--theme-border);
  border-radius: 2px;
  font-family: 'Press Start 2P', monospace;
}

.no-shortcuts {
  padding: 20px;
  text-align: center;
  font-size: 8px;
  color: var(--theme-border);
  font-style: italic;
}

.shortcuts-footer {
  padding-top: 8px;
  border-top: 2px solid var(--theme-border);
}

.footer-note {
  font-size: 7px;
  color: var(--theme-text);
  text-align: center;
  opacity: 0.7;
  line-height: 1.4;
}

/* Scrollbar styling */
.shortcuts-list::-webkit-scrollbar {
  width: 12px;
}

.shortcuts-list::-webkit-scrollbar-track {
  background: var(--theme-background);
  border: 1px solid var(--theme-border);
}

.shortcuts-list::-webkit-scrollbar-thumb {
  background: var(--theme-border);
  border: 2px solid;
  border-color: var(--theme-borderLight) var(--theme-borderDark) var(--theme-borderDark) var(--theme-borderLight);
}

.shortcuts-list::-webkit-scrollbar-thumb:hover {
  background: var(--theme-highlight);
}
</style>

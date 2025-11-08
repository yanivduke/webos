<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="isVisible" class="command-palette-overlay" @click.self="close">
        <div class="command-palette">
          <!-- Title Bar -->
          <div class="palette-titlebar">
            <div class="palette-title">Command Palette</div>
            <div class="palette-close" @click="close">×</div>
          </div>

          <!-- Search Input -->
          <div class="search-section">
            <div class="search-icon">›</div>
            <input
              ref="searchInput"
              v-model="searchQuery"
              type="text"
              class="palette-input"
              placeholder="Type a command..."
              @keydown="handleKeyDown"
            />
          </div>

          <!-- Results -->
          <div class="results-section">
            <!-- Recent Commands (shown when no search query) -->
            <div v-if="!searchQuery && recentCommands.length > 0" class="recent-section">
              <div class="section-header">Recent</div>
              <div
                v-for="(command, index) in recentCommands"
                :key="'recent-' + command.id"
                class="command-item"
                :class="{ selected: selectedIndex === index }"
                @click="executeCommand(command)"
                @mouseenter="selectedIndex = index"
              >
                <div class="command-info">
                  <div class="command-label">{{ command.label }}</div>
                  <div class="command-description">{{ command.description }}</div>
                </div>
                <div class="command-category">{{ command.category }}</div>
              </div>
            </div>

            <!-- Search Results -->
            <div v-if="searchQuery" class="search-results">
              <div v-if="searchResults.length === 0" class="no-results">
                No commands found
              </div>
              <div
                v-for="(command, index) in searchResults"
                :key="command.id"
                class="command-item"
                :class="{ selected: selectedIndex === index }"
                @click="executeCommand(command)"
                @mouseenter="selectedIndex = index"
              >
                <div class="command-info">
                  <div class="command-label">
                    <span v-html="highlightMatch(command.label)"></span>
                  </div>
                  <div class="command-description">{{ command.description }}</div>
                </div>
                <div class="command-category">{{ command.category }}</div>
              </div>
            </div>

            <!-- All Commands by Category (no search, no recent) -->
            <div v-if="!searchQuery && recentCommands.length === 0" class="categorized-commands">
              <div
                v-for="category in categorizedCommands"
                :key="category.id"
                class="category-group"
              >
                <div class="section-header">{{ category.label }}</div>
                <div
                  v-for="(command, index) in category.commands"
                  :key="command.id"
                  class="command-item"
                  :class="{ selected: selectedIndex === getCategorizedIndex(category.id, index) }"
                  @click="executeCommand(command)"
                  @mouseenter="selectedIndex = getCategorizedIndex(category.id, index)"
                >
                  <div class="command-info">
                    <div class="command-label">{{ command.label }}</div>
                    <div class="command-description">{{ command.description }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="palette-footer">
            <div class="footer-hint">
              <span class="key-hint">↑↓</span> Navigate
              <span class="key-hint">Enter</span> Execute
              <span class="key-hint">Esc</span> Close
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script lang="ts" setup>
import { ref, computed, watch, nextTick } from 'vue';
import { commandPalette, type Command } from '../utils/command-palette';

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'close'): void;
}>();

const isVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
});

const searchInput = ref<HTMLInputElement | null>(null);
const searchQuery = ref('');
const selectedIndex = ref(0);

const recentCommands = computed(() => {
  return commandPalette.getRecentCommands();
});

const searchResults = computed(() => {
  if (!searchQuery.value) return [];
  return commandPalette.search(searchQuery.value);
});

const categorizedCommands = computed(() => {
  return commandPalette.getCategorizedCommands();
});

const maxVisibleItems = computed(() => {
  if (searchQuery.value) {
    return searchResults.value.length;
  } else if (recentCommands.value.length > 0) {
    return recentCommands.value.length;
  } else {
    // Count total items in categorized view
    let total = 0;
    categorizedCommands.value.forEach(cat => {
      total += cat.commands.length;
    });
    return total;
  }
});

// Get flat index for categorized commands
const getCategorizedIndex = (categoryId: string, commandIndex: number): number => {
  let index = 0;
  for (const cat of categorizedCommands.value) {
    if (cat.id === categoryId) {
      return index + commandIndex;
    }
    index += cat.commands.length;
  }
  return 0;
};

// Reset selection when search changes
watch(searchQuery, () => {
  selectedIndex.value = 0;
});

// Focus input when visible
watch(isVisible, async (visible) => {
  if (visible) {
    await nextTick();
    searchInput.value?.focus();
    selectedIndex.value = 0;
  } else {
    searchQuery.value = '';
  }
});

const handleKeyDown = (e: KeyboardEvent) => {
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      selectedIndex.value = Math.min(selectedIndex.value + 1, maxVisibleItems.value - 1);
      break;

    case 'ArrowUp':
      e.preventDefault();
      selectedIndex.value = Math.max(selectedIndex.value - 1, 0);
      break;

    case 'Enter':
      e.preventDefault();
      executeSelectedCommand();
      break;

    case 'Escape':
      e.preventDefault();
      close();
      break;
  }
};

const executeSelectedCommand = () => {
  let command: Command | undefined;

  if (searchQuery.value) {
    command = searchResults.value[selectedIndex.value];
  } else if (recentCommands.value.length > 0) {
    command = recentCommands.value[selectedIndex.value];
  } else {
    // Find command in categorized view
    let index = 0;
    for (const cat of categorizedCommands.value) {
      if (selectedIndex.value < index + cat.commands.length) {
        command = cat.commands[selectedIndex.value - index];
        break;
      }
      index += cat.commands.length;
    }
  }

  if (command) {
    executeCommand(command);
  }
};

const executeCommand = async (command: Command) => {
  await commandPalette.executeCommand(command.id);
  close();
};

const close = () => {
  isVisible.value = false;
  emit('close');
};

const highlightMatch = (text: string): string => {
  if (!searchQuery.value) return text;

  const query = searchQuery.value.toLowerCase();
  const lowerText = text.toLowerCase();
  const index = lowerText.indexOf(query);

  if (index === -1) return text;

  const before = text.substring(0, index);
  const match = text.substring(index, index + query.length);
  const after = text.substring(index + query.length);

  return `${before}<span class="highlight">${match}</span>${after}`;
};
</script>

<style scoped>
.command-palette-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 15vh;
  z-index: 9999;
  font-family: 'Press Start 2P', monospace;
}

.command-palette {
  width: 90%;
  max-width: 600px;
  background: #a0a0a0;
  border: 4px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  box-shadow: 8px 8px 0px rgba(0, 0, 0, 0.5);
  max-height: 70vh;
  display: flex;
  flex-direction: column;
}

.palette-titlebar {
  background: #0055aa;
  color: #ffffff;
  padding: 8px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #000000;
}

.palette-title {
  font-size: 10px;
  font-weight: bold;
}

.palette-close {
  font-size: 16px;
  cursor: pointer;
  padding: 0 8px;
  line-height: 1;
  user-select: none;
}

.palette-close:hover {
  color: #ffaa00;
}

.search-section {
  background: #ffffff;
  border-bottom: 2px solid #000000;
  display: flex;
  align-items: center;
  padding: 12px;
  gap: 8px;
}

.search-icon {
  font-size: 20px;
  color: #0055aa;
  font-weight: bold;
}

.palette-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-family: 'Press Start 2P', monospace;
  font-size: 10px;
  color: #000000;
}

.palette-input::placeholder {
  color: #888888;
}

.results-section {
  flex: 1;
  overflow-y: auto;
  background: #a0a0a0;
  max-height: 400px;
}

.recent-section,
.search-results,
.categorized-commands {
  padding: 8px;
}

.section-header {
  font-size: 8px;
  color: #0055aa;
  padding: 8px 12px 4px 12px;
  font-weight: bold;
  text-transform: uppercase;
  border-bottom: 1px solid #888888;
  margin-bottom: 4px;
}

.category-group {
  margin-bottom: 12px;
}

.command-item {
  background: #ffffff;
  border: 2px solid;
  border-color: #888888 #888888 #888888 #888888;
  padding: 10px 12px;
  margin-bottom: 4px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  transition: all 0.05s;
}

.command-item:hover,
.command-item.selected {
  background: #ffff00;
  border-color: #000000 #ffffff #ffffff #000000;
}

.command-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.command-label {
  font-size: 9px;
  color: #000000;
  font-weight: bold;
}

.command-label :deep(.highlight) {
  background: #ffaa00;
  color: #000000;
  padding: 0 2px;
}

.command-description {
  font-size: 7px;
  color: #666666;
}

.command-category {
  font-size: 7px;
  color: #0055aa;
  background: #e0e0e0;
  padding: 4px 8px;
  border: 1px solid #888888;
  white-space: nowrap;
  text-transform: uppercase;
}

.no-results {
  text-align: center;
  padding: 32px;
  font-size: 9px;
  color: #666666;
}

.palette-footer {
  background: #a0a0a0;
  border-top: 2px solid #888888;
  padding: 8px 12px;
}

.footer-hint {
  font-size: 7px;
  color: #000000;
  display: flex;
  gap: 12px;
  align-items: center;
}

.key-hint {
  background: #000000;
  color: #00ff00;
  padding: 2px 6px;
  border: 1px solid #00ff00;
  margin-left: 4px;
  font-weight: bold;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Scrollbar styling */
.results-section::-webkit-scrollbar {
  width: 12px;
}

.results-section::-webkit-scrollbar-track {
  background: #888888;
}

.results-section::-webkit-scrollbar-thumb {
  background: #0055aa;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
}

.results-section::-webkit-scrollbar-thumb:hover {
  background: #0066cc;
}
</style>

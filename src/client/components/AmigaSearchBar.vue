<template>
  <Teleport to="body">
    <div v-if="visible" class="search-overlay" @click="handleOverlayClick">
      <div class="search-container" @click.stop>
        <!-- Search Input -->
        <div class="search-header">
          <div class="search-icon">🔍</div>
          <input
            ref="searchInput"
            v-model="searchQuery"
            type="text"
            class="search-input"
            placeholder="Search WebOS..."
            @input="handleInput"
            @keydown.escape="close"
            @keydown.down.prevent="selectNext"
            @keydown.up.prevent="selectPrevious"
            @keydown.enter.prevent="openSelectedResult"
          />
        </div>

        <!-- Results List -->
        <div v-if="results.length > 0 || isSearching" class="search-results">
          <!-- Loading indicator -->
          <div v-if="isSearching" class="search-loading">
            <div class="loading-spinner"></div>
            <span>Searching...</span>
          </div>

          <!-- Results -->
          <div
            v-for="(result, index) in results"
            :key="`${result.type}-${result.name}-${index}`"
            class="search-result-item"
            :class="{ selected: selectedIndex === index }"
            @click="openResult(result)"
            @mouseenter="selectedIndex = index"
          >
            <div class="result-icon">{{ getResultIcon(result) }}</div>
            <div class="result-info">
              <div class="result-name">{{ result.name }}</div>
              <div class="result-meta">
                <span class="result-category">{{ result.category }}</span>
                <span v-if="result.path" class="result-path">{{ result.path }}</span>
                <span v-if="result.size" class="result-size">{{ result.size }}</span>
              </div>
            </div>
            <div class="result-badge">
              <span class="badge" :class="`badge-${result.type}`">
                {{ result.category }}
              </span>
            </div>
          </div>

          <!-- No results message -->
          <div v-if="!isSearching && results.length === 0 && searchQuery.trim() !== ''" class="no-results">
            <div class="no-results-icon">🔍</div>
            <div class="no-results-text">No results found for "{{ searchQuery }}"</div>
          </div>
        </div>

        <!-- Recent Searches -->
        <div v-else-if="recentSearches.length > 0 && searchQuery.trim() === ''" class="recent-searches">
          <div class="recent-header">
            <span>Recent Searches</span>
            <button class="clear-recent" @click="handleClearRecent">Clear</button>
          </div>
          <div
            v-for="(recent, index) in recentSearches"
            :key="`recent-${index}`"
            class="recent-item"
            @click="handleRecentClick(recent)"
          >
            <div class="recent-icon">🕐</div>
            <div class="recent-text">{{ recent }}</div>
          </div>
        </div>

        <!-- Empty state -->
        <div v-else class="empty-state">
          <div class="empty-icon">🔍</div>
          <div class="empty-text">Search files, apps, widgets, and more...</div>
          <div class="empty-hint">Press Ctrl+Space to open search</div>
        </div>

        <!-- Footer with keyboard hints -->
        <div class="search-footer">
          <div class="footer-hint">
            <span class="key">↑↓</span> Navigate
          </div>
          <div class="footer-hint">
            <span class="key">↵</span> Open
          </div>
          <div class="footer-hint">
            <span class="key">Esc</span> Close
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script lang="ts" setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { useSearch, type SearchResult } from '../composables/useSearch';

// Props
const props = defineProps<{
  visible: boolean;
}>();

// Emits
const emit = defineEmits<{
  close: [];
  openFile: [path: string, meta: any];
  openFolder: [path: string];
  openApp: [name: string];
  openWidget: [name: string];
  executeAction: [action: string, menu?: string];
}>();

// Search composable
const {
  query,
  results,
  isSearching,
  recentSearches,
  search,
  clearSearch,
  addRecentSearch,
  clearRecentSearches,
  getResultIcon
} = useSearch();

// Local state
const searchInput = ref<HTMLInputElement | null>(null);
const searchQuery = ref('');
const selectedIndex = ref(0);

// Watch for visibility changes to focus input
watch(() => props.visible, async (visible) => {
  if (visible) {
    await nextTick();
    searchInput.value?.focus();
    searchQuery.value = '';
    selectedIndex.value = 0;
  } else {
    clearSearch();
    searchQuery.value = '';
    selectedIndex.value = 0;
  }
});

// Handle input changes (debounced search)
const handleInput = () => {
  search(searchQuery.value, 300);
  selectedIndex.value = 0;
};

// Keyboard navigation
const selectNext = () => {
  if (results.value.length > 0) {
    selectedIndex.value = (selectedIndex.value + 1) % results.value.length;
  }
};

const selectPrevious = () => {
  if (results.value.length > 0) {
    selectedIndex.value = selectedIndex.value === 0
      ? results.value.length - 1
      : selectedIndex.value - 1;
  }
};

const openSelectedResult = () => {
  if (results.value.length > 0 && selectedIndex.value < results.value.length) {
    const result = results.value[selectedIndex.value];
    openResult(result);
  }
};

// Open a search result
const openResult = (result: SearchResult) => {
  // Add to recent searches
  addRecentSearch(searchQuery.value);

  // Emit appropriate event based on result type
  switch (result.type) {
    case 'file':
      if (result.path) {
        emit('openFile', result.path, { name: result.name, size: result.size });
      }
      break;
    case 'folder':
      if (result.path) {
        emit('openFolder', result.path);
      }
      break;
    case 'app':
      emit('openApp', result.name);
      break;
    case 'widget':
      emit('openWidget', result.name);
      break;
    case 'action':
      emit('executeAction', result.name, result.menu);
      break;
  }

  // Close search
  close();
};

// Handle recent search click
const handleRecentClick = (recent: string) => {
  searchQuery.value = recent;
  search(recent, 0); // Immediate search
};

// Clear recent searches
const handleClearRecent = () => {
  clearRecentSearches();
};

// Close search
const close = () => {
  emit('close');
};

// Handle overlay click
const handleOverlayClick = () => {
  close();
};
</script>

<style scoped>
/* Search Overlay */
.search-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 15vh;
  z-index: 2000;
  animation: fadeIn 0.15s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Search Container */
.search-container {
  width: 600px;
  max-width: 90vw;
  background: var(--theme-background);
  border: 2px solid;
  border-color: var(--theme-borderLight) var(--theme-borderDark) var(--theme-borderDark) var(--theme-borderLight);
  box-shadow: 4px 4px 12px rgba(0, 0, 0, 0.5);
  animation: slideDown 0.2s ease;
  font-family: 'Press Start 2P', monospace;
}

@keyframes slideDown {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Search Header */
.search-header {
  display: flex;
  align-items: center;
  padding: 12px;
  gap: 10px;
  border-bottom: 2px solid var(--theme-border);
}

.search-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  background: var(--theme-background);
  border: 2px solid;
  border-color: var(--theme-borderDark) var(--theme-borderLight) var(--theme-borderLight) var(--theme-borderDark);
  padding: 8px;
  font-family: 'Press Start 2P', monospace;
  font-size: 11px;
  color: var(--theme-text);
  outline: none;
}

.search-input:focus {
  border-color: var(--theme-highlight);
  box-shadow: inset 0 0 0 1px var(--theme-highlight);
}

.search-input::placeholder {
  color: var(--theme-border);
}

/* Search Results */
.search-results {
  max-height: 400px;
  overflow-y: auto;
  border-bottom: 2px solid var(--theme-border);
}

.search-loading {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px;
  color: var(--theme-text);
  font-size: 10px;
  justify-content: center;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--theme-border);
  border-top-color: var(--theme-highlight);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Result Item */
.search-result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  cursor: pointer;
  border-bottom: 1px solid var(--theme-border);
  transition: all 0.1s;
}

.search-result-item:last-child {
  border-bottom: none;
}

.search-result-item:hover,
.search-result-item.selected {
  background: var(--theme-highlight);
  color: var(--theme-highlightText);
}

.result-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.result-info {
  flex: 1;
  min-width: 0;
}

.result-name {
  font-size: 11px;
  font-weight: bold;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-meta {
  display: flex;
  gap: 8px;
  font-size: 8px;
  color: var(--theme-border);
}

.search-result-item:hover .result-meta,
.search-result-item.selected .result-meta {
  color: var(--theme-highlightText);
  opacity: 0.8;
}

.result-path,
.result-size {
  opacity: 0.7;
}

.result-badge {
  flex-shrink: 0;
}

.badge {
  padding: 3px 8px;
  font-size: 7px;
  border: 1px solid;
  border-radius: 2px;
  text-transform: uppercase;
}

.badge-file {
  background: rgba(0, 85, 170, 0.2);
  border-color: var(--theme-highlight);
  color: var(--theme-highlight);
}

.badge-folder {
  background: rgba(255, 170, 0, 0.2);
  border-color: #ffaa00;
  color: #ffaa00;
}

.badge-app {
  background: rgba(0, 255, 0, 0.2);
  border-color: #00ff00;
  color: #00ff00;
}

.badge-widget {
  background: rgba(255, 0, 255, 0.2);
  border-color: #ff00ff;
  color: #ff00ff;
}

.badge-action {
  background: rgba(255, 255, 0, 0.2);
  border-color: #ffff00;
  color: #ffff00;
}

/* No Results */
.no-results {
  padding: 40px 20px;
  text-align: center;
  color: var(--theme-border);
}

.no-results-icon {
  font-size: 40px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.no-results-text {
  font-size: 10px;
}

/* Recent Searches */
.recent-searches {
  max-height: 300px;
  overflow-y: auto;
  border-bottom: 2px solid var(--theme-border);
}

.recent-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-bottom: 1px solid var(--theme-border);
  font-size: 9px;
  color: var(--theme-text);
  font-weight: bold;
}

.clear-recent {
  background: none;
  border: none;
  color: var(--theme-highlight);
  cursor: pointer;
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
  padding: 4px 8px;
  transition: all 0.1s;
}

.clear-recent:hover {
  background: var(--theme-highlight);
  color: var(--theme-highlightText);
}

.recent-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  cursor: pointer;
  border-bottom: 1px solid var(--theme-border);
  transition: all 0.1s;
}

.recent-item:last-child {
  border-bottom: none;
}

.recent-item:hover {
  background: var(--theme-highlight);
  color: var(--theme-highlightText);
}

.recent-icon {
  font-size: 16px;
  opacity: 0.7;
}

.recent-text {
  font-size: 10px;
}

/* Empty State */
.empty-state {
  padding: 40px 20px;
  text-align: center;
  color: var(--theme-border);
}

.empty-icon {
  font-size: 40px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.empty-text {
  font-size: 10px;
  margin-bottom: 8px;
}

.empty-hint {
  font-size: 8px;
  opacity: 0.7;
}

/* Footer */
.search-footer {
  display: flex;
  justify-content: center;
  gap: 20px;
  padding: 8px 12px;
  background: var(--theme-menuBackground);
  font-size: 8px;
  color: var(--theme-menuText);
}

.footer-hint {
  display: flex;
  align-items: center;
  gap: 6px;
}

.key {
  background: var(--theme-background);
  border: 1px solid var(--theme-border);
  padding: 2px 6px;
  border-radius: 2px;
  font-size: 9px;
  font-weight: bold;
}

/* Scrollbar styling */
.search-results::-webkit-scrollbar,
.recent-searches::-webkit-scrollbar {
  width: 12px;
}

.search-results::-webkit-scrollbar-track,
.recent-searches::-webkit-scrollbar-track {
  background: var(--theme-background);
  border-left: 2px solid var(--theme-border);
}

.search-results::-webkit-scrollbar-thumb,
.recent-searches::-webkit-scrollbar-thumb {
  background: var(--theme-border);
  border: 2px solid;
  border-color: var(--theme-borderLight) var(--theme-borderDark) var(--theme-borderDark) var(--theme-borderLight);
}

.search-results::-webkit-scrollbar-thumb:hover,
.recent-searches::-webkit-scrollbar-thumb:hover {
  background: var(--theme-highlight);
}
</style>

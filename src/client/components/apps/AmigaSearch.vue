<template>
  <div class="amiga-search">
    <!-- Search Header -->
    <div class="search-header">
      <div class="search-input-row">
        <label class="search-label">Find:</label>
        <input
          ref="searchInput"
          v-model="searchQuery"
          type="text"
          class="amiga-input search-input"
          placeholder="Search for files..."
          @keyup.enter="performSearch"
          @keyup.esc="clearSearch"
        />
        <button class="amiga-button" @click="performSearch" :disabled="isSearching || !searchQuery.trim()">
          {{ isSearching ? 'Searching...' : 'Search' }}
        </button>
      </div>

      <!-- Filters Panel -->
      <div class="filters-panel" :class="{ collapsed: !showFilters }">
        <div class="filters-header" @click="toggleFilters">
          <span>{{ showFilters ? '▼' : '►' }} Filters</span>
        </div>

        <div v-if="showFilters" class="filters-content">
          <!-- Scope Filter -->
          <div class="filter-row">
            <label class="filter-label">Scope:</label>
            <select v-model="filters.scope" class="amiga-select">
              <option value="all">All Disks</option>
              <option value="df0">df0 (Workbench3.1)</option>
              <option value="dh0">dh0 (System)</option>
              <option value="dh1">dh1 (Work)</option>
              <option value="ram">RAM Disk</option>
            </select>
          </div>

          <!-- File Type Filter -->
          <div class="filter-row">
            <label class="filter-label">Types:</label>
            <div class="type-checkboxes">
              <label class="checkbox-label">
                <input type="checkbox" value="txt" v-model="selectedTypes" />
                <span>Text</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" value="awml" v-model="selectedTypes" />
                <span>AWML</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" value="xml" v-model="selectedTypes" />
                <span>XML</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" value="json" v-model="selectedTypes" />
                <span>JSON</span>
              </label>
            </div>
          </div>

          <!-- Size Filter -->
          <div class="filter-row">
            <label class="filter-label">Size:</label>
            <input
              v-model.number="sizeMin"
              type="number"
              class="amiga-input size-input"
              placeholder="Min (bytes)"
              min="0"
            />
            <span class="filter-separator">to</span>
            <input
              v-model.number="sizeMax"
              type="number"
              class="amiga-input size-input"
              placeholder="Max (bytes)"
              min="0"
            />
          </div>
        </div>
      </div>

      <!-- Results Header -->
      <div class="results-header">
        <div class="results-info">
          <span v-if="searchResults.length > 0">
            Found {{ searchResults.length }} item{{ searchResults.length !== 1 ? 's' : '' }}
          </span>
          <span v-else-if="hasSearched && !isSearching">
            No results found
          </span>
          <span v-else>
            Enter search terms above
          </span>
        </div>

        <div class="view-controls">
          <label class="control-label">Sort:</label>
          <select v-model="sortBy" class="amiga-select" @change="applySort">
            <option value="relevance">Relevance</option>
            <option value="name">Name</option>
            <option value="date">Date</option>
            <option value="size">Size</option>
          </select>

          <label class="control-label">View:</label>
          <button
            class="view-button"
            :class="{ active: viewMode === 'grid' }"
            @click="viewMode = 'grid'"
            title="Grid View"
          >
            ⊞
          </button>
          <button
            class="view-button"
            :class="{ active: viewMode === 'list' }"
            @click="viewMode = 'list'"
            title="List View"
          >
            ☰
          </button>
        </div>
      </div>
    </div>

    <!-- Search Results -->
    <div class="search-results" :class="viewMode">
      <div
        v-for="result in searchResults"
        :key="result.id"
        class="result-item"
        :class="{ selected: selectedResults.includes(result.id) }"
        @click="selectResult(result, $event)"
        @dblclick="openResult(result)"
        @contextmenu.prevent="showContextMenu(result, $event)"
      >
        <div class="result-icon">
          <!-- Folder Icon -->
          <svg v-if="result.type === 'folder'" viewBox="0 0 48 48" class="icon-svg">
            <path d="M 4 8 L 4 40 L 44 40 L 44 16 L 24 16 L 20 8 Z" fill="#ffaa00" stroke="#000" stroke-width="2"/>
            <path d="M 4 8 L 20 8 L 24 16 L 44 16 L 44 12 L 24 12 L 20 8 Z" fill="#ffcc44" stroke="#000" stroke-width="1"/>
          </svg>

          <!-- File Icon -->
          <svg v-else viewBox="0 0 48 48" class="icon-svg">
            <rect x="10" y="6" width="28" height="36" fill="#ffffff" stroke="#000" stroke-width="2"/>
            <line x1="14" y1="14" x2="34" y2="14" stroke="#0055aa" stroke-width="2"/>
            <line x1="14" y1="20" x2="34" y2="20" stroke="#0055aa" stroke-width="2"/>
            <line x1="14" y1="26" x2="28" y2="26" stroke="#0055aa" stroke-width="2"/>
          </svg>
        </div>

        <div class="result-info">
          <div class="result-name">{{ result.name }}</div>
          <div class="result-path">{{ result.path }}</div>
          <div v-if="viewMode === 'list'" class="result-meta">
            <span v-if="result.size">{{ result.size }}</span>
            <span v-if="result.modified">{{ formatDate(result.modified) }}</span>
          </div>
        </div>

        <div v-if="sortBy === 'relevance'" class="result-relevance">
          {{ Math.round(result.relevance * 100) }}%
        </div>
      </div>

      <div v-if="isSearching" class="search-loading">
        <div class="loading-spinner">●</div>
        <div>Searching files...</div>
      </div>

      <div v-if="searchResults.length === 0 && !isSearching && hasSearched" class="no-results">
        <div class="no-results-icon">🔍</div>
        <div class="no-results-text">No files found matching your search</div>
        <div class="no-results-hint">Try different search terms or adjust filters</div>
      </div>
    </div>

    <!-- Search History -->
    <div v-if="showHistory && searchHistory.length > 0" class="search-history">
      <div class="history-header">
        <span>Recent Searches</span>
        <button class="clear-history-btn" @click="clearHistory">Clear</button>
      </div>
      <div class="history-items">
        <div
          v-for="(query, index) in searchHistory"
          :key="index"
          class="history-item"
          @click="searchFromHistory(query)"
        >
          {{ query }}
        </div>
      </div>
    </div>

    <!-- Context Menu -->
    <div
      v-if="contextMenuVisible"
      class="context-menu"
      :style="{ top: contextMenuY + 'px', left: contextMenuX + 'px' }"
      @click.stop
    >
      <div class="context-item" @click="openContextResult">Open</div>
      <div class="context-separator"></div>
      <div class="context-item" @click="showInFolder">Show in Folder</div>
      <div class="context-item" @click="showResultInfo">Information</div>
      <div class="context-separator"></div>
      <div class="context-item" @click="deleteContextResult">Delete</div>
    </div>

    <!-- Footer -->
    <div class="search-footer">
      <div class="footer-shortcuts">
        <span class="shortcut-hint">Ctrl+F: Focus Search</span>
        <span class="shortcut-hint">Enter: Search</span>
        <span class="shortcut-hint">Esc: Clear</span>
      </div>
      <div class="footer-actions">
        <button class="amiga-button small" @click="toggleHistory">
          {{ showHistory ? 'Hide' : 'Show' }} History
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import {
  searchFiles,
  getSearchHistory,
  addSearchHistory,
  clearSearchHistory,
  type FileSearchResult,
  type SearchFilters,
  type SortBy
} from '../../utils/file-search';

interface Props {
  data?: {
    initialQuery?: string;
    initialScope?: string;
  };
}

const props = defineProps<Props>();

const emit = defineEmits<{
  openFile: [path: string, item: any];
  openFolder: [path: string];
}>();

// Search state
const searchInput = ref<HTMLInputElement | null>(null);
const searchQuery = ref('');
const isSearching = ref(false);
const hasSearched = ref(false);
const searchResults = ref<FileSearchResult[]>([]);
const selectedResults = ref<string[]>([]);

// Filters
const showFilters = ref(false);
const filters = ref<SearchFilters>({
  query: '',
  scope: 'all'
});
const selectedTypes = ref<string[]>([]);
const sizeMin = ref<number | null>(null);
const sizeMax = ref<number | null>(null);

// View controls
const viewMode = ref<'grid' | 'list'>('grid');
const sortBy = ref<SortBy>('relevance');

// History
const showHistory = ref(false);
const searchHistory = ref<string[]>([]);

// Context menu
const contextMenuVisible = ref(false);
const contextMenuX = ref(0);
const contextMenuY = ref(0);
const contextMenuItem = ref<FileSearchResult | null>(null);

// Initialize
onMounted(() => {
  // Focus search input
  searchInput.value?.focus();

  // Load search history
  searchHistory.value = getSearchHistory();

  // Apply initial query if provided
  if (props.data?.initialQuery) {
    searchQuery.value = props.data.initialQuery;
    performSearch();
  }

  if (props.data?.initialScope) {
    filters.value.scope = props.data.initialScope;
  }

  // Global keyboard shortcuts
  document.addEventListener('keydown', handleGlobalKeyboard);
  document.addEventListener('click', closeContextMenu);
});

onUnmounted(() => {
  document.addEventListener('keydown', handleGlobalKeyboard);
  document.removeEventListener('click', closeContextMenu);
});

// Watch for filter changes
watch([selectedTypes, sizeMin, sizeMax], () => {
  if (hasSearched.value) {
    applyFiltersToResults();
  }
});

const toggleFilters = () => {
  showFilters.value = !showFilters.value;
};

const toggleHistory = () => {
  showHistory.value = !showHistory.value;
};

const performSearch = async () => {
  if (!searchQuery.value.trim()) return;

  isSearching.value = true;
  hasSearched.value = true;
  selectedResults.value = [];

  try {
    // Build filters
    const searchFilters: SearchFilters = {
      query: searchQuery.value.trim(),
      scope: filters.value.scope,
      fileTypes: selectedTypes.value.length > 0 ? selectedTypes.value : undefined,
      minSize: sizeMin.value || undefined,
      maxSize: sizeMax.value || undefined
    };

    // Perform search
    const results = await searchFiles(searchFilters, sortBy.value);
    searchResults.value = results;

    // Add to history
    addSearchHistory(searchQuery.value.trim());
    searchHistory.value = getSearchHistory();
  } catch (error) {
    console.error('Search failed:', error);
    alert('Search failed. Please try again.');
  } finally {
    isSearching.value = false;
  }
};

const applyFiltersToResults = async () => {
  if (!hasSearched.value) return;
  await performSearch();
};

const applySort = () => {
  if (searchResults.value.length === 0) return;
  performSearch();
};

const clearSearch = () => {
  searchQuery.value = '';
  searchResults.value = [];
  selectedResults.value = [];
  hasSearched.value = false;
  searchInput.value?.focus();
};

const selectResult = (result: FileSearchResult, event: MouseEvent) => {
  if (event.ctrlKey || event.metaKey) {
    // Multi-select
    const index = selectedResults.value.indexOf(result.id);
    if (index > -1) {
      selectedResults.value.splice(index, 1);
    } else {
      selectedResults.value.push(result.id);
    }
  } else {
    // Single select
    selectedResults.value = [result.id];
  }
};

const openResult = (result: FileSearchResult) => {
  if (result.type === 'folder') {
    emit('openFolder', result.path);
  } else {
    emit('openFile', result.path, result);
  }
};

const showContextMenu = (result: FileSearchResult, event: MouseEvent) => {
  contextMenuItem.value = result;
  contextMenuX.value = event.clientX;
  contextMenuY.value = event.clientY;
  contextMenuVisible.value = true;
};

const closeContextMenu = () => {
  contextMenuVisible.value = false;
  contextMenuItem.value = null;
};

const openContextResult = () => {
  if (contextMenuItem.value) {
    openResult(contextMenuItem.value);
  }
  closeContextMenu();
};

const showInFolder = () => {
  if (contextMenuItem.value) {
    const pathParts = contextMenuItem.value.path.split('/');
    pathParts.pop(); // Remove filename
    const folderPath = pathParts.join('/');
    emit('openFolder', folderPath || 'dh0');
  }
  closeContextMenu();
};

const showResultInfo = () => {
  if (contextMenuItem.value) {
    const result = contextMenuItem.value;
    const info = `Name: ${result.name}
Type: ${result.type}
Path: ${result.path}
Size: ${result.size || 'N/A'}
Modified: ${result.modified ? formatDate(result.modified) : 'N/A'}
Relevance: ${Math.round(result.relevance * 100)}%`;
    alert(info);
  }
  closeContextMenu();
};

const deleteContextResult = async () => {
  if (!contextMenuItem.value) return;

  const result = contextMenuItem.value;
  if (!confirm(`Delete "${result.name}"?`)) {
    closeContextMenu();
    return;
  }

  try {
    const response = await fetch(`/api/files/delete?path=${encodeURIComponent(result.path)}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('Failed to delete file');
    }

    // Remove from results
    searchResults.value = searchResults.value.filter(r => r.id !== result.id);
    alert(`"${result.name}" deleted successfully`);
  } catch (error) {
    console.error('Delete failed:', error);
    alert('Failed to delete file');
  } finally {
    closeContextMenu();
  }
};

const searchFromHistory = (query: string) => {
  searchQuery.value = query;
  performSearch();
};

const clearHistory = () => {
  if (confirm('Clear search history?')) {
    clearSearchHistory();
    searchHistory.value = [];
  }
};

const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const handleGlobalKeyboard = (event: KeyboardEvent) => {
  // Ctrl+F to focus search
  if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
    event.preventDefault();
    searchInput.value?.focus();
    searchInput.value?.select();
  }
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

.amiga-search {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #a0a0a0;
  font-family: 'Press Start 2P', monospace;
  overflow: hidden;
}

.search-header {
  background: #a0a0a0;
  padding: 8px;
  border-bottom: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
}

.search-input-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.search-label {
  font-size: 9px;
  color: #000000;
  white-space: nowrap;
}

.search-input {
  flex: 1;
  padding: 4px 8px;
  font-size: 9px;
  font-family: 'Press Start 2P', monospace;
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  color: #000000;
}

.search-input:focus {
  outline: none;
  background: #ffffcc;
}

.amiga-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 4px 12px;
  font-size: 9px;
  font-family: 'Press Start 2P', monospace;
  cursor: pointer;
  color: #000000;
  transition: all 0.1s;
}

.amiga-button:active:not(:disabled) {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}

.amiga-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.amiga-button.small {
  padding: 2px 8px;
  font-size: 8px;
}

.filters-panel {
  margin-top: 4px;
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
}

.filters-header {
  padding: 4px 8px;
  background: #a0a0a0;
  font-size: 9px;
  cursor: pointer;
  user-select: none;
  border-bottom: 1px solid #808080;
}

.filters-header:hover {
  background: #0055aa;
  color: #ffffff;
}

.filters-content {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 8px;
}

.filter-label {
  min-width: 60px;
  color: #000000;
}

.amiga-select {
  padding: 2px 4px;
  font-size: 8px;
  font-family: 'Press Start 2P', monospace;
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  color: #000000;
}

.type-checkboxes {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  cursor: pointer;
}

.size-input {
  width: 100px;
  padding: 2px 4px;
  font-size: 8px;
  font-family: 'Press Start 2P', monospace;
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
}

.filter-separator {
  color: #000000;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background: #ffffff;
  border-top: 2px solid #000000;
  margin-top: 8px;
}

.results-info {
  font-size: 9px;
  color: #000000;
}

.view-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-label {
  font-size: 8px;
  color: #000000;
}

.view-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.1s;
}

.view-button.active {
  background: #0055aa;
  color: #ffffff;
  border-color: #000000 #ffffff #ffffff #000000;
}

.search-results {
  flex: 1;
  overflow-y: auto;
  background: #ffffff;
  padding: 12px;
}

.search-results.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 16px;
  align-content: start;
}

.search-results.list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.result-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  cursor: pointer;
  user-select: none;
  border: 2px solid transparent;
  transition: all 0.1s;
}

.search-results.grid .result-item {
  text-align: center;
}

.search-results.list .result-item {
  flex-direction: row;
  align-items: center;
  gap: 12px;
}

.result-item:hover {
  background: rgba(0, 85, 170, 0.1);
}

.result-item.selected {
  background: #0055aa;
  border-color: #0055aa;
}

.result-item.selected .result-name,
.result-item.selected .result-path,
.result-item.selected .result-meta {
  color: #ffffff;
}

.result-icon {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
}

.search-results.list .result-icon {
  width: 32px;
  height: 32px;
}

.icon-svg {
  width: 100%;
  height: 100%;
  filter: drop-shadow(1px 1px 1px rgba(0, 0, 0, 0.3));
}

.result-info {
  flex: 1;
  min-width: 0;
}

.search-results.grid .result-info {
  width: 100%;
  margin-top: 4px;
}

.search-results.list .result-info {
  text-align: left;
}

.result-name {
  font-size: 9px;
  color: #000000;
  font-weight: bold;
  word-wrap: break-word;
  overflow: hidden;
  text-overflow: ellipsis;
}

.search-results.list .result-name {
  white-space: nowrap;
  max-width: 250px;
}

.result-path {
  font-size: 7px;
  color: #666666;
  margin-top: 2px;
  word-wrap: break-word;
}

.search-results.list .result-path {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 300px;
}

.result-meta {
  font-size: 7px;
  color: #666666;
  margin-top: 2px;
  display: flex;
  gap: 12px;
}

.result-relevance {
  font-size: 8px;
  color: #0055aa;
  font-weight: bold;
  margin-left: auto;
}

.search-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  gap: 16px;
  font-size: 9px;
  color: #666666;
}

.loading-spinner {
  font-size: 24px;
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.no-results-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.3;
}

.no-results-text {
  font-size: 10px;
  color: #000000;
  margin-bottom: 8px;
}

.no-results-hint {
  font-size: 8px;
  color: #666666;
}

.search-history {
  background: #ffffff;
  border-top: 2px solid #000000;
  padding: 8px;
  max-height: 150px;
  overflow-y: auto;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 9px;
  color: #000000;
  font-weight: bold;
}

.clear-history-btn {
  background: none;
  border: none;
  color: #0055aa;
  font-size: 8px;
  cursor: pointer;
  text-decoration: underline;
  font-family: 'Press Start 2P', monospace;
}

.history-items {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.history-item {
  padding: 4px 8px;
  background: #a0a0a0;
  border: 1px solid #808080;
  font-size: 8px;
  cursor: pointer;
  transition: all 0.1s;
}

.history-item:hover {
  background: #0055aa;
  color: #ffffff;
}

.context-menu {
  position: fixed;
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  box-shadow: 4px 4px 8px rgba(0, 0, 0, 0.4);
  z-index: 10000;
  min-width: 150px;
}

.context-item {
  padding: 4px 12px;
  font-size: 9px;
  cursor: pointer;
  color: #000000;
  transition: all 0.1s;
}

.context-item:hover {
  background: #0055aa;
  color: #ffffff;
}

.context-separator {
  height: 1px;
  background: #808080;
  margin: 2px 0;
}

.search-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #ffffff;
  border-top: 2px solid #000000;
  padding: 6px 8px;
}

.footer-shortcuts {
  display: flex;
  gap: 16px;
}

.shortcut-hint {
  font-size: 7px;
  color: #666666;
}

.footer-actions {
  display: flex;
  gap: 8px;
}

/* Scrollbar styling */
.search-results::-webkit-scrollbar,
.search-history::-webkit-scrollbar {
  width: 16px;
}

.search-results::-webkit-scrollbar-track,
.search-history::-webkit-scrollbar-track {
  background: #a0a0a0;
}

.search-results::-webkit-scrollbar-thumb,
.search-history::-webkit-scrollbar-thumb {
  background: #0055aa;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
}
</style>

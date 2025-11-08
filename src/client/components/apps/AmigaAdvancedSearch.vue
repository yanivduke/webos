<template>
  <div class="amiga-advanced-search">
    <!-- Tab Navigation -->
    <div class="tab-bar">
      <div
        v-for="tab in tabs"
        :key="tab.id"
        class="tab"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </div>
    </div>

    <!-- Simple Search Tab -->
    <div v-if="activeTab === 'simple'" class="tab-content">
      <div class="search-simple">
        <div class="input-row">
          <label class="label">Find:</label>
          <input
            ref="simpleSearchInput"
            v-model="simpleQuery"
            type="text"
            class="amiga-input flex-1"
            placeholder="Search for files..."
            @keyup.enter="performSimpleSearch"
          />
          <button class="amiga-button" @click="performSimpleSearch" :disabled="isSearching">
            {{ isSearching ? 'Searching...' : 'Search' }}
          </button>
        </div>

        <!-- Search History Dropdown -->
        <div v-if="searchSuggestions.length > 0 && showSuggestions" class="suggestions-dropdown">
          <div
            v-for="(suggestion, index) in searchSuggestions"
            :key="index"
            class="suggestion-item"
            @click="applySuggestion(suggestion)"
          >
            {{ suggestion }}
          </div>
        </div>
      </div>
    </div>

    <!-- Advanced Search Tab -->
    <div v-if="activeTab === 'advanced'" class="tab-content">
      <div class="search-advanced">
        <div class="advanced-grid">
          <!-- Search Query -->
          <div class="field-group">
            <label class="label">Filename:</label>
            <input
              v-model="advancedCriteria.query"
              type="text"
              class="amiga-input"
              placeholder="Search filename..."
            />
          </div>

          <!-- Search Mode -->
          <div class="field-group">
            <label class="label">Mode:</label>
            <select v-model="advancedCriteria.mode" class="amiga-select">
              <option value="simple">Simple</option>
              <option value="metadata">Metadata</option>
              <option value="content">Content</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <!-- File Types -->
          <div class="field-group full-width">
            <label class="label">File Types:</label>
            <div class="type-chips">
              <label v-for="type in commonFileTypes" :key="type" class="type-chip">
                <input type="checkbox" :value="type" v-model="selectedFileTypes" />
                <span>.{{ type }}</span>
              </label>
            </div>
          </div>

          <!-- Date Range -->
          <div class="field-group">
            <label class="label">Date Field:</label>
            <select v-model="dateField" class="amiga-select">
              <option value="modified">Modified</option>
              <option value="created">Created</option>
            </select>
          </div>

          <div class="field-group">
            <label class="label">From:</label>
            <input
              v-model="dateFrom"
              type="date"
              class="amiga-input"
            />
          </div>

          <div class="field-group">
            <label class="label">To:</label>
            <input
              v-model="dateTo"
              type="date"
              class="amiga-input"
            />
          </div>

          <!-- Size Range -->
          <div class="field-group">
            <label class="label">Min Size:</label>
            <input
              v-model="sizeMin"
              type="text"
              class="amiga-input"
              placeholder="e.g. 1M, 500K"
            />
          </div>

          <div class="field-group">
            <label class="label">Max Size:</label>
            <input
              v-model="sizeMax"
              type="text"
              class="amiga-input"
              placeholder="e.g. 10M, 2G"
            />
          </div>

          <!-- Tags -->
          <div class="field-group full-width">
            <label class="label">Tags:</label>
            <input
              v-model="tagsInput"
              type="text"
              class="amiga-input"
              placeholder="Comma-separated tags..."
            />
          </div>

          <!-- Scope -->
          <div class="field-group">
            <label class="label">Scope:</label>
            <select v-model="scope" class="amiga-select">
              <option value="all">All Disks</option>
              <option value="df0">df0 (Workbench3.1)</option>
              <option value="dh0">dh0 (System)</option>
              <option value="dh1">dh1 (Work)</option>
              <option value="ram">RAM Disk</option>
            </select>
          </div>

          <!-- Options -->
          <div class="field-group full-width">
            <label class="checkbox-label">
              <input type="checkbox" v-model="contentSearch" />
              <span>Search file contents</span>
            </label>
            <label class="checkbox-label">
              <input type="checkbox" v-model="caseSensitive" />
              <span>Case sensitive</span>
            </label>
            <label class="checkbox-label">
              <input type="checkbox" v-model="useRegex" />
              <span>Use regular expressions</span>
            </label>
          </div>

          <!-- Regex Validation -->
          <div v-if="useRegex && regexError" class="regex-error full-width">
            {{ regexError }}
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="action-row">
          <button class="amiga-button" @click="handleSearchButtonClick" :disabled="isSearching">
            {{ isSearching ? 'Searching...' : 'Search' }}
          </button>
          <button class="amiga-button" @click="clearAdvancedSearch">Clear</button>
          <button class="amiga-button" @click="saveAsSmartFolder" :disabled="!hasResults">
            Save as Smart Folder
          </button>
        </div>
      </div>
    </div>

    <!-- Smart Folders Tab -->
    <div v-if="activeTab === 'smart-folders'" class="tab-content">
      <div class="smart-folders">
        <div class="toolbar">
          <button class="amiga-button small" @click="showCreateDialog = true">
            Create New
          </button>
          <button class="amiga-button small" @click="installPredefined">
            Install Predefined
          </button>
          <button class="amiga-button small" @click="refreshAllFolders">
            Refresh All
          </button>
          <button class="amiga-button small" @click="exportFolders">
            Export
          </button>
          <button class="amiga-button small" @click="importFolders">
            Import
          </button>
        </div>

        <div class="folders-list">
          <div
            v-for="folder in smartFolders"
            :key="folder.id"
            class="folder-item"
            @dblclick="openSmartFolder(folder)"
          >
            <div class="folder-icon" :style="{ color: folder.color }">
              📁
            </div>
            <div class="folder-info">
              <div class="folder-name">{{ folder.name }}</div>
              <div class="folder-details">
                {{ folder.fileCount || 0 }} items • {{ formatDate(folder.lastUpdated) }}
              </div>
              <div class="folder-criteria">
                {{ formatCriteria(folder.criteria) }}
              </div>
            </div>
            <div class="folder-actions">
              <button class="icon-button" @click.stop="refreshFolder(folder)" title="Refresh">
                ↻
              </button>
              <button class="icon-button" @click.stop="editFolder(folder)" title="Edit">
                ✎
              </button>
              <button class="icon-button" @click.stop="deleteFolder(folder)" title="Delete">
                ✕
              </button>
            </div>
          </div>

          <div v-if="smartFolders.length === 0" class="empty-state">
            <div class="empty-icon">📂</div>
            <div class="empty-text">No smart folders yet</div>
            <div class="empty-hint">Create a smart folder to save your search criteria</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Search Results (shown in all tabs except Smart Folders) -->
    <div v-if="activeTab !== 'smart-folders'" class="results-section">
      <div class="results-header">
        <div class="results-info">
          <span v-if="searchResults.length > 0">
            {{ searchResults.length }} result{{ searchResults.length !== 1 ? 's' : '' }}
          </span>
          <span v-else-if="hasSearched && !isSearching">
            No results found
          </span>
          <span v-else>
            Ready to search
          </span>
        </div>

        <div v-if="hasResults" class="results-actions">
          <button class="amiga-button small" @click="exportResults('json')">
            Export JSON
          </button>
          <button class="amiga-button small" @click="exportResults('csv')">
            Export CSV
          </button>
          <button class="amiga-button small" @click="clearResults">
            Clear
          </button>
        </div>
      </div>

      <!-- Results List -->
      <div class="results-list">
        <div
          v-for="result in searchResults"
          :key="result.id"
          class="result-item"
          @dblclick="openResult(result)"
        >
          <div class="result-icon">
            {{ result.file.type === 'folder' ? '📁' : '📄' }}
          </div>

          <div class="result-main">
            <div class="result-name" v-html="highlightMatches(result.file.name, result)"></div>
            <div class="result-path">{{ result.file.path }}</div>

            <!-- Content Snippets -->
            <div v-if="result.snippets.length > 0" class="result-snippets">
              <div
                v-for="(snippet, index) in result.snippets.slice(0, 2)"
                :key="index"
                class="snippet"
              >
                <span class="snippet-line">Line {{ snippet.lineNumber }}:</span>
                <span class="snippet-text" v-html="snippet.highlighted"></span>
              </div>
              <div v-if="result.snippets.length > 2" class="snippet-more">
                +{{ result.snippets.length - 2 }} more matches
              </div>
            </div>
          </div>

          <div class="result-meta">
            <div class="result-size">{{ result.file.sizeFormatted || '-' }}</div>
            <div class="result-relevance">
              <div class="relevance-bar">
                <div
                  class="relevance-fill"
                  :style="{ width: (result.relevanceScore * 100) + '%' }"
                ></div>
              </div>
              <span class="relevance-text">{{ Math.round(result.relevanceScore * 100) }}%</span>
            </div>
            <div class="result-matches">{{ result.matchCount }} matches</div>
          </div>

          <div class="result-actions">
            <button class="icon-button" @click.stop="openResult(result)" title="Open">
              ⤢
            </button>
            <button class="icon-button" @click.stop="showLocation(result)" title="Show in Folder">
              📁
            </button>
            <button class="icon-button" @click.stop="showInfo(result)" title="Information">
              ℹ
            </button>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="isSearching" class="loading-state">
          <div class="loading-spinner">●</div>
          <div>Searching files...</div>
        </div>

        <!-- Empty State -->
        <div v-if="searchResults.length === 0 && !isSearching && hasSearched" class="empty-state">
          <div class="empty-icon">🔍</div>
          <div class="empty-text">No files found</div>
          <div class="empty-hint">Try different search terms or adjust filters</div>
        </div>
      </div>
    </div>

    <!-- Create Smart Folder Dialog -->
    <div v-if="showCreateDialog" class="modal-overlay" @click="showCreateDialog = false">
      <div class="modal-dialog" @click.stop>
        <div class="modal-header">Create Smart Folder</div>
        <div class="modal-content">
          <div class="field-group">
            <label class="label">Name:</label>
            <input
              v-model="newFolderName"
              type="text"
              class="amiga-input"
              placeholder="My Smart Folder"
            />
          </div>
          <div class="field-group">
            <label class="label">Icon:</label>
            <select v-model="newFolderIcon" class="amiga-select">
              <option value="folder">Folder</option>
              <option value="clock">Clock</option>
              <option value="image">Image</option>
              <option value="document">Document</option>
              <option value="code">Code</option>
              <option value="video">Video</option>
            </select>
          </div>
          <div class="field-group">
            <label class="label">Color:</label>
            <input
              v-model="newFolderColor"
              type="color"
              class="color-input"
            />
          </div>
          <div class="field-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="newFolderAutoRefresh" />
              <span>Auto-refresh</span>
            </label>
          </div>
        </div>
        <div class="modal-footer">
          <button class="amiga-button" @click="createSmartFolderFromCurrent">Create</button>
          <button class="amiga-button" @click="showCreateDialog = false">Cancel</button>
        </div>
      </div>
    </div>

    <!-- Import File Input -->
    <input
      ref="importFileInput"
      type="file"
      accept=".json"
      style="display: none"
      @change="handleImportFile"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch } from 'vue';
import {
  SearchCriteria,
  SearchResult,
  performAdvancedSearch,
  
  getSearchSuggestions,
  downloadResults as downloadSearchResults,
  validateRegex,
  parseFileSize
} from '../../utils/advanced-search';
import {
  SmartFolder,
  getAllSmartFolders,
  createSmartFolder,
  updateSmartFolder,
  deleteSmartFolder,
  refreshSmartFolder,
  refreshAllSmartFolders,
  installPredefinedFolders,
  downloadSmartFoldersExport,
  importFromFile,
  subscribe
} from '../../utils/smart-folders';

const emit = defineEmits<{
  openFile: [path: string, item: any];
  openFolder: [path: string];
}>();

// ==================== Tab State ====================

const tabs = [
  { id: 'simple', label: 'Simple' },
  { id: 'advanced', label: 'Advanced' },
  { id: 'smart-folders', label: 'Smart Folders' }
];

const activeTab = ref<'simple' | 'advanced' | 'smart-folders'>('simple');

// ==================== Simple Search ====================

const simpleSearchInput = ref<HTMLInputElement | null>(null);
const simpleQuery = ref('');
const showSuggestions = ref(false);

const searchSuggestions = computed(() => {
  if (!simpleQuery.value.trim()) return [];
  return getSearchSuggestions(simpleQuery.value);
});

watch(simpleQuery, (value) => {
  showSuggestions.value = value.length > 0;
});

const applySuggestion = (suggestion: string) => {
  simpleQuery.value = suggestion;
  showSuggestions.value = false;
  performSimpleSearch();
};

const performSimpleSearch = async () => {
  if (!simpleQuery.value.trim()) return;

  const criteria: SearchCriteria = {
    query: simpleQuery.value,
    mode: 'simple',
    scope: 'all'
  };

  await executeSearch(criteria);
};

// ==================== Advanced Search ====================

const commonFileTypes = ['txt', 'doc', 'pdf', 'jpg', 'png', 'gif', 'mp4', 'mp3', 'js', 'ts', 'html', 'css', 'json', 'xml', 'awml'];

const advancedCriteria = ref<SearchCriteria>({
  query: '',
  mode: 'advanced',
  scope: 'all'
});

const selectedFileTypes = ref<string[]>([]);
const dateField = ref<'created' | 'modified'>('modified');
const dateFrom = ref('');
const dateTo = ref('');
const sizeMin = ref('');
const sizeMax = ref('');
const tagsInput = ref('');
const scope = ref('all');
const contentSearch = ref(false);
const _caseSensitive = ref(false);
const useRegex = ref(false);

const regexError = computed(() => {
  if (!useRegex.value || !advancedCriteria.value.query) return null;
  const result = validateRegex(advancedCriteria.value.query);
  return result.valid ? null : result.error;
});

const handleSearchButtonClick = async () => {
  const criteria: SearchCriteria = {
    query: advancedCriteria.value.query,
    mode: advancedCriteria.value.mode,
    scope: scope.value,
    fileTypes: selectedFileTypes.value.length > 0 ? selectedFileTypes.value : undefined,
    contentSearch: contentSearch.value,
    caseSensitive: caseSensitive.value,
    regex: useRegex.value
  };

  // Date range
  if (dateFrom.value || dateTo.value) {
    criteria.dateRange = {
      field: dateField.value,
      from: dateFrom.value ? new Date(dateFrom.value) : undefined,
      to: dateTo.value ? new Date(dateTo.value) : undefined
    };
  }

  // Size range
  if (sizeMin.value || sizeMax.value) {
    criteria.sizeRange = {
      min: sizeMin.value ? parseFileSize(sizeMin.value) || undefined : undefined,
      max: sizeMax.value ? parseFileSize(sizeMax.value) || undefined : undefined
    };
  }

  // Tags
  if (tagsInput.value.trim()) {
    criteria.tags = tagsInput.value.split(',').map(t => t.trim()).filter(t => t);
  }

  await executeSearch(criteria);
};

const clearAdvancedSearch = () => {
  advancedCriteria.value.query = '';
  selectedFileTypes.value = [];
  dateFrom.value = '';
  dateTo.value = '';
  sizeMin.value = '';
  sizeMax.value = '';
  tagsInput.value = '';
  scope.value = 'all';
  contentSearch.value = false;
  caseSensitive.value = false;
  useRegex.value = false;
};

// ==================== Search Execution ====================

const isSearching = ref(false);
const hasSearched = ref(false);
const searchResults = ref<SearchResult[]>([]);

const hasResults = computed(() => searchResults.value.length > 0);

const executeSearch = async (criteria: SearchCriteria) => {
  isSearching.value = true;
  hasSearched.value = true;
  searchResults.value = [];

  try {
    const results = await performAdvancedSearch(criteria);
    searchResults.value = results;
  } catch (error) {
    console.error('Search failed:', error);
    alert('Search failed. Please try again.');
  } finally {
    isSearching.value = false;
  }
};

const clearResults = () => {
  searchResults.value = [];
  hasSearched.value = false;
};

// ==================== Smart Folders ====================

const smartFolders = ref<SmartFolder[]>([]);
const showCreateDialog = ref(false);
const newFolderName = ref('');
const newFolderIcon = ref('folder');
const newFolderColor = ref('#ffaa00');
const newFolderAutoRefresh = ref(true);

const loadSmartFolders = () => {
  smartFolders.value = getAllSmartFolders();
};

const openSmartFolder = async (folder: SmartFolder) => {
  try {
    const results = await refreshSmartFolder(folder.id);
    searchResults.value = results;
    hasSearched.value = true;
    activeTab.value = 'advanced';
  } catch (error) {
    console.error('Failed to open smart folder:', error);
    alert('Failed to open smart folder');
  }
};

const refreshFolder = async (folder: SmartFolder) => {
  try {
    await refreshSmartFolder(folder.id);
    loadSmartFolders();
    alert(`"${folder.name}" refreshed`);
  } catch (error) {
    console.error('Failed to refresh folder:', error);
    alert('Failed to refresh folder');
  }
};

const editFolder = (folder: SmartFolder) => {
  // For simplicity, show alert - in a real implementation, would show edit dialog
  const newName = prompt('Enter new name:', folder.name);
  if (newName && newName !== folder.name) {
    updateSmartFolder(folder.id, { name: newName });
    loadSmartFolders();
  }
};

const deleteFolder = (folder: SmartFolder) => {
  if (confirm(`Delete smart folder "${folder.name}"?`)) {
    deleteSmartFolder(folder.id);
    loadSmartFolders();
  }
};

const refreshAllFolders = async () => {
  try {
    await refreshAllSmartFolders();
    loadSmartFolders();
    alert('All smart folders refreshed');
  } catch (error) {
    console.error('Failed to refresh folders:', error);
    alert('Failed to refresh some folders');
  }
};

const installPredefined = () => {
  installPredefinedFolders();
  loadSmartFolders();
  alert('Predefined smart folders installed');
};

const exportFolders = () => {
  downloadSmartFoldersExport();
};

const importFileInput = ref<HTMLInputElement | null>(null);

const importFolders = () => {
  importFileInput.value?.click();
};

const handleImportFile = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  try {
    await importFromFile(file, 'merge');
    loadSmartFolders();
    alert('Smart folders imported successfully');
  } catch (error) {
    console.error('Import failed:', error);
    alert('Failed to import smart folders');
  } finally {
    input.value = '';
  }
};

const saveAsSmartFolder = () => {
  showCreateDialog.value = true;
};

const createSmartFolderFromCurrent = () => {
  if (!newFolderName.value.trim()) {
    alert('Please enter a folder name');
    return;
  }

  // Get current criteria based on active tab
  let criteria: SearchCriteria;
  if (activeTab.value === 'simple') {
    criteria = {
      query: simpleQuery.value,
      mode: 'simple',
      scope: 'all'
    };
  } else {
    criteria = {
      query: advancedCriteria.value.query,
      mode: advancedCriteria.value.mode,
      scope: scope.value,
      fileTypes: selectedFileTypes.value.length > 0 ? selectedFileTypes.value : undefined,
      contentSearch: contentSearch.value,
      caseSensitive: caseSensitive.value,
      regex: useRegex.value
    };
  }

  createSmartFolder(newFolderName.value, criteria, {
    icon: newFolderIcon.value,
    color: newFolderColor.value,
    autoRefresh: newFolderAutoRefresh.value
  });

  loadSmartFolders();
  showCreateDialog.value = false;
  newFolderName.value = '';

  alert('Smart folder created');
};

// ==================== Results Actions ====================

const openResult = (result: SearchResult) => {
  if (result.file.type === 'folder') {
    emit('openFolder', result.file.path);
  } else {
    emit('openFile', result.file.path, result.file);
  }
};

const showLocation = (result: SearchResult) => {
  const pathParts = result.file.path.split('/');
  pathParts.pop();
  const folderPath = pathParts.join('/') || 'dh0';
  emit('openFolder', folderPath);
};

const showInfo = (result: SearchResult) => {
  const info = `Name: ${result.file.name}
Type: ${result.file.type}
Path: ${result.file.path}
Size: ${result.file.sizeFormatted || 'N/A'}
Modified: ${result.file.modified ? formatDate(result.file.modified) : 'N/A'}
Relevance: ${Math.round(result.relevanceScore * 100)}%
Matches: ${result.matchCount}`;
  alert(info);
};

const exportResults = (format: 'json' | 'csv') => {
  downloadSearchResults(searchResults.value, { format });
};

// ==================== Utility Functions ====================

const highlightMatches = (text: string, result: SearchResult): string => {
  const nameMatch = result.matches.find(m => m.field === 'name');
  if (!nameMatch) return text;

  const before = text.substring(0, nameMatch.start);
  const match = text.substring(nameMatch.start, nameMatch.end);
  const after = text.substring(nameMatch.end);

  return `${before}<mark class="highlight">${match}</mark>${after}`;
};

const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString();
};

const formatCriteria = (criteria: SearchCriteria): string => {
  const parts: string[] = [];

  if (criteria.query) parts.push(`"${criteria.query}"`);
  if (criteria.fileTypes?.length) parts.push(`types: ${criteria.fileTypes.join(', ')}`);
  if (criteria.scope && criteria.scope !== 'all') parts.push(`in ${criteria.scope}`);

  return parts.join(' • ') || 'All files';
};

// ==================== Lifecycle ====================

onMounted(() => {
  // Focus simple search input
  simpleSearchInput.value?.focus();

  // Load smart folders
  loadSmartFolders();

  // Subscribe to smart folder changes
  subscribe(() => {
    loadSmartFolders();
  });
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

.amiga-advanced-search {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #a0a0a0;
  font-family: 'Press Start 2P', monospace;
  overflow: hidden;
}

/* Tab Bar */
.tab-bar {
  display: flex;
  background: #ffffff;
  border-bottom: 2px solid #000000;
}

.tab {
  padding: 6px 16px;
  font-size: 9px;
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  border-bottom: none;
  cursor: pointer;
  user-select: none;
  transition: all 0.1s;
}

.tab:hover {
  background: #b0b0b0;
}

.tab.active {
  background: #0055aa;
  color: #ffffff;
  border-color: #ffffff #000000 transparent #ffffff;
}

/* Tab Content */
.tab-content {
  padding: 12px;
  background: #a0a0a0;
  border-bottom: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
}

/* Common Elements */
.amiga-input {
  padding: 4px 8px;
  font-size: 9px;
  font-family: 'Press Start 2P', monospace;
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  color: #000000;
}

.amiga-input:focus {
  outline: none;
  background: #ffffcc;
}

.amiga-select {
  padding: 4px;
  font-size: 9px;
  font-family: 'Press Start 2P', monospace;
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  color: #000000;
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

.label {
  font-size: 9px;
  color: #000000;
  min-width: 80px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 8px;
  cursor: pointer;
  margin-right: 16px;
}

/* Simple Search */
.search-simple {
  position: relative;
}

.input-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.flex-1 {
  flex: 1;
}

.suggestions-dropdown {
  position: absolute;
  top: 100%;
  left: 80px;
  right: 100px;
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  max-height: 200px;
  overflow-y: auto;
  margin-top: 2px;
}

.suggestion-item {
  padding: 4px 8px;
  font-size: 8px;
  cursor: pointer;
  border-bottom: 1px solid #e0e0e0;
}

.suggestion-item:hover {
  background: #0055aa;
  color: #ffffff;
}

/* Advanced Search */
.search-advanced {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.advanced-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  align-items: center;
}

.field-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.field-group.full-width {
  grid-column: 1 / -1;
}

.type-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.type-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  background: #ffffff;
  border: 1px solid #808080;
  font-size: 8px;
  cursor: pointer;
}

.type-chip:has(input:checked) {
  background: #0055aa;
  color: #ffffff;
}

.action-row {
  display: flex;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid #808080;
}

.regex-error {
  color: #ff0000;
  font-size: 8px;
  padding: 4px;
  background: #ffcccc;
  border: 1px solid #ff0000;
}

.color-input {
  width: 60px;
  height: 24px;
  border: 2px solid #000000;
  cursor: pointer;
}

/* Smart Folders */
.smart-folders {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.toolbar {
  display: flex;
  gap: 8px;
}

.folders-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.folder-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  background: #ffffff;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  cursor: pointer;
  transition: all 0.1s;
}

.folder-item:hover {
  background: #e0e0e0;
}

.folder-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.folder-info {
  flex: 1;
  min-width: 0;
}

.folder-name {
  font-size: 9px;
  font-weight: bold;
  color: #000000;
}

.folder-details {
  font-size: 7px;
  color: #666666;
  margin-top: 2px;
}

.folder-criteria {
  font-size: 7px;
  color: #0055aa;
  margin-top: 2px;
}

.folder-actions {
  display: flex;
  gap: 4px;
}

.icon-button {
  width: 24px;
  height: 24px;
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.1s;
}

.icon-button:active {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}

/* Results Section */
.results-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  overflow: hidden;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background: #a0a0a0;
  border-bottom: 2px solid #000000;
}

.results-info {
  font-size: 9px;
  color: #000000;
}

.results-actions {
  display: flex;
  gap: 8px;
}

.results-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.result-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 8px;
  background: #f0f0f0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.1s;
}

.result-item:hover {
  background: #e0e0e0;
}

.result-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.result-main {
  flex: 1;
  min-width: 0;
}

.result-name {
  font-size: 9px;
  font-weight: bold;
  color: #000000;
}

.result-path {
  font-size: 7px;
  color: #666666;
  margin-top: 2px;
}

.result-snippets {
  margin-top: 4px;
  padding: 4px;
  background: #000000;
  color: #00ff00;
  font-size: 7px;
  font-family: monospace;
  border: 1px solid #00ff00;
}

.snippet {
  margin-bottom: 2px;
}

.snippet-line {
  color: #ffaa00;
  margin-right: 4px;
}

.snippet-text {
  color: #ffffff;
}

.snippet-more {
  color: #808080;
  font-style: italic;
  margin-top: 2px;
}

.result-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  font-size: 8px;
  color: #666666;
}

.result-size {
  font-family: monospace;
}

.result-relevance {
  display: flex;
  align-items: center;
  gap: 4px;
}

.relevance-bar {
  width: 60px;
  height: 8px;
  background: #e0e0e0;
  border: 1px solid #000000;
}

.relevance-fill {
  height: 100%;
  background: #0055aa;
  transition: width 0.3s;
}

.relevance-text {
  font-size: 7px;
  color: #0055aa;
  font-weight: bold;
}

.result-matches {
  color: #0055aa;
}

.result-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* Highlights */
:deep(.highlight),
:deep(mark) {
  background: #ffff00;
  color: #000000;
  font-weight: bold;
  padding: 0 2px;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
  gap: 16px;
  font-size: 9px;
  color: #666666;
}

.loading-spinner {
  font-size: 32px;
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.3;
}

.empty-text {
  font-size: 10px;
  color: #000000;
  margin-bottom: 8px;
}

.empty-hint {
  font-size: 8px;
  color: #666666;
}

/* Modal Dialog */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.modal-dialog {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  box-shadow: 4px 4px 8px rgba(0, 0, 0, 0.5);
  min-width: 400px;
}

.modal-header {
  padding: 8px 12px;
  background: #0055aa;
  color: #ffffff;
  font-size: 10px;
  font-weight: bold;
  border-bottom: 2px solid #000000;
}

.modal-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.modal-footer {
  padding: 8px 12px;
  background: #ffffff;
  border-top: 2px solid #000000;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
</style>

<template>
  <div class="amiga-clipboard">
    <!-- Toolbar -->
    <div class="clipboard-toolbar">
      <div class="toolbar-section">
        <input
          v-model="searchQuery"
          type="text"
          class="search-input"
          placeholder="Search clipboard..."
          @input="handleSearch"
        />
      </div>
      <div class="toolbar-section">
        <button class="amiga-button" @click="pasteSelected" :disabled="!selectedItem">
          Paste
        </button>
        <button class="amiga-button" @click="clearAll">
          Clear All
        </button>
      </div>
    </div>

    <!-- Status Bar -->
    <div class="clipboard-status">
      <span class="status-text">{{ statusText }}</span>
      <span class="item-count">{{ displayedItems.length }} items in history</span>
    </div>

    <!-- Pinned Items Section -->
    <div v-if="pinnedItems.length > 0" class="clipboard-section">
      <div class="section-header">
        <div class="section-icon">📌</div>
        <div class="section-title">Pinned Items</div>
      </div>
      <div class="clipboard-items">
        <div
          v-for="item in pinnedItems"
          :key="item.id"
          class="clipboard-item"
          :class="{ selected: selectedItem?.id === item.id }"
          @click="selectItem(item)"
          @dblclick="pasteItem(item)"
          @contextmenu.prevent="showContextMenu(item, $event)"
        >
          <div class="item-icon">
            <div class="icon-wrapper">
              {{ getIcon(item) }}
            </div>
            <div class="pin-indicator">📌</div>
          </div>
          <div class="item-details">
            <div class="item-name">{{ getItemName(item) }}</div>
            <div class="item-meta">
              <span class="item-type">{{ item.type }}</span>
              <span class="item-operation" :class="item.operation">
                {{ item.operation === 'copy' ? '📋' : '✂' }}
              </span>
              <span class="item-timestamp">{{ formatTime(item.timestamp) }}</span>
            </div>
            <div class="item-preview">{{ item.preview }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Items Section -->
    <div class="clipboard-section">
      <div class="section-header">
        <div class="section-icon">🕐</div>
        <div class="section-title">Recent Items</div>
      </div>
      <div class="clipboard-items" ref="itemsContainer">
        <div
          v-if="unpinnedItems.length === 0"
          class="empty-message"
        >
          No clipboard items yet. Copy or cut files to see them here.
        </div>
        <div
          v-for="item in unpinnedItems"
          :key="item.id"
          class="clipboard-item"
          :class="{ selected: selectedItem?.id === item.id }"
          @click="selectItem(item)"
          @dblclick="pasteItem(item)"
          @contextmenu.prevent="showContextMenu(item, $event)"
        >
          <div class="item-icon">
            <div class="icon-wrapper">
              {{ getIcon(item) }}
            </div>
          </div>
          <div class="item-details">
            <div class="item-name">{{ getItemName(item) }}</div>
            <div class="item-meta">
              <span class="item-type">{{ item.type }}</span>
              <span class="item-operation" :class="item.operation">
                {{ item.operation === 'copy' ? '📋' : '✂' }}
              </span>
              <span class="item-timestamp">{{ formatTime(item.timestamp) }}</span>
              <span v-if="item.size" class="item-size">{{ item.size }}</span>
            </div>
            <div class="item-preview">{{ item.preview }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Context Menu -->
    <div
      v-if="contextMenuVisible"
      class="context-menu"
      :style="{ left: contextMenuX + 'px', top: contextMenuY + 'px' }"
      @click.stop
    >
      <div class="context-menu-item" @click="pasteContextItem">
        <span class="menu-icon">📄</span>
        Paste
      </div>
      <div class="context-menu-separator"></div>
      <div class="context-menu-item" @click="togglePin">
        <span class="menu-icon">{{ contextMenuItem?.pinned ? '📍' : '📌' }}</span>
        {{ contextMenuItem?.pinned ? 'Unpin' : 'Pin' }}
      </div>
      <div class="context-menu-separator"></div>
      <div class="context-menu-item" @click="deleteContextItem">
        <span class="menu-icon">🗑</span>
        Delete
      </div>
      <div class="context-menu-item danger" @click="clearAllConfirm">
        <span class="menu-icon">⚠</span>
        Clear All
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import advancedClipboard, { type ClipboardHistoryItem } from '../../utils/clipboard-manager';

const searchQuery = ref('');
const selectedItem = ref<ClipboardHistoryItem | null>(null);
const clipboardHistory = ref<ClipboardHistoryItem[]>([]);
const contextMenuVisible = ref(false);
const contextMenuX = ref(0);
const contextMenuY = ref(0);
const contextMenuItem = ref<ClipboardHistoryItem | null>(null);
const itemsContainer = ref<HTMLElement | null>(null);

// Computed
const displayedItems = computed(() => {
  if (searchQuery.value.trim()) {
    return advancedClipboard.search(searchQuery.value);
  }
  return clipboardHistory.value;
});

const pinnedItems = computed(() => {
  return displayedItems.value.filter(item => item.pinned);
});

const unpinnedItems = computed(() => {
  return displayedItems.value.filter(item => !item.pinned);
});

const statusText = computed(() => {
  return advancedClipboard.getStatus();
});

// Methods
const loadHistory = () => {
  clipboardHistory.value = advancedClipboard.getHistory();
};

const handleSearch = () => {
  // Search is handled by the computed property
};

const selectItem = (item: ClipboardHistoryItem) => {
  selectedItem.value = item;
  advancedClipboard.useHistoryItem(item.id);
};

const pasteItem = async (item: ClipboardHistoryItem) => {
  try {
    advancedClipboard.useHistoryItem(item.id);
    // Show notification
    console.log('Item set as current clipboard:', item.name || item.text);
    // Note: Actual paste will happen when user uses Ctrl+V in a folder
  } catch (error) {
    console.error('Failed to set clipboard item:', error);
    alert('Failed to set clipboard item');
  }
};

const pasteSelected = async () => {
  if (!selectedItem.value) return;
  await pasteItem(selectedItem.value);
};

const showContextMenu = (item: ClipboardHistoryItem, event: MouseEvent) => {
  contextMenuItem.value = item;
  contextMenuX.value = event.clientX;
  contextMenuY.value = event.clientY;
  contextMenuVisible.value = true;
};

const pasteContextItem = async () => {
  if (contextMenuItem.value) {
    await pasteItem(contextMenuItem.value);
  }
  contextMenuVisible.value = false;
};

const togglePin = () => {
  if (!contextMenuItem.value) return;

  if (contextMenuItem.value.pinned) {
    advancedClipboard.unpin(contextMenuItem.value.id);
  } else {
    advancedClipboard.pin(contextMenuItem.value.id);
  }

  loadHistory();
  contextMenuVisible.value = false;
};

const deleteContextItem = () => {
  if (!contextMenuItem.value) return;

  if (confirm(`Delete "${getItemName(contextMenuItem.value)}" from clipboard history?`)) {
    advancedClipboard.deleteHistoryItem(contextMenuItem.value.id);
    loadHistory();

    if (selectedItem.value?.id === contextMenuItem.value.id) {
      selectedItem.value = null;
    }
  }

  contextMenuVisible.value = false;
};

const clearAll = () => {
  if (confirm('Clear all clipboard history? Pinned items will be kept.')) {
    advancedClipboard.clearHistory(false);
    loadHistory();
    selectedItem.value = null;
  }
};

const clearAllConfirm = () => {
  contextMenuVisible.value = false;
  if (confirm('Clear ALL clipboard history including pinned items?')) {
    advancedClipboard.clearHistory(true);
    loadHistory();
    selectedItem.value = null;
  }
};

const getIcon = (item: ClipboardHistoryItem): string => {
  switch (item.type) {
    case 'folder':
      return '📁';
    case 'file':
      return '📄';
    case 'text':
      return '📝';
    case 'image':
      return '🖼';
    default:
      return '📋';
  }
};

const getItemName = (item: ClipboardHistoryItem): string => {
  if (item.name) return item.name;
  if (item.text) {
    const truncated = item.text.substring(0, 50);
    return truncated.length < item.text.length ? truncated + '...' : truncated;
  }
  return 'Unknown item';
};

const formatTime = (timestamp: Date): string => {
  const now = new Date();
  const diff = now.getTime() - timestamp.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
};

const handleKeyDown = async (event: KeyboardEvent) => {
  const isCtrlOrCmd = event.ctrlKey || event.metaKey;

  if (isCtrlOrCmd && event.key.toLowerCase() === 'v') {
    event.preventDefault();
    if (selectedItem.value) {
      await pasteSelected();
    }
  } else if (event.key === 'Delete' && selectedItem.value) {
    event.preventDefault();
    if (confirm(`Delete "${getItemName(selectedItem.value)}" from clipboard history?`)) {
      advancedClipboard.deleteHistoryItem(selectedItem.value.id);
      loadHistory();
      selectedItem.value = null;
    }
  } else if (event.key === 'Escape') {
    contextMenuVisible.value = false;
  }
};

const handleClipboardEvent = () => {
  loadHistory();
};

const closeContextMenu = () => {
  contextMenuVisible.value = false;
};

// Lifecycle
onMounted(() => {
  loadHistory();

  // Subscribe to clipboard events
  const unsubscribe = advancedClipboard.subscribe(handleClipboardEvent);

  // Add keyboard listener
  document.addEventListener('keydown', handleKeyDown);

  // Close context menu when clicking outside
  document.addEventListener('click', closeContextMenu);

  // Cleanup
  onUnmounted(() => {
    unsubscribe();
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('click', closeContextMenu);
  });
});
</script>

<style scoped>
.amiga-clipboard {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #a0a0a0;
  font-family: 'Press Start 2P', monospace;
}

/* Toolbar */
.clipboard-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background: #ffffff;
  border-bottom: 2px solid #000000;
  gap: 8px;
}

.toolbar-section {
  display: flex;
  gap: 4px;
  align-items: center;
}

.search-input {
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 4px 8px;
  font-size: 8px;
  font-family: 'Press Start 2P', monospace;
  color: #000000;
  min-width: 200px;
}

.search-input:focus {
  outline: none;
  border-color: #0055aa #ffffff #ffffff #0055aa;
}

.amiga-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 4px 8px;
  font-size: 8px;
  cursor: pointer;
  color: #000000;
  font-family: 'Press Start 2P', monospace;
  transition: all 0.05s;
}

.amiga-button:hover:not(:disabled) {
  background: #b0b0b0;
}

.amiga-button:active:not(:disabled) {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}

.amiga-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Status Bar */
.clipboard-status {
  display: flex;
  justify-content: space-between;
  padding: 4px 8px;
  background: #ffffff;
  border-bottom: 2px solid #000000;
  font-size: 7px;
  color: #0055aa;
}

.status-text {
  font-weight: bold;
}

/* Section */
.clipboard-section {
  display: flex;
  flex-direction: column;
  margin-bottom: 8px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: #888888;
  border-bottom: 2px solid #000000;
  font-size: 9px;
  color: #ffffff;
}

.section-icon {
  font-size: 12px;
}

.section-title {
  font-weight: bold;
}

/* Items Container */
.clipboard-items {
  flex: 1;
  overflow-y: auto;
  padding: 4px;
  background: #ffffff;
}

.empty-message {
  padding: 20px;
  text-align: center;
  color: #666666;
  font-size: 8px;
}

/* Clipboard Item */
.clipboard-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px;
  margin-bottom: 2px;
  background: #ffffff;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.05s;
  user-select: none;
}

.clipboard-item:hover {
  background: rgba(0, 85, 170, 0.1);
  border-color: #0055aa;
}

.clipboard-item.selected {
  background: #0055aa;
  border-color: #0055aa;
  color: #ffffff;
}

.clipboard-item.selected .item-name,
.clipboard-item.selected .item-meta,
.clipboard-item.selected .item-preview {
  color: #ffffff;
}

/* Item Icon */
.item-icon {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
}

.icon-wrapper {
  font-size: 24px;
}

.pin-indicator {
  position: absolute;
  top: 0;
  right: 0;
  font-size: 12px;
}

/* Item Details */
.item-details {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-size: 9px;
  font-weight: bold;
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-meta {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 7px;
  color: #666666;
  margin-bottom: 2px;
}

.clipboard-item.selected .item-meta {
  color: #cccccc;
}

.item-type {
  text-transform: uppercase;
  font-weight: bold;
}

.item-operation {
  font-size: 10px;
}

.item-operation.copy {
  color: #0055aa;
}

.item-operation.cut {
  color: #ff6600;
}

.clipboard-item.selected .item-operation {
  color: #ffffff;
}

.item-preview {
  font-size: 7px;
  color: #888888;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.clipboard-item.selected .item-preview {
  color: #dddddd;
}

/* Context Menu */
.context-menu {
  position: fixed;
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.4);
  z-index: 10000;
  min-width: 150px;
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  font-size: 8px;
  cursor: pointer;
  color: #000000;
  transition: all 0.05s;
}

.context-menu-item:hover {
  background: #0055aa;
  color: #ffffff;
}

.context-menu-item.danger:hover {
  background: #ff0000;
  color: #ffffff;
}

.menu-icon {
  font-size: 10px;
}

.context-menu-separator {
  height: 1px;
  background: #666666;
  margin: 2px 0;
}

/* Scrollbar styling */
.clipboard-items::-webkit-scrollbar {
  width: 12px;
}

.clipboard-items::-webkit-scrollbar-track {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
}

.clipboard-items::-webkit-scrollbar-thumb {
  background: #888888;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
}

.clipboard-items::-webkit-scrollbar-thumb:hover {
  background: #666666;
}
</style>

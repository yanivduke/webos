<template>
  <div class="gopher-client">
    <!-- Address Bar -->
    <div class="address-bar">
      <button class="amiga-button small" @click="goBack" :disabled="historyIndex <= 0">
        ← Back
      </button>
      <button class="amiga-button small" @click="goForward" :disabled="historyIndex >= history.length - 1">
        Forward →
      </button>
      <button class="amiga-button small" @click="goHome">
        🏠 Home
      </button>
      <input
        v-model="currentUrl"
        type="text"
        class="amiga-input url-input"
        placeholder="gopher://hostname:70/path"
        @keyup.enter="navigate"
      />
      <button class="amiga-button" @click="navigate">
        Go
      </button>
      <button class="amiga-button small" @click="reload">
        ⟳
      </button>
    </div>

    <!-- Content Area -->
    <div class="content-area" ref="contentRef">
      <div v-if="isLoading" class="loading">
        <div class="loading-spinner">⟳</div>
        <div class="loading-text">Fetching from Gopherspace...</div>
      </div>

      <div v-else-if="error" class="error-message">
        <div class="error-icon">⚠</div>
        <div class="error-text">{{ error }}</div>
        <button class="amiga-button small" @click="reload">Try Again</button>
      </div>

      <div v-else class="gopher-content">
        <!-- Text Content -->
        <div v-if="contentType === 'text'" class="text-content">
          <pre>{{ content }}</pre>
        </div>

        <!-- Directory Listing -->
        <div v-else-if="contentType === 'menu'" class="menu-content">
          <div class="page-title" v-if="pageTitle">{{ pageTitle }}</div>
          <div
            v-for="(item, index) in menuItems"
            :key="index"
            class="menu-item"
            :class="{ link: item.type !== 'i', selected: selectedIndex === index }"
            @click="selectMenuItem(index)"
            @dblclick="openMenuItem(item)"
          >
            <span class="item-icon">{{ getItemIcon(item.type) }}</span>
            <span class="item-text">{{ item.display }}</span>
            <span v-if="item.host && item.type !== 'i'" class="item-host">{{ item.host }}</span>
          </div>
        </div>

        <!-- Binary/Unknown Content -->
        <div v-else class="binary-content">
          <div class="binary-icon">📦</div>
          <div class="binary-text">Binary content ({{ contentType }})</div>
          <div class="binary-info">{{ content.length }} bytes</div>
          <button class="amiga-button" @click="downloadBinary">Download</button>
        </div>
      </div>
    </div>

    <!-- Status Bar -->
    <div class="status-bar">
      <span class="status-type">{{ statusText }}</span>
      <span class="status-separator">|</span>
      <span class="status-url">{{ displayUrl }}</span>
      <span v-if="menuItems.length > 0" class="status-items">{{ menuItems.length }} items</span>
    </div>

    <!-- Bookmarks Bar -->
    <div class="bookmarks-bar">
      <div class="bookmark-label">Bookmarks:</div>
      <button
        class="amiga-button small"
        @click="navigateTo('gopher://gopher.floodgap.com')"
      >
        Floodgap
      </button>
      <button
        class="amiga-button small"
        @click="navigateTo('gopher://gopher.quux.org')"
      >
        Quux.org
      </button>
      <button
        class="amiga-button small"
        @click="navigateTo('gopher://gopherpedia.com')"
      >
        Gopherpedia
      </button>
      <button
        class="amiga-button small"
        @click="addBookmark"
        :disabled="!currentUrl"
      >
        + Add
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, nextTick } from 'vue';

interface GopherMenuItem {
  type: string;
  display: string;
  selector: string;
  host: string;
  port: number;
}

const currentUrl = ref('gopher://gopher.floodgap.com');
const content = ref('');
const contentType = ref<'text' | 'menu' | 'binary'>('menu');
const menuItems = ref<GopherMenuItem[]>([]);
const selectedIndex = ref(-1);
const isLoading = ref(false);
const error = ref('');
const history = ref<string[]>([]);
const historyIndex = ref(-1);
const pageTitle = ref('');
const contentRef = ref<HTMLDivElement | null>(null);

const statusText = computed(() => {
  if (isLoading.value) return 'Loading...';
  if (error.value) return 'Error';
  if (contentType.value === 'menu') return 'Gopher Menu';
  if (contentType.value === 'text') return 'Text Document';
  return 'Binary Data';
});

const displayUrl = computed(() => {
  return currentUrl.value || 'Not connected';
});

const getItemIcon = (type: string): string => {
  const icons: { [key: string]: string } = {
    '0': '📄', // Text file
    '1': '📁', // Directory
    '2': '☎', // CSO phone book
    '3': '⚠',  // Error
    '4': '🗜',  // BinHex file
    '5': '💾', // DOS archive
    '6': '📋', // UUEncoded file
    '7': '🔍', // Search
    '8': '📡', // Telnet
    '9': '📦', // Binary file
    'g': '🖼️', // GIF image
    'I': '🖼️', // Image
    'h': '🌐', // HTML
    'i': ' ',  // Info line
    's': '🔊', // Sound
  };
  return icons[type] || '❓';
};

const navigate = async () => {
  if (!currentUrl.value) return;

  // Add to history
  if (historyIndex.value < history.value.length - 1) {
    history.value = history.value.slice(0, historyIndex.value + 1);
  }
  history.value.push(currentUrl.value);
  historyIndex.value = history.value.length - 1;

  await fetchGopher(currentUrl.value);
};

const navigateTo = (url: string) => {
  currentUrl.value = url;
  navigate();
};

const fetchGopher = async (url: string) => {
  isLoading.value = true;
  error.value = '';
  selectedIndex.value = -1;

  try {
    const response = await fetch('/api/network/gopher/fetch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch');
    }

    const data = await response.json();

    if (data.type === 'menu') {
      contentType.value = 'menu';
      menuItems.value = data.items || [];
      // Extract title from first info line if present
      const titleItem = menuItems.value.find(item => item.type === 'i' && item.display.trim());
      pageTitle.value = titleItem?.display.trim() || '';
    } else if (data.type === 'text') {
      contentType.value = 'text';
      content.value = data.content || '';
      menuItems.value = [];
    } else {
      contentType.value = 'binary';
      content.value = data.content || '';
      menuItems.value = [];
    }

    // Scroll to top
    nextTick(() => {
      if (contentRef.value) {
        contentRef.value.scrollTop = 0;
      }
    });

  } catch (err: any) {
    error.value = err.message || 'Unknown error occurred';
    contentType.value = 'menu';
    menuItems.value = [];
  } finally {
    isLoading.value = false;
  }
};

const selectMenuItem = (index: number) => {
  selectedIndex.value = index;
};

const openMenuItem = (item: GopherMenuItem) => {
  if (item.type === 'i') return; // Info lines are not clickable

  // Build the gopher URL
  const url = `gopher://${item.host}:${item.port}/${item.type}${item.selector}`;
  currentUrl.value = url;
  navigate();
};

const reload = () => {
  if (currentUrl.value) {
    fetchGopher(currentUrl.value);
  }
};

const goBack = () => {
  if (historyIndex.value > 0) {
    historyIndex.value--;
    currentUrl.value = history.value[historyIndex.value];
    fetchGopher(currentUrl.value);
  }
};

const goForward = () => {
  if (historyIndex.value < history.value.length - 1) {
    historyIndex.value++;
    currentUrl.value = history.value[historyIndex.value];
    fetchGopher(currentUrl.value);
  }
};

const goHome = () => {
  currentUrl.value = 'gopher://gopher.floodgap.com';
  navigate();
};

const addBookmark = () => {
  const title = prompt('Bookmark name:', pageTitle.value || currentUrl.value);
  if (title) {
    alert(`Bookmark "${title}" would be saved here`);
  }
};

const downloadBinary = () => {
  const blob = new Blob([content.value], { type: 'application/octet-stream' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'gopher-download.bin';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};
</script>

<style scoped>
.gopher-client {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  font-family: 'Press Start 2P', 'Courier New', monospace;
}

.address-bar {
  display: flex;
  gap: 6px;
  padding: 8px;
  background: #a0a0a0;
  border-bottom: 2px solid #000000;
  align-items: center;
}

.amiga-input {
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 4px 8px;
  font-size: 9px;
  font-family: 'Press Start 2P', monospace;
  color: #000000;
}

.url-input {
  flex: 1;
  min-width: 200px;
}

.amiga-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 4px 12px;
  font-size: 9px;
  cursor: pointer;
  color: #000000;
  font-family: 'Press Start 2P', monospace;
  white-space: nowrap;
}

.amiga-button:active {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}

.amiga-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.amiga-button.small {
  padding: 3px 8px;
  font-size: 8px;
}

.content-area {
  flex: 1;
  overflow-y: auto;
  background: #ffffff;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #0055aa;
}

.loading-spinner {
  font-size: 48px;
  animation: spin 2s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.loading-text {
  margin-top: 16px;
  font-size: 10px;
}

.error-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #ff0000;
  padding: 20px;
}

.error-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.error-text {
  font-size: 10px;
  margin-bottom: 16px;
  text-align: center;
}

.gopher-content {
  padding: 12px;
}

.text-content {
  font-family: 'Courier New', monospace;
  font-size: 11px;
  line-height: 1.6;
}

.text-content pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.menu-content {
  font-size: 10px;
}

.page-title {
  font-size: 12px;
  font-weight: bold;
  color: #0055aa;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #0055aa;
}

.menu-item {
  padding: 6px 8px;
  margin-bottom: 2px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 2px solid transparent;
  transition: all 0.1s;
}

.menu-item.link {
  cursor: pointer;
}

.menu-item.link:hover {
  background: #e0e0e0;
}

.menu-item.selected {
  background: #0055aa;
  color: #ffffff;
  border-color: #0055aa;
}

.item-icon {
  font-size: 14px;
  width: 20px;
  text-align: center;
}

.item-text {
  flex: 1;
}

.item-host {
  font-size: 8px;
  color: #666666;
  font-family: 'Courier New', monospace;
}

.menu-item.selected .item-host {
  color: #cccccc;
}

.binary-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666666;
}

.binary-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.binary-text {
  font-size: 11px;
  margin-bottom: 8px;
}

.binary-info {
  font-size: 9px;
  margin-bottom: 16px;
  color: #888888;
}

.status-bar {
  display: flex;
  gap: 12px;
  padding: 6px 10px;
  background: #ffffff;
  border-top: 2px solid #000000;
  font-size: 8px;
  color: #000000;
}

.status-type {
  font-weight: bold;
  color: #0055aa;
}

.status-separator {
  color: #cccccc;
}

.status-url {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #666666;
}

.status-items {
  color: #666666;
}

.bookmarks-bar {
  display: flex;
  gap: 6px;
  padding: 6px 8px;
  background: #a0a0a0;
  border-top: 2px solid #ffffff;
  align-items: center;
}

.bookmark-label {
  font-size: 9px;
  color: #000000;
  margin-right: 4px;
}

/* Scrollbar styling */
.content-area::-webkit-scrollbar {
  width: 12px;
}

.content-area::-webkit-scrollbar-track {
  background: #cccccc;
}

.content-area::-webkit-scrollbar-thumb {
  background: #666666;
  border: 1px solid #000000;
}

.content-area::-webkit-scrollbar-thumb:hover {
  background: #888888;
}
</style>

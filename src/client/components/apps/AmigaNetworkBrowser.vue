<template>
  <div class="network-browser">
    <!-- Toolbar -->
    <div class="toolbar">
      <div class="toolbar-left">
        <button class="amiga-button" @click="showConnectionDialog" title="New Connection">
          Connect
        </button>
        <button
          class="amiga-button"
          @click="disconnect"
          :disabled="!currentConnection"
          title="Disconnect"
        >
          Disconnect
        </button>
        <div class="toolbar-separator"></div>
        <button class="amiga-button" @click="refreshRemote" :disabled="!currentConnection" title="Refresh">
          Refresh
        </button>
        <button class="amiga-button" @click="toggleBookmarks" title="Bookmarks">
          Bookmarks
        </button>
        <button class="amiga-button" @click="toggleTransferQueue" title="Transfers">
          Transfers {{ activeTransferCount > 0 ? `(${activeTransferCount})` : '' }}
        </button>
      </div>
      <div class="toolbar-right">
        <div v-if="currentConnection" class="connection-status connected">
          🟢 {{ currentConnection.protocol.toUpperCase() }}://{{ currentConnection.host }}:{{ currentConnection.port }}
        </div>
        <div v-else class="connection-status disconnected">
          🔴 Not Connected
        </div>
      </div>
    </div>

    <!-- Main content area -->
    <div class="browser-content">
      <!-- Bookmarks sidebar (toggleable) -->
      <div v-if="showBookmarks" class="bookmarks-panel">
        <div class="panel-header">
          <span class="panel-title">Bookmarks</span>
          <button class="close-button" @click="showBookmarks = false">✕</button>
        </div>
        <div class="bookmarks-list">
          <div
            v-for="bookmark in bookmarks"
            :key="bookmark.id"
            class="bookmark-item"
            :class="{ favorite: bookmark.favorite }"
            @click="connectToBookmark(bookmark)"
            @dblclick="connectToBookmark(bookmark)"
          >
            <div class="bookmark-icon">{{ getProtocolIcon(bookmark.protocol) }}</div>
            <div class="bookmark-info">
              <div class="bookmark-name">{{ bookmark.name }}</div>
              <div class="bookmark-details">{{ bookmark.host }}:{{ bookmark.port }}</div>
            </div>
            <div class="bookmark-actions">
              <button class="icon-button" @click.stop="removeBookmark(bookmark.id)" title="Delete">
                🗑️
              </button>
            </div>
          </div>
          <div v-if="bookmarks.length === 0" class="empty-message">
            No bookmarks saved
          </div>
        </div>
      </div>

      <!-- Two-pane file manager -->
      <div class="file-manager">
        <!-- Left pane: Local files -->
        <div class="file-pane local-pane">
          <div class="pane-header">
            <span class="pane-title">Local Files</span>
            <button class="amiga-button-small" @click="navigateLocalUp" :disabled="!canNavigateLocalUp">
              Parent
            </button>
          </div>
          <div class="pane-path">{{ localPath }}</div>
          <div class="pane-content" @drop="handleLocalDrop" @dragover.prevent>
            <div
              v-for="file in localFiles"
              :key="file.id"
              class="file-item"
              :class="{
                selected: selectedLocalFiles.includes(file.id),
                directory: file.type === 'folder'
              }"
              draggable="true"
              @dragstart="startDragLocal(file, $event)"
              @click="selectLocalFile(file, $event)"
              @dblclick="openLocalFile(file)"
            >
              <div class="item-icon">{{ file.type === 'folder' ? '📁' : '📄' }}</div>
              <div class="item-name">{{ file.name }}</div>
              <div class="item-size">{{ file.size || '' }}</div>
            </div>
            <div v-if="localFiles.length === 0" class="empty-message">
              No files
            </div>
          </div>
        </div>

        <!-- Resize handle -->
        <div class="pane-resizer" @mousedown="startResize"></div>

        <!-- Right pane: Remote files -->
        <div class="file-pane remote-pane">
          <div class="pane-header">
            <span class="pane-title">Remote Files</span>
            <button
              class="amiga-button-small"
              @click="navigateRemoteUp"
              :disabled="!canNavigateRemoteUp || !currentConnection"
            >
              Parent
            </button>
          </div>
          <div class="pane-path">{{ remotePath }}</div>
          <div class="pane-content" @drop="handleRemoteDrop" @dragover.prevent>
            <div v-if="!currentConnection" class="empty-message">
              Not connected to a server
            </div>
            <div v-else-if="loadingRemote" class="loading-message">
              Loading...
            </div>
            <div v-else>
              <div
                v-for="file in remoteFiles"
                :key="file.path"
                class="file-item"
                :class="{
                  selected: selectedRemoteFiles.includes(file.path),
                  directory: file.isDirectory
                }"
                draggable="true"
                @dragstart="startDragRemote(file, $event)"
                @click="selectRemoteFile(file, $event)"
                @dblclick="openRemoteFile(file)"
                @contextmenu.prevent="showRemoteContextMenu(file, $event)"
              >
                <div class="item-icon">{{ file.isDirectory ? '📁' : '📄' }}</div>
                <div class="item-name">{{ file.name }}</div>
                <div class="item-size">{{ file.isDirectory ? '' : formatSize(file.size) }}</div>
              </div>
              <div v-if="remoteFiles.length === 0" class="empty-message">
                Empty directory
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Transfer queue (toggleable bottom panel) -->
      <div v-if="showTransferQueue" class="transfer-panel">
        <div class="panel-header">
          <span class="panel-title">File Transfers</span>
          <div class="panel-actions">
            <button class="amiga-button-small" @click="clearCompletedTransfers">
              Clear Completed
            </button>
            <button class="close-button" @click="showTransferQueue = false">✕</button>
          </div>
        </div>
        <div class="transfer-list">
          <AmigaTransferProgress
            v-for="transfer in transfers"
            :key="transfer.id"
            :transfer="transfer"
            @pause="pauseTransfer"
            @resume="resumeTransfer"
            @cancel="cancelTransfer"
            @retry="retryTransfer"
          />
          <div v-if="transfers.length === 0" class="empty-message">
            No active transfers
          </div>
        </div>
      </div>
    </div>

    <!-- Status bar -->
    <div class="status-bar">
      <div class="status-left">
        {{ localFiles.length }} local items | {{ remoteFiles.length }} remote items
      </div>
      <div class="status-right">
        {{ statusMessage }}
      </div>
    </div>

    <!-- Connection dialog -->
    <AmigaConnectionDialog
      v-if="connectionDialogOpen"
      @close="connectionDialogOpen = false"
      @connect="handleConnect"
    />

    <!-- Context menu for remote files -->
    <div
      v-if="contextMenu.visible"
      class="context-menu"
      :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
      @click="contextMenu.visible = false"
    >
      <div class="context-menu-item" @click="downloadFile">Download</div>
      <div class="context-menu-item" @click="deleteRemoteFile">Delete</div>
      <div class="context-menu-item" @click="renameRemoteFile">Rename</div>
      <div class="context-menu-separator"></div>
      <div class="context-menu-item" @click="createRemoteFolder">New Folder</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import networkBrowser, { type NetworkConnection, type NetworkFile, type TransferItem } from '../../utils/network-browser';
import AmigaConnectionDialog from '../AmigaConnectionDialog.vue';
import AmigaTransferProgress from '../AmigaTransferProgress.vue';

interface LocalFile {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: string;
  path: string;
}

const currentConnection = ref<NetworkConnection | null>(null);
const connectionDialogOpen = ref(false);

// Local files
const localPath = ref('dh0');
const localFiles = ref<LocalFile[]>([]);
const selectedLocalFiles = ref<string[]>([]);

// Remote files
const remotePath = ref('/');
const remoteFiles = ref<NetworkFile[]>([]);
const selectedRemoteFiles = ref<string[]>([]);
const loadingRemote = ref(false);

// UI state
const showBookmarks = ref(false);
const showTransferQueue = ref(true);
const statusMessage = ref('Ready');

// Bookmarks
const bookmarks = ref(networkBrowser.getBookmarks());

// Transfers
const transfers = ref<TransferItem[]>([]);

// Context menu
const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  file: null as NetworkFile | null
});

// Computed
const canNavigateLocalUp = computed(() => {
  const parts = localPath.value.split('/');
  return parts.length > 1;
});

const canNavigateRemoteUp = computed(() => {
  return remotePath.value !== '/';
});

const activeTransferCount = computed(() => {
  return transfers.value.filter(t => t.status === 'active' || t.status === 'pending').length;
});

// Load local files
const loadLocalFiles = async () => {
  try {
    const response = await fetch(`/api/files/list?path=${encodeURIComponent(localPath.value)}`);
    if (!response.ok) throw new Error('Failed to load local files');

    const data = await response.json();
    localFiles.value = data.items || [];
    statusMessage.value = `Loaded ${localFiles.value.length} local items`;
  } catch (error) {
    console.error('Error loading local files:', error);
    statusMessage.value = 'Error loading local files';
    localFiles.value = [];
  }
};

// Load remote files
const loadRemoteFiles = async () => {
  if (!currentConnection.value) return;

  loadingRemote.value = true;
  try {
    const files = await networkBrowser.listRemoteFiles(currentConnection.value.id, remotePath.value);
    remoteFiles.value = files;
    statusMessage.value = `Loaded ${files.length} remote items`;
  } catch (error) {
    console.error('Error loading remote files:', error);
    statusMessage.value = 'Error loading remote files';
    remoteFiles.value = [];
  } finally {
    loadingRemote.value = false;
  }
};

// Connection management
const showConnectionDialog = () => {
  connectionDialogOpen.value = true;
};

const handleConnect = async (connection: NetworkConnection) => {
  currentConnection.value = connection;
  remotePath.value = connection.path || '/';
  await loadRemoteFiles();
  bookmarks.value = networkBrowser.getBookmarks(); // Refresh bookmarks
};

const disconnect = async () => {
  if (currentConnection.value) {
    await networkBrowser.disconnect(currentConnection.value.id);
    currentConnection.value = null;
    remoteFiles.value = [];
    selectedRemoteFiles.value = [];
    statusMessage.value = 'Disconnected';
  }
};

const connectToBookmark = async (bookmark: any) => {
  const connection: NetworkConnection = {
    id: `conn-${Date.now()}`,
    protocol: bookmark.protocol,
    host: bookmark.host,
    port: bookmark.port,
    username: bookmark.username,
    password: bookmark.password,
    path: bookmark.path || '/'
  };

  const result = await networkBrowser.connect(connection);
  if (result.success) {
    currentConnection.value = connection;
    remotePath.value = connection.path || '/';
    await loadRemoteFiles();
    statusMessage.value = `Connected to ${bookmark.name}`;
  } else {
    alert(`Connection failed: ${result.message}`);
  }
};

// Navigation
const navigateLocalUp = () => {
  const parts = localPath.value.split('/');
  if (parts.length > 1) {
    parts.pop();
    localPath.value = parts.join('/') || 'dh0';
    loadLocalFiles();
  }
};

const navigateRemoteUp = () => {
  if (remotePath.value !== '/') {
    const parts = remotePath.value.split('/').filter(p => p);
    parts.pop();
    remotePath.value = '/' + parts.join('/');
    loadRemoteFiles();
  }
};

const openLocalFile = (file: LocalFile) => {
  if (file.type === 'folder') {
    localPath.value = file.path;
    loadLocalFiles();
  }
};

const openRemoteFile = (file: NetworkFile) => {
  if (file.isDirectory) {
    remotePath.value = file.path;
    loadRemoteFiles();
  }
};

// File selection
const selectLocalFile = (file: LocalFile, event: MouseEvent) => {
  if (event.ctrlKey || event.metaKey) {
    const index = selectedLocalFiles.value.indexOf(file.id);
    if (index > -1) {
      selectedLocalFiles.value.splice(index, 1);
    } else {
      selectedLocalFiles.value.push(file.id);
    }
  } else {
    selectedLocalFiles.value = [file.id];
  }
};

const selectRemoteFile = (file: NetworkFile, event: MouseEvent) => {
  if (event.ctrlKey || event.metaKey) {
    const index = selectedRemoteFiles.value.indexOf(file.path);
    if (index > -1) {
      selectedRemoteFiles.value.splice(index, 1);
    } else {
      selectedRemoteFiles.value.push(file.path);
    }
  } else {
    selectedRemoteFiles.value = [file.path];
  }
};

// Drag and drop
const startDragLocal = (file: LocalFile, event: DragEvent) => {
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData('text/plain', JSON.stringify({ type: 'local', file }));
  }
};

const startDragRemote = (file: NetworkFile, event: DragEvent) => {
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData('text/plain', JSON.stringify({ type: 'remote', file }));
  }
};

const handleLocalDrop = async (event: DragEvent) => {
  const data = event.dataTransfer?.getData('text/plain');
  if (!data) return;

  try {
    const dragData = JSON.parse(data);
    if (dragData.type === 'remote' && currentConnection.value) {
      // Download from remote to local
      const file = dragData.file as NetworkFile;
      await downloadFileToLocal(file);
    }
  } catch (error) {
    console.error('Drop error:', error);
  }
};

const handleRemoteDrop = async (event: DragEvent) => {
  if (!currentConnection.value) return;

  const data = event.dataTransfer?.getData('text/plain');
  if (!data) return;

  try {
    const dragData = JSON.parse(data);
    if (dragData.type === 'local') {
      // Upload from local to remote
      const file = dragData.file as LocalFile;
      await uploadFileToRemote(file);
    }
  } catch (error) {
    console.error('Drop error:', error);
  }
};

// File operations
const uploadFileToRemote = async (file: LocalFile) => {
  if (!currentConnection.value) return;

  try {
    // Read file content from server
    const response = await fetch('/api/files/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: file.path })
    });

    if (!response.ok) throw new Error('Failed to read file');

    const data = await response.json();
    const blob = new Blob([data.content]);

    await networkBrowser.uploadFile(
      currentConnection.value.id,
      file.path,
      remotePath.value + '/' + file.name,
      blob
    );

    statusMessage.value = `Uploading ${file.name}...`;
    updateTransfers();
  } catch (error) {
    console.error('Upload error:', error);
    alert(`Upload failed: ${error}`);
  }
};

const downloadFileToLocal = async (file: NetworkFile) => {
  if (!currentConnection.value) return;

  try {
    await networkBrowser.downloadFile(
      currentConnection.value.id,
      file.path,
      localPath.value + '/' + file.name
    );

    statusMessage.value = `Downloading ${file.name}...`;
    updateTransfers();
  } catch (error) {
    console.error('Download error:', error);
    alert(`Download failed: ${error}`);
  }
};

const downloadFile = async () => {
  if (!contextMenu.value.file) return;
  await downloadFileToLocal(contextMenu.value.file);
};

const deleteRemoteFile = async () => {
  if (!contextMenu.value.file || !currentConnection.value) return;

  const confirmed = confirm(`Delete ${contextMenu.value.file.name}?`);
  if (!confirmed) return;

  try {
    statusMessage.value = `Deleting ${contextMenu.value.file.name}...`;
    // Mock delete - would call API
    setTimeout(() => {
      loadRemoteFiles();
    }, 500);
  } catch (error) {
    console.error('Delete error:', error);
    alert(`Delete failed: ${error}`);
  }
};

const renameRemoteFile = async () => {
  if (!contextMenu.value.file || !currentConnection.value) return;

  const newName = prompt('Enter new name:', contextMenu.value.file.name);
  if (!newName || newName === contextMenu.value.file.name) return;

  try {
    statusMessage.value = `Renaming ${contextMenu.value.file.name}...`;
    // Mock rename - would call API
    setTimeout(() => {
      loadRemoteFiles();
    }, 500);
  } catch (error) {
    console.error('Rename error:', error);
    alert(`Rename failed: ${error}`);
  }
};

const createRemoteFolder = async () => {
  if (!currentConnection.value) return;

  const folderName = prompt('Enter folder name:');
  if (!folderName) return;

  try {
    statusMessage.value = `Creating folder ${folderName}...`;
    // Mock create - would call API
    setTimeout(() => {
      loadRemoteFiles();
    }, 500);
  } catch (error) {
    console.error('Create folder error:', error);
    alert(`Create folder failed: ${error}`);
  }
};

// Transfer management
const updateTransfers = () => {
  transfers.value = networkBrowser.getTransfers();
};

const pauseTransfer = (transferId: string) => {
  networkBrowser.pauseTransfer(transferId);
  updateTransfers();
};

const resumeTransfer = (transferId: string) => {
  networkBrowser.resumeTransfer(transferId);
  updateTransfers();
};

const cancelTransfer = (transferId: string) => {
  networkBrowser.cancelTransfer(transferId);
  updateTransfers();
};

const retryTransfer = (transferId: string) => {
  // Would implement retry logic
  console.log('Retry transfer:', transferId);
};

const clearCompletedTransfers = () => {
  networkBrowser.clearCompletedTransfers();
  updateTransfers();
};

// Bookmarks
const toggleBookmarks = () => {
  showBookmarks.value = !showBookmarks.value;
};

const removeBookmark = (bookmarkId: string) => {
  if (confirm('Remove this bookmark?')) {
    networkBrowser.removeBookmark(bookmarkId);
    bookmarks.value = networkBrowser.getBookmarks();
  }
};

const toggleTransferQueue = () => {
  showTransferQueue.value = !showTransferQueue.value;
};

// Context menu
const showRemoteContextMenu = (file: NetworkFile, event: MouseEvent) => {
  contextMenu.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY,
    file
  };
};

// Refresh
const refreshRemote = () => {
  loadRemoteFiles();
};

// Utilities
const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getProtocolIcon = (protocol: string): string => {
  const icons: Record<string, string> = {
    ftp: '📂',
    sftp: '🔒',
    webdav: '☁️',
    http: '🌐'
  };
  return icons[protocol] || '📁';
};

// Resize panes
let isResizing = false;
let startX = 0;
let startWidth = 0;

const startResize = (event: MouseEvent) => {
  isResizing = true;
  startX = event.clientX;
  const localPane = document.querySelector('.local-pane') as HTMLElement;
  if (localPane) {
    startWidth = localPane.offsetWidth;
  }
  document.addEventListener('mousemove', onResize);
  document.addEventListener('mouseup', stopResize);
  event.preventDefault();
};

const onResize = (event: MouseEvent) => {
  if (!isResizing) return;
  const dx = event.clientX - startX;
  const localPane = document.querySelector('.local-pane') as HTMLElement;
  if (localPane) {
    const newWidth = startWidth + dx;
    if (newWidth > 200 && newWidth < window.innerWidth - 400) {
      localPane.style.width = newWidth + 'px';
    }
  }
};

const stopResize = () => {
  isResizing = false;
  document.removeEventListener('mousemove', onResize);
  document.removeEventListener('mouseup', stopResize);
};

// Close context menu on click outside
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (!target.closest('.context-menu')) {
    contextMenu.value.visible = false;
  }
};

// Lifecycle
onMounted(() => {
  loadLocalFiles();

  // Subscribe to network browser updates
  const unsubscribe = networkBrowser.subscribe(() => {
    updateTransfers();
    bookmarks.value = networkBrowser.getBookmarks();
  });

  document.addEventListener('click', handleClickOutside);

  // Initial transfer update
  updateTransfers();

  return () => {
    unsubscribe();
    document.removeEventListener('click', handleClickOutside);
  };
});

onUnmounted(() => {
  document.removeEventListener('mousemove', onResize);
  document.removeEventListener('mouseup', stopResize);
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.network-browser {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #a0a0a0;
  font-family: 'Press Start 2P', monospace;
}

/* Toolbar */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  border-bottom: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  background: #a0a0a0;
}

.toolbar-left {
  display: flex;
  gap: 8px;
  align-items: center;
}

.toolbar-separator {
  width: 2px;
  height: 24px;
  background: #000000;
  margin: 0 4px;
}

.toolbar-right {
  display: flex;
  gap: 8px;
  align-items: center;
}

.connection-status {
  font-size: 9px;
  padding: 4px 8px;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
}

.connection-status.connected {
  background: #ccffcc;
  color: #006600;
}

.connection-status.disconnected {
  background: #ffcccc;
  color: #cc0000;
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
}

.amiga-button:hover:not(:disabled) {
  background: #b0b0b0;
}

.amiga-button:active:not(:disabled) {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}

.amiga-button:disabled {
  color: #808080;
  cursor: not-allowed;
}

.amiga-button-small {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 2px 8px;
  font-size: 8px;
  cursor: pointer;
  color: #000000;
  font-family: 'Press Start 2P', monospace;
}

.amiga-button-small:hover:not(:disabled) {
  background: #b0b0b0;
}

.amiga-button-small:active:not(:disabled) {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}

.amiga-button-small:disabled {
  color: #808080;
  cursor: not-allowed;
}

/* Main content */
.browser-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* Bookmarks panel */
.bookmarks-panel {
  width: 250px;
  border-right: 2px solid #000000;
  background: #a0a0a0;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background: #0055aa;
  color: #ffffff;
  border-bottom: 2px solid #000000;
}

.panel-title {
  font-size: 10px;
  font-weight: bold;
}

.panel-actions {
  display: flex;
  gap: 4px;
}

.close-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  width: 20px;
  height: 20px;
  cursor: pointer;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #000000;
}

.close-button:hover {
  background: #b0b0b0;
}

.bookmarks-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.bookmark-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  margin-bottom: 4px;
  background: #c0c0c0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  cursor: pointer;
}

.bookmark-item:hover {
  background: #d0d0d0;
}

.bookmark-item.favorite {
  border-color: #ffaa00;
  background: #ffffcc;
}

.bookmark-icon {
  font-size: 16px;
}

.bookmark-info {
  flex: 1;
  min-width: 0;
}

.bookmark-name {
  font-size: 9px;
  font-weight: bold;
  color: #000000;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bookmark-details {
  font-size: 7px;
  color: #555555;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bookmark-actions {
  display: flex;
  gap: 4px;
}

.icon-button {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 12px;
  padding: 2px;
}

.icon-button:hover {
  opacity: 0.7;
}

/* File manager */
.file-manager {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.file-pane {
  display: flex;
  flex-direction: column;
  background: #a0a0a0;
}

.local-pane {
  width: 50%;
  border-right: 1px solid #000000;
}

.remote-pane {
  flex: 1;
  border-left: 1px solid #000000;
}

.pane-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  background: #0055aa;
  color: #ffffff;
  border-bottom: 2px solid #000000;
}

.pane-title {
  font-size: 10px;
  font-weight: bold;
}

.pane-path {
  padding: 4px 8px;
  background: #ffffff;
  border-bottom: 2px solid #000000;
  font-size: 8px;
  color: #000000;
  font-family: monospace;
}

.pane-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  margin-bottom: 2px;
  cursor: pointer;
  user-select: none;
}

.file-item:hover {
  background: rgba(0, 85, 170, 0.2);
}

.file-item.selected {
  background: #0055aa;
  color: #ffffff;
}

.file-item.directory {
  font-weight: bold;
}

.item-icon {
  font-size: 14px;
}

.item-name {
  flex: 1;
  font-size: 9px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-size {
  font-size: 8px;
  color: #555555;
  min-width: 60px;
  text-align: right;
}

.file-item.selected .item-size {
  color: #cccccc;
}

.pane-resizer {
  width: 4px;
  background: #888888;
  cursor: col-resize;
  border-left: 1px solid #ffffff;
  border-right: 1px solid #000000;
}

.pane-resizer:hover {
  background: #777777;
}

/* Transfer panel */
.transfer-panel {
  border-top: 2px solid #000000;
  background: #a0a0a0;
  max-height: 40%;
  display: flex;
  flex-direction: column;
}

.transfer-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

/* Status bar */
.status-bar {
  display: flex;
  justify-content: space-between;
  padding: 4px 8px;
  border-top: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  background: #c0c0c0;
  font-size: 8px;
  color: #000000;
}

/* Context menu */
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
  padding: 6px 12px;
  font-size: 9px;
  cursor: pointer;
  color: #000000;
}

.context-menu-item:hover {
  background: #0055aa;
  color: #ffffff;
}

.context-menu-separator {
  height: 2px;
  background: #000000;
  margin: 2px 0;
}

/* Messages */
.empty-message,
.loading-message {
  text-align: center;
  padding: 32px;
  color: #555555;
  font-size: 9px;
}

.loading-message {
  color: #0055aa;
}

/* Scrollbars */
::-webkit-scrollbar {
  width: 16px;
  height: 16px;
}

::-webkit-scrollbar-track {
  background: #888888;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
}

::-webkit-scrollbar-thumb {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
}

::-webkit-scrollbar-thumb:hover {
  background: #b0b0b0;
}
</style>

<template>
  <div class="ftp-client">
    <!-- Connection Bar -->
    <div class="connection-bar">
      <input
        v-model="hostname"
        type="text"
        class="amiga-input"
        placeholder="ftp.example.com"
        :disabled="isConnected"
      />
      <input
        v-model.number="port"
        type="number"
        class="amiga-input port-input"
        placeholder="21"
        :disabled="isConnected"
      />
      <input
        v-model="username"
        type="text"
        class="amiga-input"
        placeholder="username"
        :disabled="isConnected"
      />
      <input
        v-model="password"
        type="password"
        class="amiga-input"
        placeholder="password"
        :disabled="isConnected"
      />
      <button
        class="amiga-button"
        @click="isConnected ? disconnect() : connect()"
      >
        {{ isConnected ? 'Disconnect' : 'Connect' }}
      </button>
      <span v-if="isConnected" class="status-indicator connected">● Connected</span>
      <span v-else class="status-indicator disconnected">○ Disconnected</span>
    </div>

    <!-- Path Bar -->
    <div v-if="isConnected" class="path-bar">
      <button class="amiga-button small" @click="navigateUp" :disabled="currentPath === '/'">
        ↑ Parent
      </button>
      <span class="current-path">{{ currentPath }}</span>
      <button class="amiga-button small" @click="refreshList">
        ⟳ Refresh
      </button>
    </div>

    <!-- File List -->
    <div v-if="isConnected" class="file-list" ref="fileListRef">
      <div class="list-header">
        <div class="col-name">Name</div>
        <div class="col-size">Size</div>
        <div class="col-date">Modified</div>
        <div class="col-type">Type</div>
      </div>
      <div
        v-for="(item, index) in fileList"
        :key="index"
        class="file-item"
        :class="{ selected: selectedItem === item, directory: item.type === 'd' }"
        @click="selectItem(item)"
        @dblclick="openItem(item)"
      >
        <div class="col-name">
          <span class="file-icon">{{ item.type === 'd' ? '📁' : '📄' }}</span>
          {{ item.name }}
        </div>
        <div class="col-size">{{ item.type === 'd' ? '-' : formatSize(item.size) }}</div>
        <div class="col-date">{{ formatDate(item.date) }}</div>
        <div class="col-type">{{ item.type === 'd' ? 'DIR' : 'FILE' }}</div>
      </div>
    </div>

    <!-- Log Output -->
    <div class="log-output" ref="logRef">
      <div class="log-header">Connection Log:</div>
      <div
        v-for="(line, index) in logLines"
        :key="index"
        class="log-line"
        :class="line.type"
      >
        {{ line.text }}
      </div>
    </div>

    <!-- Action Bar -->
    <div v-if="isConnected" class="action-bar">
      <button class="amiga-button small" @click="downloadFile" :disabled="!selectedItem || selectedItem.type === 'd'">
        ⬇ Download
      </button>
      <button class="amiga-button small" @click="uploadFile">
        ⬆ Upload
      </button>
      <button class="amiga-button small" @click="deleteFile" :disabled="!selectedItem">
        🗑 Delete
      </button>
      <button class="amiga-button small" @click="createDirectory">
        📁 New Dir
      </button>
      <button class="amiga-button small" @click="renameItem" :disabled="!selectedItem">
        ✏ Rename
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';

interface FileItem {
  name: string;
  type: 'd' | '-';
  size: number;
  date: string;
  permissions?: string;
}

interface LogLine {
  text: string;
  type: 'info' | 'error' | 'success' | 'command';
}

const hostname = ref('');
const port = ref(21);
const username = ref('anonymous');
const password = ref('');
const isConnected = ref(false);
const currentPath = ref('/');
const fileList = ref<FileItem[]>([]);
const selectedItem = ref<FileItem | null>(null);
const logLines = ref<LogLine[]>([]);
const sessionId = ref<string | null>(null);
const fileListRef = ref<HTMLDivElement | null>(null);
const logRef = ref<HTMLDivElement | null>(null);

onMounted(() => {
  addLog('FTP Client v1.0 - Ready', 'info');
});

onUnmounted(() => {
  if (isConnected.value) {
    disconnect();
  }
});

const addLog = (text: string, type: LogLine['type'] = 'info') => {
  const timestamp = new Date().toLocaleTimeString();
  logLines.value.push({ text: `[${timestamp}] ${text}`, type });
  nextTick(() => {
    if (logRef.value) {
      logRef.value.scrollTop = logRef.value.scrollHeight;
    }
  });
};

const connect = async () => {
  if (!hostname.value) {
    addLog('Error: Please enter a hostname', 'error');
    return;
  }

  addLog(`Connecting to ${hostname.value}:${port.value}...`, 'command');

  try {
    const response = await fetch('/api/network/ftp/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host: hostname.value,
        port: port.value,
        user: username.value,
        password: password.value
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Connection failed');
    }

    const data = await response.json();
    sessionId.value = data.sessionId;
    isConnected.value = true;
    addLog(`Connected to ${hostname.value}`, 'success');

    // Load initial directory
    await listDirectory('/');

  } catch (error: any) {
    addLog(`Connection failed: ${error.message}`, 'error');
  }
};

const disconnect = async () => {
  if (!sessionId.value) return;

  try {
    await fetch(`/api/network/ftp/disconnect/${sessionId.value}`, {
      method: 'POST'
    });
    addLog('Disconnected', 'info');
  } catch (error) {
    console.error('Disconnect error:', error);
  }

  isConnected.value = false;
  sessionId.value = null;
  fileList.value = [];
  selectedItem.value = null;
  currentPath.value = '/';
};

const listDirectory = async (path: string) => {
  if (!sessionId.value) return;

  addLog(`Listing directory: ${path}`, 'command');

  try {
    const response = await fetch('/api/network/ftp/list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sessionId.value,
        path: path
      })
    });

    if (!response.ok) {
      throw new Error('Failed to list directory');
    }

    const data = await response.json();
    fileList.value = data.files || [];
    currentPath.value = path;
    selectedItem.value = null;
    addLog(`Listed ${fileList.value.length} items`, 'success');

  } catch (error: any) {
    addLog(`Error: ${error.message}`, 'error');
  }
};

const selectItem = (item: FileItem) => {
  selectedItem.value = item;
};

const openItem = (item: FileItem) => {
  if (item.type === 'd') {
    // Navigate to directory
    const newPath = currentPath.value === '/'
      ? `/${item.name}`
      : `${currentPath.value}/${item.name}`;
    listDirectory(newPath);
  } else {
    // Download file
    downloadFile();
  }
};

const navigateUp = () => {
  if (currentPath.value === '/') return;
  const parts = currentPath.value.split('/').filter(p => p);
  parts.pop();
  const newPath = parts.length === 0 ? '/' : '/' + parts.join('/');
  listDirectory(newPath);
};

const refreshList = () => {
  listDirectory(currentPath.value);
};

const downloadFile = async () => {
  if (!selectedItem.value || selectedItem.value.type === 'd' || !sessionId.value) return;

  const filePath = currentPath.value === '/'
    ? `/${selectedItem.value.name}`
    : `${currentPath.value}/${selectedItem.value.name}`;

  addLog(`Downloading: ${filePath}`, 'command');

  try {
    const response = await fetch('/api/network/ftp/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sessionId.value,
        remotePath: filePath
      })
    });

    if (!response.ok) {
      throw new Error('Download failed');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedItem.value.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    addLog(`Downloaded: ${selectedItem.value.name}`, 'success');

  } catch (error: any) {
    addLog(`Download error: ${error.message}`, 'error');
  }
};

const uploadFile = () => {
  addLog('Upload functionality: Select a file to upload', 'info');
  // TODO: Implement file upload dialog
};

const deleteFile = async () => {
  if (!selectedItem.value || !sessionId.value) return;

  const confirm = window.confirm(`Delete ${selectedItem.value.name}?`);
  if (!confirm) return;

  const filePath = currentPath.value === '/'
    ? `/${selectedItem.value.name}`
    : `${currentPath.value}/${selectedItem.value.name}`;

  addLog(`Deleting: ${filePath}`, 'command');

  try {
    const response = await fetch('/api/network/ftp/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sessionId.value,
        path: filePath
      })
    });

    if (!response.ok) {
      throw new Error('Delete failed');
    }

    addLog(`Deleted: ${selectedItem.value.name}`, 'success');
    refreshList();

  } catch (error: any) {
    addLog(`Delete error: ${error.message}`, 'error');
  }
};

const createDirectory = async () => {
  if (!sessionId.value) return;

  const dirName = prompt('Enter directory name:');
  if (!dirName) return;

  const dirPath = currentPath.value === '/'
    ? `/${dirName}`
    : `${currentPath.value}/${dirName}`;

  addLog(`Creating directory: ${dirPath}`, 'command');

  try {
    const response = await fetch('/api/network/ftp/mkdir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sessionId.value,
        path: dirPath
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create directory');
    }

    addLog(`Created directory: ${dirName}`, 'success');
    refreshList();

  } catch (error: any) {
    addLog(`Error: ${error.message}`, 'error');
  }
};

const renameItem = async () => {
  if (!selectedItem.value || !sessionId.value) return;

  const newName = prompt(`Rename "${selectedItem.value.name}" to:`, selectedItem.value.name);
  if (!newName || newName === selectedItem.value.name) return;

  const oldPath = currentPath.value === '/'
    ? `/${selectedItem.value.name}`
    : `${currentPath.value}/${selectedItem.value.name}`;
  const newPath = currentPath.value === '/'
    ? `/${newName}`
    : `${currentPath.value}/${newName}`;

  addLog(`Renaming: ${oldPath} to ${newPath}`, 'command');

  try {
    const response = await fetch('/api/network/ftp/rename', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sessionId.value,
        oldPath: oldPath,
        newPath: newPath
      })
    });

    if (!response.ok) {
      throw new Error('Rename failed');
    }

    addLog(`Renamed to: ${newName}`, 'success');
    refreshList();

  } catch (error: any) {
    addLog(`Rename error: ${error.message}`, 'error');
  }
};

const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

const formatDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  } catch {
    return dateStr;
  }
};
</script>

<style scoped>
.ftp-client {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  font-family: 'Press Start 2P', 'Courier New', monospace;
}

.connection-bar {
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
  padding: 4px 6px;
  font-size: 9px;
  font-family: 'Press Start 2P', monospace;
  color: #000000;
  flex: 1;
  min-width: 100px;
}

.port-input {
  width: 60px;
  flex: 0;
}

.amiga-input:disabled {
  background: #cccccc;
  color: #666666;
}

.amiga-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 4px 10px;
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

.status-indicator {
  font-size: 9px;
  font-family: 'Press Start 2P', monospace;
  margin-left: 8px;
}

.status-indicator.connected {
  color: #00aa00;
}

.status-indicator.disconnected {
  color: #666666;
}

.path-bar {
  display: flex;
  gap: 8px;
  padding: 6px 8px;
  background: #e0e0e0;
  border-bottom: 2px solid #000000;
  align-items: center;
}

.current-path {
  flex: 1;
  font-size: 9px;
  color: #000000;
  padding: 4px 8px;
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
}

.file-list {
  flex: 1;
  overflow-y: auto;
  background: #ffffff;
  border-bottom: 2px solid #000000;
}

.list-header {
  display: grid;
  grid-template-columns: 2fr 1fr 2fr 80px;
  gap: 8px;
  padding: 6px 8px;
  background: #0055aa;
  color: #ffffff;
  font-size: 9px;
  font-weight: bold;
  border-bottom: 2px solid #000000;
  position: sticky;
  top: 0;
  z-index: 1;
}

.file-item {
  display: grid;
  grid-template-columns: 2fr 1fr 2fr 80px;
  gap: 8px;
  padding: 4px 8px;
  font-size: 9px;
  cursor: pointer;
  border-bottom: 1px solid #e0e0e0;
  transition: background 0.1s;
}

.file-item:hover {
  background: #f0f0f0;
}

.file-item.selected {
  background: #0055aa;
  color: #ffffff;
}

.file-item.directory {
  font-weight: bold;
}

.col-name {
  display: flex;
  align-items: center;
  gap: 6px;
}

.file-icon {
  font-size: 12px;
}

.col-size,
.col-date,
.col-type {
  display: flex;
  align-items: center;
}

.log-output {
  height: 120px;
  padding: 8px;
  overflow-y: auto;
  background: #000000;
  color: #00ff00;
  font-family: 'Courier New', monospace;
  font-size: 9px;
  line-height: 1.4;
  border-bottom: 2px solid #000000;
}

.log-header {
  color: #ffaa00;
  margin-bottom: 4px;
  font-weight: bold;
}

.log-line {
  margin-bottom: 2px;
}

.log-line.error {
  color: #ff0000;
}

.log-line.success {
  color: #00ff00;
}

.log-line.info {
  color: #00aaff;
}

.log-line.command {
  color: #ffaa00;
}

.action-bar {
  display: flex;
  gap: 6px;
  padding: 8px;
  background: #a0a0a0;
  border-top: 2px solid #ffffff;
}

/* Scrollbar styling */
.file-list::-webkit-scrollbar,
.log-output::-webkit-scrollbar {
  width: 12px;
}

.file-list::-webkit-scrollbar-track,
.log-output::-webkit-scrollbar-track {
  background: #cccccc;
}

.file-list::-webkit-scrollbar-thumb {
  background: #666666;
  border: 1px solid #000000;
}

.log-output::-webkit-scrollbar-thumb {
  background: #004400;
  border: 1px solid #000000;
}

.file-list::-webkit-scrollbar-thumb:hover,
.log-output::-webkit-scrollbar-thumb:hover {
  background: #888888;
}
</style>

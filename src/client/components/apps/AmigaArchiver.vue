<template>
  <div class="amiga-archiver">
    <!-- Toolbar -->
    <div class="archiver-toolbar">
      <button class="amiga-button" @click="createNewArchive" title="Create new archive">
        New
      </button>
      <button class="amiga-button" @click="openArchive" :disabled="!selectedFile || !isZipFile(selectedFile)" title="Open archive">
        Open
      </button>
      <button class="amiga-button" @click="extractArchive" :disabled="!currentArchive" title="Extract archive">
        Extract
      </button>
      <button class="amiga-button" @click="addToArchive" :disabled="!currentArchive || selectedFiles.length === 0" title="Add to archive">
        Add
      </button>
      <button class="amiga-button" @click="removeFromArchive" :disabled="!currentArchive || selectedArchiveItems.length === 0" title="Remove from archive">
        Remove
      </button>
      <button class="amiga-button" @click="testArchive" :disabled="!currentArchive" title="Test archive integrity">
        Test
      </button>
      <button class="amiga-button" @click="showArchiveInfo" :disabled="!currentArchive" title="Archive information">
        Info
      </button>
      <div class="toolbar-spacer"></div>
      <div class="compression-level">
        <label>Level:</label>
        <select v-model="compressionLevel" class="amiga-select">
          <option value="none">None</option>
          <option value="fast">Fast</option>
          <option value="normal">Normal</option>
          <option value="maximum">Maximum</option>
        </select>
      </div>
    </div>

    <!-- Two-pane layout -->
    <div class="archiver-content">
      <!-- Left pane: File browser -->
      <div class="archiver-pane file-browser">
        <div class="pane-header">
          <span class="pane-title">Files</span>
          <button class="amiga-button-small" @click="navigateUp" :disabled="!canNavigateUp">
            Parent
          </button>
        </div>
        <div class="pane-path">{{ currentPath }}</div>
        <div class="pane-content">
          <div
            v-for="file in fileList"
            :key="file.id"
            class="file-item"
            :class="{
              selected: selectedFiles.includes(file.id),
              highlight: file.type === 'file' && isZipFile(file)
            }"
            @click="selectFile(file, $event)"
            @dblclick="openFile(file)"
          >
            <div class="item-icon">{{ getFileIcon(file) }}</div>
            <div class="item-name">{{ file.name }}</div>
            <div class="item-size">{{ file.size || '' }}</div>
          </div>
          <div v-if="fileList.length === 0" class="empty-message">
            No files
          </div>
        </div>
      </div>

      <!-- Resizer -->
      <div class="pane-resizer" @mousedown="startResize"></div>

      <!-- Right pane: Archive contents -->
      <div class="archiver-pane archive-view">
        <div class="pane-header">
          <span class="pane-title">Archive Contents</span>
          <span v-if="currentArchive" class="archive-stats">
            {{ archiveStats.fileCount }} files, {{ formatSize(archiveStats.totalSize) }} → {{ formatSize(archiveStats.compressedSize) }} ({{ archiveStats.compressionRatio }}%)
          </span>
        </div>
        <div class="pane-content">
          <div v-if="!currentArchive" class="empty-message">
            No archive loaded
          </div>
          <div v-else class="archive-table">
            <div class="table-header">
              <div class="col-name">Name</div>
              <div class="col-size">Size</div>
              <div class="col-compressed">Compressed</div>
              <div class="col-ratio">Ratio</div>
              <div class="col-date">Date</div>
            </div>
            <div
              v-for="item in archiveContents"
              :key="item.path"
              class="table-row"
              :class="{
                selected: selectedArchiveItems.includes(item.path),
                directory: item.isDirectory
              }"
              @click="selectArchiveItem(item, $event)"
              @dblclick="extractSingleFile(item)"
            >
              <div class="col-name">
                <span class="item-icon">{{ item.isDirectory ? '📁' : '📄' }}</span>
                {{ item.name }}
              </div>
              <div class="col-size">{{ item.isDirectory ? '' : formatSize(item.size) }}</div>
              <div class="col-compressed">{{ item.isDirectory ? '' : formatSize(item.compressedSize) }}</div>
              <div class="col-ratio">{{ item.isDirectory ? '' : item.ratio + '%' }}</div>
              <div class="col-date">{{ formatDate(item.date) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Compression settings panel (togglable) -->
    <div v-if="showSettings" class="settings-panel">
      <div class="settings-header">
        <span>Compression Settings</span>
        <button class="amiga-button-small" @click="showSettings = false">Close</button>
      </div>
      <div class="settings-content">
        <div class="setting-row">
          <label>
            <input type="checkbox" v-model="usePassword" />
            Password Protection
          </label>
          <input
            v-if="usePassword"
            type="password"
            v-model="password"
            placeholder="Enter password"
            class="amiga-input"
          />
        </div>
        <div class="setting-row">
          <label>Archive Comment</label>
          <textarea v-model="archiveComment" class="amiga-textarea" rows="3"></textarea>
        </div>
      </div>
    </div>

    <!-- Status bar -->
    <div class="archiver-status">
      <div>{{ statusMessage }}</div>
      <div v-if="currentArchive" class="archive-name">{{ currentArchiveName }}</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import archiveManager, { type ArchiveFile, type CompressionLevel } from '../../utils/archive-manager';

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: string;
  path: string;
  isDirectory?: boolean;
}

const currentPath = ref('dh0');
const fileList = ref<FileItem[]>([]);
const selectedFiles = ref<string[]>([]);
const selectedFile = ref<FileItem | null>(null);

const currentArchive = ref<Blob | null>(null);
const currentArchiveName = ref('');
const archiveContents = ref<ArchiveFile[]>([]);
const selectedArchiveItems = ref<string[]>([]);

const compressionLevel = ref<CompressionLevel>('normal');
const usePassword = ref(false);
const password = ref('');
const archiveComment = ref('');
const showSettings = ref(false);

const statusMessage = ref('Ready');

const archiveStats = ref({
  fileCount: 0,
  folderCount: 0,
  totalSize: 0,
  compressedSize: 0,
  compressionRatio: 0
});

const canNavigateUp = computed(() => {
  const parts = currentPath.value.split('/');
  return parts.length > 1;
});

// Load file list
const loadFileList = async () => {
  try {
    statusMessage.value = 'Loading files...';
    const response = await fetch(`/api/files/list?path=${encodeURIComponent(currentPath.value)}`);

    if (!response.ok) {
      throw new Error('Failed to load files');
    }

    const data = await response.json();
    fileList.value = data.items || [];
    statusMessage.value = `${fileList.value.length} items`;
  } catch (error) {
    console.error('Error loading files:', error);
    statusMessage.value = 'Error loading files';
    fileList.value = [];
  }
};

// File selection
const selectFile = (file: FileItem, event: MouseEvent) => {
  if (event.ctrlKey || event.metaKey) {
    const index = selectedFiles.value.indexOf(file.id);
    if (index > -1) {
      selectedFiles.value.splice(index, 1);
    } else {
      selectedFiles.value.push(file.id);
    }
  } else {
    selectedFiles.value = [file.id];
    selectedFile.value = file;
  }
};

const openFile = (file: FileItem) => {
  if (file.type === 'folder') {
    currentPath.value = file.path;
    loadFileList();
  } else if (isZipFile(file)) {
    openArchive();
  }
};

const navigateUp = () => {
  const parts = currentPath.value.split('/');
  if (parts.length > 1) {
    parts.pop();
    currentPath.value = parts.join('/') || 'dh0';
    loadFileList();
  }
};

const isZipFile = (file: FileItem): boolean => {
  return file.name.toLowerCase().endsWith('.zip');
};

const getFileIcon = (file: FileItem): string => {
  if (file.type === 'folder') return '📁';
  if (isZipFile(file)) return '🗜️';
  return '📄';
};

// Archive operations
const createNewArchive = async () => {
  const archiveName = prompt('Enter archive name (without .zip):');
  if (!archiveName) return;

  const fileName = archiveName.endsWith('.zip') ? archiveName : `${archiveName}.zip`;

  try {
    statusMessage.value = 'Creating archive...';

    // Create empty archive
    const blob = await archiveManager.createArchive({
      files: [],
      compressionLevel: compressionLevel.value,
      comment: archiveComment.value || undefined
    });

    // Save to current path
    await saveArchiveToServer(fileName, blob);

    statusMessage.value = `Archive "${fileName}" created`;
    loadFileList();
  } catch (error) {
    console.error('Error creating archive:', error);
    alert('Failed to create archive');
    statusMessage.value = 'Error creating archive';
  }
};

const openArchive = async () => {
  if (!selectedFile.value || !isZipFile(selectedFile.value)) {
    alert('Please select a ZIP file');
    return;
  }

  try {
    statusMessage.value = 'Opening archive...';

    // Load archive from server
    const response = await fetch(`/api/files/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: selectedFile.value.path })
    });

    if (!response.ok) {
      throw new Error('Failed to load archive');
    }

    const data = await response.json();

    // Convert base64 content to blob
    const binaryString = atob(data.content);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'application/zip' });

    currentArchive.value = blob;
    currentArchiveName.value = selectedFile.value.name;

    // List contents
    archiveContents.value = await archiveManager.listArchiveContents(blob);

    // Get archive info
    const info = await archiveManager.getArchiveInfo(blob);
    archiveStats.value = info;
    archiveComment.value = info.comment || '';

    statusMessage.value = `Archive opened: ${info.fileCount} files, ${info.folderCount} folders`;
  } catch (error) {
    console.error('Error opening archive:', error);
    alert('Failed to open archive');
    statusMessage.value = 'Error opening archive';
  }
};

const extractArchive = async () => {
  if (!currentArchive.value) return;

  const destination = prompt('Extract to path:', currentPath.value);
  if (!destination) return;

  try {
    statusMessage.value = 'Extracting archive...';

    // Use server endpoint to extract
    const formData = new FormData();
    formData.append('archive', currentArchive.value, currentArchiveName.value);
    formData.append('destinationPath', destination);

    const response = await fetch('/api/files/extract', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to extract archive');
    }

    const result = await response.json();
    statusMessage.value = `Extracted ${result.extractedCount} files`;
    alert(`Successfully extracted ${result.extractedCount} files to ${destination}`);

    loadFileList();
  } catch (error) {
    console.error('Error extracting archive:', error);
    alert('Failed to extract archive');
    statusMessage.value = 'Error extracting archive';
  }
};

const addToArchive = async () => {
  if (!currentArchive.value) return;
  if (selectedFiles.value.length === 0) {
    alert('Please select files to add');
    return;
  }

  try {
    statusMessage.value = 'Adding files to archive...';

    // Load selected files from server
    const filesToAdd = [];
    const selectedFileItems = fileList.value.filter(f => selectedFiles.value.includes(f.id));

    for (const file of selectedFileItems) {
      if (file.type === 'folder') {
        filesToAdd.push({
          path: file.name,
          content: new Blob([]),
          isDirectory: true
        });
      } else {
        const response = await fetch('/api/files/read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: file.path })
        });

        if (response.ok) {
          const data = await response.json();
          filesToAdd.push({
            path: file.name,
            content: data.content,
            isDirectory: false
          });
        }
      }
    }

    // Add to archive
    const updatedBlob = await archiveManager.addToArchive(
      currentArchive.value,
      filesToAdd,
      {
        compressionLevel: compressionLevel.value,
        comment: archiveComment.value || undefined
      }
    );

    // Save updated archive
    await saveArchiveToServer(currentArchiveName.value, updatedBlob);

    // Refresh archive view
    currentArchive.value = updatedBlob;
    archiveContents.value = await archiveManager.listArchiveContents(updatedBlob);
    const info = await archiveManager.getArchiveInfo(updatedBlob);
    archiveStats.value = info;

    statusMessage.value = `Added ${filesToAdd.length} items to archive`;
  } catch (error) {
    console.error('Error adding to archive:', error);
    alert('Failed to add files to archive');
    statusMessage.value = 'Error adding files';
  }
};

const removeFromArchive = async () => {
  if (!currentArchive.value || selectedArchiveItems.value.length === 0) return;

  if (!confirm(`Remove ${selectedArchiveItems.value.length} item(s) from archive?`)) {
    return;
  }

  try {
    statusMessage.value = 'Removing files from archive...';

    const updatedBlob = await archiveManager.removeFromArchive(
      currentArchive.value,
      selectedArchiveItems.value
    );

    // Save updated archive
    await saveArchiveToServer(currentArchiveName.value, updatedBlob);

    // Refresh archive view
    currentArchive.value = updatedBlob;
    archiveContents.value = await archiveManager.listArchiveContents(updatedBlob);
    const info = await archiveManager.getArchiveInfo(updatedBlob);
    archiveStats.value = info;
    selectedArchiveItems.value = [];

    statusMessage.value = `Removed items from archive`;
  } catch (error) {
    console.error('Error removing from archive:', error);
    alert('Failed to remove files from archive');
    statusMessage.value = 'Error removing files';
  }
};

const testArchive = async () => {
  if (!currentArchive.value) return;

  try {
    statusMessage.value = 'Testing archive...';

    const result = await archiveManager.testArchive(currentArchive.value);

    if (result.valid) {
      alert(`Archive is OK!\n\nTested ${result.fileCount} files.\nNo errors found.`);
      statusMessage.value = 'Archive integrity OK';
    } else {
      alert(`Archive has errors!\n\n${result.errors.join('\n')}`);
      statusMessage.value = 'Archive has errors';
    }
  } catch (error) {
    console.error('Error testing archive:', error);
    alert('Failed to test archive');
    statusMessage.value = 'Error testing archive';
  }
};

const showArchiveInfo = () => {
  if (!currentArchive.value) return;

  const info = `Archive: ${currentArchiveName.value}

Files: ${archiveStats.value.fileCount}
Folders: ${archiveStats.value.folderCount}
Total Size: ${formatSize(archiveStats.value.totalSize)}
Compressed: ${formatSize(archiveStats.value.compressedSize)}
Compression Ratio: ${archiveStats.value.compressionRatio}%

${archiveComment.value ? `Comment: ${archiveComment.value}` : ''}`;

  alert(info);
};

const extractSingleFile = async (item: ArchiveFile) => {
  if (item.isDirectory) return;

  try {
    statusMessage.value = `Extracting ${item.name}...`;

    const files = await archiveManager.extractArchive(currentArchive.value!, {
      selectedFiles: [item.path]
    });

    if (files.length > 0) {
      // Save to current path
      const file = files[0];
      const blob = file.content instanceof Blob ? file.content : new Blob([file.content]);

      // Convert blob to base64 for server
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];

        await fetch('/api/files/write', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: `${currentPath.value}/${item.name}`,
            content: base64
          })
        });

        statusMessage.value = `Extracted ${item.name}`;
        loadFileList();
      };
      reader.readAsDataURL(blob);
    }
  } catch (error) {
    console.error('Error extracting file:', error);
    statusMessage.value = 'Error extracting file';
  }
};

const selectArchiveItem = (item: ArchiveFile, event: MouseEvent) => {
  if (event.ctrlKey || event.metaKey) {
    const index = selectedArchiveItems.value.indexOf(item.path);
    if (index > -1) {
      selectedArchiveItems.value.splice(index, 1);
    } else {
      selectedArchiveItems.value.push(item.path);
    }
  } else {
    selectedArchiveItems.value = [item.path];
  }
};

// Helper functions
const saveArchiveToServer = async (fileName: string, blob: Blob) => {
  // Convert blob to base64
  const reader = new FileReader();

  return new Promise<void>((resolve, reject) => {
    reader.onloadend = async () => {
      try {
        const base64 = (reader.result as string).split(',')[1];

        const response = await fetch('/api/files/write', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: `${currentPath.value}/${fileName}`,
            content: base64
          })
        });

        if (!response.ok) {
          throw new Error('Failed to save archive');
        }

        resolve();
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read blob'));
    reader.readAsDataURL(blob);
  });
};

const formatSize = (bytes: number): string => {
  return archiveManager.formatSize(bytes);
};

const formatDate = (date: Date): string => {
  if (!date) return '';
  try {
    return new Date(date).toLocaleString('en-US', {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '';
  }
};

// Pane resizing
const startResize = (e: MouseEvent) => {
  const startX = e.clientX;
  const archiver = document.querySelector('.archiver-content') as HTMLElement;
  const leftPane = archiver.querySelector('.file-browser') as HTMLElement;
  const startWidth = leftPane.offsetWidth;

  const onMouseMove = (e: MouseEvent) => {
    const deltaX = e.clientX - startX;
    const newWidth = Math.max(200, Math.min(startWidth + deltaX, archiver.offsetWidth - 250));
    leftPane.style.flexBasis = `${newWidth}px`;
  };

  const onMouseUp = () => {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
};

onMounted(() => {
  loadFileList();
});
</script>

<style scoped>
.amiga-archiver {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #a0a0a0;
  font-family: 'Press Start 2P', monospace;
  font-size: 9px;
}

.archiver-toolbar {
  display: flex;
  gap: 4px;
  padding: 8px;
  background: #c0c0c0;
  border-bottom: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  align-items: center;
}

.toolbar-spacer {
  flex: 1;
}

.compression-level {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 8px;
}

.compression-level label {
  color: #000000;
}

.amiga-select {
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 2px 4px;
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
}

.archiver-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.archiver-pane {
  display: flex;
  flex-direction: column;
  background: #ffffff;
  overflow: hidden;
}

.file-browser {
  flex-basis: 45%;
  border-right: 2px solid #000000;
}

.archive-view {
  flex: 1;
}

.pane-resizer {
  width: 4px;
  background: #a0a0a0;
  cursor: col-resize;
  border-left: 1px solid #ffffff;
  border-right: 1px solid #000000;
}

.pane-resizer:hover {
  background: #0055aa;
}

.pane-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  background: #0055aa;
  color: #ffffff;
  border-bottom: 2px solid #000000;
  font-size: 9px;
}

.pane-title {
  font-weight: bold;
}

.archive-stats {
  font-size: 7px;
  color: #ffaa00;
}

.pane-path {
  padding: 4px 8px;
  background: #f0f0f0;
  border-bottom: 1px solid #000000;
  font-size: 8px;
  color: #0055aa;
}

.pane-content {
  flex: 1;
  overflow-y: auto;
  padding: 4px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 6px;
  cursor: pointer;
  border: 1px solid transparent;
  background: transparent;
  transition: all 0.1s;
}

.file-item:hover {
  background: rgba(0, 85, 170, 0.1);
}

.file-item.selected {
  background: #0055aa;
  color: #ffffff;
}

.file-item.highlight {
  border-left: 3px solid #ffaa00;
}

.item-icon {
  font-size: 12px;
  width: 20px;
  text-align: center;
}

.item-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-size {
  font-size: 7px;
  color: #666666;
  width: 60px;
  text-align: right;
}

.file-item.selected .item-size {
  color: #ffaa00;
}

.archive-table {
  display: flex;
  flex-direction: column;
}

.table-header {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 60px 120px;
  gap: 8px;
  padding: 6px 8px;
  background: #0055aa;
  color: #ffffff;
  font-size: 8px;
  font-weight: bold;
  border-bottom: 2px solid #000000;
  position: sticky;
  top: 0;
}

.table-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 60px 120px;
  gap: 8px;
  padding: 4px 8px;
  cursor: pointer;
  border-bottom: 1px solid #e0e0e0;
  transition: all 0.1s;
}

.table-row:hover {
  background: rgba(0, 85, 170, 0.1);
}

.table-row.selected {
  background: #0055aa;
  color: #ffffff;
}

.table-row.directory {
  font-weight: bold;
  color: #ffaa00;
}

.table-row.selected.directory {
  color: #ffffff;
}

.col-name {
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.col-size, .col-compressed, .col-ratio {
  text-align: right;
  font-size: 8px;
}

.col-date {
  font-size: 7px;
  color: #666666;
}

.table-row.selected .col-date {
  color: #ffaa00;
}

.empty-message {
  padding: 20px;
  text-align: center;
  color: #888888;
  font-size: 8px;
}

.settings-panel {
  border-top: 2px solid #000000;
  background: #f0f0f0;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  background: #0055aa;
  color: #ffffff;
  font-size: 9px;
}

.settings-content {
  padding: 10px;
}

.setting-row {
  margin-bottom: 10px;
}

.setting-row label {
  display: block;
  margin-bottom: 4px;
  color: #000000;
  font-size: 8px;
}

.amiga-input, .amiga-textarea {
  width: 100%;
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 4px;
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
}

.archiver-status {
  display: flex;
  justify-content: space-between;
  padding: 4px 8px;
  background: #c0c0c0;
  border-top: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  font-size: 8px;
  color: #000000;
}

.archive-name {
  color: #0055aa;
  font-weight: bold;
}

.amiga-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 4px 8px;
  font-size: 8px;
  font-family: 'Press Start 2P', monospace;
  color: #000000;
  cursor: pointer;
  white-space: nowrap;
}

.amiga-button:hover:not(:disabled) {
  background: #b0b0b0;
}

.amiga-button:active:not(:disabled) {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}

.amiga-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.amiga-button-small {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 2px 6px;
  font-size: 7px;
  font-family: 'Press Start 2P', monospace;
  color: #000000;
  cursor: pointer;
}

.amiga-button-small:hover:not(:disabled) {
  background: #b0b0b0;
}

.amiga-button-small:active:not(:disabled) {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}

.amiga-button-small:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>

<template>
  <div class="amiga-folder">
    <div class="folder-header">
      <button class="amiga-button" :disabled="!canNavigateUp" @click="navigateUp">Parent</button>
      <div class="path-display">{{ displayPath }}</div>
    </div>

    <div
      class="folder-content"
      :class="{ 'drag-over-folder': isDraggingFilesOver }"
      @dragover="handleFolderDragOver"
      @dragleave="handleFolderDragLeave"
      @drop="handleFolderDrop"
    >
      <!-- Drop zone overlay -->
      <div v-if="isDraggingFilesOver" class="folder-drop-overlay">
        <div class="folder-drop-message">
          <div class="folder-drop-icon">📁</div>
          <div class="folder-drop-text">Drop files here to upload</div>
          <div class="folder-drop-path">Destination: {{ currentPath }}</div>
        </div>
      </div>
      <div
        v-for="(item, index) in items"
        :key="index"
        class="folder-item"
        :class="{ 
          selected: selectedItems.includes(item.id),
          'drag-over': dragOverItem === item.id && item.type === 'folder'
        }"
        :draggable="true"
        @click="selectItem(item, $event)"
        @dblclick="openItem(item)"
        @contextmenu.prevent="showContextMenu(item, $event)"
        @dragstart="handleDragStart(item, $event)"
        @dragend="handleDragEnd"
        @dragover="handleDragOver(item, $event)"
        @dragleave="handleDragLeave(item, $event)"
        @drop="handleDrop(item, $event)"
      >
        <div class="item-icon">
          <!-- Folder Icon -->
          <svg v-if="item.type === 'folder'" viewBox="0 0 48 48" class="icon-svg">
            <path d="M 4 8 L 4 40 L 44 40 L 44 16 L 24 16 L 20 8 Z" fill="#ffaa00" stroke="#000" stroke-width="2"/>
            <path d="M 4 8 L 20 8 L 24 16 L 44 16 L 44 12 L 24 12 L 20 8 Z" fill="#ffcc44" stroke="#000" stroke-width="1"/>
          </svg>

          <!-- File Icon -->
          <svg v-else-if="item.type === 'file'" viewBox="0 0 48 48" class="icon-svg">
            <rect x="10" y="6" width="28" height="36" fill="#ffffff" stroke="#000" stroke-width="2"/>
            <line x1="14" y1="14" x2="34" y2="14" stroke="#0055aa" stroke-width="2"/>
            <line x1="14" y1="20" x2="34" y2="20" stroke="#0055aa" stroke-width="2"/>
            <line x1="14" y1="26" x2="28" y2="26" stroke="#0055aa" stroke-width="2"/>
            <line x1="14" y1="32" x2="30" y2="32" stroke="#0055aa" stroke-width="2"/>
          </svg>

          <!-- Disk Icon -->
          <svg v-else-if="item.type === 'disk'" viewBox="0 0 48 48" class="icon-svg">
            <rect x="8" y="12" width="32" height="24" fill="#666" stroke="#000" stroke-width="2"/>
            <rect x="12" y="16" width="24" height="6" fill="#333"/>
            <circle cx="24" cy="28" r="6" fill="#888"/>
            <circle cx="24" cy="28" r="3" fill="#333"/>
          </svg>

          <!-- AWML App Icon -->
          <svg v-else-if="item.type === 'awml-app'" viewBox="0 0 48 48" class="icon-svg">
            <rect x="8" y="8" width="32" height="32" fill="#ff6600" stroke="#000" stroke-width="2"/>
            <rect x="12" y="12" width="24" height="6" fill="#fff"/>
            <rect x="12" y="20" width="24" height="6" fill="#fff"/>
            <rect x="12" y="28" width="24" height="6" fill="#fff"/>
            <circle cx="38" cy="10" r="4" fill="#00ff00"/>
            <text x="39" y="13" text-anchor="middle" fill="#000" font-size="6" font-family="monospace">A</text>
          </svg>

          <!-- Tool Icon -->
          <svg v-else-if="item.type === 'tool'" viewBox="0 0 48 48" class="icon-svg">
            <rect x="12" y="8" width="24" height="32" fill="#0055aa" stroke="#000" stroke-width="2"/>
            <rect x="16" y="12" width="16" height="4" fill="#fff"/>
            <rect x="16" y="18" width="16" height="4" fill="#fff"/>
            <rect x="16" y="24" width="16" height="4" fill="#fff"/>
          </svg>
        </div>
        <div class="item-label">{{ item.name }}</div>
        <div v-if="item.size" class="item-size">{{ item.size }}</div>
      </div>
    </div>

    <!-- Context Menu -->
    <AmigaContextMenu
      v-if="contextMenuVisible"
      :visible="contextMenuVisible"
      :x="contextMenuX"
      :y="contextMenuY"
      :items="contextMenuItems"
      @close="contextMenuVisible = false"
      @action="handleContextAction"
    />

    <!-- Quick Look Preview -->
    <AmigaQuickLook
      :visible="quickLookVisible"
      :file="quickLookFile"
      :files="items"
      :currentPath="currentPath"
      @close="quickLookVisible = false"
      @openFile="handleQuickLookOpen"
      @extract="handleQuickLookExtract"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import AmigaContextMenu, { type ContextMenuItem } from './AmigaContextMenu.vue';
import AmigaQuickLook from './AmigaQuickLook.vue';
import clipboard, { type ClipboardItem } from './ClipboardManager';
import { filePreview } from '../utils/file-preview';
import dragDropManager from '../utils/drag-drop-manager';

interface Props {
  data?: any;
}

interface FolderItem {
  id: string;
  name: string;
  type: 'folder' | 'file' | 'disk' | 'tool' | 'awml-app';
  size?: string;
  icon?: string;
  created?: string;
  modified?: string;
  path?: string;
  isDirectory?: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  openFile: [path: string, item: FolderItem];
  openTool: [toolName: string];
}>();

const items = ref<FolderItem[]>([]);
const isLoading = ref(false);
const errorMessage = ref('');
const contextMenuVisible = ref(false);
const contextMenuX = ref(0);
const contextMenuY = ref(0);
const contextMenuItem = ref<FolderItem | null>(null);

// Quick Look state
const quickLookVisible = ref(false);
const quickLookFile = ref<FolderItem | null>(null);

// Drag and drop state
const dragOverItem = ref<string | null>(null);
const draggedItems = ref<FolderItem[]>([]);

// File upload drag state
const isDraggingFilesOver = ref(false);
let folderDragLeaveTimeout: number | null = null;

const contextMenuItems = computed<ContextMenuItem[]>(() => {
  const hasClipboard = clipboard.hasItems();
  const hasSelection = selectedItems.value.length > 0;
  const isMultiSelection = selectedItems.value.length > 1;

  // Base menu items
  const menuItems: ContextMenuItem[] = [];

  // If item-specific (right-clicked on item)
  if (contextMenuItem.value) {
    const isZipFile = contextMenuItem.value.name.toLowerCase().endsWith('.zip');
    const isPreviewable = contextMenuItem.value.type === 'file' &&
                          filePreview.isPreviewable(contextMenuItem.value.name);

    menuItems.push(
      { label: 'Open', action: 'open', icon: '▶' },
      { label: '', action: '', separator: true }
    );

    // Add Quick Look option for previewable files
    if (isPreviewable) {
      menuItems.push(
        { label: 'Quick Look', action: 'quick-look', icon: '👁', disabled: isMultiSelection }
      );
    }

    menuItems.push(
      { label: 'Copy', action: 'copy', icon: '📋', disabled: isMultiSelection && !hasSelection },
      { label: 'Cut', action: 'cut', icon: '✂', disabled: isMultiSelection && !hasSelection },
      { label: 'Duplicate', action: 'duplicate', icon: '⧉' },
      { label: '', action: '', separator: true }
    );

    // Archive-specific menu items
    if (isZipFile) {
      menuItems.push(
        { label: 'Extract Here', action: 'extract-here', icon: '📦' },
        { label: 'Extract To...', action: 'extract-to', icon: '📂' },
        { label: 'Open with Archiver', action: 'open-archiver', icon: '🗜️' },
        { label: '', action: '', separator: true }
      );
    } else if (hasSelection && contextMenuItem.value.type === 'file') {
      // If file(s) selected, show compress option
      menuItems.push(
        { label: 'Compress to ZIP', action: 'compress-to-zip', icon: '🗜️' },
        { label: '', action: '', separator: true }
      );
    }

    menuItems.push(
      { label: 'Rename', action: 'rename', icon: '✏', disabled: isMultiSelection },
      { label: 'Delete', action: 'delete', icon: '🗑' },
      { label: '', action: '', separator: true },
      { label: 'Info', action: 'info', icon: 'ℹ', disabled: isMultiSelection }
    );
  }

  // Universal menu items (always available)
  if (hasClipboard) {
    menuItems.push({ label: 'Paste', action: 'paste', icon: '📄', disabled: false });
    menuItems.push({ label: '', action: '', separator: true });
  }

  menuItems.push(
    { label: 'New File', action: 'new-file', icon: '📄' },
    { label: 'New Folder', action: 'new-folder', icon: '📁' }
  );

  return menuItems;
});

const currentPath = ref<string>(props.data?.id || 'dh0');
const parentPath = ref<string | null>(null);

const displayPath = computed(() => currentPath.value || '');
const canNavigateUp = computed(() => parentPath.value !== null);

// Load files from the server
const loadFiles = async () => {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    // Special handling for utils (tools) - load AWML applications from System/Applications
    if (currentPath.value === 'utils') {
      try {
        const appsResponse = await fetch(`/api/files/list?path=${encodeURIComponent('dh0/System/Applications')}`);
        if (appsResponse.ok) {
          const appsData = await appsResponse.json();
          const awmlApps = (appsData.items || [])
            .filter((item: any) => item.name.endsWith('.awml'))
            .map((item: any) => ({
              id: `app_${item.name.replace('.awml', '')}`,
              name: item.name.replace('.awml', ''),
              type: 'awml-app',
              size: item.size,
              path: `dh0/System/Applications/${item.name}`,
              created: item.created,
              modified: item.modified
            }));
          
          // Add system tools
          const systemTools = [
            { id: 'u_shell', name: 'Shell', type: 'tool' },
            { id: 'u_awml_runner', name: 'AWML Runner', type: 'tool' },
            { id: 'u_awml_wizard', name: 'AWML Wizard', type: 'tool' }
          ];
          
          items.value = [...awmlApps, ...systemTools];
          parentPath.value = null;
          selectedItems.value = [];
          isLoading.value = false;
          return;
        }
      } catch (error) {
        console.error('Failed to load applications:', error);
      }
      
      // Fallback to hardcoded list if loading fails
      items.value = [
        { id: 'u1', name: 'Calculator', type: 'tool' },
        { id: 'u2', name: 'Clock', type: 'tool' },
        { id: 'u3', name: 'NotePad', type: 'tool' },
        { id: 'u4', name: 'Paint', type: 'tool' },
        { id: 'u5', name: 'MultiView', type: 'tool' },
        { id: 'u6', name: 'Shell', type: 'tool' },
        { id: 'u7', name: 'AWML Runner', type: 'tool' },
        { id: 'u8', name: 'AWML Wizard', type: 'tool' }
      ];
      parentPath.value = null;
      selectedItems.value = [];
      isLoading.value = false;
      return;
    }

    const response = await fetch(`/api/files/list?path=${encodeURIComponent(currentPath.value)}`);

    if (!response.ok) {
      throw new Error('Failed to load files');
    }

    const data = await response.json();
    items.value = data.items || [];
    currentPath.value = data.path || currentPath.value;
    parentPath.value = data.parentPath ?? null;
    selectedItems.value = [];
  } catch (error) {
    console.error('Error loading files:', error);
    errorMessage.value = 'Error loading files';
    items.value = [];
  } finally {
    isLoading.value = false;
  }
};

watch(
  () => props.data?.id,
  (newId) => {
    currentPath.value = newId || 'dh0';
    parentPath.value = null;
    loadFiles();
  },
  { immediate: true }
);

const selectedItems = ref<string[]>([]);

const selectItem = (item: FolderItem, event: MouseEvent) => {
  if (event.ctrlKey || event.metaKey) {
    // Multi-select with Ctrl/Cmd
    const index = selectedItems.value.indexOf(item.id);
    if (index > -1) {
      selectedItems.value.splice(index, 1);
    } else {
      selectedItems.value.push(item.id);
    }
  } else {
    // Single select
    selectedItems.value = [item.id];
  }
};

const openItem = (item: FolderItem) => {
  if (item.type === 'awml-app') {
    // AWML applications - emit as file with .awml extension
    const filePath = item.path || `${currentPath.value}/${item.name}.awml`;
    emit('openFile', filePath, { ...item, type: 'awml-app' });
  } else if (item.type === 'tool') {
    // Emit tool opening event
    emit('openTool', item.name);
  } else if (item.type === 'file') {
    // Build the file path
    const filePath = item.path || `${currentPath.value}/${item.name}`;
    emit('openFile', filePath, item);
  } else if (item.type === 'folder') {
    if (item.path) {
      navigateTo(item.path);
    }
  }
};

const showContextMenu = (item: FolderItem, event: MouseEvent) => {
  contextMenuItem.value = item;
  contextMenuX.value = event.clientX;
  contextMenuY.value = event.clientY;
  contextMenuVisible.value = true;
};

const handleContextAction = async (action: string) => {
  if (!contextMenuItem.value && !['paste', 'new-file', 'new-folder'].includes(action)) return;

  const item = contextMenuItem.value;

  switch (action) {
    case 'open':
      if (item) openItem(item);
      break;
    case 'quick-look':
      if (item) showQuickLook(item);
      break;
    case 'delete':
      if (item && confirm(`Delete "${item.name}"?`)) {
        await deleteItem(item);
      }
      break;
    case 'copy':
      await copySelectedItems();
      break;
    case 'cut':
      await cutSelectedItems();
      break;
    case 'paste':
      await pasteItems();
      break;
    case 'rename':
      if (item) await renameItem(item);
      break;
    case 'info':
      if (item) showItemInfo(item);
      break;
    case 'new-file':
      await createNewFile();
      break;
    case 'new-folder':
      await createNewFolder();
      break;
    case 'duplicate':
      if (item) await duplicateItem(item);
      break;
    case 'extract-here':
      if (item) await extractArchiveHere(item);
      break;
    case 'extract-to':
      if (item) await extractArchiveTo(item);
      break;
    case 'open-archiver':
      if (item) openWithArchiver(item);
      break;
    case 'compress-to-zip':
      await compressToZip();
      break;
  }

  contextMenuVisible.value = false;
  contextMenuItem.value = null;
};

const deleteItem = async (item: FolderItem) => {
  try {
    const itemPath = item.path || `${currentPath.value}/${item.name}`;

    const response = await fetch(`/api/files/delete?path=${encodeURIComponent(itemPath)}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('Failed to delete item');
    }

    // Reload the file list
    await loadFiles();
  } catch (error) {
    console.error('Error deleting item:', error);
    alert('Error deleting item');
  }
};

const renameItem = async (item: FolderItem) => {
  const newName = prompt(`Rename "${item.name}" to:`, item.name);
  if (!newName || newName === item.name) return;

  try {
    const oldPath = item.path || `${currentPath.value}/${item.name}`;
    const newPath = `${currentPath.value}/${newName}`;

    const response = await fetch('/api/files/rename', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldPath, newPath })
    });

    if (!response.ok) throw new Error('Failed to rename item');

    alert(`"${item.name}" renamed to "${newName}"`);
    await loadFiles();
  } catch (error) {
    console.error('Error renaming item:', error);
    alert('Failed to rename item');
  }
};

const showItemInfo = (item: FolderItem) => {
  const info = `Name: ${item.name}
Type: ${item.type}
Size: ${item.size || 'N/A'}
Created: ${item.created || 'N/A'}
Modified: ${item.modified || 'N/A'}
Path: ${item.path || currentPath.value + '/' + item.name}`;
  alert(info);
};

// Enhanced clipboard operations
const copySelectedItems = () => {
  const selected = getSelectedItems();
  if (selected.length === 0) return;

  const clipboardItems: ClipboardItem[] = selected.map(item => ({
    id: item.id,
    name: item.name,
    type: item.type as 'file' | 'folder',
    path: item.path || `${currentPath.value}/${item.name}`,
    operation: 'copy',
    size: item.size,
    created: item.created,
    modified: item.modified
  }));

  clipboard.copy(clipboardItems);
  console.log(`Copied ${selected.length} item(s) to clipboard`);
};

const cutSelectedItems = () => {
  const selected = getSelectedItems();
  if (selected.length === 0) return;

  const clipboardItems: ClipboardItem[] = selected.map(item => ({
    id: item.id,
    name: item.name,
    type: item.type as 'file' | 'folder',
    path: item.path || `${currentPath.value}/${item.name}`,
    operation: 'cut',
    size: item.size,
    created: item.created,
    modified: item.modified
  }));

  clipboard.cut(clipboardItems);
  console.log(`Cut ${selected.length} item(s) to clipboard`);
};

const pasteItems = async () => {
  try {
    await clipboard.paste(currentPath.value);
    console.log('Items pasted successfully');
    await loadFiles(); // Refresh the view
  } catch (error) {
    console.error('Paste operation failed:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    alert(`Paste failed: ${message}`);
  }
};

const getSelectedItems = (): FolderItem[] => {
  return items.value.filter(item => selectedItems.value.includes(item.id));
};

const createNewFile = async () => {
  const fileName = prompt('Enter file name:');
  if (!fileName) return;

  try {
    const response = await fetch('/api/files/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: currentPath.value,
        name: fileName,
        type: 'file',
        content: ''
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create file');
    }

    console.log(`File "${fileName}" created successfully`);
    await loadFiles();
  } catch (error) {
    console.error('Error creating file:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    alert(`Failed to create file: ${message}`);
  }
};

const createNewFolder = async () => {
  const folderName = prompt('Enter folder name:');
  if (!folderName) return;

  try {
    const response = await fetch('/api/files/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: currentPath.value,
        name: folderName,
        type: 'folder'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create folder');
    }

    console.log(`Folder "${folderName}" created successfully`);
    await loadFiles();
  } catch (error) {
    console.error('Error creating folder:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    alert(`Failed to create folder: ${message}`);
  }
};

const duplicateItem = async (item: FolderItem) => {
  const baseName = item.name;
  const extension = item.type === 'file' ? (baseName.includes('.') ? baseName.split('.').pop() : '') : '';
  const nameWithoutExt = extension ? baseName.replace(`.${extension}`, '') : baseName;
  const newName = `${nameWithoutExt} copy${extension ? `.${extension}` : ''}`;

  try {
    const sourcePath = item.path || `${currentPath.value}/${item.name}`;

    const response = await fetch('/api/files/copy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourcePath: sourcePath,
        destinationPath: currentPath.value,
        newName: newName
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to duplicate item');
    }

    console.log(`Item "${item.name}" duplicated as "${newName}"`);
    await loadFiles();
  } catch (error) {
    console.error('Error duplicating item:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    alert(`Failed to duplicate item: ${message}`);
  }
};

// Archive operations
const extractArchiveHere = async (item: FolderItem) => {
  try {
    const archivePath = item.path || `${currentPath.value}/${item.name}`;

    const response = await fetch('/api/files/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        archivePath: archivePath,
        destinationPath: currentPath.value
      })
    });

    if (!response.ok) {
      throw new Error('Failed to extract archive');
    }

    const result = await response.json();
    alert(`Extracted ${result.extractedCount || 0} files from ${item.name}`);
    await loadFiles();
  } catch (error) {
    console.error('Error extracting archive:', error);
    alert('Failed to extract archive. Note: Server-side ZIP extraction requires additional dependencies.');
  }
};

const extractArchiveTo = async (item: FolderItem) => {
  const destination = prompt('Extract to path:', currentPath.value);
  if (!destination) return;

  try {
    const archivePath = item.path || `${currentPath.value}/${item.name}`;

    const response = await fetch('/api/files/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        archivePath: archivePath,
        destinationPath: destination
      })
    });

    if (!response.ok) {
      throw new Error('Failed to extract archive');
    }

    const result = await response.json();
    alert(`Extracted ${result.extractedCount || 0} files to ${destination}`);
    await loadFiles();
  } catch (error) {
    console.error('Error extracting archive:', error);
    alert('Failed to extract archive. Note: Server-side ZIP extraction requires additional dependencies.');
  }
};

const openWithArchiver = (_item: FolderItem) => {
  // Emit event to open the archiver tool
  emit('openTool', 'Archiver');
};

const compressToZip = async () => {
  const selected = getSelectedItems();
  if (selected.length === 0) {
    alert('Please select files to compress');
    return;
  }

  const archiveName = prompt('Enter archive name (without .zip):', 'archive');
  if (!archiveName) return;

  const fileName = archiveName.endsWith('.zip') ? archiveName : `${archiveName}.zip`;

  try {
    const filePaths = selected.map(item => item.path || `${currentPath.value}/${item.name}`);

    const response = await fetch('/api/files/compress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        files: filePaths,
        archiveName: fileName,
        destinationPath: currentPath.value,
        compressionLevel: 'normal'
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create archive');
    }

    const result = await response.json();
    alert(`Created archive "${fileName}" with ${result.fileCount || selected.length} files`);
    await loadFiles();
  } catch (error) {
    console.error('Error creating archive:', error);
    alert('Failed to create archive. Note: Server-side ZIP compression requires additional dependencies.');
  }
};

const navigateTo = async (nextPath: string) => {
  if (!nextPath || nextPath === currentPath.value) return;
  currentPath.value = nextPath;
  await loadFiles();
};

// Quick Look functions
const showQuickLook = (item: FolderItem) => {
  if (item.type !== 'file') return;
  if (!filePreview.isPreviewable(item.name)) return;

  quickLookFile.value = item;
  quickLookVisible.value = true;
};

const handleQuickLookOpen = (filePath: string, item: FolderItem) => {
  quickLookVisible.value = false;
  emit('openFile', filePath, item);
};

const handleQuickLookExtract = async (archivePath: string) => {
  quickLookVisible.value = false;

  // Extract archive to current directory
  try {
    const response = await fetch('/api/files/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        archivePath: archivePath,
        destinationPath: currentPath.value
      })
    });

    if (!response.ok) {
      throw new Error('Failed to extract archive');
    }

    const result = await response.json();
    alert(`Extracted ${result.extractedCount || 0} files`);
    await loadFiles();
  } catch (error) {
    console.error('Error extracting archive:', error);
    alert('Failed to extract archive');
  }
};

// Drag and drop handlers
const handleDragStart = (item: FolderItem, event: DragEvent) => {
  // Include all selected items if the dragged item is selected
  if (selectedItems.value.includes(item.id)) {
    draggedItems.value = getSelectedItems();
  } else {
    draggedItems.value = [item];
    selectedItems.value = [item.id];
  }

  // Set drag effect and data
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'copyMove';
    event.dataTransfer.setData('text/plain', JSON.stringify({
      items: draggedItems.value.map(i => ({ id: i.id, name: i.name, path: i.path || `${currentPath.value}/${i.name}` }))
    }));
  }

  console.log(`Started dragging ${draggedItems.value.length} item(s)`);
};

const handleDragEnd = () => {
  dragOverItem.value = null;
  draggedItems.value = [];
};

const handleDragOver = (item: FolderItem, event: DragEvent) => {
  // Only allow drop on folders
  if (item.type !== 'folder') return;

  event.preventDefault();
  
  if (event.dataTransfer) {
    // Determine drop effect based on key modifiers
    if (event.ctrlKey || event.metaKey) {
      event.dataTransfer.dropEffect = 'copy';
    } else {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  dragOverItem.value = item.id;
};

const handleDragLeave = (item: FolderItem, event: DragEvent) => {
  // Only clear if we're actually leaving the element (not entering a child)
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const x = event.clientX;
  const y = event.clientY;
  
  if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
    if (dragOverItem.value === item.id) {
      dragOverItem.value = null;
    }
  }
};

const handleDrop = async (targetItem: FolderItem, event: DragEvent) => {
  event.preventDefault();
  dragOverItem.value = null;

  if (targetItem.type !== 'folder') return;
  if (!event.dataTransfer) return;

  try {
    const data = JSON.parse(event.dataTransfer.getData('text/plain'));
    const itemsToMove = data.items as { id: string; name: string; path: string; }[];
    
    if (!itemsToMove || itemsToMove.length === 0) return;

    const isCopyOperation = event.ctrlKey || event.metaKey;
    const targetPath = targetItem.path || `${currentPath.value}/${targetItem.name}`;

    console.log(`${isCopyOperation ? 'Copying' : 'Moving'} ${itemsToMove.length} item(s) to ${targetPath}`);

    // Perform the operation for each item
    for (const item of itemsToMove) {
      try {
        if (isCopyOperation) {
          // Copy operation
          await fetch('/api/files/copy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sourcePath: item.path,
              destinationPath: targetPath,
              newName: item.name
            })
          });
        } else {
          // Move operation (rename to new path)
          const newPath = `${targetPath}/${item.name}`;
          await fetch('/api/files/rename', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              path: item.path,
              newName: newPath
            })
          });
        }
      } catch (error) {
        console.error(`Failed to ${isCopyOperation ? 'copy' : 'move'} ${item.name}:`, error);
      }
    }

    // Refresh the view and clear selection
    await loadFiles();
    selectedItems.value = [];
    
    console.log(`Successfully ${isCopyOperation ? 'copied' : 'moved'} ${itemsToMove.length} item(s)`);
    
  } catch (error) {
    console.error('Drop operation failed:', error);
    alert('Drop operation failed');
  } finally {
    draggedItems.value = [];
  }
};

// Keyboard shortcuts
const handleKeyDown = async (event: KeyboardEvent) => {
  // Don't interfere with input elements
  if (event.target instanceof HTMLInputElement) return;

  const isCtrlOrCmd = event.ctrlKey || event.metaKey;
  
  if (isCtrlOrCmd) {
    switch (event.key.toLowerCase()) {
      case 'c':
        event.preventDefault();
        if (selectedItems.value.length > 0) {
          copySelectedItems();
        }
        break;
      case 'x':
        event.preventDefault();
        if (selectedItems.value.length > 0) {
          cutSelectedItems();
        }
        break;
      case 'v':
        event.preventDefault();
        if (clipboard.hasItems()) {
          pasteItems();
        }
        break;
      case 'a':
        event.preventDefault();
        // Select all items
        selectedItems.value = items.value.map(item => item.id);
        break;
    }
  } else {
    switch (event.key) {
      case ' ':
        // Spacebar - Quick Look
        event.preventDefault();
        if (selectedItems.value.length === 1) {
          const item = items.value.find(i => i.id === selectedItems.value[0]);
          if (item && item.type === 'file' && filePreview.isPreviewable(item.name)) {
            showQuickLook(item);
          }
        }
        break;
      case 'Delete':
      case 'Backspace':
        if (selectedItems.value.length > 0) {
          const selected = getSelectedItems();
          if (confirm(`Delete ${selected.length} item(s)?`)) {
            for (const item of selected) {
              await deleteItem(item);
            }
          }
        }
        break;
      case 'F2':
        if (selectedItems.value.length === 1) {
          const item = items.value.find(i => i.id === selectedItems.value[0]);
          if (item) {
            await renameItem(item);
          }
        }
        break;
    }
  }
};

const navigateUp = async () => {
  if (!parentPath.value) return;
  await navigateTo(parentPath.value);
};

// File upload drag-and-drop handlers
const handleFolderDragOver = (event: DragEvent) => {
  // Only handle file drops from outside, not internal drag operations
  if (event.dataTransfer?.types.includes('Files')) {
    event.preventDefault();
    event.stopPropagation();

    if (folderDragLeaveTimeout) {
      clearTimeout(folderDragLeaveTimeout);
      folderDragLeaveTimeout = null;
    }

    isDraggingFilesOver.value = true;

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }
};

const handleFolderDragLeave = (_event: DragEvent) => {
  // Use timeout to prevent flickering
  if (folderDragLeaveTimeout) {
    clearTimeout(folderDragLeaveTimeout);
  }

  folderDragLeaveTimeout = window.setTimeout(() => {
    isDraggingFilesOver.value = false;
  }, 100);
};

const handleFolderDrop = async (event: DragEvent) => {
  event.preventDefault();
  event.stopPropagation();

  if (folderDragLeaveTimeout) {
    clearTimeout(folderDragLeaveTimeout);
    folderDragLeaveTimeout = null;
  }

  isDraggingFilesOver.value = false;

  if (!event.dataTransfer?.files) return;

  const files = Array.from(event.dataTransfer.files);
  if (files.length === 0) return;

  console.log(`Uploading ${files.length} file(s) to ${currentPath.value}`);

  try {
    await dragDropManager.addFiles(files, currentPath.value);

    // Set up callback to refresh folder after upload completes
    dragDropManager.onComplete(() => {
      loadFiles();
    });
  } catch (error) {
    console.error('Failed to add files to upload queue:', error);
    alert('Failed to start upload');
  }
};

// Lifecycle hooks
onMounted(() => {
  document.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown);
});
</script>

<style scoped>
.amiga-folder {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #ffffff;
}

.folder-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px 0;
}

.folder-header .amiga-button:disabled {
  opacity: 0.4;
  pointer-events: none;
}

.path-display {
  font-size: 9px;
  color: #000000;
  background: rgba(255, 255, 255, 0.8);
  padding: 4px 6px;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
}

.folder-content {
  flex: 1;
  padding: 12px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  grid-gap: 16px;
  align-content: start;
  overflow-y: auto;
}

.folder-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  cursor: pointer;
  user-select: none;
  border: 2px solid transparent;
  background: transparent;
  transition: all 0.1s;
}

.folder-item:hover {
  background: rgba(0, 85, 170, 0.1);
}

.folder-item.selected {
  background: #0055aa;
  border-color: #0055aa;
}

.folder-item.drag-over {
  background: rgba(255, 170, 0, 0.3);
  border-color: #ffaa00;
  border-style: dashed;
}

.folder-item.selected .item-label {
  color: #ffffff;
  background: #0055aa;
  text-shadow: none;
}

.item-icon {
  width: 48px;
  height: 48px;
  margin-bottom: 4px;
}

.icon-svg {
  width: 100%;
  height: 100%;
  filter: drop-shadow(1px 1px 1px rgba(0, 0, 0, 0.3));
}

.item-label {
  font-size: 9px;
  text-align: center;
  color: #000000;
  max-width: 70px;
  word-wrap: break-word;
  line-height: 1.3;
  padding: 2px 4px;
  background: rgba(255, 255, 255, 0.8);
  font-family: 'Press Start 2P', monospace;
}

.item-size {
  font-size: 7px;
  color: #666666;
  margin-top: 2px;
}

/* File upload drop zone styling */
.folder-content.drag-over-folder {
  position: relative;
  border: 3px dashed #0055aa;
  background: rgba(0, 85, 170, 0.05);
}

.folder-drop-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 85, 170, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  pointer-events: none;
  animation: fadeInOverlay 0.2s ease;
}

@keyframes fadeInOverlay {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.folder-drop-message {
  text-align: center;
  color: #ffffff;
  padding: 30px;
  background: rgba(0, 0, 0, 0.4);
  border: 3px dashed #ffffff;
  border-radius: 6px;
}

.folder-drop-icon {
  font-size: 48px;
  margin-bottom: 15px;
  animation: bounceIcon 1s ease-in-out infinite;
}

@keyframes bounceIcon {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.folder-drop-text {
  font-size: 12px;
  font-weight: bold;
  margin-bottom: 8px;
  font-family: 'Press Start 2P', monospace;
}

.folder-drop-path {
  font-size: 8px;
  opacity: 0.9;
  font-family: 'Press Start 2P', monospace;
  color: #ffaa00;
}
</style>

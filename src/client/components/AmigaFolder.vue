<template>
  <div class="amiga-folder">
    <div class="folder-header">
      <button class="amiga-button" :disabled="!canNavigateUp" @click="navigateUp">Parent</button>
      <div class="path-display">{{ displayPath }}</div>
    </div>

    <div class="folder-content">
      <div
        v-for="(item, index) in items"
        :key="index"
        class="folder-item"
        :class="{ selected: selectedItems.includes(item.id) }"
        @click="selectItem(item, $event)"
        @dblclick="openItem(item)"
        @contextmenu.prevent="showContextMenu(item, $event)"
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
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import AmigaContextMenu, { type ContextMenuItem } from './AmigaContextMenu.vue';

interface Props {
  data?: any;
}

interface FolderItem {
  id: string;
  name: string;
  type: 'folder' | 'file' | 'disk' | 'tool';
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

const contextMenuItems = computed<ContextMenuItem[]>(() => [
  { label: 'Open', action: 'open', icon: '▶' },
  { label: '', action: '', separator: true },
  { label: 'Copy', action: 'copy', icon: '📋', disabled: true },
  { label: 'Rename', action: 'rename', icon: '✏', disabled: true },
  { label: 'Delete', action: 'delete', icon: '🗑' },
  { label: '', action: '', separator: true },
  { label: 'Info', action: 'info', icon: 'ℹ', disabled: true }
]);

const currentPath = ref<string>(props.data?.id || 'dh0');
const parentPath = ref<string | null>(null);

const displayPath = computed(() => currentPath.value || '');
const canNavigateUp = computed(() => parentPath.value !== null);

// Load files from the server
const loadFiles = async () => {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    // Special handling for utils (tools) - use static list
    if (currentPath.value === 'utils') {
      items.value = [
        { id: 'u1', name: 'Clock', type: 'tool' },
        { id: 'u2', name: 'Calculator', type: 'tool' },
        { id: 'u3', name: 'MultiView', type: 'tool' },
        { id: 'u4', name: 'NotePad', type: 'tool' },
        { id: 'u5', name: 'Shell', type: 'tool' },
        { id: 'u6', name: 'More', type: 'folder' }
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
  if (item.type === 'tool') {
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
  if (!contextMenuItem.value) return;

  const item = contextMenuItem.value;

  switch (action) {
    case 'open':
      openItem(item);
      break;
    case 'delete':
      if (confirm(`Delete "${item.name}"?`)) {
        await deleteItem(item);
      }
      break;
    case 'copy':
    case 'rename':
    case 'info':
      alert(`${action} is not yet implemented`);
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

const navigateTo = async (nextPath: string) => {
  if (!nextPath || nextPath === currentPath.value) return;
  currentPath.value = nextPath;
  await loadFiles();
};

const navigateUp = async () => {
  if (!parentPath.value) return;
  await navigateTo(parentPath.value);
};
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
</style>

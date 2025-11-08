<template>
  <div class="amiga-folder-enhanced">
    <div class="folder-header">
      <button class="amiga-button" :disabled="!canNavigateUp" @click="navigateUp">Parent</button>
      <div class="path-display">{{ displayPath }}</div>
      <div class="view-options">
        <button
          class="amiga-button"
          :class="{ active: viewMode === 'grid' }"
          @click="viewMode = 'grid'"
        >Grid</button>
        <button
          class="amiga-button"
          :class="{ active: viewMode === 'list' }"
          @click="viewMode = 'list'"
        >List</button>
      </div>
    </div>

    <div class="folder-content" :class="`view-${viewMode}`">
      <!-- Enhanced Draggable List -->
      <draggable
        v-model="items"
        :group="{ name: 'files', pull: true, put: true }"
        :animation="150"
        ghost-class="drag-ghost"
        drag-class="drag-dragging"
        chosen-class="drag-chosen"
        handle=".drag-handle"
        :disabled="false"
        @start="onDragStart"
        @end="onDragEnd"
        @change="onDragChange"
        item-key="id"
        class="sortable-list"
        :class="{ empty: items.length === 0 }"
      >
        <template #item="{ element: item, index }">
          <div
            class="folder-item drag-item"
            :class="{
              selected: selectedItems.includes(item.id),
              'drag-over': dragState.dropZone?.id === item.id
            }"
            @click="selectItem(item, $event)"
            @dblclick="openItem(item)"
            @contextmenu.prevent="showContextMenu(item, $event)"
            @dragover="onItemDragOver(item, $event)"
            @dragleave="onItemDragLeave(item, $event)"
            @drop="onItemDrop(item, $event)"
          >
            <div class="drag-indicator"></div>
            <div class="drag-handle" v-if="viewMode === 'list'">⋮⋮</div>

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

              <!-- Tool Icon -->
              <svg v-else-if="item.type === 'tool'" viewBox="0 0 48 48" class="icon-svg">
                <rect x="12" y="8" width="24" height="32" fill="#0055aa" stroke="#000" stroke-width="2"/>
                <rect x="16" y="12" width="16" height="4" fill="#fff"/>
                <rect x="16" y="18" width="16" height="4" fill="#fff"/>
                <rect x="16" y="24" width="16" height="4" fill="#fff"/>
              </svg>
            </div>

            <div class="item-details">
              <div class="item-label">{{ item.name }}</div>
              <div v-if="item.size && viewMode === 'list'" class="item-size">{{ item.size }}</div>
            </div>
          </div>
        </template>
      </draggable>

      <!-- Drop message for empty folders -->
      <div v-if="items.length === 0" class="empty-folder-message">
        <div class="empty-icon">📁</div>
        <p>Empty Folder</p>
        <p class="empty-hint">Drag files here</p>
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

    <!-- Drag Feedback Overlay -->
    <div v-if="dragState.isDragging" class="drag-feedback-overlay">
      <div class="drag-feedback">
        {{ dragState.dragOperation?.items.length || 0 }} item(s)
        <span v-if="dragState.canDrop" class="can-drop">✓ Drop here</span>
        <span v-else class="cannot-drop">✗ Cannot drop</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted } from 'vue';
import draggable from 'vuedraggable';
import AmigaContextMenu, { type ContextMenuItem } from './AmigaContextMenu.vue';
import { useDragDrop } from '../composables/useDragDrop';
import type { DragItem, DropZone } from '../types/drag';

interface Props {
  data?: any;
}

interface FolderItem {
  id: string;
  name: string;
  type: 'folder' | 'file' | 'disk' | 'tool';
  size?: string;
  path?: string;
  created?: Date;
  modified?: Date;
}

const props = defineProps<Props>();
const emit = defineEmits(['open-folder', 'close']);

// Enhanced drag & drop composable
const {
  dragState,
  handleDragStart,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleDragEnd,
  executeDrop,
  setDropZone,
  moveToTrash,
} = useDragDrop();

// State
const items = ref<FolderItem[]>([]);
const selectedItems = ref<string[]>([]);
const currentPath = ref<string>('dh0');
const viewMode = ref<'grid' | 'list'>('grid');

// Context menu
const contextMenuVisible = ref(false);
const contextMenuX = ref(0);
const contextMenuY = ref(0);
const contextMenuItems = ref<ContextMenuItem[]>([]);

// Computed
const displayPath = computed(() => {
  return currentPath.value.replace(/\//g, ' › ');
});

const canNavigateUp = computed(() => {
  return currentPath.value.includes('/');
});

// Methods
const loadFiles = async () => {
  try {
    const response = await fetch(`/api/files/list?path=${encodeURIComponent(currentPath.value)}`);
    if (!response.ok) throw new Error('Failed to load files');

    const data = await response.json();
    items.value = data.items || [];
  } catch (error) {
    console.error('Failed to load files:', error);
    items.value = [];
  }
};

const selectItem = (item: FolderItem, event: MouseEvent) => {
  if (event.ctrlKey || event.metaKey) {
    // Multi-select
    if (selectedItems.value.includes(item.id)) {
      selectedItems.value = selectedItems.value.filter(id => id !== item.id);
    } else {
      selectedItems.value.push(item.id);
    }
  } else {
    selectedItems.value = [item.id];
  }
};

const openItem = (item: FolderItem) => {
  if (item.type === 'folder') {
    currentPath.value = item.path || `${currentPath.value}/${item.name}`;
    loadFiles();
  } else {
    emit('open-folder', item);
  }
};

const navigateUp = () => {
  const parts = currentPath.value.split('/');
  parts.pop();
  currentPath.value = parts.join('/') || 'dh0';
  loadFiles();
};

// Drag and drop handlers
const onDragStart = (event: any) => {
  const selectedItemsData = items.value.filter(item =>
    selectedItems.value.includes(item.id)
  );

  const dragItems: DragItem[] = selectedItemsData.map(item => ({
    id: item.id,
    name: item.name,
    type: item.type,
    path: item.path || `${currentPath.value}/${item.name}`,
    size: item.size,
  }));

  handleDragStart(event.originalEvent, dragItems, 'move');
};

const onDragEnd = () => {
  handleDragEnd();
};

const onDragChange = (event: any) => {
  console.log('Drag change:', event);
};

const onItemDragOver = (item: FolderItem, event: DragEvent) => {
  if (item.type !== 'folder') return;

  const zone: DropZone = {
    id: item.id,
    type: 'folder',
    accepts: ['file', 'folder', 'tool'],
    path: item.path || `${currentPath.value}/${item.name}`,
  };

  handleDragOver(event, zone);
};

const onItemDragLeave = (item: FolderItem, event: DragEvent) => {
  handleDragLeave();
};

const onItemDrop = async (item: FolderItem, event: DragEvent) => {
  if (item.type !== 'folder') return;

  const destination = item.path || `${currentPath.value}/${item.name}`;
  const result = await handleDrop(event, destination);

  if (result?.success) {
    await loadFiles();
    selectedItems.value = [];
  }
};

// Context menu
const showContextMenu = (item: FolderItem, event: MouseEvent) => {
  if (!selectedItems.value.includes(item.id)) {
    selectedItems.value = [item.id];
  }

  contextMenuX.value = event.clientX;
  contextMenuY.value = event.clientY;
  contextMenuItems.value = [
    { id: 'open', label: 'Open', icon: '📂' },
    { id: 'copy', label: 'Copy', icon: '📋' },
    { id: 'cut', label: 'Cut', icon: '✂️' },
    { id: 'delete', label: 'Delete', icon: '🗑️' },
    { id: 'rename', label: 'Rename', icon: '✏️' },
  ];
  contextMenuVisible.value = true;
};

const handleContextAction = async (action: string) => {
  contextMenuVisible.value = false;

  const selectedItemsData = items.value.filter(item =>
    selectedItems.value.includes(item.id)
  );

  switch (action) {
    case 'delete':
      const dragItems: DragItem[] = selectedItemsData.map(item => ({
        id: item.id,
        name: item.name,
        type: item.type,
        path: item.path || `${currentPath.value}/${item.name}`,
      }));
      await moveToTrash(dragItems);
      await loadFiles();
      selectedItems.value = [];
      break;

    // Handle other actions...
  }
};

// Lifecycle
onMounted(() => {
  loadFiles();
});

watch(() => props.data, () => {
  if (props.data?.path) {
    currentPath.value = props.data.path;
    loadFiles();
  }
}, { deep: true });
</script>

<style scoped>
.amiga-folder-enhanced {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #a0a0a0;
}

.folder-header {
  display: flex;
  gap: 8px;
  padding: 8px;
  border-bottom: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  align-items: center;
}

.path-display {
  flex: 1;
  font-size: 10px;
  padding: 4px 8px;
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
}

.view-options {
  display: flex;
  gap: 4px;
}

.amiga-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 4px 12px;
  font-size: 10px;
  font-family: 'Press Start 2P', monospace;
  cursor: pointer;
  text-transform: uppercase;
}

.amiga-button:active,
.amiga-button.active {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}

.amiga-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.folder-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  position: relative;
}

.sortable-list {
  display: grid;
  gap: 8px;
  min-height: 100px;
}

.view-grid .sortable-list {
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
}

.view-list .sortable-list {
  grid-template-columns: 1fr;
}

.folder-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  cursor: pointer;
  border: 2px solid transparent;
  position: relative;
}

.view-list .folder-item {
  flex-direction: row;
  gap: 8px;
}

.folder-item.selected {
  background: rgba(0, 85, 170, 0.3);
  border: 2px solid #0055aa;
}

.drag-handle {
  cursor: grab;
  color: #555555;
  font-size: 16px;
  padding: 0 4px;
}

.drag-handle:active {
  cursor: grabbing;
}

.item-icon {
  width: 48px;
  height: 48px;
}

.icon-svg {
  width: 100%;
  height: 100%;
}

.item-details {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.view-list .item-details {
  flex: 1;
  align-items: flex-start;
  flex-direction: row;
  justify-content: space-between;
}

.item-label {
  font-size: 10px;
  text-align: center;
  word-break: break-word;
}

.view-list .item-label {
  text-align: left;
}

.item-size {
  font-size: 8px;
  color: #555555;
}

.empty-folder-message {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #555555;
  font-size: 10px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-hint {
  margin-top: 8px;
  font-size: 8px;
}

.drag-feedback-overlay {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 10000;
  pointer-events: none;
}

.drag-feedback {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 12px 16px;
  font-size: 10px;
  box-shadow: 4px 4px 0px rgba(0, 0, 0, 0.5);
}

.can-drop {
  color: #00aa00;
  margin-left: 8px;
}

.cannot-drop {
  color: #aa0000;
  margin-left: 8px;
}
</style>

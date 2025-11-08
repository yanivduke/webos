<template>
  <div
    class="trash-drop-zone"
    :class="{
      'trash-drop-active': isDropActive,
      'trash-shake': isDropActive
    }"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
    @click="handleClick"
    @dblclick="handleDoubleClick"
  >
    <div class="trash-icon-container">
      <svg viewBox="0 0 64 64" class="trash-icon-svg">
        <rect x="16" y="24" width="32" height="32" :fill="trashFillColor" stroke="#000" stroke-width="2"/>
        <rect x="12" y="20" width="40" height="6" fill="#888" stroke="#000" stroke-width="2"/>
        <rect x="26" y="12" width="12" height="8" fill="#888" stroke="#000" stroke-width="1"/>
        <line x1="24" y1="30" x2="24" y2="48" stroke="#000" stroke-width="2"/>
        <line x1="32" y1="30" x2="32" y2="48" stroke="#000" stroke-width="2"/>
        <line x1="40" y1="30" x2="40" y2="48" stroke="#000" stroke-width="2"/>
      </svg>
    </div>
    <div class="trash-label">Trash</div>
    <div v-if="itemCount > 0" class="trash-count">{{ itemCount }} item(s)</div>
    <div v-if="isDropActive" class="drop-hint">Drop to Delete</div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { useDragDrop } from '../composables/useDragDrop';
import type { DropZone, DragItem } from '../types/drag';

const emit = defineEmits(['open', 'delete']);

const { setDropZone, handleDrop, moveToTrash, dragState } = useDragDrop();

// State
const isDropActive = ref(false);
const itemCount = ref(0);

// Computed
const trashFillColor = computed(() => {
  if (isDropActive.value) return '#aa0000';
  if (itemCount.value > 0) return '#888';
  return '#666';
});

// Methods
const loadTrashCount = async () => {
  try {
    const response = await fetch('/api/files/list?path=trash');
    if (!response.ok) throw new Error('Failed to load trash');

    const data = await response.json();
    itemCount.value = data.items?.length || 0;
  } catch (error) {
    console.error('Failed to load trash count:', error);
    itemCount.value = 0;
  }
};

const onDragOver = (event: DragEvent) => {
  event.preventDefault();

  const zone: DropZone = {
    id: 'trash',
    type: 'trash',
    accepts: ['file', 'folder', 'tool'],
    path: 'trash',
  };

  setDropZone(zone);
  isDropActive.value = true;

  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }
};

const onDragLeave = (event: DragEvent) => {
  // Check if we're actually leaving the trash zone
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const x = event.clientX;
  const y = event.clientY;

  if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
    setDropZone(null);
    isDropActive.value = false;
  }
};

const onDrop = async (event: DragEvent) => {
  event.preventDefault();
  isDropActive.value = false;

  if (!event.dataTransfer) return;

  try {
    // Parse dropped data
    const data = JSON.parse(event.dataTransfer.getData('text/plain'));

    if (data.items && Array.isArray(data.items)) {
      const dragItems: DragItem[] = data.items.map((item: any) => ({
        id: item.id,
        name: item.name,
        type: item.type,
        path: item.path,
      }));

      // Move items to trash
      const result = await moveToTrash(dragItems);

      if (result.success) {
        console.log(`Moved ${dragItems.length} item(s) to trash`);
        await loadTrashCount();
        emit('delete', dragItems);
      } else {
        console.error('Failed to move items to trash');
        alert('Failed to delete items');
      }
    }
  } catch (error) {
    console.error('Failed to process drop:', error);
    alert('Failed to delete items');
  } finally {
    setDropZone(null);
  }
};

const handleClick = () => {
  // Optional: Select trash for other operations
};

const handleDoubleClick = () => {
  // Open trash folder
  emit('open');
};

// Load trash count on mount
loadTrashCount();
</script>

<style scoped>
.trash-drop-zone {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s ease;
  user-select: none;
}

.trash-drop-zone:hover {
  background: rgba(255, 255, 255, 0.1);
}

.trash-drop-zone.trash-drop-active {
  background: rgba(170, 0, 0, 0.3);
  border: 2px dashed #aa0000;
}

.trash-icon-container {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.trash-icon-svg {
  width: 100%;
  height: 100%;
  transition: fill 0.2s ease;
}

.trash-label {
  font-size: 10px;
  text-align: center;
  background: rgba(160, 160, 160, 0.9);
  padding: 2px 4px;
  border: 1px solid #000;
}

.trash-count {
  font-size: 8px;
  color: #555555;
}

.drop-hint {
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 8px;
  background: #aa0000;
  color: #ffffff;
  padding: 2px 6px;
  border: 1px solid #000;
  white-space: nowrap;
  animation: pulse 0.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}
</style>

<template>
  <div
    ref="scrollContainer"
    class="virtual-scroll-container"
    @scroll="handleScroll"
    :style="{ height: containerHeight }"
  >
    <!-- Spacer for top items not rendered -->
    <div :style="{ height: `${topSpacerHeight}px` }"></div>

    <!-- Rendered visible items -->
    <div
      v-for="item in visibleItems"
      :key="item.id"
      class="virtual-scroll-item folder-item drag-item drag-optimized"
      :class="{
        selected: selectedItems.includes(item.id),
        'drag-over': dragState.dropZone?.id === item.id
      }"
      :draggable="true"
      @click="handleClick(item, $event)"
      @dblclick="handleDoubleClick(item)"
      @dragstart="handleDragStart(item, $event)"
      @dragend="handleDragEnd"
      @dragover="handleDragOver(item, $event)"
      @dragleave="handleDragLeave"
      @drop="handleDrop(item, $event)"
    >
      <div class="drag-indicator"></div>

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
        </svg>

        <!-- Tool Icon -->
        <svg v-else-if="item.type === 'tool'" viewBox="0 0 48 48" class="icon-svg">
          <rect x="12" y="8" width="24" height="32" fill="#0055aa" stroke="#000" stroke-width="2"/>
          <rect x="16" y="12" width="16" height="4" fill="#fff"/>
          <rect x="16" y="18" width="16" height="4" fill="#fff"/>
        </svg>
      </div>

      <div class="item-details">
        <div class="item-label">{{ item.name }}</div>
        <div v-if="item.size" class="item-size">{{ item.size }}</div>
      </div>
    </div>

    <!-- Spacer for bottom items not rendered -->
    <div :style="{ height: `${bottomSpacerHeight}px` }"></div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useDragDrop } from '../composables/useDragDrop';
import type { DragItem, DropZone } from '../types/drag';

interface FolderItem {
  id: string;
  name: string;
  type: 'folder' | 'file' | 'tool';
  size?: string;
  path?: string;
}

interface Props {
  items: FolderItem[];
  itemHeight?: number;
  containerHeight?: string;
  selectedItems?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  itemHeight: 80,
  containerHeight: '100%',
  selectedItems: () => [],
});

const emit = defineEmits(['select', 'open', 'dragstart', 'drop']);

const { dragState, handleDragStart: composableDragStart, handleDragEnd: composableDragEnd, handleDrop: composableDrop, setDropZone } = useDragDrop();

// Scroll state
const scrollContainer = ref<HTMLElement | null>(null);
const scrollTop = ref(0);
const visibleCount = ref(20);

// Virtual scroll calculations
const totalHeight = computed(() => props.items.length * props.itemHeight);

const startIndex = computed(() => {
  return Math.max(0, Math.floor(scrollTop.value / props.itemHeight) - 5);
});

const endIndex = computed(() => {
  return Math.min(
    props.items.length,
    startIndex.value + visibleCount.value + 10
  );
});

const visibleItems = computed(() => {
  return props.items.slice(startIndex.value, endIndex.value);
});

const topSpacerHeight = computed(() => {
  return startIndex.value * props.itemHeight;
});

const bottomSpacerHeight = computed(() => {
  return Math.max(0, (props.items.length - endIndex.value) * props.itemHeight);
});

// Scroll handler
const handleScroll = () => {
  if (scrollContainer.value) {
    scrollTop.value = scrollContainer.value.scrollTop;
  }
};

// Calculate visible count based on container height
const updateVisibleCount = () => {
  if (scrollContainer.value) {
    const containerHeightPx = scrollContainer.value.clientHeight;
    visibleCount.value = Math.ceil(containerHeightPx / props.itemHeight) + 5;
  }
};

// Event handlers
const handleClick = (item: FolderItem, event: MouseEvent) => {
  emit('select', item, event);
};

const handleDoubleClick = (item: FolderItem) => {
  emit('open', item);
};

const handleDragStart = (item: FolderItem, event: DragEvent) => {
  const dragItems: DragItem[] = props.selectedItems.includes(item.id)
    ? props.items.filter(i => props.selectedItems.includes(i.id)).map(i => ({
        id: i.id,
        name: i.name,
        type: i.type,
        path: i.path || i.name,
      }))
    : [{
        id: item.id,
        name: item.name,
        type: item.type,
        path: item.path || item.name,
      }];

  composableDragStart(event, dragItems, 'move');
  emit('dragstart', item, event);
};

const handleDragEnd = () => {
  composableDragEnd();
};

const handleDragOver = (item: FolderItem, event: DragEvent) => {
  if (item.type !== 'folder') return;

  const zone: DropZone = {
    id: item.id,
    type: 'folder',
    accepts: ['file', 'folder', 'tool'],
    path: item.path || item.name,
  };

  setDropZone(zone);
  event.preventDefault();
};

const handleDragLeave = () => {
  setDropZone(null);
};

const handleDrop = async (item: FolderItem, event: DragEvent) => {
  if (item.type !== 'folder') return;

  const result = await composableDrop(event, item.path || item.name);
  emit('drop', result);
};

// Lifecycle
onMounted(() => {
  updateVisibleCount();
  window.addEventListener('resize', updateVisibleCount);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateVisibleCount);
});

// Watch for item changes
watch(() => props.items.length, () => {
  updateVisibleCount();
});
</script>

<style scoped>
.virtual-scroll-container {
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
}

.virtual-scroll-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  cursor: pointer;
  border: 2px solid transparent;
  position: relative;
}

.virtual-scroll-item.selected {
  background: rgba(0, 85, 170, 0.3);
  border: 2px solid #0055aa;
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

.item-label {
  font-size: 10px;
  text-align: center;
  word-break: break-word;
}

.item-size {
  font-size: 8px;
  color: #555555;
}
</style>

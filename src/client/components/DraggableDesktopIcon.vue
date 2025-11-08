<template>
  <div
    class="draggable-desktop-icon"
    :class="{
      selected: isSelected,
      'desktop-icon-dragging': isDragging
    }"
    :style="positionStyle"
    @click="handleClick"
    @dblclick="handleDoubleClick"
    @mousedown="startDrag"
    draggable="true"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
  >
    <div class="icon-visual">
      <!-- Disk Icon -->
      <svg v-if="icon.type === 'disk'" viewBox="0 0 64 64" class="icon-svg">
        <rect x="12" y="16" width="40" height="32" :fill="icon.color || '#ffaa00'" stroke="#000" stroke-width="2"/>
        <rect x="16" y="20" width="32" height="8" fill="#000"/>
        <circle cx="32" cy="36" r="8" fill="#888"/>
        <circle cx="32" cy="36" r="4" fill="#333"/>
        <text x="32" y="52" text-anchor="middle" fill="#000" font-size="8" font-family="monospace">{{ icon.label }}</text>
      </svg>

      <!-- Folder Icon -->
      <svg v-else-if="icon.type === 'folder'" viewBox="0 0 64 64" class="icon-svg">
        <path d="M 8 16 L 8 52 L 56 52 L 56 24 L 32 24 L 28 16 Z" fill="#ffaa00" stroke="#000" stroke-width="2"/>
        <path d="M 8 16 L 28 16 L 32 24 L 56 24 L 56 20 L 32 20 L 28 16 Z" fill="#ffcc44" stroke="#000" stroke-width="1"/>
      </svg>

      <!-- Tool Icon -->
      <svg v-else-if="icon.type === 'tool'" viewBox="0 0 64 64" class="icon-svg">
        <rect x="20" y="12" width="24" height="40" fill="#0055aa" stroke="#000" stroke-width="2"/>
        <rect x="24" y="16" width="16" height="6" fill="#fff"/>
        <rect x="24" y="24" width="16" height="6" fill="#fff"/>
        <rect x="24" y="32" width="16" height="6" fill="#fff"/>
      </svg>

      <!-- Trash Icon -->
      <svg v-else-if="icon.type === 'trash'" viewBox="0 0 64 64" class="icon-svg">
        <rect x="16" y="24" width="32" height="32" fill="#666" stroke="#000" stroke-width="2"/>
        <rect x="12" y="20" width="40" height="6" fill="#888" stroke="#000" stroke-width="2"/>
        <rect x="26" y="12" width="12" height="8" fill="#888" stroke="#000" stroke-width="1"/>
        <line x1="24" y1="30" x2="24" y2="48" stroke="#000" stroke-width="2"/>
        <line x1="32" y1="30" x2="32" y2="48" stroke="#000" stroke-width="2"/>
        <line x1="40" y1="30" x2="40" y2="48" stroke="#000" stroke-width="2"/>
      </svg>

      <!-- Generic Icon -->
      <svg v-else viewBox="0 0 64 64" class="icon-svg">
        <rect x="16" y="16" width="32" height="32" :fill="icon.color || '#a0a0a0'" stroke="#000" stroke-width="2"/>
      </svg>
    </div>

    <div class="icon-label">{{ icon.name }}</div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { useDragDrop } from '../composables/useDragDrop';
import type { DragItem } from '../types/drag';

interface DesktopIcon {
  id: string;
  name: string;
  type: 'disk' | 'folder' | 'tool' | 'trash';
  path?: string;
  x: number;
  y: number;
  color?: string;
  label?: string;
}

interface Props {
  icon: DesktopIcon;
  isSelected?: boolean;
  snapToGrid?: boolean;
  gridSize?: number;
}

const props = withDefaults(defineProps<Props>(), {
  isSelected: false,
  snapToGrid: true,
  gridSize: 80,
});

const emit = defineEmits(['select', 'open', 'move']);

const { handleDragStart: composableDragStart, handleDragEnd: composableDragEnd } = useDragDrop();

// State
const isDragging = ref(false);
const dragStartX = ref(0);
const dragStartY = ref(0);
const dragOffsetX = ref(0);
const dragOffsetY = ref(0);

// Computed
const positionStyle = computed(() => ({
  left: `${props.icon.x}px`,
  top: `${props.icon.y}px`,
}));

// Methods
const handleClick = (event: MouseEvent) => {
  emit('select', props.icon, event);
};

const handleDoubleClick = () => {
  emit('open', props.icon);
};

const startDrag = (event: MouseEvent) => {
  // Don't start native drag on mousedown, just track for position
  dragStartX.value = event.clientX;
  dragStartY.value = event.clientY;
  dragOffsetX.value = props.icon.x;
  dragOffsetY.value = props.icon.y;

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', stopDrag);
};

const onMouseMove = (event: MouseEvent) => {
  if (!isDragging.value) {
    isDragging.value = true;
  }

  let newX = dragOffsetX.value + (event.clientX - dragStartX.value);
  let newY = dragOffsetY.value + (event.clientY - dragStartY.value);

  // Snap to grid if enabled
  if (props.snapToGrid) {
    newX = Math.round(newX / props.gridSize) * props.gridSize;
    newY = Math.round(newY / props.gridSize) * props.gridSize;
  }

  // Emit move event
  emit('move', { ...props.icon, x: newX, y: newY });
};

const stopDrag = () => {
  isDragging.value = false;
  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseup', stopDrag);
};

// HTML5 drag API handlers (for drag to other elements)
const onDragStart = (event: DragEvent) => {
  const dragItem: DragItem = {
    id: props.icon.id,
    name: props.icon.name,
    type: props.icon.type as any,
    path: props.icon.path,
  };

  composableDragStart(event, [dragItem], 'move');

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', JSON.stringify({
      items: [dragItem],
    }));
  }
};

const onDragEnd = () => {
  composableDragEnd();
  stopDrag();
};
</script>

<style scoped>
.draggable-desktop-icon {
  position: absolute;
  width: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  user-select: none;
  padding: 4px;
  border: 2px solid transparent;
  transition: transform 0.1s ease;
}

.draggable-desktop-icon:hover {
  background: rgba(255, 255, 255, 0.1);
}

.draggable-desktop-icon.selected {
  background: rgba(0, 85, 170, 0.3);
  border: 2px solid #0055aa;
}

.draggable-desktop-icon.desktop-icon-dragging {
  opacity: 0.6;
  cursor: grabbing !important;
  filter: drop-shadow(4px 4px 0px rgba(0, 0, 0, 0.5));
  transform: rotate(-3deg);
}

.icon-visual {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-svg {
  width: 100%;
  height: 100%;
}

.icon-label {
  font-size: 10px;
  text-align: center;
  word-break: break-word;
  max-width: 100%;
  background: rgba(160, 160, 160, 0.9);
  padding: 2px 4px;
  border: 1px solid #000;
}
</style>

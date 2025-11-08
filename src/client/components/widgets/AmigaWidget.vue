<template>
  <div
    class="amiga-widget"
    :style="{ left: `${x}px`, top: `${y}px` }"
    @mousedown="startDrag"
  >
    <div class="widget-header">
      <div class="widget-title">{{ title }}</div>
      <div class="widget-close" @click.stop="closeWidget">×</div>
    </div>
    <div class="widget-content">
      <slot></slot>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onUnmounted } from 'vue';

interface Props {
  title: string;
  x: number;
  y: number;
  id: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [id: string];
  updatePosition: [id: string, x: number, y: number];
}>();

const isDragging = ref(false);
let dragStartX = 0;
let dragStartY = 0;
let initialX = props.x;
let initialY = props.y;

const startDrag = (e: MouseEvent) => {
  // Only drag if clicking on header area
  const target = e.target as HTMLElement;
  if (!target.closest('.widget-header')) return;
  if (target.closest('.widget-close')) return;

  isDragging.value = true;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  initialX = props.x;
  initialY = props.y;

  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', stopDrag);
  e.preventDefault();
};

const onDrag = (e: MouseEvent) => {
  if (!isDragging.value) return;

  const dx = e.clientX - dragStartX;
  const dy = e.clientY - dragStartY;

  const newX = initialX + dx;
  const newY = initialY + dy;

  // Constrain to viewport
  const maxX = window.innerWidth - 200;
  const maxY = window.innerHeight - 100;

  const constrainedX = Math.max(0, Math.min(newX, maxX));
  const constrainedY = Math.max(0, Math.min(newY, maxY));

  emit('updatePosition', props.id, constrainedX, constrainedY);
};

const stopDrag = () => {
  isDragging.value = false;
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDrag);
};

const closeWidget = () => {
  emit('close', props.id);
};

onUnmounted(() => {
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDrag);
});
</script>

<style scoped>
.amiga-widget {
  position: fixed;
  background: var(--theme-background);
  border: 2px solid;
  border-color: var(--theme-borderLight) var(--theme-borderDark) var(--theme-borderDark) var(--theme-borderLight);
  box-shadow: 3px 3px 6px var(--theme-shadow);
  z-index: 900;
  min-width: 200px;
  font-family: 'Press Start 2P', monospace;
  transition: box-shadow 0.2s;
}

.amiga-widget:hover {
  box-shadow: 4px 4px 8px var(--theme-shadow);
}

.widget-header {
  background: var(--theme-highlight);
  color: var(--theme-highlightText);
  padding: 6px 8px;
  font-size: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: move;
  border-bottom: 2px solid var(--theme-borderDark);
  user-select: none;
}

.widget-title {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.widget-close {
  cursor: pointer;
  padding: 0 6px;
  font-size: 16px;
  line-height: 16px;
  font-family: Arial, sans-serif;
  transition: all 0.1s;
}

.widget-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

.widget-close:active {
  background: rgba(255, 255, 255, 0.4);
}

.widget-content {
  padding: 10px;
  font-size: 9px;
  color: var(--theme-text);
  background: var(--theme-background);
}
</style>

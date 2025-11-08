<template>
  <div
    class="amiga-window"
    :style="windowStyle"
    @mousedown="bringToFront"
  >
    <!-- Title Bar with authentic Amiga styling -->
    <div
      class="window-titlebar"
      @mousedown="startDrag"
      @dblclick="toggleMaximize"
    >
      <div class="title-bar-left">
        <div class="title-bar-button close-button" @click.stop="close">
          <div class="close-icon"></div>
        </div>
        <div class="title-bar-button depth-button" @click.stop="sendToBack">
          <div class="depth-icon"></div>
        </div>
      </div>
      <div class="window-title">{{ title }}</div>
      <div class="title-bar-right">
        <div class="title-bar-button zoom-button" @click.stop="toggleMaximize">
          <div class="zoom-icon"></div>
        </div>
      </div>
    </div>

    <!-- Window Content Area -->
    <div class="window-content">
      <slot></slot>
    </div>

    <!-- Resize Handle (Bottom-right corner) -->
    <div
      class="resize-handle"
      @mousedown.stop="startResize"
    ></div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

interface Props {
  title?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Untitled',
  x: 100,
  y: 80,
  width: 500,
  height: 350
});

const emit = defineEmits<{
  close: [];
  minimize: [];
  maximize: [];
}>();

// Window state
const windowX = ref(props.x);
const windowY = ref(props.y);
const windowWidth = ref(props.width);
const windowHeight = ref(props.height);
const isMaximized = ref(false);
const isDragging = ref(false);
const isResizing = ref(false);
const zIndex = ref(1);

// Drag state
let dragStartX = 0;
let dragStartY = 0;
let dragStartWindowX = 0;
let dragStartWindowY = 0;

// Resize state
let resizeStartX = 0;
let resizeStartY = 0;
let resizeStartWidth = 0;
let resizeStartHeight = 0;

// Saved position for maximize/restore
let savedX = 0;
let savedY = 0;
let savedWidth = 0;
let savedHeight = 0;

const windowStyle = computed(() => ({
  left: `${windowX.value}px`,
  top: `${windowY.value}px`,
  width: `${windowWidth.value}px`,
  height: `${windowHeight.value}px`,
  zIndex: zIndex.value
}));

// Dragging functions
const startDrag = (e: MouseEvent) => {
  if (isMaximized.value) return;

  isDragging.value = true;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  dragStartWindowX = windowX.value;
  dragStartWindowY = windowY.value;

  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', stopDrag);
  e.preventDefault();
};

const onDrag = (e: MouseEvent) => {
  if (!isDragging.value) return;

  const dx = e.clientX - dragStartX;
  const dy = e.clientY - dragStartY;

  windowX.value = dragStartWindowX + dx;
  windowY.value = dragStartWindowY + dy;
};

const stopDrag = () => {
  isDragging.value = false;
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDrag);
};

// Resize functions
const startResize = (e: MouseEvent) => {
  isResizing.value = true;
  resizeStartX = e.clientX;
  resizeStartY = e.clientY;
  resizeStartWidth = windowWidth.value;
  resizeStartHeight = windowHeight.value;

  document.addEventListener('mousemove', onResize);
  document.addEventListener('mouseup', stopResize);
  e.preventDefault();
};

const onResize = (e: MouseEvent) => {
  if (!isResizing.value) return;

  const dx = e.clientX - resizeStartX;
  const dy = e.clientY - resizeStartY;

  windowWidth.value = Math.max(200, resizeStartWidth + dx);
  windowHeight.value = Math.max(150, resizeStartHeight + dy);
};

const stopResize = () => {
  isResizing.value = false;
  document.removeEventListener('mousemove', onResize);
  document.removeEventListener('mouseup', stopResize);
};

// Window actions
const close = () => {
  emit('close');
};

const toggleMaximize = () => {
  if (isMaximized.value) {
    // Restore
    windowX.value = savedX;
    windowY.value = savedY;
    windowWidth.value = savedWidth;
    windowHeight.value = savedHeight;
    isMaximized.value = false;
  } else {
    // Maximize
    savedX = windowX.value;
    savedY = windowY.value;
    savedWidth = windowWidth.value;
    savedHeight = windowHeight.value;

    windowX.value = 120;
    windowY.value = 0;
    windowWidth.value = window.innerWidth - 140;
    windowHeight.value = window.innerHeight - 50;
    isMaximized.value = true;
  }
};

const bringToFront = () => {
  zIndex.value = Date.now();
};

const sendToBack = () => {
  zIndex.value = 1;
};

// Cleanup
onUnmounted(() => {
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDrag);
  document.removeEventListener('mousemove', onResize);
  document.removeEventListener('mouseup', stopResize);
});
</script>

<style scoped>
/* Authentic Amiga Window Styling */
.amiga-window {
  position: absolute;
  background: var(--window-titlebar-bg);
  border: var(--window-border-width) var(--window-border-style);
  border-color: var(--color-border-light) var(--color-border-dark) var(--color-border-dark) var(--color-border-light);
  border-radius: var(--window-border-radius);
  box-shadow: var(--window-shadow);
  display: flex;
  flex-direction: column;
  font-family: var(--font-family);
}

/* Title Bar */
.window-titlebar {
  background: var(--window-titlebar-bg);
  border-bottom: var(--window-border-width) solid var(--color-border-dark);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2px 4px;
  cursor: move;
  user-select: none;
  height: var(--window-titlebar-height);
  box-shadow: inset 1px 1px 0 var(--color-border-light), inset -1px -1px 0 var(--color-border);
}

.window-titlebar:active {
  cursor: grabbing;
}

.title-bar-left,
.title-bar-right {
  display: flex;
  gap: 4px;
  align-items: center;
}

.window-title {
  flex: 1;
  text-align: center;
  font-size: var(--font-size-title);
  color: var(--window-titlebar-text);
  font-weight: var(--font-weight-bold);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 8px;
}

/* Title Bar Buttons */
.title-bar-button {
  width: 18px;
  height: 18px;
  background: var(--button-bg);
  border: var(--button-border-width) var(--button-border-style);
  border-color: var(--color-border-light) var(--color-border-dark) var(--color-border-dark) var(--color-border-light);
  border-radius: var(--button-border-radius);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--animation-duration);
}

.title-bar-button:hover {
  background: var(--button-hover-bg);
}

.title-bar-button:active {
  border-color: var(--color-border-dark) var(--color-border-light) var(--color-border-light) var(--color-border-dark);
  background: var(--button-active-bg);
}

/* Close Button */
.close-button .close-icon {
  width: 10px;
  height: 10px;
  position: relative;
}

.close-button .close-icon::before,
.close-button .close-icon::after {
  content: '';
  position: absolute;
  width: 12px;
  height: 2px;
  background: var(--color-error);
  top: 4px;
  left: -1px;
}

.close-button .close-icon::before {
  transform: rotate(45deg);
}

.close-button .close-icon::after {
  transform: rotate(-45deg);
}

/* Depth Button (send to back) */
.depth-button .depth-icon {
  width: 8px;
  height: 8px;
  border: 2px solid var(--color-primary);
  background: transparent;
}

/* Zoom Button (maximize) */
.zoom-button .zoom-icon {
  width: 10px;
  height: 10px;
  border: 2px solid var(--color-primary);
  background: transparent;
  position: relative;
}

.zoom-button .zoom-icon::after {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  height: 3px;
  background: var(--color-primary);
}

/* Window Content */
.window-content {
  flex: 1;
  background: var(--window-content-bg);
  color: var(--color-text);
  overflow: auto;
  padding: 8px;
  border: 1px solid var(--color-border);
  margin: 2px;
  min-height: 100px;
}

/* Resize Handle */
.resize-handle {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 16px;
  height: 16px;
  cursor: nwse-resize;
  background: linear-gradient(135deg, transparent 0%, transparent 45%, var(--color-border-dark) 45%, var(--color-border-dark) 50%, transparent 50%);
}

.resize-handle::after {
  content: '';
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 8px;
  height: 8px;
  background: repeating-linear-gradient(
    45deg,
    var(--color-border-dark),
    var(--color-border-dark) 1px,
    transparent 1px,
    transparent 2px
  );
}

/* Scrollbar styling for authentic look */
.window-content::-webkit-scrollbar {
  width: var(--scrollbar-width);
  height: var(--scrollbar-width);
}

.window-content::-webkit-scrollbar-track {
  background: var(--scrollbar-track);
  border: var(--window-border-width) var(--window-border-style);
  border-color: var(--color-border) var(--color-border-light) var(--color-border-light) var(--color-border);
}

.window-content::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
  border: var(--window-border-width) var(--window-border-style);
  border-color: var(--color-border-light) var(--color-border-dark) var(--color-border-dark) var(--color-border-light);
}

.window-content::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover);
}

.window-content::-webkit-scrollbar-corner {
  background: var(--scrollbar-track);
}

/* Arrow buttons for scrollbar */
.window-content::-webkit-scrollbar-button {
  background: var(--scrollbar-button);
  border: var(--window-border-width) var(--window-border-style);
  border-color: var(--color-border-light) var(--color-border-dark) var(--color-border-dark) var(--color-border-light);
  height: var(--scrollbar-width);
  width: var(--scrollbar-width);
}

.window-content::-webkit-scrollbar-button:hover {
  background: var(--button-hover-bg);
}
</style>
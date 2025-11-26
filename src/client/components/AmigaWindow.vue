<template>
  <div
    class="amiga-window"
    :style="windowStyle"
    @mousedown="bringToFront"
    role="dialog"
    :aria-label="title"
    :aria-modal="false"
    tabindex="-1"
    ref="windowRef"
  >
    <!-- Title Bar with authentic Amiga styling -->
    <div
      class="window-titlebar"
      @mousedown="startDrag"
      @dblclick="toggleMaximize"
      role="banner"
      aria-label="Window title bar"
    >
      <div class="title-bar-left">
        <button
          class="title-bar-button close-button"
          @click.stop="close"
          @keydown.enter.stop="close"
          @keydown.space.stop="close"
          aria-label="Close window"
          title="Close (Alt+F4)"
          data-keyboard-shortcut="Alt+F4"
        >
          <div class="close-icon" aria-hidden="true"></div>
        </button>
        <button
          class="title-bar-button depth-button"
          @click.stop="sendToBack"
          @keydown.enter.stop="sendToBack"
          @keydown.space.stop="sendToBack"
          aria-label="Send to back"
          title="Send to back"
        >
          <div class="depth-icon" aria-hidden="true"></div>
        </button>
      </div>
      <div class="window-title" id="window-title">{{ title }}</div>
      <div class="title-bar-right">
        <button
          class="title-bar-button zoom-button"
          @click.stop="toggleMaximize"
          @keydown.enter.stop="toggleMaximize"
          @keydown.space.stop="toggleMaximize"
          :aria-label="isMaximized ? 'Restore window' : 'Maximize window'"
          :title="isMaximized ? 'Restore' : 'Maximize'"
          :aria-pressed="isMaximized"
        >
          <div class="zoom-icon" aria-hidden="true"></div>
        </button>
      </div>
    </div>

    <!-- Window Content Area -->
    <div
      class="window-content"
      role="main"
      :aria-labelledby="'window-title'"
    >
      <slot></slot>
    </div>

    <!-- Resize Handle (Bottom-right corner) -->
    <div
      class="resize-handle"
      @mousedown.stop="startResize"
      @keydown="handleResizeKeyboard"
      role="separator"
      aria-label="Resize window"
      tabindex="0"
      title="Resize (Arrow keys)"
    ></div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { screenReader } from '../utils/screen-reader';
import { useEscapeKey } from '../composables/useKeyboardNav';
import { getNextZIndex } from '../composables/useZIndexManager';

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

// Window reference
const windowRef = ref<HTMLElement | null>(null);

// Window state
const windowX = ref(props.x);
const windowY = ref(props.y);
const windowWidth = ref(props.width);
const windowHeight = ref(props.height);
const isMaximized = ref(false);
const isDragging = ref(false);
const isResizing = ref(false);
const zIndex = ref(getNextZIndex()); // Use centralized z-index manager

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
  screenReader.announceAction('Close', props.title);
};

const toggleMaximize = () => {
  if (isMaximized.value) {
    // Restore
    windowX.value = savedX;
    windowY.value = savedY;
    windowWidth.value = savedWidth;
    windowHeight.value = savedHeight;
    isMaximized.value = false;
    screenReader.announceAction('Window restored', props.title);
  } else {
    // Maximize
    savedX = windowX.value;
    savedY = windowY.value;
    savedWidth = windowWidth.value;
    savedHeight = windowHeight.value;

    windowX.value = 120; // Avoid desktop icons (120px left margin)
    windowY.value = 40; // Avoid menu bar (40px top margin)
    windowWidth.value = window.innerWidth - 140; // Account for left margin + small right padding
    windowHeight.value = window.innerHeight - 90; // Account for menu bar (40px) + footer (50px)
    isMaximized.value = true;
    screenReader.announceAction('Window maximized', props.title);
  }
};

const bringToFront = () => {
  zIndex.value = getNextZIndex();
};

const sendToBack = () => {
  zIndex.value = 1;
  screenReader.announceAction('Window sent to back', props.title);
};

// Keyboard resize function
const handleResizeKeyboard = (e: KeyboardEvent) => {
  const step = e.shiftKey ? 10 : 1;

  switch (e.key) {
    case 'ArrowRight':
      e.preventDefault();
      windowWidth.value += step;
      break;
    case 'ArrowLeft':
      e.preventDefault();
      windowWidth.value = Math.max(200, windowWidth.value - step);
      break;
    case 'ArrowDown':
      e.preventDefault();
      windowHeight.value += step;
      break;
    case 'ArrowUp':
      e.preventDefault();
      windowHeight.value = Math.max(150, windowHeight.value - step);
      break;
  }
};

// Escape key to close
useEscapeKey(() => {
  if (windowRef.value && document.activeElement && windowRef.value.contains(document.activeElement)) {
    close();
  }
});

// Lifecycle
onMounted(() => {
  // Announce window opened
  screenReader.announceWindowOpened(props.title);

  // Set up keyboard shortcuts
  const handleKeyDown = (e: KeyboardEvent) => {
    if (windowRef.value && !windowRef.value.contains(document.activeElement)) return;

    // Alt+F4 to close
    if (e.altKey && e.key === 'F4') {
      e.preventDefault();
      close();
    }

    // F11 to maximize/restore
    if (e.key === 'F11') {
      e.preventDefault();
      toggleMaximize();
    }
  };

  document.addEventListener('keydown', handleKeyDown);

  // Cleanup
  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
    document.removeEventListener('mousemove', onResize);
    document.removeEventListener('mouseup', stopResize);

    // Announce window closed
    screenReader.announceWindowClosed(props.title);
  });
});
</script>

<style scoped>
/* Authentic Amiga Window Styling - Using Theme CSS Variables */
.amiga-window {
  position: absolute;
  background: var(--theme-window-chrome, #a0a0a0);
  border: var(--theme-border-width, 2px) solid;
  border-color: var(--theme-border-light, #ffffff) var(--theme-border-dark, #000000) var(--theme-border-dark, #000000) var(--theme-border-light, #ffffff);
  box-shadow: var(--theme-shadow, 4px 4px 8px rgba(0, 0, 0, 0.5));
  display: flex;
  flex-direction: column;
  font-family: var(--theme-font-primary, 'Press Start 2P'), 'Courier New', monospace;
}

/* Title Bar */
.window-titlebar {
  background: var(--theme-window-chrome, #a0a0a0);
  background-image: linear-gradient(180deg, var(--theme-border-light, #ffffff) 0%, var(--theme-window-chrome, #c0c0c0) 50%, var(--theme-shadow, #a0a0a0) 100%);
  border-bottom: 2px solid var(--theme-border-dark, #000000);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2px 4px;
  cursor: move;
  user-select: none;
  height: var(--theme-title-bar-height, 24px);
  box-shadow: inset 1px 1px 0 var(--theme-border-light, #ffffff), inset -1px -1px 0 var(--theme-shadow, #808080);
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
  font-size: var(--theme-font-size-medium, 10px);
  color: var(--theme-text, #000000);
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 8px;
}

/* Title Bar Buttons */
.title-bar-button {
  width: 18px;
  height: 18px;
  background: var(--theme-window-chrome, #a0a0a0);
  border: 2px solid;
  border-color: var(--theme-border-light, #ffffff) var(--theme-border-dark, #000000) var(--theme-border-dark, #000000) var(--theme-border-light, #ffffff);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--theme-animation-duration, 0.1s);
}

.title-bar-button:hover {
  filter: brightness(1.1);
}

.title-bar-button:active {
  border-color: var(--theme-border-dark, #000000) var(--theme-border-light, #ffffff) var(--theme-border-light, #ffffff) var(--theme-border-dark, #000000);
  background: var(--theme-shadow, #888888);
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
  background: var(--theme-error, #ff6600);
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
  border: 2px solid var(--theme-primary, #0055aa);
  background: transparent;
}

/* Zoom Button (maximize) */
.zoom-button .zoom-icon {
  width: 10px;
  height: 10px;
  border: 2px solid var(--theme-primary, #0055aa);
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
  background: var(--theme-primary, #0055aa);
}

/* Window Content */
.window-content {
  flex: 1;
  background: var(--theme-input-bg, #ffffff);
  color: var(--theme-input-text, #000000);
  overflow: auto;
  padding: var(--theme-spacing-medium, 8px);
  border: 1px solid var(--theme-shadow, #808080);
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
  background: linear-gradient(135deg, transparent 0%, transparent 45%, var(--theme-border-dark, #000000) 45%, var(--theme-border-dark, #000000) 50%, transparent 50%);
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
    var(--theme-border-dark, #000000),
    var(--theme-border-dark, #000000) 1px,
    transparent 1px,
    transparent 2px
  );
}

/* Scrollbar styling using theme variables */
.window-content::-webkit-scrollbar {
  width: 16px;
  height: 16px;
}

.window-content::-webkit-scrollbar-track {
  background: var(--theme-scrollbar-track, #a0a0a0);
  border: 2px solid;
  border-color: var(--theme-shadow, #808080) var(--theme-border-light, #ffffff) var(--theme-border-light, #ffffff) var(--theme-shadow, #808080);
}

.window-content::-webkit-scrollbar-thumb {
  background: var(--theme-scrollbar-thumb, #0055aa);
  border: 2px solid;
  border-color: var(--theme-border-light, #ffffff) var(--theme-border-dark, #000000) var(--theme-border-dark, #000000) var(--theme-border-light, #ffffff);
}

.window-content::-webkit-scrollbar-thumb:hover {
  filter: brightness(1.1);
}

.window-content::-webkit-scrollbar-corner {
  background: var(--theme-scrollbar-track, #a0a0a0);
}

/* Arrow buttons for scrollbar */
.window-content::-webkit-scrollbar-button {
  background: var(--theme-scrollbar-track, #a0a0a0);
  border: 2px solid;
  border-color: var(--theme-border-light, #ffffff) var(--theme-border-dark, #000000) var(--theme-border-dark, #000000) var(--theme-border-light, #ffffff);
  height: 16px;
  width: 16px;
}

.window-content::-webkit-scrollbar-button:hover {
  filter: brightness(1.1);
}
</style>
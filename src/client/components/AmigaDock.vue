<template>
  <div
    class="amiga-dock-container"
    :class="{ 'auto-hidden': isAutoHidden }"
    @mouseenter="handleDockHover(true)"
    @mouseleave="handleDockHover(false)"
  >
    <!-- Dock Background Panel -->
    <div
      class="dock-panel"
      :style="{ height: `${dockHeight}px` }"
    >
      <!-- Dock Items -->
      <div class="dock-items" :style="{ gap: `${dockGap}px` }">
        <!-- Pinned Apps -->
        <div
          v-for="(item, index) in pinnedItems"
          :key="item.id"
          class="dock-item"
          :class="{ running: item.running, magnified: hoveredItemId === item.id }"
          :style="dockItemStyle(index)"
          @mouseenter="hoveredItemId = item.id"
          @mouseleave="hoveredItemId = null"
          @click="handleItemClick(item)"
          @contextmenu.prevent="showContextMenu(item, $event)"
          :draggable="true"
          @dragstart="handleDragStart(index, $event)"
          @dragover.prevent="handleDragOver(index, $event)"
          @drop.prevent="handleDrop(index, $event)"
          @dragend="handleDragEnd"
        >
          <!-- Item Icon -->
          <div class="item-icon">{{ item.icon || '📦' }}</div>

          <!-- Running Indicator -->
          <div v-if="item.running" class="running-indicator">
            <span v-if="item.windowCount > 1" class="window-count">{{ item.windowCount }}</span>
            <span v-else class="running-dot"></span>
          </div>

          <!-- Tooltip -->
          <div class="item-tooltip">{{ item.name }}</div>
        </div>

        <!-- Separator -->
        <div v-if="pinnedItems.length > 0 && runningWindowItems.length > 0" class="dock-separator"></div>

        <!-- Running Windows -->
        <div
          v-for="(item, index) in runningWindowItems"
          :key="item.id"
          class="dock-item running-window"
          :class="{ minimized: isWindowMinimized(item.id), magnified: hoveredItemId === item.id }"
          :style="dockItemStyle(pinnedItems.length + 1 + index)"
          @mouseenter="hoveredItemId = item.id"
          @mouseleave="hoveredItemId = null"
          @click="handleWindowClick(item)"
          @contextmenu.prevent="showContextMenu(item, $event)"
        >
          <!-- Window Icon -->
          <div class="item-icon window-icon">🪟</div>

          <!-- Window Badge -->
          <div class="window-badge">{{ item.windowCount }}</div>

          <!-- Tooltip -->
          <div class="item-tooltip">{{ item.name }}</div>
        </div>
      </div>

      <!-- Dock Controls (Right side) -->
      <div class="dock-controls">
        <!-- Settings Button -->
        <div
          class="dock-control-button"
          title="Dock Settings"
          @click="showDockSettings"
        >
          ⚙️
        </div>
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
import { ref, computed, onMounted } from 'vue';
import { useDock, type DockItem } from '../composables/useDock';
import AmigaContextMenu, { type ContextMenuItem } from './AmigaContextMenu.vue';
import { useSoundEffects } from '../composables/useSoundEffects';

interface Props {
  openWindows?: any[];
}

const props = withDefaults(defineProps<Props>(), {
  openWindows: () => []
});

const emit = defineEmits<{
  launchApp: [appId: string];
  focusWindow: [windowId: string];
  restoreWindow: [windowId: string];
  minimizeWindow: [windowId: string];
  closeWindow: [windowId: string];
}>();

const {
  dockItems,
  dockSettings,
  minimizedWindows,
  isAutoHidden,
  initializeDock,
  pinnedItems,
  runningWindowItems,
  dockHeight,
  dockItemSize,
  togglePin,
  reorderItems,
  isWindowMinimized,
  restoreWindow,
  updateDockSettings
} = useDock();

const { playSound } = useSoundEffects();

// Local state
const hoveredItemId = ref<string | null>(null);
const draggedIndex = ref<number | null>(null);
const contextMenuVisible = ref(false);
const contextMenuX = ref(0);
const contextMenuY = ref(0);
const contextMenuItem = ref<DockItem | null>(null);

// Computed properties
const dockGap = computed(() => {
  const sizes = { small: 6, medium: 10, large: 12 };
  return sizes[dockSettings.value.size];
});

const magnificationFactor = computed(() => {
  return dockSettings.value.magnification ? 1.5 : 1;
});

const contextMenuItems = computed<ContextMenuItem[]>(() => {
  if (!contextMenuItem.value) return [];

  const item = contextMenuItem.value;
  const items: ContextMenuItem[] = [];

  if (item.type === 'app') {
    if (item.running && item.windowCount > 0) {
      items.push(
        { label: 'Close All Windows', action: 'close-all', icon: '✕' },
        { label: '', action: '', separator: true }
      );
    }

    items.push({
      label: item.pinned ? 'Unpin from Dock' : 'Pin to Dock',
      action: item.pinned ? 'unpin' : 'pin',
      icon: item.pinned ? '📌' : '📍'
    });
  } else if (item.type === 'window') {
    items.push(
      { label: 'Restore', action: 'restore', icon: '🔄' },
      { label: 'Minimize', action: 'minimize', icon: '▼' },
      { label: 'Close', action: 'close', icon: '✕' }
    );
  }

  return items;
});

// Methods
const handleItemClick = (item: DockItem) => {
  playSound('click');

  if (item.type === 'app') {
    emit('launchApp', item.id);
  }
};

const handleWindowClick = (item: DockItem) => {
  playSound('click');

  if (isWindowMinimized(item.id)) {
    emit('restoreWindow', item.id);
  } else {
    emit('focusWindow', item.id);
  }
};

const handleDragStart = (index: number, event: DragEvent) => {
  draggedIndex.value = index;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(index));
  }
};

const handleDragOver = (index: number, event: DragEvent) => {
  if (draggedIndex.value === null) return;
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }
};

const handleDrop = (toIndex: number, event: DragEvent) => {
  if (draggedIndex.value === null) return;

  const fromIndex = draggedIndex.value;
  if (fromIndex !== toIndex) {
    reorderItems(fromIndex, toIndex);
    playSound('click');
  }
};

const handleDragEnd = () => {
  draggedIndex.value = null;
};

const showContextMenu = (item: DockItem, event: MouseEvent) => {
  contextMenuItem.value = item;
  contextMenuX.value = event.clientX;
  contextMenuY.value = event.clientY;
  contextMenuVisible.value = true;
};

const handleContextAction = async (action: string) => {
  if (!contextMenuItem.value) return;

  const item = contextMenuItem.value;
  contextMenuVisible.value = false;

  switch (action) {
    case 'pin':
      togglePin(item.id);
      playSound('click');
      break;
    case 'unpin':
      togglePin(item.id);
      playSound('click');
      break;
    case 'restore':
      emit('restoreWindow', item.id);
      playSound('click');
      break;
    case 'minimize':
      emit('minimizeWindow', item.id);
      playSound('click');
      break;
    case 'close':
      emit('closeWindow', item.id);
      playSound('click');
      break;
    case 'close-all':
      // Close all windows for this app
      const appItem = dockItems.value.find(i => i.id === item.id && i.type === 'app');
      if (appItem) {
        // Emit close for all windows associated with this app
        runningWindowItems.value
          .filter(w => w.data?.appId === item.id)
          .forEach(w => emit('closeWindow', w.id));
      }
      playSound('click');
      break;
  }

  contextMenuItem.value = null;
};

const showDockSettings = () => {
  // TODO: Show dock settings dialog
  console.log('Show dock settings');
  playSound('click');
};

const handleDockHover = (isHovering: boolean) => {
  if (dockSettings.value.autoHide) {
    // TODO: Implement auto-hide toggle
  }
};

const dockItemStyle = (index: number) => {
  const isHovered = hoveredItemId.value !== null;
  let scale = 1;

  if (dockSettings.value.magnification && isHovered) {
    // Calculate magnification based on distance from hovered item
    const itemIndex = dockItems.value.findIndex(item => item.id === hoveredItemId.value);
    const distance = Math.abs(index - itemIndex);

    if (distance === 0) {
      scale = magnificationFactor.value;
    } else if (distance === 1) {
      scale = magnificationFactor.value * 0.75;
    } else if (distance === 2) {
      scale = magnificationFactor.value * 0.5;
    }
  }

  return {
    transform: `scale(${scale})`,
    transition: 'transform 0.15s ease-out'
  };
};

// Initialize dock on mount
onMounted(() => {
  initializeDock();
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

.amiga-dock-container {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  z-index: 900;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.amiga-dock-container.auto-hidden {
  transform: translateX(-50%) translateY(100%);
  pointer-events: none;
}

.amiga-dock-container.auto-hidden:hover {
  transform: translateX(-50%) translateY(0);
  pointer-events: all;
}

/* Dock Panel */
.dock-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 8px 16px;
  background: rgba(160, 160, 160, 0.95);
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  border-radius: 12px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4),
              inset 1px 1px 0 #ffffff,
              inset -1px -1px 0 #000000;
  backdrop-filter: blur(10px);
}

/* Dock Items Container */
.dock-items {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* Dock Item */
.dock-item {
  position: relative;
  width: v-bind('dockItemSize + "px"');
  height: v-bind('dockItemSize + "px"');
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(0, 85, 170, 0.3);
  transition: all 0.15s ease-out;
  padding: 4px;
}

.dock-item:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.dock-item.running {
  background: rgba(0, 85, 170, 0.2);
  border-color: #0055aa;
  box-shadow: inset 0 0 8px rgba(0, 85, 170, 0.3);
}

.dock-item.magnified {
  transform: scale(1.3);
}

.dock-item.running-window {
  background: rgba(255, 170, 0, 0.15);
  border-color: #ffaa00;
}

.dock-item.running-window.minimized {
  opacity: 0.6;
  background: rgba(160, 160, 160, 0.3);
}

/* Item Icon */
.item-icon {
  font-size: v-bind('(dockItemSize * 0.6) + "px"');
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  filter: drop-shadow(1px 1px 0 rgba(0, 0, 0, 0.3));
  transition: transform 0.15s ease-out;
}

.dock-item.running .item-icon {
  filter: drop-shadow(0 0 6px #0055aa);
}

.window-icon {
  font-size: v-bind('(dockItemSize * 0.5) + "px"');
  background: #0055aa;
  border-radius: 4px;
  padding: 2px;
  color: #ffffff;
}

/* Running Indicator */
.running-indicator {
  position: absolute;
  bottom: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.running-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  background: #0055aa;
  border-radius: 50%;
  box-shadow: 0 0 4px #0055aa;
}

.window-count {
  display: inline-block;
  min-width: 12px;
  height: 12px;
  background: #ff6600;
  color: #ffffff;
  font-size: 8px;
  font-weight: bold;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

/* Window Badge */
.window-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  display: inline-block;
  min-width: 14px;
  height: 14px;
  background: #ff6600;
  color: #ffffff;
  font-size: 9px;
  font-weight: bold;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  border: 1px solid #ffffff;
}

/* Tooltip */
.item-tooltip {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.9);
  color: #ffffff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 9px;
  font-family: 'Press Start 2P', monospace;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.15s ease-out;
  z-index: 1000;
}

.dock-item:hover .item-tooltip {
  opacity: 1;
}

/* Separator */
.dock-separator {
  width: 2px;
  height: 50%;
  background: rgba(0, 0, 0, 0.3);
  border-left: 1px solid rgba(255, 255, 255, 0.3);
  margin: 0 4px;
}

/* Dock Controls */
.dock-controls {
  display: flex;
  gap: 4px;
  margin-left: 8px;
  border-left: 2px solid rgba(0, 0, 0, 0.2);
  padding-left: 8px;
}

.dock-control-button {
  width: v-bind('dockItemSize + "px"');
  height: v-bind('dockItemSize + "px"');
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: v-bind('(dockItemSize * 0.6) + "px"');
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(0, 85, 170, 0.3);
  transition: all 0.15s ease-out;
  user-select: none;
}

.dock-control-button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.dock-control-button:active {
  background: rgba(0, 85, 170, 0.2);
  transform: scale(0.95);
}

/* Drag preview styling */
.dock-item.dragging {
  opacity: 0.5;
}
</style>

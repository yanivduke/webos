<template>
  <div class="amiga-tab-bar">
    <div class="tab-list-container">
      <div
        class="tab-list"
        ref="tabListRef"
        @wheel="handleWheel"
      >
        <div
          v-for="(tab, index) in tabs"
          :key="tab.id"
          class="tab"
          :class="{
            active: tab.id === activeTabId,
            dragging: draggedTabId === tab.id
          }"
          :draggable="true"
          @click="handleTabClick(tab)"
          @mousedown="handleTabMouseDown(tab, $event)"
          @contextmenu.prevent="showTabContextMenu(tab, $event)"
          @dragstart="handleDragStart(tab, index, $event)"
          @dragover="handleDragOver(index, $event)"
          @drop="handleDrop(index, $event)"
          @dragend="handleDragEnd"
        >
          <div class="tab-icon">{{ tab.icon }}</div>
          <div class="tab-title">{{ truncateTitle(tab.title) }}</div>
          <div
            class="tab-close"
            @click.stop="handleCloseTab(tab)"
          >
            ×
          </div>
        </div>
      </div>
    </div>

    <div class="tab-actions">
      <div
        class="new-tab-button"
        @click="handleNewTab"
        title="New Tab (Ctrl+T)"
      >
        +
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
import { ref, computed } from 'vue';
import AmigaContextMenu, { type ContextMenuItem } from './AmigaContextMenu.vue';
import type { Tab } from '../composables/useWindowTabs';

interface Props {
  tabs: Tab[];
  activeTabId: string | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  tabClick: [tab: Tab];
  tabClose: [tab: Tab];
  tabReorder: [fromIndex: number, toIndex: number];
  tabTearOff: [tab: Tab, mouseX: number, mouseY: number];
  newTab: [];
  closeOtherTabs: [tab: Tab];
  closeTabsToRight: [tab: Tab];
}>();

// Refs
const tabListRef = ref<HTMLElement | null>(null);
const draggedTabId = ref<string | null>(null);
const draggedIndex = ref<number>(-1);

// Context menu state
const contextMenuVisible = ref(false);
const contextMenuX = ref(0);
const contextMenuY = ref(0);
const contextMenuTab = ref<Tab | null>(null);

// Tear-off state
const tearOffStartX = ref(0);
const tearOffStartY = ref(0);
const tearOffThreshold = 50; // pixels to drag before tearing off

const contextMenuItems = computed<ContextMenuItem[]>(() => {
  if (!contextMenuTab.value) return [];

  const tabIndex = props.tabs.findIndex(t => t.id === contextMenuTab.value?.id);
  const isLastTab = tabIndex === props.tabs.length - 1;
  const isOnlyTab = props.tabs.length === 1;

  return [
    { label: 'Close Tab', action: 'close', icon: '✕', disabled: isOnlyTab },
    { label: '', action: '', separator: true },
    { label: 'Close Other Tabs', action: 'close-others', icon: '⊗', disabled: isOnlyTab },
    { label: 'Close Tabs to Right', action: 'close-to-right', icon: '→✕', disabled: isLastTab || isOnlyTab },
    { label: '', action: '', separator: true },
    { label: 'New Tab', action: 'new-tab', icon: '+' },
    { label: '', action: '', separator: true },
    { label: 'Duplicate Tab', action: 'duplicate', icon: '⧉' }
  ];
});

const handleTabClick = (tab: Tab) => {
  emit('tabClick', tab);
};

const handleCloseTab = (tab: Tab) => {
  emit('tabClose', tab);
};

const handleNewTab = () => {
  emit('newTab');
};

const truncateTitle = (title: string, maxLength = 15): string => {
  if (title.length <= maxLength) return title;
  return title.substring(0, maxLength - 3) + '...';
};

// Horizontal scroll support
const handleWheel = (e: WheelEvent) => {
  if (!tabListRef.value) return;
  e.preventDefault();
  tabListRef.value.scrollLeft += e.deltaY;
};

// Drag and drop for tab reordering
const handleDragStart = (tab: Tab, index: number, e: DragEvent) => {
  draggedTabId.value = tab.id;
  draggedIndex.value = index;

  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', tab.id);
  }

  // Store initial mouse position for tear-off detection
  tearOffStartX.value = e.clientX;
  tearOffStartY.value = e.clientY;
};

const handleDragOver = (targetIndex: number, e: DragEvent) => {
  e.preventDefault();

  if (!e.dataTransfer) return;

  // Check if dragging far enough vertically for tear-off
  const deltaY = Math.abs(e.clientY - tearOffStartY.value);

  if (deltaY > tearOffThreshold) {
    e.dataTransfer.dropEffect = 'copy'; // Visual indicator for tear-off
  } else {
    e.dataTransfer.dropEffect = 'move';
  }
};

const handleDrop = (targetIndex: number, e: DragEvent) => {
  e.preventDefault();

  const deltaY = Math.abs(e.clientY - tearOffStartY.value);

  // Check if this is a tear-off (dragged far enough vertically)
  if (deltaY > tearOffThreshold && draggedIndex.value !== -1) {
    const tab = props.tabs[draggedIndex.value];
    if (tab) {
      emit('tabTearOff', tab, e.clientX, e.clientY);
    }
  } else if (draggedIndex.value !== -1 && draggedIndex.value !== targetIndex) {
    // Normal reorder within same window
    emit('tabReorder', draggedIndex.value, targetIndex);
  }

  draggedTabId.value = null;
  draggedIndex.value = -1;
};

const handleDragEnd = () => {
  draggedTabId.value = null;
  draggedIndex.value = -1;
};

// Tab mouse down for potential tear-off
const handleTabMouseDown = (tab: Tab, e: MouseEvent) => {
  tearOffStartX.value = e.clientX;
  tearOffStartY.value = e.clientY;
};

// Context menu
const showTabContextMenu = (tab: Tab, e: MouseEvent) => {
  contextMenuTab.value = tab;
  contextMenuX.value = e.clientX;
  contextMenuY.value = e.clientY;
  contextMenuVisible.value = true;
};

const handleContextAction = (action: string) => {
  if (!contextMenuTab.value) return;

  const tab = contextMenuTab.value;

  switch (action) {
    case 'close':
      emit('tabClose', tab);
      break;
    case 'close-others':
      emit('closeOtherTabs', tab);
      break;
    case 'close-to-right':
      emit('closeTabsToRight', tab);
      break;
    case 'new-tab':
      emit('newTab');
      break;
    case 'duplicate':
      // Handled by parent - emit a new tab with same data
      emit('newTab');
      break;
  }

  contextMenuVisible.value = false;
  contextMenuTab.value = null;
};
</script>

<style scoped>
.amiga-tab-bar {
  display: flex;
  background: linear-gradient(180deg, #d0d0d0 0%, #b0b0b0 100%);
  border-bottom: 2px solid #000000;
  height: 28px;
  user-select: none;
}

.tab-list-container {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.tab-list {
  display: flex;
  gap: 2px;
  padding: 2px 4px;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  height: 100%;
}

.tab-list::-webkit-scrollbar {
  display: none;
}

.tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  min-width: 120px;
  max-width: 200px;
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  cursor: pointer;
  transition: all 0.1s;
  flex-shrink: 0;
  position: relative;
}

.tab:hover {
  background: #b0b0b0;
}

.tab.active {
  background: #ffffff;
  border-color: #ffffff #808080 #808080 #ffffff;
  box-shadow: inset 0 0 4px rgba(0, 0, 0, 0.1);
}

.tab.dragging {
  opacity: 0.5;
  cursor: grabbing;
}

.tab-icon {
  font-size: 12px;
  flex-shrink: 0;
}

.tab-title {
  flex: 1;
  font-size: 8px;
  font-family: 'Press Start 2P', monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #000000;
}

.tab-close {
  width: 14px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #ff6600;
  border: 1px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  background: #a0a0a0;
  flex-shrink: 0;
  transition: all 0.1s;
}

.tab-close:hover {
  background: #ff6600;
  color: #ffffff;
  border-color: #000000 #ffffff #ffffff #000000;
}

.tab-actions {
  display: flex;
  align-items: center;
  padding: 2px 4px;
  border-left: 2px solid #808080;
}

.new-tab-button {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: bold;
  color: #0055aa;
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  cursor: pointer;
  transition: all 0.1s;
}

.new-tab-button:hover {
  background: #b0b0b0;
  transform: scale(1.05);
}

.new-tab-button:active {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}
</style>

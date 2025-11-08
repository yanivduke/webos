<template>
  <div class="amiga-desktop">
    <!-- Amiga Workbench Menu Bar -->
    <div class="workbench-menu">
      <div class="menu-left">
        <div
          class="menu-item"
          v-for="menu in menus"
          :key="menu.name"
          :class="{ active: activeMenu === menu.name }"
          @click="toggleMenu(menu.name)"
          @mouseenter="hoverMenu(menu.name)"
          @mouseleave="clearHover"
        >
          {{ menu.name }}

          <!-- Dropdown Menu -->
          <div v-if="activeMenu === menu.name" class="menu-dropdown" @click.stop>
            <div
              v-for="item in menu.items"
              :key="item"
              class="menu-dropdown-item"
              @click="handleMenuAction(menu.name, item)"
              :class="{ disabled: isMenuItemDisabled(menu.name, item) }"
            >
              {{ item }}
            </div>
          </div>
        </div>
      </div>
      <div class="menu-right">
        <div class="system-time">{{ currentTime }}</div>
        <div class="memory-indicator">Chip: {{ chipMem }} | Fast: {{ fastMem }}</div>
        <NotificationWidget @toggle="toggleNotificationCenter" />
      </div>
    </div>

    <!-- Desktop Background (Authentic Amiga gray) -->
    <div class="desktop-background" @click="handleDesktopClick" @contextmenu="showDesktopBackgroundContextMenu">
      <!-- Disk Icons on Desktop -->
      <div class="desktop-icons">
        <div
          class="disk-icon"
          v-for="disk in disks"
          :key="disk.id"
          :style="{
            left: `${getPosition(disk.id).x}px`,
            top: `${getPosition(disk.id).y}px`
          }"
          :class="{
            selected: isIconSelected(disk.id),
            hovered: isIconHovered(disk.id),
            active: isIconActive(disk.id),
            dragging: draggingIconId === disk.id
          }"
          @mousedown="startIconDrag(disk.id, $event)"
          @click="handleIconClick(disk.id, $event)"
          @dblclick="openDisk(disk)"
          @mouseenter="handleIconHover(disk.id, true)"
          @mouseleave="handleIconMouseLeave(disk.id)"
          @mouseover="showTooltip(disk.id, $event)"
          @contextmenu="showDesktopIconContextMenu(disk, $event)"
        >
          <div class="icon-image">
            <svg viewBox="0 0 64 64" class="disk-svg" :class="{ active: isIconActive(disk.id) }">
              <rect x="8" y="12" width="48" height="40" fill="#666" stroke="#000" stroke-width="2"/>
              <rect x="12" y="16" width="40" height="8" fill="#333"/>
              <circle cx="32" cy="36" r="8" fill="#888"/>
              <circle cx="32" cy="36" r="4" fill="#333"/>
              <rect x="16" y="20" width="8" height="2" fill="#0f0"/>
            </svg>
          </div>
          <div class="icon-label">{{ disk.name }}</div>
        </div>

        <!-- RAM Disk -->
        <div
          class="disk-icon"
          :style="{
            left: `${getPosition('ram').x}px`,
            top: `${getPosition('ram').y}px`
          }"
          :class="{
            selected: isIconSelected('ram'),
            hovered: isIconHovered('ram'),
            active: isIconActive('ram'),
            dragging: draggingIconId === 'ram'
          }"
          @mousedown="startIconDrag('ram', $event)"
          @click="handleIconClick('ram', $event)"
          @dblclick="openRAM"
          @mouseenter="handleIconHover('ram', true)"
          @mouseleave="handleIconHover('ram', false)"
          @mouseover="showTooltip('ram', $event)"
          @contextmenu="showDesktopIconContextMenu({ id: 'ram', name: 'RAM Disk', type: 'ram' }, $event)"
        >
          <div class="icon-image">
            <svg viewBox="0 0 64 64" class="ram-svg" :class="{ active: isIconActive('ram') }">
              <rect x="12" y="20" width="40" height="24" fill="#555" stroke="#000" stroke-width="2"/>
              <rect x="16" y="24" width="8" height="4" :fill="isIconActive('ram') ? '#0ff' : '#0f0'"/>
              <rect x="26" y="24" width="8" height="4" :fill="isIconActive('ram') ? '#0ff' : '#0f0'"/>
              <rect x="36" y="24" width="8" height="4" :fill="isIconActive('ram') ? '#0ff' : '#0f0'"/>
              <text x="32" y="38" text-anchor="middle" fill="#fff" font-size="8" font-family="Topaz">RAM</text>
            </svg>
          </div>
          <div class="icon-label">RAM Disk</div>
        </div>

        <!-- Utilities Drawer -->
        <div
          class="disk-icon"
          :style="{
            left: `${getPosition('utils').x}px`,
            top: `${getPosition('utils').y}px`
          }"
          :class="{
            selected: isIconSelected('utils'),
            hovered: isIconHovered('utils'),
            open: isIconOpen('utils'),
            active: isIconActive('utils'),
            dragging: draggingIconId === 'utils'
          }"
          @mousedown="startIconDrag('utils', $event)"
          @click="handleIconClick('utils', $event)"
          @dblclick="openUtilities"
          @mouseenter="handleIconHover('utils', true)"
          @mouseleave="handleIconHover('utils', false)"
          @mouseover="showTooltip('utils', $event)"
          @contextmenu="showDesktopIconContextMenu({ id: 'utils', name: 'Utilities', type: 'ram' }, $event)"
        >
          <div class="icon-image">
            <svg viewBox="0 0 64 64" class="drawer-svg" :class="{ open: isIconOpen('utils'), active: isIconActive('utils') }">
              <!-- Closed drawer -->
              <g v-if="!isIconOpen('utils')">
                <rect x="8" y="16" width="48" height="32" fill="#888" stroke="#000" stroke-width="2"/>
                <rect x="12" y="20" width="40" height="6" fill="#666"/>
                <rect x="12" y="28" width="40" height="6" fill="#666"/>
                <rect x="12" y="36" width="40" height="6" fill="#666"/>
                <rect x="44" y="22" width="4" height="2" fill="#333"/>
                <rect x="44" y="30" width="4" height="2" fill="#333"/>
                <rect x="44" y="38" width="4" height="2" fill="#333"/>
              </g>
              <!-- Open drawer -->
              <g v-else>
                <rect x="8" y="16" width="48" height="32" fill="#888" stroke="#000" stroke-width="2"/>
                <rect x="12" y="20" width="40" height="6" fill="#666" transform="translate(5, 2)"/>
                <rect x="12" y="28" width="40" height="6" fill="#666"/>
                <rect x="12" y="36" width="40" height="6" fill="#666"/>
                <rect x="49" y="22" width="4" height="2" fill="#333"/>
                <rect x="44" y="30" width="4" height="2" fill="#333"/>
                <rect x="44" y="38" width="4" height="2" fill="#333"/>
              </g>
            </svg>
          </div>
          <div class="icon-label">Utilities</div>
        </div>

        <!-- Trash Can -->
        <div
          class="disk-icon trash"
          :style="{
            left: `${getPosition('trash').x}px`,
            top: `${getPosition('trash').y}px`
          }"
          :class="{
            selected: isIconSelected('trash'),
            hovered: isIconHovered('trash'),
            full: trashItemCount > 0,
            active: isIconActive('trash'),
            dragging: draggingIconId === 'trash'
          }"
          @mousedown="startIconDrag('trash', $event)"
          @click="handleIconClick('trash', $event)"
          @dblclick="openTrash"
          @mouseenter="handleIconHover('trash', true)"
          @mouseleave="handleIconHover('trash', false)"
          @mouseover="showTooltip('trash', $event)"
          @contextmenu="showDesktopIconContextMenu({ id: 'trash', name: 'Trash', type: 'ram' }, $event)"
        >
          <div class="icon-image">
            <svg viewBox="0 0 64 64" class="trash-svg" :class="{ full: trashItemCount > 0, active: isIconActive('trash') }">
              <rect x="18" y="28" width="28" height="24" :fill="trashItemCount > 0 ? '#777' : '#666'" stroke="#000" stroke-width="2"/>
              <rect x="16" y="24" width="32" height="4" fill="#888" stroke="#000" stroke-width="2"/>
              <path d="M 24 18 L 24 24 M 32 18 L 32 24 M 40 18 L 40 24" stroke="#000" stroke-width="2" fill="none"/>
              <rect v-if="trashItemCount > 0" x="22" y="32" width="3" height="16" fill="#555"/>
              <rect v-if="trashItemCount > 0" x="30" y="32" width="3" height="16" fill="#555"/>
              <rect v-if="trashItemCount > 0" x="38" y="32" width="3" height="16" fill="#555"/>
              <rect v-if="trashItemCount === 0" x="22" y="32" width="3" height="16" fill="#444"/>
              <rect v-if="trashItemCount === 0" x="30" y="32" width="3" height="16" fill="#444"/>
              <rect v-if="trashItemCount === 0" x="38" y="32" width="3" height="16" fill="#444"/>
            </svg>
          </div>
          <div class="icon-label">Trash{{ trashItemCount > 0 ? ` (${trashItemCount})` : '' }}</div>
        </div>
      </div>

      <!-- Windows Container -->
      <div class="windows-container">
        <AmigaWindow
          v-for="window in openWindows"
          :key="window.id"
          :title="window.tabs ? (getActiveTab(window.id)?.title || window.title) : window.title"
          :x="window.x"
          :y="window.y"
          :width="window.width"
          :height="window.height"
          @close="closeWindow(window.id)"
          @minimize="handleDockMinimizeWindow(window.id)"
        >
          <!-- Tab Bar (if window has tabs) -->
          <template v-if="window.tabs && window.tabs.length > 0" #tab-bar>
            <AmigaTabBar
              :tabs="getWindowTabs(window.id)"
              :active-tab-id="window.activeTabId || null"
              @tab-click="(tab) => handleTabClick(window.id, tab)"
              @tab-close="(tab) => handleTabClose(window.id, tab)"
              @tab-reorder="(from, to) => handleTabReorder(window.id, from, to)"
              @tab-tear-off="(tab, x, y) => handleTabTearOff(window.id, tab, x, y)"
              @new-tab="handleNewTab(window.id)"
              @close-other-tabs="(tab) => handleCloseOtherTabs(window.id, tab)"
              @close-tabs-to-right="(tab) => handleCloseTabsToRight(window.id, tab)"
            />
          </template>

          <!-- Window content - either from active tab or single window content -->
          <component
            v-if="window.tabs && window.tabs.length > 0"
            :is="getActiveTab(window.id)?.component || window.component"
            :data="getActiveTab(window.id)?.data || window.data"
            @openFile="(path, item) => handleOpenFileInTab(window.id, path, item)"
            @openTool="handleOpenTool"
            @executeAwml="handleExecuteAwml"
            @editFile="handleEditFile"
            @quickView="handleQuickView"
          />
          <component
            v-else
            :is="window.component"
            :data="window.data"
            @openFile="(path, item) => handleOpenFileInTab(window.id, path, item)"
            @openTool="handleOpenTool"
            @executeAwml="handleExecuteAwml"
            @editFile="handleEditFile"
            @quickView="handleQuickView"
          />
        </AmigaWindow>
      </div>

      <!-- Widgets Container -->
      <div class="widgets-container">
        <AmigaWidget
          v-for="widget in widgets"
          :key="widget.id"
          :id="widget.id"
          :title="widget.title"
          :x="widget.x"
          :y="widget.y"
          @close="closeWidget"
          @updatePosition="updateWidgetPosition"
        >
          <component :is="widget.component" />
        </AmigaWidget>
      </div>
    </div>

    <!-- Amiga Workbench Footer Bar -->
    <div class="workbench-footer">
      <div class="footer-left">
        <span class="screen-depth">Screen: Workbench (640x256, 16 colors)</span>
      </div>
      <div class="footer-right">
        <span class="drive-activity" :class="{ active: driveActivity }">●</span>
        <span>{{ selectedCount }} items selected</span>
      </div>
    </div>

    <!-- Tooltip -->
    <AmigaTooltip
      :visible="tooltipVisible"
      :position="tooltipPosition"
      :metadata="tooltipMetadata"
    />

    <!-- Context Menu -->
    <AmigaContextMenu
      v-if="contextMenuVisible"
      :visible="contextMenuVisible"
      :x="contextMenuX"
      :y="contextMenuY"
      :items="contextMenuItems"
      @close="contextMenuVisible = false"
      @action="handleDesktopContextAction"
    />

    <!-- Quick View -->
    <AmigaQuickView />

    <!-- Dock -->
    <AmigaDock
      :open-windows="openWindows"
      @launch-app="handleDockLaunchApp"
      @focus-window="handleDockFocusWindow"
      @restore-window="handleDockRestoreWindow"
      @minimize-window="handleDockMinimizeWindow"
      @close-window="handleDockCloseWindow"
    />
    <!-- Global Search Bar -->
    <AmigaSearchBar
      :visible="searchBarVisible"
      @close="handleCloseSearch"
      @openFile="handleSearchOpenFile"
      @openFolder="handleSearchOpenFolder"
      @openApp="handleSearchOpenApp"
      @openWidget="handleSearchOpenWidget"
      @executeAction="handleSearchExecuteAction"
    />

    <!-- Notification Center -->
    <AmigaNotificationCenter
      :is-open="isNotificationCenterOpen"
      @close="isNotificationCenterOpen = false"
    />

    <!-- Toast Notifications -->
    <div class="notifications-toast-container">
      <AmigaNotification
        v-for="notification in activeNotifications"
        :key="notification.id"
        :notification="notification"
        @dismiss="() => {}"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import AmigaWindow from './AmigaWindow.vue';
import AmigaFolder from './AmigaFolder.vue';
import AmigaNotePad from './apps/AmigaNotePad.vue';
import AmigaPaint from './apps/AmigaPaint.vue';
import AmigaCalculator from './apps/AmigaCalculator.vue';
import AmigaShell from './apps/AmigaShell.vue';
import AmigaClock from './apps/AmigaClock.vue';
import AmigaMultiView from './apps/AmigaMultiView.vue';
import AmigaAwmlRunner from './apps/AmigaAwmlRunner.vue';
import AmigaAwmlWizard from './apps/AmigaAwmlWizard.vue';
import AmigaFileInfo from './apps/AmigaFileInfo.vue';
import AmigaPreferences from './apps/AmigaPreferences.vue';
import AmigaWidget from './widgets/AmigaWidget.vue';
import ThemeWidget from './widgets/ThemeWidget.vue';
import KeyboardShortcutsWidget from './widgets/KeyboardShortcutsWidget.vue';
import ClockGadget from './widgets/ClockGadget.vue';
import SystemMonitorGadget from './widgets/SystemMonitorGadget.vue';
import DiskUsageGadget from './widgets/DiskUsageGadget.vue';
import NetworkStatusGadget from './widgets/NetworkStatusGadget.vue';
import WorkspaceSwitcher from './widgets/WorkspaceSwitcher.vue';
import AmigaContextMenu, { type ContextMenuItem } from './AmigaContextMenu.vue';
import AmigaQuickView from './AmigaQuickView.vue';
import AmigaTooltip from './AmigaTooltip.vue';
import AmigaDock from './AmigaDock.vue';
import AmigaTabBar from './AmigaTabBar.vue';
import AmigaSearchBar from './AmigaSearchBar.vue';
import { useTheme } from '../composables/useTheme';
import { useIconStates } from '../composables/useIconStates';
import { useWindowSnapshots } from '../composables/useWindowSnapshots';
import { useTooltip, type FileMetadata, type TooltipPosition } from '../composables/useTooltip';
import { useQuickView, type QuickViewItem } from '../composables/useQuickView';
import { useGlobalKeyboardShortcuts, formatShortcut } from '../composables/useKeyboardShortcuts';
import { useSoundEffects } from '../composables/useSoundEffects';
import { useDock } from '../composables/useDock';
import { useWindowTabs } from '../composables/useWindowTabs';
import { useVirtualDesktops } from '../composables/useVirtualDesktops';
import { useIconPositions } from '../composables/useIconPositions';
import { useBackdrop } from '../composables/useBackdrop';
import { useNotifications } from '../composables/useNotifications';
import AmigaNotification from './AmigaNotification.vue';
import AmigaNotificationCenter from './AmigaNotificationCenter.vue';
import NotificationWidget from './widgets/NotificationWidget.vue';

interface Disk {
  id: string;
  name: string;
  type: 'floppy' | 'hard' | 'ram';
}

interface Window {
  id: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  component: any;
  data?: any;
  typeId?: string;
  tabs?: Tab[];
  activeTabId?: string;
}

interface Tab {
  id: string;
  title: string;
  component: any;
  data: any;
  icon: string;
  path?: string;
}

interface Menu {
  name: string;
  items: string[];
}

interface Widget {
  id: string;
  type: string;
  title: string;
  x: number;
  y: number;
  component: any;
}

// Initialize theme
const { currentTheme } = useTheme();

// Initialize dock
const { dockItems, addRunningWindow, removeRunningWindow, minimizeWindow, restoreWindow, isWindowMinimized } = useDock();

// Initialize icon states
const {
  selectIcon,
  clearSelection,
  setHovered,
  setOpen,
  setActive,
  isIconSelected,
  isIconHovered,
  isIconOpen,
  isIconActive,
  selectedIcons
} = useIconStates();

// Initialize tooltip
const { calculatePosition, formatDate, fetchMetadata } = useTooltip();

// Initialize sound effects
const { playSound } = useSoundEffects();

// Initialize keyboard shortcuts
const { registerShortcut, formatShortcut: formatShortcutKey } = useGlobalKeyboardShortcuts();

// Initialize Quick View
const { open: openQuickView } = useQuickView();

// Initialize Window Tabs
const {
  getWindowTabs,
  getActiveTab,
  initializeWindow,
  addTab,
  removeTab,
  setActiveTab,
  reorderTabs,
  moveTabToWindow,
  closeOtherTabs,
  closeTabsToRight,
  navigateTab,
  cleanupWindow
} = useWindowTabs();

// Initialize Virtual Desktops
const {
  workspaceState,
  getCurrentDesktop,
  switchToDesktop,
  updateWindows,
  updateIconPositions,
  updateBackdrop,
  addWindow: addWindowToDesktop,
  removeWindow: removeWindowFromDesktop
} = useVirtualDesktops();

// Initialize Icon Positions
const { getPosition, setPosition } = useIconPositions();

// Initialize Backdrop
const { setSettings: setBackdropSettings } = useBackdrop();

// Initialize Notifications
const { notify, activeNotifications } = useNotifications();

// Notification center state
const isNotificationCenterOpen = ref(false);

const toggleNotificationCenter = () => {
  isNotificationCenterOpen.value = !isNotificationCenterOpen.value;
};

// Tooltip state
const tooltipVisible = ref(false);
const tooltipPosition = ref<TooltipPosition>({ x: 0, y: 0 });
const tooltipMetadata = ref<FileMetadata | null>(null);
const tooltipHoverTimer = ref<number | null>(null);
const tooltipHoverItem = ref<string | null>(null);
// Search bar state
const searchBarVisible = ref(false);


// Track trash items
const trashItemCount = ref(0);

// Workbench Menu
const menus = ref<Menu[]>([
  { name: 'Workbench', items: ['About', 'Execute Command', 'Redraw All', 'Update', 'Quit'] },
  { name: 'Window', items: ['New Drawer', 'Open Parent', 'Close Window', 'Update', 'Select Contents', 'Clean Up', 'Snapshot'] },
  { name: 'Icons', items: ['Open', 'Copy', 'Rename', 'Information', 'Snapshot', 'Unsnapshot', 'Leave Out', 'Put Away', 'Delete', 'Format Disk'] },
  { name: 'Tools', items: ['Calculator', 'Clock', 'NotePad', 'Paint', 'MultiView', 'Shell', 'AWML Runner', 'AWML Wizard', 'Preferences'] },
  { name: 'Widgets', items: ['Theme Selector', 'Keyboard Shortcuts', 'Clock', 'System Monitor', 'Disk Usage', 'Network Status', 'Hide All Widgets'] },
  { name: 'Help', items: ['Keyboard Shortcuts', 'About'] }
]);

// System info
const currentTime = ref('12:00:00');
const chipMem = ref('512K');
const fastMem = ref('512K');
const driveActivity = ref(false);
const selectedCount = computed(() => selectedIcons.value.length);

// Disks
const disks = ref<Disk[]>([
  { id: 'df0', name: 'Workbench3.1', type: 'floppy' },
  { id: 'dh0', name: 'System', type: 'hard' },
  { id: 'dh1', name: 'Work', type: 'hard' }
]);

// Windows - Get windows from current desktop
const openWindows = computed({
  get: () => getCurrentDesktop().windows,
  set: (windows: Window[]) => updateWindows(windows)
});

// Widgets
const widgets = ref<Widget[]>([]);

// Menu state
const activeMenu = ref<string | null>(null);
const menuHoverTimeout = ref<number | null>(null);

// Context menu state
const contextMenuVisible = ref(false);
const contextMenuX = ref(0);
const contextMenuY = ref(0);
const contextMenuType = ref<'desktop' | 'icon' | null>(null);
const contextMenuTarget = ref<Disk | null>(null);

// Time update
let timeInterval: number | undefined;

onMounted(() => {
  updateTime();
  timeInterval = window.setInterval(updateTime, 1000);

  // Close menu when clicking outside
  document.addEventListener('click', closeMenuOnClickOutside);

  // Fetch trash item count
  fetchTrashItemCount();

  // Register keyboard shortcuts for workspace switching
  registerShortcut({
    key: '1',
    ctrl: true,
    description: 'Switch to Desktop 1',
    category: 'navigation',
    action: () => handleWorkspaceSwitch(1),
    global: true
  });

  registerShortcut({
    key: '2',
    ctrl: true,
    description: 'Switch to Desktop 2',
    category: 'navigation',
    action: () => handleWorkspaceSwitch(2),
    global: true
  });

  // Register global search shortcut (Ctrl+Space)
  registerShortcut({
    key: ' ',
    ctrl: true,
    description: 'Open Global Search',
    category: 'navigation',
    action: () => { searchBarVisible.value = true; },
    global: true,
    preventDefault: true
  });

  registerShortcut({
    key: '3',
    ctrl: true,
    description: 'Switch to Desktop 3',
    category: 'navigation',
    action: () => handleWorkspaceSwitch(3),
    global: true
  });

  registerShortcut({
    key: '4',
    ctrl: true,
    description: 'Switch to Desktop 4',
    category: 'navigation',
    action: () => handleWorkspaceSwitch(4),
    global: true
  });

  // Register tab keyboard shortcuts
  registerShortcut({
    key: 't',
    ctrl: true,
    description: 'New Tab in Active Window',
    category: 'tabs',
    action: () => {
      const activeWindow = openWindows.value[openWindows.value.length - 1];
      if (activeWindow) {
        handleNewTab(activeWindow.id);
      }
    },
    preventDefault: true
  });

  registerShortcut({
    key: 'w',
    ctrl: true,
    description: 'Close Active Tab',
    category: 'tabs',
    action: () => {
      const activeWindow = openWindows.value[openWindows.value.length - 1];
      if (activeWindow && activeWindow.tabs && activeWindow.tabs.length > 0) {
        const activeTab = getActiveTab(activeWindow.id);
        if (activeTab) {
          handleTabClose(activeWindow.id, activeTab);
        }
      }
    },
    preventDefault: true
  });

  registerShortcut({
    key: 'Tab',
    ctrl: true,
    description: 'Next Tab',
    category: 'tabs',
    action: () => {
      const activeWindow = openWindows.value[openWindows.value.length - 1];
      if (activeWindow && activeWindow.tabs && activeWindow.tabs.length > 1) {
        navigateTab(activeWindow.id, 'next');
        const newActiveTab = getActiveTab(activeWindow.id);
        if (newActiveTab) {
          activeWindow.activeTabId = newActiveTab.id;
        }
      }
    },
    preventDefault: true
  });

  registerShortcut({
    key: 'Tab',
    ctrl: true,
    shift: true,
    description: 'Previous Tab',
    category: 'tabs',
    action: () => {
      const activeWindow = openWindows.value[openWindows.value.length - 1];
      if (activeWindow && activeWindow.tabs && activeWindow.tabs.length > 1) {
        navigateTab(activeWindow.id, 'prev');
        const newActiveTab = getActiveTab(activeWindow.id);
        if (newActiveTab) {
          activeWindow.activeTabId = newActiveTab.id;
        }
      }
    },
    preventDefault: true
  });
});

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval);
  }
  document.removeEventListener('click', closeMenuOnClickOutside);
  hideTooltip();
});

const updateTime = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  currentTime.value = `${hours}:${minutes}:${seconds}`;
};

const fetchTrashItemCount = async () => {
  try {
    const response = await fetch('/api/files/list?path=trash');
    const data = await response.json();
    trashItemCount.value = data.items?.length || 0;
  } catch (error) {
    console.error('Failed to fetch trash items:', error);
    trashItemCount.value = 0;
  }
};

// Icon state handlers
const handleDesktopClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (target.classList.contains('desktop-background')) {
    clearSelection();
  }
};

const handleIconClick = (iconId: string, event: MouseEvent) => {
  event.stopPropagation();
  const multiSelect = event.ctrlKey || event.metaKey;
  selectIcon(iconId, multiSelect);
  playSound('click');
};

const handleIconHover = (iconId: string, isHovered: boolean) => {
  if (!isHovered) hideTooltip();
  setHovered(iconId, isHovered);
};

// Tooltip handlers
const showTooltip = async (iconId: string, event: MouseEvent) => {
  tooltipHoverItem.value = iconId;

  // Clear any existing timer
  if (tooltipHoverTimer.value) {
    clearTimeout(tooltipHoverTimer.value);
  }

  // Set timer for tooltip display (500ms delay)
  tooltipHoverTimer.value = window.setTimeout(async () => {
    // Fetch metadata
    const metadata = await fetchMetadata(iconId);
    if (metadata && tooltipHoverItem.value === iconId) {
      tooltipMetadata.value = metadata;

      // Calculate position - estimate tooltip size
      const estimatedWidth = 280;
      const estimatedHeight = 200;
      tooltipPosition.value = calculatePosition(
        event.clientX,
        event.clientY,
        estimatedWidth,
        estimatedHeight,
        { x: 15, y: 15 }
      );

      tooltipVisible.value = true;
    }
  }, 500);
};

const hideTooltip = () => {
  tooltipVisible.value = false;
  tooltipMetadata.value = null;
  tooltipHoverItem.value = null;

  if (tooltipHoverTimer.value) {
    clearTimeout(tooltipHoverTimer.value);
    tooltipHoverTimer.value = null;
  }
};

const toggleMenu = (menuName: string) => {
  const willOpen = activeMenu.value !== menuName;
  activeMenu.value = activeMenu.value === menuName ? null : menuName;
  if (willOpen) {
    playSound('menuOpen');
  }
};

const hoverMenu = (menuName: string) => {
  if (activeMenu.value && activeMenu.value !== menuName) {
    activeMenu.value = menuName;
  }
};

const clearHover = () => {
  // Keep menu open when hovering over dropdown
};

const closeMenuOnClickOutside = (event: Event) => {
  const target = event.target as HTMLElement;
  if (!target.closest('.menu-item')) {
    activeMenu.value = null;
  }
};

const isMenuItemDisabled = (menuName: string, item: string) => {
  // Disable certain items when no windows are open
  if (menuName === 'Window' && ['Close Window', 'Update', 'Clean Up'].includes(item)) {
    return openWindows.value.length === 0;
  }
  if (menuName === 'Icons' && ['Copy', 'Rename', 'Delete'].includes(item)) {
    return selectedCount.value === 0;
  }
  return false;
};

const handleMenuAction = (menuName: string, item: string) => {
  console.log(`Menu action: ${menuName} -> ${item}`);
  activeMenu.value = null; // Close menu after action

  switch (menuName) {
    case 'Workbench':
      handleWorkbenchAction(item);
      break;
    case 'Window':
      handleWindowAction(item);
      break;
    case 'Icons':
      handleIconsAction(item);
      break;
    case 'Tools':
      handleToolsAction(item);
      break;
    case 'Widgets':
      handleWidgetsAction(item);
      break;
    case 'Help':
      handleHelpAction(item);
      break;
  }
};

const handleWorkbenchAction = (action: string) => {
  switch (action) {
    case 'About':
      showAboutDialog();
      break;
    case 'Execute Command':
      handleOpenTool('Shell');
      break;
    case 'Redraw All':
      // Force re-render of desktop
      location.reload();
      break;
    case 'Update':
      updateSystemInfo();
      break;
    case 'Quit':
      if (confirm('Really quit Workbench?')) {
        window.close();
      }
      break;
  }
};

const handleWindowAction = (action: string) => {
  switch (action) {
    case 'New Drawer':
      createNewDrawer();
      break;
    case 'Close Window':
      if (openWindows.value.length > 0) {
        closeWindow(openWindows.value[openWindows.value.length - 1].id);
      }
      break;
    case 'Update':
      // Refresh current window
      if (openWindows.value.length > 0) {
        const currentWindow = openWindows.value[openWindows.value.length - 1];
        // Force re-render by removing and adding back
        const windowData = { ...currentWindow };
        closeWindow(currentWindow.id);
        setTimeout(() => {
          openWindows.value.push(windowData);
        }, 100);
      }
      break;
    case 'Clean Up':
      cleanUpWindows();
      break;
    default:
      break;
  }
};

const handleIconsAction = (action: string) => {
  switch (action) {
    case 'Open':
      openUtilities();
      break;
    case 'Information':
      showIconInformation();
      break;
    case 'Copy':
      copySelectedIcons();
      break;
    case 'Rename':
      renameSelectedIcon();
      break;
    case 'Delete':
      deleteSelectedIcons();
      break;
    default:
      break;
  }
};

const handleToolsAction = (action: string) => {
  handleOpenTool(action);
};

const showAboutDialog = () => {
  const aboutText = `WebOS v2.0.0
Amiga Workbench Style Interface

Built with Vue 3 + TypeScript
Server: Express.js with JSON persistence
Features: 8 working applications

© 2024 WebOS Project`;

  alert(aboutText);
};

const updateSystemInfo = async () => {
  try {
    const response = await fetch('/api/system/status');
    const data = await response.json();
    chipMem.value = data.memory?.chipMem || '512K';
    fastMem.value = data.memory?.fastMem || '512K';
    console.log('System info updated');
  } catch (error) {
    console.error('Failed to update system info:', error);
  }
};

const openDisk = (disk: Disk) => {
  // Set active state for animation
  setActive(disk.id, true);
  playSound('open');

  const newWindow: Window = {
    id: `window-${Date.now()}`,
    title: disk.name,
    x: 100 + openWindows.value.length * 30,
    y: 80 + openWindows.value.length * 30,
    width: 500,
    height: 350,
    component: AmigaFolder,
    data: disk,
    typeId: disk.id
  };
  openWindows.value.push(newWindow);
  driveActivity.value = true;
  setTimeout(() => driveActivity.value = false, 500);
};

const openRAM = () => {
  // Set active state for animation
  setActive('ram', true);
  playSound('open');

  const newWindow: Window = {
    id: `window-${Date.now()}`,
    title: 'RAM Disk',
    x: 120,
    y: 100,
    width: 480,
    height: 320,
    component: AmigaFolder,
    data: { id: 'ram', name: 'RAM Disk', type: 'ram' },
    typeId: 'ram'
  };
  openWindows.value.push(newWindow);
};

const openUtilities = () => {
  // Set active state for animation
  setActive('utils', true);
  playSound('open');

  const newWindow: Window = {
    id: `window-${Date.now()}`,
    title: 'Utilities',
    x: 140,
    y: 120,
    width: 520,
    height: 380,
    component: AmigaFolder,
    data: { id: 'utils', name: 'Utilities', type: 'drawer' },
    typeId: 'utils'
  };
  openWindows.value.push(newWindow);

  // Mark drawer as open
  setOpen('utils', true);
};

const openTrash = () => {
  // Set active state for animation
  setActive('trash', true);
  playSound('open');

  const newWindow: Window = {
    id: `window-${Date.now()}`,
    title: 'Trash',
    x: 160,
    y: 140,
    width: 450,
    height: 300,
    component: AmigaFolder,
    data: { id: 'trash', name: 'Trash', type: 'trash' },
    typeId: 'trash'
  };
  openWindows.value.push(newWindow);

  // Mark trash as open
  setOpen('trash', true);
};

const handleOpenFile = (filePath: string, fileMeta: { name?: string; [key: string]: any }) => {
  const fileName = fileMeta?.name || filePath.split('/').pop() || 'Unknown';
  const lowerName = fileName.toLowerCase();
  console.log('Opening file:', filePath, fileName);

  let config;
  let data;

  if (lowerName.endsWith('.txt') || lowerName.endsWith('.text') || lowerName.endsWith('.doc')) {
    // Open text files directly in NotePad legacy component (not AWML app)
    config = {
      title: `NotePad - ${fileName}`,
      width: 600,
      height: 450,
      component: AmigaNotePad,
      baseX: 150,
      baseY: 100
    };
    data = { filePath, fileName };
  } else if (lowerName.endsWith('.awml')) {
    // AWML files should open in file info viewer by default (not execute)
    config = {
      title: `Info - ${fileName}`,
      width: 420,
      height: 320,
      component: AmigaFileInfo,
      baseX: 160,
      baseY: 120
    };
    data = { filePath, meta: fileMeta };
  } else {
    // All other files open in info viewer
    config = {
      title: `Info - ${fileName}`,
      width: 420,
      height: 320,
      component: AmigaFileInfo,
      baseX: 160,
      baseY: 120
    };
    data = { filePath, meta: fileMeta };
  }

  openWindows.value.push(createWindow(config, data));
};

// Tool configurations for window creation - Updated to use AWML platform
const toolConfigs = {
  'NotePad': {
    title: 'NotePad',
    width: 600,
    height: 450,
    component: AmigaAwmlRunner,
    baseX: 150,
    baseY: 100,
    awmlPath: 'dh0/System/Applications/NotePad.awml'
  },
  'Calculator': {
    title: 'Calculator',
    width: 350,
    height: 420,
    component: AmigaAwmlRunner,
    baseX: 200,
    baseY: 120,
    awmlPath: 'dh0/System/Applications/Calculator.awml'
  },
  'Shell': {
    title: 'AmigaShell',
    width: 650,
    height: 450,
    component: AmigaAwmlRunner,
    baseX: 170,
    baseY: 110,
    awmlPath: 'dh0/System/Applications/Shell.awml'
  },
  'Clock': {
    title: 'Clock',
    width: 400,
    height: 320,
    component: AmigaAwmlRunner,
    baseX: 220,
    baseY: 130,
    awmlPath: 'dh0/System/Applications/Clock.awml'
  },
  'Paint': {
    title: 'Paint',
    width: 700,
    height: 550,
    component: AmigaAwmlRunner,
    baseX: 160,
    baseY: 90,
    awmlPath: 'dh0/System/Applications/Paint.awml'
  },
  'MultiView': {
    title: 'MultiView',
    width: 600,
    height: 450,
    component: AmigaMultiView,
    baseX: 160,
    baseY: 90
  },
  'AWML Runner': {
    title: 'AWML Runner',
    width: 640,
    height: 480,
    component: AmigaAwmlRunner,
    baseX: 180,
    baseY: 110
  },
  'AWML Wizard': {
    title: 'AWML Wizard',
    width: 600,
    height: 500,
    component: AmigaAwmlWizard,
    baseX: 200,
    baseY: 130
  }
};

const createWindow = (config: any, data = {}) => {
  const offset = openWindows.value.length * 20;

  // If this is an AWML app, prepare AWML-specific data
  let windowData = data;
  if (config.awmlPath) {
    windowData = {
      ...data,
      filePath: config.awmlPath,
      meta: {
        name: config.title,
        type: 'awml',
        ...data.meta
      }
    };
  }

  return {
    id: `window-${Date.now()}`,
    title: config.title,
    x: config.baseX + offset,
    y: config.baseY + offset,
    width: config.width,
    height: config.height,
    component: config.component,
    data: windowData
  };
};

const handleOpenTool = (toolName: string) => {
  console.log('Opening tool:', toolName);

  if (toolName === 'Preferences') {
    openPreferences();
    return;
  }

  const config = toolConfigs[toolName as keyof typeof toolConfigs];
  if (config) {
    playSound('open');
    openWindows.value.push(createWindow(config));
  } else {
    console.log(`Tool "${toolName}" not found in toolConfigs`);
  }
};

const handleExecuteAwml = (filePath: string) => {
  console.log('Executing AWML:', filePath);
  const fileName = filePath.split('/').pop() || 'AWML App';
  const config = {
    title: `${fileName}`,
    width: 640,
    height: 480,
    component: AmigaAwmlRunner,
    baseX: 160,
    baseY: 120
  };
  const data = {
    filePath,
    meta: { name: fileName, type: 'awml' }
  };
  openWindows.value.push(createWindow(config, data));
};

const handleEditFile = (filePath: string) => {
  console.log('Editing file:', filePath);
  const fileName = filePath.split('/').pop() || 'File';
  const config = {
    title: `NotePad - ${fileName}`,
    width: 600,
    height: 450,
    component: AmigaNotePad,
    baseX: 150,
    baseY: 100
  };
  const data = { filePath, fileName };
  openWindows.value.push(createWindow(config, data));
};

// Preferences
const openPreferences = () => {
  playSound('open');
  const newWindow: Window = {
    id: `window-${Date.now()}`,
    title: 'Preferences',
    x: 200,
    y: 150,
    width: 600,
    height: 450,
    component: AmigaPreferences,
    data: {}
  };
  openWindows.value.push(newWindow);
};

// Window management functions
const createNewDrawer = async () => {
  const name = prompt('Enter new drawer name:');
  if (!name) return;

  try {
    const response = await fetch('/api/files/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: `dh0/${name}`,
        type: 'folder'
      })
    });

    if (response.ok) {
      alert(`Drawer "${name}" created successfully!`);
      // Refresh dh0 if open
    } else {
      alert('Failed to create drawer');
    }
  } catch (error) {
    console.error('Error creating drawer:', error);
    alert('Error creating drawer');
  }
};

const cleanUpWindows = () => {
  // Arrange windows in a cascade
  openWindows.value.forEach((window, index) => {
    window.x = 100 + index * 30;
    window.y = 80 + index * 30;
  });
};

// Icon management functions
const showIconInformation = () => {
  if (selectedCount.value === 0) {
    alert('No icons selected');
    return;
  }
  alert(`${selectedCount.value} icon(s) selected\n\nSelect an icon on the desktop and use this option to view its properties.`);
};

const copySelectedIcons = () => {
  if (selectedCount.value === 0) {
    alert('No icons selected');
    return;
  }
  alert(`Copy functionality: ${selectedCount.value} icon(s) would be copied to clipboard.`);
};

const renameSelectedIcon = async () => {
  if (selectedCount.value === 0) {
    alert('No icons selected');
    return;
  }
  if (selectedCount.value > 1) {
    alert('Please select only one icon to rename');
    return;
  }

  const newName = prompt('Enter new name:');
  if (newName) {
    alert(`Icon would be renamed to: ${newName}`);
  }
};

const deleteSelectedIcons = async () => {
  if (selectedCount.value === 0) {
    alert('No icons selected');
    return;
  }

  if (confirm(`Delete ${selectedCount.value} icon(s)?`)) {
    alert(`${selectedCount.value} icon(s) would be moved to trash.`);
    // Update selected count after deletion
    clearSelection();
  }
};

const closeWindow = (windowId: string) => {
  const index = openWindows.value.findIndex(w => w.id === windowId);
  if (index !== -1) {
    const window = openWindows.value[index];
    playSound('close');

    // Mark drawers as closed when window closes
    if (window.data?.id === 'utils') {
      setOpen('utils', false);
    } else if (window.data?.id === 'trash') {
      setOpen('trash', false);
      // Refresh trash count when closing trash window
      fetchTrashItemCount();
    }

    // Remove from dock if it was there
    removeRunningWindow(windowId, window.typeId || 'unknown');
    
    // Clean up tab state
    cleanupWindow(windowId);

    openWindows.value.splice(index, 1);
  }
};

// Dock event handlers
const handleDockLaunchApp = (appId: string) => {
  const appMap: { [key: string]: string } = {
    'workbench': 'df0',
    'system': 'dh0',
    'shell': 'Shell',
    'calculator': 'Calculator',
    'paint': 'Paint',
    'notepad': 'NotePad',
    'utilities': 'utils'
  };

  const target = appMap[appId];
  if (!target) return;

  // Check if already open
  const existingWindow = openWindows.value.find(w => {
    if (appId === 'workbench' || appId === 'system' || appId === 'utilities') {
      return w.typeId === target || (w.data?.id === target);
    }
    return w.title === target;
  });

  if (existingWindow) {
    // Bring to front
    const index = openWindows.value.findIndex(w => w.id === existingWindow.id);
    if (index !== -1) {
      // Move to end (highest z-index)
      const window = openWindows.value.splice(index, 1)[0];
      openWindows.value.push(window);
    }
  } else {
    // Launch app
    switch (appId) {
      case 'workbench':
        openDisk(disks.value[0]);
        break;
      case 'system':
        openDisk(disks.value[1]);
        break;
      case 'utilities':
        openUtilities();
        break;
      case 'shell':
      case 'calculator':
      case 'paint':
      case 'notepad':
        handleOpenTool(target);
        break;
    }
  }
};

const handleDockFocusWindow = (windowId: string) => {
  const index = openWindows.value.findIndex(w => w.id === windowId);
  if (index !== -1) {
    // Move to end (highest z-index)
    const window = openWindows.value.splice(index, 1)[0];
    openWindows.value.push(window);
    playSound('click');
  }
};

const handleDockRestoreWindow = (windowId: string) => {
  const windowData = restoreWindow(windowId);
  if (windowData) {
    // Add window back to openWindows
    openWindows.value.push(windowData);
    playSound('open');
  }
};

const handleDockMinimizeWindow = (windowId: string) => {
  const index = openWindows.value.findIndex(w => w.id === windowId);
  if (index !== -1) {
    const windowData = openWindows.value.splice(index, 1)[0];
    minimizeWindow(windowId, windowData);
    playSound('close');
  }
};

const handleDockCloseWindow = (windowId: string) => {
  closeWindow(windowId);
};

// Workspace switching handler
const handleWorkspaceSwitch = (desktopId: number) => {
  const success = switchToDesktop(desktopId);
  if (success) {
    playSound('click');
    // Update backdrop when switching desktops
    const desktop = getCurrentDesktop();
    if (desktop) {
      setBackdropSettings(desktop.backdrop);
    }
  }
};

// Widget management functions
const handleWidgetsAction = (action: string) => {
  switch (action) {
    case 'Theme Selector':
      toggleThemeWidget();
      break;
    case 'Workspace Switcher':
      toggleWorkspaceSwitcherWidget();
      break;
    case 'Hide All Widgets':
    case 'Keyboard Shortcuts':
      toggleKeyboardShortcutsWidget();
      break;
    case 'Clock':
      toggleClockWidget();
      break;
    case 'System Monitor':
      toggleSystemMonitorWidget();
      break;
    case 'Disk Usage':
      toggleDiskUsageWidget();
      break;
    case 'Network Status':
      toggleNetworkStatusWidget();
      break;
      widgets.value = [];
      break;
  }
};

const toggleThemeWidget = () => {
  const existingWidget = widgets.value.find(w => w.type === 'theme');
  if (existingWidget) {
    closeWidget(existingWidget.id);
  } else {
    const newWidget: Widget = {
      id: `widget-${Date.now()}`,
      type: 'theme',
      title: 'Theme',
      x: window.innerWidth - 280,
      y: 80,
      component: ThemeWidget
    };
    widgets.value.push(newWidget);
  }
};

const toggleKeyboardShortcutsWidget = () => {
  const existingWidget = widgets.value.find(w => w.type === 'keyboard-shortcuts');
  if (existingWidget) {
    closeWidget(existingWidget.id);
  } else {
    const newWidget: Widget = {
      id: `widget-${Date.now()}`,
      type: 'keyboard-shortcuts',
      title: 'Keyboard Shortcuts',
      x: window.innerWidth - 420,
      y: 80,
      component: KeyboardShortcutsWidget
    };
    widgets.value.push(newWidget);
  }
};

const toggleClockWidget = () => {
  const existingWidget = widgets.value.find(w => w.type === 'clock');
  if (existingWidget) {
    closeWidget(existingWidget.id);
  } else {
    const newWidget: Widget = {
      id: `widget-${Date.now()}`,
      type: 'clock',
      title: 'Clock',
      x: window.innerWidth - 280,
      y: 200,
      component: ClockGadget
    };
    widgets.value.push(newWidget);
  }
};

const toggleSystemMonitorWidget = () => {
  const existingWidget = widgets.value.find(w => w.type === 'system-monitor');
  if (existingWidget) {
    closeWidget(existingWidget.id);
  } else {
    const newWidget: Widget = {
      id: `widget-${Date.now()}`,
      type: 'system-monitor',
      title: 'System Monitor',
      x: window.innerWidth - 280,
      y: 320,
      component: SystemMonitorGadget
    };
    widgets.value.push(newWidget);
  }
};

const toggleDiskUsageWidget = () => {
  const existingWidget = widgets.value.find(w => w.type === 'disk-usage');
  if (existingWidget) {
    closeWidget(existingWidget.id);
  } else {
    const newWidget: Widget = {
      id: `widget-${Date.now()}`,
      type: 'disk-usage',
      title: 'Disk Usage',
      x: 20,
      y: 80,
      component: DiskUsageGadget
    };
    widgets.value.push(newWidget);
  }
};

const toggleNetworkStatusWidget = () => {
  const existingWidget = widgets.value.find(w => w.type === 'network-status');
  if (existingWidget) {
    closeWidget(existingWidget.id);
  } else {
    const newWidget: Widget = {
      id: `widget-${Date.now()}`,
      type: 'network-status',
      title: 'Network Status',
      x: 20,
      y: 400,
      component: NetworkStatusGadget
    };
    widgets.value.push(newWidget);
  }
};

const closeWidget = (widgetId: string) => {
  const index = widgets.value.findIndex(w => w.id === widgetId);
  if (index !== -1) {
    widgets.value.splice(index, 1);
  }
};

const updateWidgetPosition = (widgetId: string, x: number, y: number) => {
  const widget = widgets.value.find(w => w.id === widgetId);
  if (widget) {
    widget.x = x;
    widget.y = y;
  }
};

// Context menu functionality
const contextMenuItems = computed<ContextMenuItem[]>(() => {
  if (contextMenuType.value === 'icon' && contextMenuTarget.value) {
    // Menu for desktop icons
    return [
      { label: 'Open', action: 'open', icon: '▶' },
      { label: '', action: '', separator: true },
      { label: 'Information', action: 'information', icon: 'ℹ' },
      { label: '', action: '', separator: true },
      { label: 'Copy', action: 'copy', icon: '📋' },
      { label: 'Rename', action: 'rename', icon: '✏' },
      { label: 'Delete', action: 'delete', icon: '🗑' },
      { label: '', action: '', separator: true },
      { label: 'Snapshot', action: 'snapshot', icon: '📌' }
    ];
  } else if (contextMenuType.value === 'desktop') {
    // Menu for desktop background
    return [
      { label: 'New Drawer', action: 'new-drawer', icon: '📁' },
      { label: '', action: '', separator: true },
      { label: 'Clean Up', action: 'clean-up', icon: '🧹' },
      { label: 'Refresh', action: 'refresh', icon: '🔄' },
      { label: '', action: '', separator: true },
      { label: 'Snapshot All Icons', action: 'snapshot-all', icon: '📌' }
    ];
  }
  return [];
});

const showDesktopIconContextMenu = (disk: Disk, event: MouseEvent) => {
  event.preventDefault();
  event.stopPropagation();
  contextMenuType.value = 'icon';
  contextMenuTarget.value = disk;
  contextMenuX.value = event.clientX;
  contextMenuY.value = event.clientY;
  contextMenuVisible.value = true;
};

const showDesktopBackgroundContextMenu = (event: MouseEvent) => {
  event.preventDefault();
  contextMenuType.value = 'desktop';
  contextMenuTarget.value = null;
  contextMenuX.value = event.clientX;
  contextMenuY.value = event.clientY;
  contextMenuVisible.value = true;
};

const handleDesktopContextAction = async (action: string) => {
  contextMenuVisible.value = false;

  if (contextMenuType.value === 'icon' && contextMenuTarget.value) {
    const disk = contextMenuTarget.value;
    switch (action) {
      case 'open':
        if (disk.id === 'ram') {
          openRAM();
        } else if (disk.id === 'utils') {
          openUtilities();
        } else if (disk.id === 'trash') {
          openTrash();
        } else {
          openDisk(disk);
        }
        break;
      case 'information':
        showDiskInfo(disk);
        break;
      case 'copy':
        alert(`Copy "${disk.name}" - Feature coming soon!`);
        break;
      case 'rename':
        await renameDisk(disk);
        break;
      case 'delete':
        await deleteDisk(disk);
        break;
      case 'snapshot':
        alert(`Snapshot position of "${disk.name}" - Feature coming soon!`);
        break;
    }
  } else if (contextMenuType.value === 'desktop') {
    switch (action) {
      case 'new-drawer':
        createNewDrawer();
        break;
      case 'clean-up':
        alert('Clean up icons - Feature coming soon!');
        break;
      case 'refresh':
        location.reload();
        break;
      case 'snapshot-all':
        alert('Snapshot all icon positions - Feature coming soon!');
        break;
    }
  }

  contextMenuType.value = null;
  contextMenuTarget.value = null;
};

const showDiskInfo = (disk: Disk) => {
  const info = `Name: ${disk.name}
Type: ${disk.type === 'floppy' ? 'Floppy Disk' : disk.type === 'hard' ? 'Hard Drive' : 'RAM Disk'}
ID: ${disk.id}
Status: Mounted`;
  alert(info);
};

const renameDisk = async (disk: Disk) => {
  const newName = prompt(`Rename "${disk.name}" to:`, disk.name);
  if (newName && newName !== disk.name) {
    // Find and update the disk
    const diskIndex = disks.value.findIndex(d => d.id === disk.id);
    if (diskIndex !== -1) {
      disks.value[diskIndex].name = newName;
      alert(`Disk renamed to "${newName}"`);
    }
  }
};

const deleteDisk = async (disk: Disk) => {
  if (confirm(`Delete "${disk.name}"? This will move it to the trash.`)) {
    // Remove from disks array
    const diskIndex = disks.value.findIndex(d => d.id === disk.id);
    if (diskIndex !== -1) {
      disks.value.splice(diskIndex, 1);
      alert(`"${disk.name}" moved to trash`);
    }
  }
};
// Tab management handlers
const handleTabClick = (windowId: string, tab: Tab) => {
  const window = openWindows.value.find(w => w.id === windowId);
  if (!window) return;

  setActiveTab(windowId, tab.id);
  window.activeTabId = tab.id;
};

const handleTabClose = (windowId: string, tab: Tab) => {
  const shouldCloseWindow = removeTab(windowId, tab.id);

  if (shouldCloseWindow) {
    closeWindow(windowId);
  } else {
    const window = openWindows.value.find(w => w.id === windowId);
    if (window) {
      const activeTab = getActiveTab(windowId);
      if (activeTab) {
        window.activeTabId = activeTab.id;
        window.title = activeTab.title;
      }
    }
  }
};

const handleTabReorder = (windowId: string, fromIndex: number, toIndex: number) => {
  reorderTabs(windowId, fromIndex, toIndex);
};

const handleTabTearOff = (windowId: string, tab: Tab, mouseX: number, mouseY: number) => {
  // Remove tab from current window
  const shouldCloseWindow = removeTab(windowId, tab.id);

  // Create new window with this tab
  const newWindow: Window = {
    id: `window-${Date.now()}`,
    title: tab.title,
    x: mouseX - 100,
    y: mouseY - 20,
    width: 500,
    height: 350,
    component: tab.component,
    data: tab.data
  };

  openWindows.value.push(newWindow);
  playSound('open');

  // Close original window if no tabs left
  if (shouldCloseWindow) {
    closeWindow(windowId);
  }
};

const handleNewTab = (windowId: string) => {
  const window = openWindows.value.find(w => w.id === windowId);
  if (!window) return;

  // Create a new folder tab in the same window
  const newTab: Tab = {
    id: `tab-${Date.now()}`,
    title: 'System',
    component: AmigaFolder,
    data: { id: 'dh0', name: 'System', type: 'hard' },
    icon: '📁',
    path: 'dh0'
  };

  // Initialize window tabs if this is the first time
  if (!window.tabs || window.tabs.length === 0) {
    // Convert existing window to tabbed window
    const initialTab: Tab = {
      id: `tab-${Date.now() - 1}`,
      title: window.title,
      component: window.component,
      data: window.data,
      icon: '📁',
      path: window.data?.id
    };

    initializeWindow(windowId, initialTab);
    window.tabs = [initialTab];
    window.activeTabId = initialTab.id;
  }

  // Add the new tab
  addTab(windowId, newTab, true);
  window.tabs!.push(newTab);
  window.activeTabId = newTab.id;

  playSound('click');
};

const handleCloseOtherTabs = (windowId: string, tab: Tab) => {
  closeOtherTabs(windowId, tab.id);

  const window = openWindows.value.find(w => w.id === windowId);
  if (window && window.tabs) {
    window.tabs = window.tabs.filter(t => t.id === tab.id);
    window.activeTabId = tab.id;
  }
};

const handleCloseTabsToRight = (windowId: string, tab: Tab) => {
  const window = openWindows.value.find(w => w.id === windowId);
  if (!window || !window.tabs) return;

  const tabIndex = window.tabs.findIndex(t => t.id === tab.id);
  if (tabIndex === -1) return;

  closeTabsToRight(windowId, tab.id);
  window.tabs = window.tabs.slice(0, tabIndex + 1);

  // Ensure active tab is still valid
  if (window.activeTabId && !window.tabs.find(t => t.id === window.activeTabId)) {
    window.activeTabId = tab.id;
  }
};

const handleOpenFileInTab = (windowId: string, filePath: string, fileMeta: any) => {
  const window = openWindows.value.find(w => w.id === windowId);
  if (!window) {
    // If no window, open in new window instead
    handleOpenFile(filePath, fileMeta);
    return;
  }

  const fileName = fileMeta?.name || filePath.split('/').pop() || 'Unknown';
  const lowerName = fileName.toLowerCase();

  // Determine component and icon based on file type
  let component = AmigaFileInfo;
  let icon = '📄';

  if (lowerName.endsWith('.txt') || lowerName.endsWith('.text') || lowerName.endsWith('.doc')) {
    component = AmigaNotePad;
    icon = '📝';
  } else if (lowerName.endsWith('.awml')) {
    component = AmigaAwmlRunner;
    icon = '⚙';
  }

  // Create new tab
  const newTab: Tab = {
    id: `tab-${Date.now()}`,
    title: fileName,
    component: component,
    data: { filePath, fileName, meta: fileMeta },
    icon: icon,
    path: filePath
  };

  // Initialize window tabs if this is the first time
  if (!window.tabs || window.tabs.length === 0) {
    // Convert existing window to tabbed window
    const initialTab: Tab = {
      id: `tab-${Date.now() - 1}`,
      title: window.title,
      component: window.component,
      data: window.data,
      icon: '📁',
      path: window.data?.id
    };

    initializeWindow(windowId, initialTab);
    window.tabs = [initialTab];
    window.activeTabId = initialTab.id;
  }

  // Check if tab with same path already exists
  const existingTab = window.tabs.find(t => t.path === filePath);
  if (existingTab) {
    // Just activate the existing tab
    setActiveTab(windowId, existingTab.id);
    window.activeTabId = existingTab.id;
    return;
  }

  // Add new tab
  addTab(windowId, newTab, true);
  window.tabs.push(newTab);
  window.activeTabId = newTab.id;

  playSound('click');
};

// Search bar handlers
const handleCloseSearch = () => {
  searchBarVisible.value = false;
};

const handleSearchOpenFile = (path: string, meta: any) => {
  handleOpenFile(path, meta);
  searchBarVisible.value = false;
};

const handleSearchOpenFolder = (path: string) => {
  // Parse the path to determine which disk/folder to open
  const parts = path.split('/');
  const diskId = parts[0];
  
  if (diskId === 'ram') {
    openRAM();
  } else if (diskId === 'trash') {
    openTrash();
  } else if (diskId === 'utils') {
    openUtilities();
  } else {
    // Find disk and open it
    const disk = disks.value.find(d => d.id === diskId);
    if (disk) {
      openDisk(disk);
    }
  }
  
  searchBarVisible.value = false;
};

const handleSearchOpenApp = (appName: string) => {
  handleOpenTool(appName);
  searchBarVisible.value = false;
};

const handleSearchOpenWidget = (widgetName: string) => {
  handleWidgetsAction(widgetName);
  searchBarVisible.value = false;
};

const handleSearchExecuteAction = (actionName: string, menuName?: string) => {
  // Execute menu actions based on which menu they belong to
  if (menuName) {
    handleMenuAction(menuName, actionName);
  }
  searchBarVisible.value = false;
};
</script>

<style scoped>
/* Authentic Amiga Workbench Styling */
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

.amiga-desktop {
  height: 100vh;
  display: flex;
  flex-direction: column;
  font-family: 'Press Start 2P', 'Courier New', monospace;
  background: var(--theme-background);
  overflow: hidden;
  transition: background-color 0.3s ease;
}

/* Workbench Menu Bar */
.workbench-menu {
  display: flex;
  justify-content: space-between;
  background: var(--theme-menuBackground);
  border-bottom: 2px solid var(--theme-borderDark);
  padding: 4px 8px;
  font-size: 11px;
  box-shadow: inset -1px -1px 0 var(--theme-border), inset 1px 1px 0 var(--theme-borderLight);
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.menu-left {
  display: flex;
  gap: 20px;
}

.menu-item {
  position: relative;
  cursor: pointer;
  padding: 2px 8px;
  color: var(--theme-menuText);
  transition: all 0.1s;
  user-select: none;
}

.menu-item:hover,
.menu-item.active {
  background: var(--theme-highlight);
  color: var(--theme-highlightText);
}

/* Menu Dropdown */
.menu-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  background: var(--theme-background);
  border: 2px solid;
  border-color: var(--theme-borderLight) var(--theme-borderDark) var(--theme-borderDark) var(--theme-borderLight);
  box-shadow: 2px 2px 4px var(--theme-shadow);
  z-index: 1000;
  min-width: 180px;
  font-size: 11px;
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.menu-dropdown-item {
  padding: 4px 12px;
  cursor: pointer;
  color: var(--theme-text);
  background: var(--theme-background);
  border-bottom: 1px solid var(--theme-border);
  transition: all 0.1s;
  white-space: nowrap;
}

.menu-dropdown-item:last-child {
  border-bottom: none;
}

.menu-dropdown-item:hover:not(.disabled) {
  background: var(--theme-highlight);
  color: var(--theme-highlightText);
}

.menu-dropdown-item.disabled {
  color: var(--theme-border);
  cursor: not-allowed;
}

.menu-right {
  display: flex;
  gap: 20px;
  align-items: center;
  color: var(--theme-menuText);
  font-size: 9px;
}

.system-time {
  font-weight: bold;
}

.memory-indicator {
  color: var(--theme-highlight);
}

/* Desktop Background */
.desktop-background {
  flex: 1;
  position: relative;
  background: var(--theme-background);
  overflow: hidden;
  padding: 20px;
  transition: background-color 0.3s ease;
}

/* Desktop Icons */
.desktop-icons {
  display: flex;
  flex-direction: column;
  gap: 30px;
  width: 100px;
}

.disk-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  user-select: none;
  padding: 8px;
  border-radius: 4px;
  transition: all 0.15s ease;
}

.disk-icon:hover {
  background: rgba(0, 85, 170, 0.1);
}

.disk-icon.selected {
  background: var(--theme-highlight);
  border: 2px solid var(--theme-highlightText);
  box-shadow: 0 0 8px rgba(0, 85, 170, 0.5);
}

.disk-icon.active .icon-image {
  animation: iconPulse 0.5s ease-in-out;
}

@keyframes iconPulse {
  0%, 100% {
    transform: scale(1);
    filter: brightness(1);
  }
  50% {
    transform: scale(1.1);
    filter: brightness(1.3);
  }
}

@keyframes drawerOpen {
  from {
    transform: translateY(-2px);
  }
  to {
    transform: translateY(0);
  }
}

.icon-image {
  width: 64px;
  height: 64px;
  margin-bottom: 4px;
  transition: transform 0.15s ease;
}

.disk-icon.hovered .icon-image {
  transform: scale(1.05);
}

.disk-svg,
.ram-svg,
.drawer-svg,
.trash-svg {
  width: 100%;
  height: 100%;
  filter: drop-shadow(2px 2px 0px rgba(0, 0, 0, 0.3));
  transition: filter 0.15s ease;
}

.disk-svg.active,
.ram-svg.active,
.drawer-svg.active,
.trash-svg.active {
  filter: drop-shadow(0 0 8px #0ff) drop-shadow(2px 2px 0px rgba(0, 0, 0, 0.3));
}

.icon-label {
  font-size: 9px;
  color: var(--theme-text);
  text-align: center;
  text-shadow:
    -1px -1px 0 var(--theme-borderLight),
    1px -1px 0 var(--theme-borderLight),
    -1px 1px 0 var(--theme-borderLight),
    1px 1px 0 var(--theme-borderLight);
  max-width: 80px;
  word-wrap: break-word;
  transition: color 0.15s ease;
}

.disk-icon.selected .icon-label {
  color: var(--theme-highlightText);
  text-shadow:
    -1px -1px 0 var(--theme-highlight),
    1px -1px 0 var(--theme-highlight),
    -1px 1px 0 var(--theme-highlight),
    1px 1px 0 var(--theme-highlight);
}

/* Windows Container */
.windows-container {
  position: absolute;
  top: 20px;
  left: 120px;
  right: 20px;
  bottom: 20px;
  pointer-events: none;
}

.windows-container > * {
  pointer-events: all;
}

/* Workbench Footer Bar */
.workbench-footer {
  display: flex;
  justify-content: space-between;
  background: var(--theme-menuBackground);
  border-top: 2px solid var(--theme-borderDark);
  padding: 4px 12px;
  font-size: 9px;
  color: var(--theme-menuText);
  box-shadow: inset -1px 1px 0 var(--theme-border), inset 1px -1px 0 var(--theme-borderLight);
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.footer-left {
  display: flex;
  gap: 15px;
}

.footer-right {
  display: flex;
  gap: 15px;
  align-items: center;
}

.screen-depth {
  color: var(--theme-highlight);
  font-weight: bold;
}

.drive-activity {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #555555;
  transition: all 0.2s;
}

.drive-activity.active {
  background: #ff0000;
  box-shadow: 0 0 8px #ff0000;
  animation: pulse 0.5s ease-in-out;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Retro scanline effect (optional) */
.desktop-background::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.03) 0px,
    transparent 1px,
    transparent 2px,
    rgba(0, 0, 0, 0.03) 3px
  );
  pointer-events: none;
  opacity: 0.5;
}

/* Classic Amiga button style */
.amiga-button {
  background: var(--theme-background);
  border: 2px solid;
  border-color: var(--theme-borderLight) var(--theme-borderDark) var(--theme-borderDark) var(--theme-borderLight);
  padding: 4px 12px;
  font-size: 10px;
  cursor: pointer;
  color: var(--theme-text);
  font-family: 'Press Start 2P', monospace;
  transition: all 0.1s;
}

.amiga-button:active {
  border-color: var(--theme-borderDark) var(--theme-borderLight) var(--theme-borderLight) var(--theme-borderDark);
  background: var(--theme-border);
}

/* Widgets Container */
.widgets-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 800;
}

.widgets-container > * {
  pointer-events: all;
}

/* Notifications Toast Container */
.notifications-toast-container {
  position: fixed;
  top: 40px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
}

.notifications-toast-container > * {
  pointer-events: all;
}
</style>

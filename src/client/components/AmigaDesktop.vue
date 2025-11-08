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
        <div v-if="hasClipboardItems" class="clipboard-indicator" @click="handleOpenTool('Clipboard')" title="Clipboard has items">
          📋
        </div>
        <AmigaWorkspaceSwitcher @openManager="handleOpenTool('Workspace Manager')" />
        <div class="system-time">{{ currentTime }}</div>
        <div class="memory-indicator">Chip: {{ chipMem }} | Fast: {{ fastMem }}</div>
      </div>
    </div>

    <!-- Desktop Background (Authentic Amiga gray) -->
    <div
      class="desktop-background"
      @dragover="handleDesktopDragOver"
      @dragleave="handleDesktopDragLeave"
      @drop="handleDesktopDrop"
    >
      <!-- Drop Overlay -->
      <div v-if="isDraggingFiles" class="drop-overlay">
        <div class="drop-message">
          <div class="drop-icon">📁</div>
          <div class="drop-text">Drop files here to upload</div>
          <div class="drop-subtext">Files will be uploaded to default location</div>
        </div>
      </div>

      <!-- Disk Icons on Desktop -->
      <div class="desktop-icons">
        <div class="disk-icon" v-for="disk in disks" :key="disk.id" @dblclick="openDisk(disk)">
          <div class="icon-image">
            <svg viewBox="0 0 64 64" class="disk-svg">
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
        <div class="disk-icon" @dblclick="openRAM">
          <div class="icon-image">
            <svg viewBox="0 0 64 64" class="ram-svg">
              <rect x="12" y="20" width="40" height="24" fill="#555" stroke="#000" stroke-width="2"/>
              <rect x="16" y="24" width="8" height="4" fill="#0f0"/>
              <rect x="26" y="24" width="8" height="4" fill="#0f0"/>
              <rect x="36" y="24" width="8" height="4" fill="#0f0"/>
              <text x="32" y="38" text-anchor="middle" fill="#fff" font-size="8" font-family="Topaz">RAM</text>
            </svg>
          </div>
          <div class="icon-label">RAM Disk</div>
        </div>

        <!-- Utilities Drawer -->
        <div class="disk-icon" @dblclick="openUtilities">
          <div class="icon-image">
            <svg viewBox="0 0 64 64" class="drawer-svg">
              <rect x="8" y="16" width="48" height="32" fill="#888" stroke="#000" stroke-width="2"/>
              <rect x="12" y="20" width="40" height="6" fill="#666"/>
              <rect x="12" y="28" width="40" height="6" fill="#666"/>
              <rect x="12" y="36" width="40" height="6" fill="#666"/>
              <rect x="44" y="22" width="4" height="2" fill="#333"/>
              <rect x="44" y="30" width="4" height="2" fill="#333"/>
              <rect x="44" y="38" width="4" height="2" fill="#333"/>
            </svg>
          </div>
          <div class="icon-label">Utilities</div>
        </div>

        <!-- Trash Can -->
        <div class="disk-icon trash" @dblclick="openTrash">
          <div class="icon-image">
            <svg viewBox="0 0 64 64" class="trash-svg">
              <rect x="18" y="28" width="28" height="24" fill="#666" stroke="#000" stroke-width="2"/>
              <rect x="16" y="24" width="32" height="4" fill="#888" stroke="#000" stroke-width="2"/>
              <path d="M 24 18 L 24 24 M 32 18 L 32 24 M 40 18 L 40 24" stroke="#000" stroke-width="2" fill="none"/>
              <rect x="22" y="32" width="3" height="16" fill="#444"/>
              <rect x="30" y="32" width="3" height="16" fill="#444"/>
              <rect x="38" y="32" width="3" height="16" fill="#444"/>
            </svg>
          </div>
          <div class="icon-label">Trash</div>
        </div>
        <!-- Search Files -->
        <div class="disk-icon search" @dblclick="openSearch">
          <div class="icon-image">
            <svg viewBox="0 0 64 64" class="search-svg">
              <circle cx="26" cy="26" r="14" fill="#0055aa" stroke="#000" stroke-width="2"/>
              <circle cx="26" cy="26" r="9" fill="#ffffff" stroke="#000" stroke-width="2"/>
              <line x1="36" y1="36" x2="50" y2="50" stroke="#000" stroke-width="4" stroke-linecap="round"/>
              <line x1="36" y1="36" x2="50" y2="50" stroke="#666" stroke-width="3" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="icon-label">Search  </div>
        <!-- System Monitor -->
        <div class="disk-icon sysmon" @dblclick="openSystemMonitor">
          <div class="icon-image">
            <svg viewBox="0 0 64 64" class="sysmon-svg">
              <rect x="8" y="12" width="48" height="40" fill="#0055aa" stroke="#000" stroke-width="2"/>
              <rect x="12" y="16" width="40" height="32" fill="#000" stroke="#fff" stroke-width="1"/>
              <!-- Bar chart inside -->
              <rect x="16" y="38" width="6" height="8" fill="#00ff00"/>
              <rect x="24" y="32" width="6" height="14" fill="#ffaa00"/>
              <rect x="32" y="28" width="6" height="18" fill="#ff6600"/>
              <rect x="40" y="24" width="6" height="22" fill="#ff0000"/>
              <!-- Top text -->
              <text x="32" y="24" text-anchor="middle" fill="#00ff00" font-size="6" font-family="monospace">SYS</text>
            </svg>
          </div>
          <div class="icon-label">Monitor</div>
        </div>
        <!-- Task Manager -->
        <div class="disk-icon taskmgr" @dblclick="openTaskManager">
          <div class="icon-image">
            <svg viewBox="0 0 64 64" class="taskmgr-svg">
              <rect x="8" y="12" width="48" height="40" fill="#888" stroke="#000" stroke-width="2"/>
              <rect x="12" y="16" width="40" height="6" fill="#0055aa"/>
              <rect x="12" y="24" width="40" height="2" fill="#fff"/>
              <rect x="12" y="28" width="40" height="2" fill="#fff"/>
              <rect x="12" y="32" width="40" height="2" fill="#fff"/>
              <rect x="12" y="36" width="40" height="2" fill="#fff"/>
              <rect x="12" y="40" width="40" height="2" fill="#fff"/>
              <text x="32" y="20" text-anchor="middle" fill="#fff" font-size="5" font-family="monospace">TASKS</text>
            </svg>
          </div>
          <div class="icon-label">Tasks</div>
        </div>
        <!-- Screen Capture -->
        <div class="disk-icon capture" @dblclick="openScreenCapture">
          <div class="icon-image">
            <svg viewBox="0 0 64 64" class="capture-svg">
              <rect x="8" y="16" width="48" height="32" fill="#666" stroke="#000" stroke-width="2"/>
              <circle cx="32" cy="32" r="12" fill="#333"/>
              <circle cx="32" cy="32" r="8" fill="#888"/>
              <circle cx="32" cy="32" r="4" fill="#000"/>
              <rect x="48" y="20" width="4" height="4" fill="#ff0000"/>
              <circle cx="32" cy="32" r="2" fill="#ffffff" opacity="0.5"/>
            </svg>
          </div>
          <div class="icon-label">Capture</div>
        <!-- Archiver -->
        <div class="disk-icon archiver" @dblclick="openArchiver">
          <div class="icon-image">
            <svg viewBox="0 0 64 64" class="archiver-svg">
              <rect x="12" y="10" width="40" height="44" fill="#ffaa00" stroke="#000" stroke-width="2"/>
              <rect x="16" y="14" width="32" height="36" fill="#ff8800" stroke="#000" stroke-width="1"/>
              <!-- Zipper effect -->
              <line x1="32" y1="14" x2="32" y2="50" stroke="#333" stroke-width="2"/>
              <rect x="30" y="16" width="4" height="3" fill="#666"/>
              <rect x="30" y="21" width="4" height="3" fill="#666"/>
              <rect x="30" y="26" width="4" height="3" fill="#666"/>
              <rect x="30" y="31" width="4" height="3" fill="#666"/>
              <rect x="30" y="36" width="4" height="3" fill="#666"/>
              <rect x="30" y="41" width="4" height="3" fill="#666"/>
              <rect x="30" y="46" width="4" height="3" fill="#666"/>
              <text x="32" y="60" text-anchor="middle" fill="#000" font-size="6" font-family="monospace">ZIP</text>
            </svg>
          </div>
          <div class="icon-label">Archiver</div>
        </div>
        <!-- Plugin Manager -->
        <div class="disk-icon plugins" @dblclick="handleOpenTool('Plugin Manager')">
          <div class="icon-image">
            <svg viewBox="0 0 64 64" class="plugins-svg">
              <!-- Puzzle piece -->
              <path d="M 18 18 L 18 28 L 14 28 L 14 36 L 18 36 L 18 46 L 28 46 L 28 50 L 36 50 L 36 46 L 46 46 L 46 36 L 50 36 L 50 28 L 46 28 L 46 18 Z" fill="#8b5cf6" stroke="#000" stroke-width="2"/>
              <circle cx="16" cy="32" r="3" fill="#6b48c6"/>
              <circle cx="32" cy="48" r="3" fill="#6b48c6"/>
              <circle cx="48" cy="32" r="3" fill="#6b48c6"/>
              <!-- Inner detail -->
              <rect x="24" y="24" width="16" height="16" fill="#a78bfa" stroke="#000" stroke-width="1" opacity="0.6"/>
              <text x="32" y="60" text-anchor="middle" fill="#000" font-size="6" font-family="monospace">PLG</text>
            </svg>
          </div>
          <div class="icon-label">Plugins</div>
        </div>
        </div>
        </div>
      </div>

      <!-- Windows Container -->
      <div class="windows-container">
        <AmigaWindow
          v-for="window in openWindows"
          :key="window.id"
          :title="window.title"
          :x="window.x"
          :y="window.y"
          :width="window.width"
          :height="window.height"
          @close="closeWindow(window.id)"
        >
          <component
            :is="window.component"
            :data="window.data"
            @openFile="handleOpenFile"
            @openTool="handleOpenTool"
            @executeAwml="handleExecuteAwml"
            @editFile="handleEditFile"
            @openFolder="handleOpenFolder"
          />
        </AmigaWindow>
      </div>
    </div>

    <!-- Upload Progress Widget -->
    <AmigaUploadProgress />
    
    <!-- Duplicate File Dialog -->
    <AmigaDuplicateDialog
      :visible="duplicateDialogVisible"
      :fileName="duplicateFileName"
      @select="handleDuplicateSelect"
      @cancel="handleDuplicateCancel"
    />

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
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue';
import AmigaWindow from './AmigaWindow.vue';
import AmigaFolder from './AmigaFolder.vue';
import AmigaNotePad from './apps/AmigaNotePad.vue';
import AmigaCodeEditor from './apps/AmigaCodeEditor.vue';
import AmigaMultiView from './apps/AmigaMultiView.vue';
import AmigaAwmlRunner from './apps/AmigaAwmlRunner.vue';
import AmigaAwmlWizard from './apps/AmigaAwmlWizard.vue';
import AmigaFileInfo from './apps/AmigaFileInfo.vue';
import AmigaPreferences from './apps/AmigaPreferences.vue';
import AmigaSearch from './apps/AmigaSearch.vue';
import AmigaSysMonitor from './apps/AmigaSysMonitor.vue';
import AmigaClipboard from './apps/AmigaClipboard.vue';
import AmigaArchiver from './apps/AmigaArchiver.vue';
import AmigaTaskManager from './apps/AmigaTaskManager.vue';
import AmigaWorkspaceSwitcher from './AmigaWorkspaceSwitcher.vue';
import AmigaWorkspaceManager from './apps/AmigaWorkspaceManager.vue';
import AmigaScreenCapture from './apps/AmigaScreenCapture.vue';
import AmigaUploadProgress from './AmigaUploadProgress.vue';
import AmigaDuplicateDialog from './AmigaDuplicateDialog.vue';
import AmigaPluginManager from './apps/AmigaPluginManager.vue';
import advancedClipboard from '../utils/clipboard-manager';
import workspaceManager from '../utils/workspace-manager';
import { screenCapture } from '../utils/screen-capture';
import dragDropManager from '../utils/drag-drop-manager';
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
}

interface Menu {
  name: string;
  items: string[];
}

// Workbench Menu
const menus = ref<Menu[]>([
  { name: 'Workbench', items: ['About', 'Execute Command', 'Redraw All', 'Update', 'Quit'] },
  { name: 'Window', items: ['New Drawer', 'Open Parent', 'Close Window', 'Update', 'Select Contents', 'Clean Up', 'Snapshot'] },
  { name: 'Icons', items: ['Open', 'Copy', 'Rename', 'Information', 'Snapshot', 'Unsnapshot', 'Leave Out', 'Put Away', 'Delete', 'Format Disk'] },
  { name: 'Tools', items: ['Search Files', 'Calculator', 'Clock', 'NotePad', 'Code Editor', 'Paint', 'MultiView', 'Shell', 'System Monitor', 'Task Manager', 'Clipboard', 'Screen Capture', 'Archiver', 'Workspace Manager', 'Plugin Manager', 'AWML Runner', 'AWML Wizard', 'Preferences'] }
]);

// System info
const currentTime = ref('12:00:00');
const chipMem = ref('512K');
const fastMem = ref('512K');
const driveActivity = ref(false);
const selectedCount = ref(0);
const hasClipboardItems = ref(false);

// Drag-and-drop state
const isDraggingFiles = ref(false);
let dragLeaveTimeout: number | null = null;

// Duplicate dialog state
const duplicateDialogVisible = ref(false);
const duplicateFileName = ref('');
let duplicateResolve: ((action: 'overwrite' | 'keep-both' | 'skip') => void) | null = null;

// Disks
const disks = ref<Disk[]>([
  { id: 'df0', name: 'Workbench3.1', type: 'floppy' },
  { id: 'dh0', name: 'System', type: 'hard' },
  { id: 'dh1', name: 'Work', type: 'hard' }
]);

// Windows
const openWindows = ref<Window[]>([]);

// Menu state
const activeMenu = ref<string | null>(null);

// Time update
let timeInterval: number | undefined;

onMounted(() => {
  updateTime();
  timeInterval = window.setInterval(updateTime, 1000);

  // Close menu when clicking outside
  document.addEventListener('click', closeMenuOnClickOutside);

  // Add global keyboard shortcuts
  document.addEventListener('keydown', handleGlobalKeyDown);

  // Set up drag-drop manager duplicate callback
  dragDropManager.onDuplicateDetected(async (_item, existingFile) => {
    return new Promise((resolve) => {
      duplicateFileName.value = existingFile;
      duplicateDialogVisible.value = true;
      duplicateResolve = resolve;
    });
  });

  // Subscribe to clipboard changes
  advancedClipboard.subscribe(() => {
    hasClipboardItems.value = advancedClipboard.hasItems();
  });

  // Initial clipboard check
  hasClipboardItems.value = advancedClipboard.hasItems();

  // Load windows from current workspace
  openWindows.value = workspaceManager.getCurrentWindows();

  // Subscribe to workspace changes
  workspaceManager.subscribe(() => {
    // Save current windows before switching
    workspaceManager.setCurrentWindows(openWindows.value);

    // Load windows from new workspace
    openWindows.value = workspaceManager.getCurrentWindows();
  });

  // Save windows periodically (in case of crashes)
  setInterval(() => {
    workspaceManager.setCurrentWindows(openWindows.value);
  }, 5000);
});

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval);
  }
  document.removeEventListener('click', closeMenuOnClickOutside);
  document.removeEventListener('keydown', handleGlobalKeyDown);
});

const updateTime = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  currentTime.value = `${hours}:${minutes}:${seconds}`;
};

const toggleMenu = (menuName: string) => {
  activeMenu.value = activeMenu.value === menuName ? null : menuName;
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
          addWindow(windowData);
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

const handleGlobalKeyDown = async (event: KeyboardEvent) => {
  const isCtrlOrCmd = event.ctrlKey || event.metaKey;
  const isAlt = event.altKey;

  // Ctrl+Shift+V to open clipboard manager
  if (isCtrlOrCmd && event.shiftKey && event.key.toLowerCase() === 'v') {
    event.preventDefault();
    handleOpenTool('Clipboard');
  }

  // Ctrl+Shift+F to open search
  if (isCtrlOrCmd && event.shiftKey && event.key === 'F') {
    event.preventDefault();
    openSearch();
  }

  // Ctrl+Alt+Delete to open task manager
  if (isCtrlOrCmd && isAlt && event.key === 'Delete') {
    event.preventDefault();
    handleOpenTool('Task Manager');
  }

  // Screenshot shortcuts
  // PrintScreen: Full desktop screenshot
  if (event.key === 'PrintScreen' && !isCtrlOrCmd && !isAlt) {
    event.preventDefault();
    await quickScreenshot('full-desktop');
  }

  // Alt+PrintScreen: Active window screenshot
  if (event.key === 'PrintScreen' && isAlt && !isCtrlOrCmd) {
    event.preventDefault();
    await quickScreenshot('active-window');
  }

  // Ctrl+PrintScreen: Area selection (currently defaults to full desktop)
  if (event.key === 'PrintScreen' && isCtrlOrCmd && !isAlt) {
    event.preventDefault();
    await quickScreenshot('area');
  }
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
  const newWindow: Window = {
    id: `window-${Date.now()}`,
    title: disk.name,
    x: 100 + openWindows.value.length * 30,
    y: 80 + openWindows.value.length * 30,
    width: 500,
    height: 350,
    component: AmigaFolder,
    data: disk
  };
  addWindow(newWindow);
  driveActivity.value = true;
  setTimeout(() => driveActivity.value = false, 500);
};

const openRAM = () => {
  const newWindow: Window = {
    id: `window-${Date.now()}`,
    title: 'RAM Disk',
    x: 120,
    y: 100,
    width: 480,
    height: 320,
    component: AmigaFolder,
    data: { id: 'ram', name: 'RAM Disk', type: 'ram' }
  };
  addWindow(newWindow);
};

const openUtilities = () => {
  const newWindow: Window = {
    id: `window-${Date.now()}`,
    title: 'Utilities',
    x: 140,
    y: 120,
    width: 520,
    height: 380,
    component: AmigaFolder,
    data: { id: 'utils', name: 'Utilities', type: 'drawer' }
  };
  addWindow(newWindow);
};

const openTrash = () => {
  const newWindow: Window = {
    id: `window-${Date.now()}`,
    title: 'Trash',
    x: 160,
    y: 140,
    width: 450,
    height: 300,
    component: AmigaFolder,
    data: { id: 'trash', name: 'Trash', type: 'trash' }
  };
  addWindow(newWindow);
};

const handleOpenFile = (filePath: string, fileMeta: { name?: string; [key: string]: any }) => {
  const fileName = fileMeta?.name || filePath.split('/').pop() || 'Unknown';
  const lowerName = fileName.toLowerCase();
  console.log('Opening file:', filePath, fileName);

  let config;
  let data;

  // Code file extensions that should open in Code Editor
  const codeExtensions = ['.js', '.ts', '.jsx', '.tsx', '.html', '.htm', '.css', '.scss', '.sass', '.less',
                          '.json', '.md', '.markdown', '.py', '.java', '.cpp', '.c', '.h', '.hpp',
                          '.xml', '.yaml', '.yml', '.sh', '.bash', '.sql', '.php', '.rb', '.go', '.rs'];

  const isCodeFile = codeExtensions.some(ext => lowerName.endsWith(ext));

  if (isCodeFile) {
    // Open code files in Code Editor
    config = {
      title: `Code Editor - ${fileName}`,
      width: 900,
      height: 650,
      component: AmigaCodeEditor,
      baseX: 120,
      baseY: 80
    };
    data = { filePath, fileName };
  } else if (lowerName.endsWith('.txt') || lowerName.endsWith('.text') || lowerName.endsWith('.doc')) {
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

  addWindow(createWindow(config, data));
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
  'Code Editor': {
    title: 'Code Editor',
    width: 900,
    height: 650,
    component: AmigaCodeEditor,
    baseX: 120,
    baseY: 80
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
  },
  'System Monitor': {
    title: 'System Monitor',
    width: 700,
    height: 550,
    component: AmigaSysMonitor,
    baseX: 150,
    baseY: 80
  },
  'Task Manager': {
    title: 'Task Manager',
    width: 750,
    height: 600,
    component: AmigaTaskManager,
    baseX: 140,
    baseY: 70
  },
  'Clipboard': {
    title: 'Clipboard Manager',
    width: 580,
    height: 450,
    component: AmigaClipboard,
    baseX: 180,
    baseY: 120
  },
  'Archiver': {
    title: 'Archiver',
    width: 800,
    height: 600,
    component: AmigaArchiver,
    baseX: 130,
    baseY: 70
  },
  'Workspace Manager': {
    title: 'Workspace Manager',
    width: 700,
    height: 600,
    component: AmigaWorkspaceManager,
    baseX: 150,
    baseY: 70
  },
  'Plugin Manager': {
    title: 'Plugin Manager',
    width: 800,
    height: 650,
    component: AmigaPluginManager,
    baseX: 130,
    baseY: 60
  },
  'Screen Capture': {
    title: 'Screen Capture',
    width: 700,
    height: 600,
    component: AmigaScreenCapture,
    baseX: 150,
    baseY: 80
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
        ...(data as any).meta
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
    addWindow(createWindow(config));
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
  addWindow(createWindow(config, data));
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
  addWindow(createWindow(config, data));
};

// Preferences
const openPreferences = () => {
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
  addWindow(newWindow);
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
    selectedCount.value = 0;
  }
};

// Helper to add window and sync with workspace manager
const addWindow = (window: Window) => {
  openWindows.value.push(window);
  workspaceManager.setCurrentWindows(openWindows.value);
};

const closeWindow = (windowId: string) => {
  const index = openWindows.value.findIndex(w => w.id === windowId);
  if (index !== -1) {
    openWindows.value.splice(index, 1);
    // Update workspace manager
    workspaceManager.setCurrentWindows(openWindows.value);
  }
};


// Open Task Manager
const openTaskManager = () => {
  const newWindow: Window = {
    id: `window-${Date.now()}`,
    title: 'Task Manager',
    x: 140,
    y: 70,
    width: 750,
    height: 600,
    component: AmigaTaskManager,
    data: {}
  };
  addWindow(newWindow);
};

// Open System Monitor
const openSystemMonitor = () => {
  const newWindow: Window = {
    id: `window-${Date.now()}`,
    title: 'System Monitor',
    x: 150,
    y: 80,
    width: 700,
    height: 550,
    component: AmigaSysMonitor,
    data: {}
  };
  addWindow(newWindow);
};

// Open search window
const openSearch = () => {
  const newWindow: Window = {
    id: `window-${Date.now()}`,
    title: 'Search Files',
    x: 180,
    y: 100,
    width: 600,
    height: 500,
    component: AmigaSearch,
    data: {}
  };
  addWindow(newWindow);
};

// Handle opening folder from search
const handleOpenFolder = (folderPath: string) => {
  const pathParts = folderPath.split('/');
  const diskId = pathParts[0];
  const diskName = disks.value.find(d => d.id === diskId)?.name || diskId;

  const newWindow: Window = {
    id: `window-${Date.now()}`,
    title: diskName,
    x: 100 + openWindows.value.length * 30,
    y: 80 + openWindows.value.length * 30,
    width: 500,
    height: 350,
    component: AmigaFolder,
    data: { id: folderPath, name: diskName, type: 'folder' }
  };
  addWindow(newWindow);
};

// Open screen capture window
const openScreenCapture = () => {
  const newWindow: Window = {
    id: `window-${Date.now()}`,
    title: 'Screen Capture',
    x: 150,
    y: 80,
    width: 700,
    height: 600,
    component: AmigaScreenCapture,
    data: {}
  };
  addWindow(newWindow);
};

// Quick screenshot function for keyboard shortcuts
const quickScreenshot = async (mode: 'full-desktop' | 'active-window' | 'area' = 'full-desktop') => {
  try {
    const result = await screenCapture.takeScreenshot({
      mode,
      format: 'png',
      countdown: 0
    });
    if (result) {
      try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `screenshot-${timestamp}.png`;
        await screenCapture.saveToFiles(result, filename);
        console.log(`Screenshot saved: ${filename}`);
        // Could show a toast notification here
      } catch (error) {
        console.error('Failed to auto-save screenshot:', error);
      }
    }
  } catch (error) {
    console.error('Quick screenshot failed:', error);
  }
};

// Open archiver window
const openArchiver = () => {
  const newWindow: Window = {
    id: `window-${Date.now()}`,
    title: 'Archiver',
    x: 130,
    y: 70,
    width: 800,
    height: 600,
    component: AmigaArchiver,
    data: {}
  };
  addWindow(newWindow);
};

// Drag-and-drop file upload handlers
const handleDesktopDragOver = (event: DragEvent) => {
  // Only handle file drops, not internal drag operations
  if (event.dataTransfer?.types.includes('Files')) {
    event.preventDefault();
    event.stopPropagation();

    if (dragLeaveTimeout) {
      clearTimeout(dragLeaveTimeout);
      dragLeaveTimeout = null;
    }

    isDraggingFiles.value = true;

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }
};

const handleDesktopDragLeave = (_event: DragEvent) => {
  // Use timeout to prevent flickering when dragging over child elements
  if (dragLeaveTimeout) {
    clearTimeout(dragLeaveTimeout);
  }

  dragLeaveTimeout = window.setTimeout(() => {
    isDraggingFiles.value = false;
  }, 100);
};

const handleDesktopDrop = async (event: DragEvent) => {
  event.preventDefault();
  event.stopPropagation();

  if (dragLeaveTimeout) {
    clearTimeout(dragLeaveTimeout);
    dragLeaveTimeout = null;
  }

  isDraggingFiles.value = false;

  if (!event.dataTransfer?.files) return;

  const files = Array.from(event.dataTransfer.files);
  if (files.length === 0) return;

  // Upload to default location (dh0)
  const defaultPath = 'dh0';

  console.log(`Uploading ${files.length} file(s) to ${defaultPath}`);

  try {
    await dragDropManager.addFiles(files, defaultPath);
  } catch (error) {
    console.error('Failed to add files to upload queue:', error);
    alert('Failed to start upload');
  }
};

// Duplicate dialog handlers
const handleDuplicateSelect = (action: 'overwrite' | 'keep-both' | 'skip', remember: boolean) => {
  if (remember) {
    dragDropManager.setDuplicatePreference(action, true);
  }

  if (duplicateResolve) {
    duplicateResolve(action);
    duplicateResolve = null;
  }

  duplicateDialogVisible.value = false;
};

const handleDuplicateCancel = () => {
  if (duplicateResolve) {
    duplicateResolve('skip');
    duplicateResolve = null;
  }

  duplicateDialogVisible.value = false;
  dragDropManager.cancelAll();
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
  background: #a0a0a0; /* Authentic Amiga gray */
  overflow: hidden;
}

/* Workbench Menu Bar */
.workbench-menu {
  display: flex;
  justify-content: space-between;
  background: #ffffff;
  border-bottom: 2px solid #000000;
  padding: 4px 8px;
  font-size: 11px;
  box-shadow: inset -1px -1px 0 #808080, inset 1px 1px 0 #ffffff;
}

.menu-left {
  display: flex;
  gap: 20px;
}

.menu-item {
  position: relative;
  cursor: pointer;
  padding: 2px 8px;
  color: #000000;
  transition: all 0.1s;
  user-select: none;
}

.menu-item:hover,
.menu-item.active {
  background: #0055aa;
  color: #ffffff;
}

/* Menu Dropdown */
.menu-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.4);
  z-index: 1000;
  min-width: 180px;
  font-size: 11px;
}

.menu-dropdown-item {
  padding: 4px 12px;
  cursor: pointer;
  color: #000000;
  background: #a0a0a0;
  border-bottom: 1px solid #808080;
  transition: all 0.1s;
  white-space: nowrap;
}

.menu-dropdown-item:last-child {
  border-bottom: none;
}

.menu-dropdown-item:hover:not(.disabled) {
  background: #0055aa;
  color: #ffffff;
}

.menu-dropdown-item.disabled {
  color: #808080;
  cursor: not-allowed;
}

.menu-right {
  display: flex;
  gap: 20px;
  align-items: center;
  color: #000000;
  font-size: 9px;
}

.system-time {
  font-weight: bold;
}

.memory-indicator {
  color: #0055aa;
}

.clipboard-indicator {
  font-size: 14px;
  cursor: pointer;
  padding: 2px 4px;
  transition: all 0.1s;
}

.clipboard-indicator:hover {
  background: rgba(0, 85, 170, 0.2);
  border-radius: 2px;
}

/* Desktop Background */
.desktop-background {
  flex: 1;
  position: relative;
  background: #a0a0a0; /* Authentic Amiga Workbench gray */
  overflow: hidden;
  padding: 20px;
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
  transition: all 0.1s;
}

.disk-icon:hover {
  background: rgba(0, 85, 170, 0.2);
}

.icon-image {
  width: 64px;
  height: 64px;
  margin-bottom: 4px;
}

.disk-svg,
.ram-svg,
.drawer-svg,
.trash-svg {
  width: 100%;
  height: 100%;
  filter: drop-shadow(2px 2px 0px rgba(0, 0, 0, 0.3));
}

.icon-label {
  font-size: 9px;
  color: #000000;
  text-align: center;
  text-shadow:
    -1px -1px 0 #ffffff,
    1px -1px 0 #ffffff,
    -1px 1px 0 #ffffff,
    1px 1px 0 #ffffff;
  max-width: 80px;
  word-wrap: break-word;
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
  background: #ffffff;
  border-top: 2px solid #000000;
  padding: 4px 12px;
  font-size: 9px;
  color: #000000;
  box-shadow: inset -1px 1px 0 #808080, inset 1px -1px 0 #ffffff;
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
  color: #0055aa;
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
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 4px 12px;
  font-size: 10px;
  cursor: pointer;
  color: #000000;
  font-family: 'Press Start 2P', monospace;
}

.amiga-button:active {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}

/* Drop overlay for file uploads */
.drop-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 85, 170, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9998;
  pointer-events: none;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.drop-message {
  text-align: center;
  color: #ffffff;
  padding: 40px;
  background: rgba(0, 0, 0, 0.3);
  border: 4px dashed #ffffff;
  border-radius: 8px;
}

.drop-icon {
  font-size: 64px;
  margin-bottom: 20px;
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.drop-text {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 10px;
  font-family: 'Press Start 2P', monospace;
}

.drop-subtext {
  font-size: 10px;
  opacity: 0.9;
  font-family: 'Press Start 2P', monospace;
}
</style>
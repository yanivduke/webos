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
      </div>
    </div>

    <!-- Desktop Background (Authentic Amiga gray) -->
    <div class="desktop-background">
      <!-- Disk Icons on Desktop (Left Side) -->
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
          />
        </AmigaWindow>
      </div>

      <!-- Widgets Panel (Right Side) -->
      <div class="widgets-panel">
        <ClockWidget
          v-if="widgetSettings.clock.enabled"
          :showDate="widgetSettings.clock.showDate"
          :showSeconds="widgetSettings.clock.showSeconds"
        />
        <WeatherWidget
          v-if="widgetSettings.weather.enabled"
          :location="widgetSettings.weather.location"
          :units="widgetSettings.weather.units"
        />
        <NewsWidget
          v-if="widgetSettings.news.enabled"
          :category="widgetSettings.news.category"
          :maxItems="widgetSettings.news.maxItems"
        />
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
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue';
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
import ClockWidget from './widgets/ClockWidget.vue';
import WeatherWidget from './widgets/WeatherWidget.vue';
import NewsWidget from './widgets/NewsWidget.vue';

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
  { name: 'Tools', items: ['Calculator', 'Clock', 'NotePad', 'Paint', 'MultiView', 'Shell', 'AWML Runner', 'AWML Wizard', 'Preferences'] }
]);

// System info
const currentTime = ref('12:00:00');
const chipMem = ref('512K');
const fastMem = ref('512K');
const driveActivity = ref(false);
const selectedCount = ref(0);

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
const menuHoverTimeout = ref<number | null>(null);

// Widget settings
const widgetSettings = ref({
  clock: {
    enabled: true,
    showDate: true,
    showSeconds: true
  },
  weather: {
    enabled: false,
    location: 'New York',
    units: 'metric' as 'metric' | 'imperial'
  },
  news: {
    enabled: false,
    category: 'technology',
    maxItems: 5
  }
});

// Time update
let timeInterval: number | undefined;

const loadWidgetSettings = async () => {
  try {
    const response = await fetch('/api/settings/widgets');
    if (response.ok) {
      const data = await response.json();
      if (data.settings) {
        widgetSettings.value = { ...widgetSettings.value, ...data.settings };
      }
    }
  } catch (error) {
    console.error('Failed to load widget settings:', error);
  }
};

onMounted(() => {
  updateTime();
  timeInterval = window.setInterval(updateTime, 1000);
  loadWidgetSettings();

  // Close menu when clicking outside
  document.addEventListener('click', closeMenuOnClickOutside);
});

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval);
  }
  document.removeEventListener('click', closeMenuOnClickOutside);
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
  openWindows.value.push(newWindow);
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
  openWindows.value.push(newWindow);
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
  openWindows.value.push(newWindow);
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
  openWindows.value.push(newWindow);
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
    selectedCount.value = 0;
  }
};

const closeWindow = (windowId: string) => {
  const index = openWindows.value.findIndex(w => w.id === windowId);
  if (index !== -1) {
    openWindows.value.splice(index, 1);
  }
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
  right: 220px;
  bottom: 20px;
  pointer-events: none;
}

.windows-container > * {
  pointer-events: all;
}

/* Widgets Panel */
.widgets-panel {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 200px;
  max-height: calc(100% - 40px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

/* Custom scrollbar for widgets panel */
.widgets-panel::-webkit-scrollbar {
  width: 12px;
}

.widgets-panel::-webkit-scrollbar-track {
  background: #888888;
}

.widgets-panel::-webkit-scrollbar-thumb {
  background: #a0a0a0;
  border: 1px solid #000000;
}

.widgets-panel::-webkit-scrollbar-thumb:hover {
  background: #b0b0b0;
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
</style>
<template>
  <div class="amiga-desktop">
    <!-- Amiga Workbench Menu Bar -->
    <div class="workbench-menu">
      <div class="menu-left">
        <div class="menu-item" v-for="menu in menus" :key="menu.name" @click="toggleMenu(menu.name)">
          {{ menu.name }}
        </div>
      </div>
      <div class="menu-right">
        <div class="system-time">{{ currentTime }}</div>
        <div class="memory-indicator">Chip: {{ chipMem }} | Fast: {{ fastMem }}</div>
      </div>
    </div>

    <!-- Desktop Background (Authentic Amiga gray) -->
    <div class="desktop-background">
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
          />
        </AmigaWindow>
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
  { name: 'Tools', items: ['Clock', 'Calculator', 'Shell', 'Preferences'] }
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

// Time update
let timeInterval: number | undefined;

onMounted(() => {
  updateTime();
  timeInterval = window.setInterval(updateTime, 1000);
});

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval);
  }
});

const updateTime = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  currentTime.value = `${hours}:${minutes}:${seconds}`;
};

const toggleMenu = (menuName: string) => {
  console.log(`Menu clicked: ${menuName}`);
  // Menu implementation
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

const handleOpenFile = (filePath: string, fileName: string) => {
  console.log('Opening file:', filePath, fileName);

  // Check if it's a text file
  if (fileName.endsWith('.txt') || fileName.endsWith('.text') || fileName.endsWith('.doc')) {
    const newWindow: Window = {
      id: `window-${Date.now()}`,
      title: `NotePad - ${fileName}`,
      x: 150 + openWindows.value.length * 20,
      y: 100 + openWindows.value.length * 20,
      width: 600,
      height: 450,
      component: AmigaNotePad,
      data: { filePath, fileName }
    };
    openWindows.value.push(newWindow);
  } else {
    alert('Only text files (.txt, .text, .doc) can be opened with NotePad');
  }
};

const handleOpenTool = (toolName: string) => {
  console.log('Opening tool:', toolName);

  if (toolName === 'NotePad') {
    const newWindow: Window = {
      id: `window-${Date.now()}`,
      title: 'NotePad',
      x: 150 + openWindows.value.length * 20,
      y: 100 + openWindows.value.length * 20,
      width: 600,
      height: 450,
      component: AmigaNotePad,
      data: {}
    };
    openWindows.value.push(newWindow);
  } else if (toolName === 'Calculator') {
    const newWindow: Window = {
      id: `window-${Date.now()}`,
      title: 'Calculator',
      x: 200 + openWindows.value.length * 20,
      y: 120 + openWindows.value.length * 20,
      width: 280,
      height: 420,
      component: AmigaCalculator,
      data: {}
    };
    openWindows.value.push(newWindow);
  } else if (toolName === 'Shell') {
    const newWindow: Window = {
      id: `window-${Date.now()}`,
      title: 'AmigaShell',
      x: 170 + openWindows.value.length * 20,
      y: 110 + openWindows.value.length * 20,
      width: 650,
      height: 450,
      component: AmigaShell,
      data: {}
    };
    openWindows.value.push(newWindow);
  } else if (toolName === 'Clock') {
    const newWindow: Window = {
      id: `window-${Date.now()}`,
      title: 'Clock',
      x: 220 + openWindows.value.length * 20,
      y: 130 + openWindows.value.length * 20,
      width: 320,
      height: 480,
      component: AmigaClock,
      data: {}
    };
    openWindows.value.push(newWindow);
  } else if (toolName === 'MultiView') {
    // Open Paint when MultiView is clicked
    const newWindow: Window = {
      id: `window-${Date.now()}`,
      title: 'AmigaPaint',
      x: 160 + openWindows.value.length * 20,
      y: 90 + openWindows.value.length * 20,
      width: 700,
      height: 550,
      component: AmigaPaint,
      data: {}
    };
    openWindows.value.push(newWindow);
  } else {
    alert(`Tool "${toolName}" is not yet implemented`);
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
  cursor: pointer;
  padding: 2px 8px;
  color: #000000;
  transition: all 0.1s;
  user-select: none;
}

.menu-item:hover {
  background: #0055aa;
  color: #ffffff;
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
</style>
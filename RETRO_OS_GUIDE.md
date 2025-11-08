# Retro OS Implementation Guide

This guide will walk you through creating a new retro operating system theme for WebOS. Whether you want to implement Windows 95, Mac OS System 7, BeOS, or any other classic OS, this document provides the blueprint.

## Table of Contents

1. [Before You Start](#before-you-start)
2. [Research Phase](#research-phase)
3. [Architecture Overview](#architecture-overview)
4. [Step-by-Step Implementation](#step-by-step-implementation)
5. [Component Naming Conventions](#component-naming-conventions)
6. [Styling Best Practices](#styling-best-practices)
7. [Testing Your Theme](#testing-your-theme)
8. [Common Patterns](#common-patterns)
9. [Examples from Amiga Workbench](#examples-from-amiga-workbench)

---

## Before You Start

### Prerequisites

- Basic knowledge of Vue 3 Composition API
- Familiarity with TypeScript (or willingness to learn)
- CSS skills (no frameworks - we write authentic retro styles)
- Passion for the retro OS you're implementing
- Access to screenshots, videos, or the original OS for reference

### Open an Issue First

Before writing code, open a [Retro OS Proposal](../../issues/new?template=retro_os_proposal.md) issue to:
- Get feedback on your implementation plan
- Connect with others interested in the same OS
- Avoid duplicate work
- Discuss technical challenges

---

## Research Phase

### 1. Gather Authentic Resources

**Essential Research:**
- Original OS screenshots (multiple windows, dialogs, menus)
- System font information (name, fallbacks)
- Color palette (exact hex codes if possible)
- Window chrome details (title bar, borders, buttons)
- UI widget styles (buttons, checkboxes, scrollbars, menus)
- Desktop paradigms (taskbar, dock, desktop icons)
- Animations and transitions (how fast? what effects?)

**Recommended Resources:**
- [GUI Gallery](https://guidebookgallery.org/) - Comprehensive OS screenshots
- [Toasty Tech GUI Gallery](http://toastytech.com/guis/) - Classic GUI collection
- [Archive.org](https://archive.org/) - OS videos and manuals
- [WinWorld](https://winworldpc.com/) - Windows and DOS software
- YouTube - "History of [OS Name]" videos
- Original hardware if available (or emulators)

### 2. Document Key Visual Elements

Create a reference document with:

```markdown
## [OS Name] Visual Specification

### Color Palette
- Window background: #RRGGBB
- Title bar active: #RRGGBB
- Title bar inactive: #RRGGBB
- Text color: #RRGGBB
- Border highlights: #RRGGBB
- Border shadows: #RRGGBB
- Desktop background: #RRGGBB

### Typography
- System font: "Font Name", fallback-font
- Title bar font size: Xpx
- Menu font size: Xpx
- Icon label font size: Xpx

### Window Chrome
- Title bar height: Xpx
- Border width: Xpx
- Corner style: rounded/square
- Button dimensions: Xpx × Xpx

### Interaction Behaviors
- Window dragging: smooth/instant
- Transition speeds: Xms
- Focus behavior: how do windows indicate focus?
```

---

## Architecture Overview

WebOS uses a component-based architecture where each OS theme is self-contained:

```
src/client/
├── components/
│   ├── amiga/           # Amiga Workbench components
│   │   ├── AmigaDesktop.vue
│   │   ├── AmigaWindow.vue
│   │   ├── AmigaFolder.vue
│   │   └── ...
│   ├── windows95/       # Your new OS theme (example)
│   │   ├── Windows95Desktop.vue
│   │   ├── Windows95Window.vue
│   │   ├── Windows95Taskbar.vue
│   │   └── ...
│   └── shared/          # Shared utilities (if needed)
```

### Core Components Every Theme Needs

1. **Desktop Component** (`[OS]Desktop.vue`)
   - Main orchestrator
   - Manages open windows array
   - Handles desktop icons
   - Renders taskbar/dock/menu bar
   - System clock and notifications

2. **Window Component** (`[OS]Window.vue`)
   - Reusable window container
   - Draggable via title bar
   - Resizable (if OS supports it)
   - Close/minimize/maximize buttons
   - Z-index management for layering

3. **File Browser Component** (`[OS]Folder.vue` or `[OS]Explorer.vue`)
   - Display files and folders
   - Icon view, list view (depending on OS)
   - Navigation breadcrumbs
   - Selection behavior

4. **Application Components**
   - Text editor (e.g., `[OS]Notepad.vue`)
   - Calculator (e.g., `[OS]Calculator.vue`)
   - System settings
   - Other OS-specific apps

---

## Step-by-Step Implementation

### Phase 1: Basic Desktop & Window

#### Step 1: Create Desktop Component

```vue
<!-- src/client/components/windows95/Windows95Desktop.vue -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

interface Window {
  id: number;
  title: string;
  component: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  minimized: boolean;
}

const windows = ref<Window[]>([]);
const currentTime = ref('');
let clockInterval: number;

const openWindow = (config: Partial<Window>) => {
  const newWindow: Window = {
    id: Date.now(),
    title: config.title || 'Untitled',
    component: config.component || 'Windows95Folder',
    x: config.x || 100,
    y: config.y || 100,
    width: config.width || 640,
    height: config.height || 480,
    zIndex: Date.now(),
    minimized: false,
  };
  windows.value.push(newWindow);
};

const closeWindow = (id: number) => {
  windows.value = windows.value.filter(w => w.id !== id);
};

const focusWindow = (id: number) => {
  const window = windows.value.find(w => w.id === id);
  if (window) {
    window.zIndex = Date.now();
  }
};

const updateClock = () => {
  const now = new Date();
  currentTime.value = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

onMounted(() => {
  updateClock();
  clockInterval = window.setInterval(updateClock, 1000);
});

onUnmounted(() => {
  if (clockInterval) clearInterval(clockInterval);
});
</script>

<template>
  <div class="windows95-desktop">
    <!-- Desktop Icons -->
    <div class="desktop-icons">
      <div class="desktop-icon" @dblclick="openWindow({ title: 'My Computer', component: 'Windows95Folder' })">
        <img src="/icons/my-computer.png" alt="My Computer">
        <span>My Computer</span>
      </div>
      <!-- Add more icons -->
    </div>

    <!-- Open Windows -->
    <Windows95Window
      v-for="window in windows"
      :key="window.id"
      :title="window.title"
      :x="window.x"
      :y="window.y"
      :width="window.width"
      :height="window.height"
      :z-index="window.zIndex"
      @close="closeWindow(window.id)"
      @focus="focusWindow(window.id)"
    >
      <component :is="window.component" />
    </Windows95Window>

    <!-- Taskbar -->
    <div class="taskbar">
      <button class="start-button">
        <img src="/icons/windows-logo.png" alt="Start">
        Start
      </button>
      <div class="taskbar-windows">
        <button
          v-for="window in windows"
          :key="window.id"
          class="taskbar-window"
          :class="{ minimized: window.minimized }"
          @click="focusWindow(window.id)"
        >
          {{ window.title }}
        </button>
      </div>
      <div class="system-tray">
        <span class="clock">{{ currentTime }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.windows95-desktop {
  width: 100vw;
  height: 100vh;
  background: #008080; /* Windows 95 teal */
  position: relative;
  overflow: hidden;
  font-family: 'MS Sans Serif', Arial, sans-serif;
}

.desktop-icons {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 10px;
}

.desktop-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 80px;
  cursor: pointer;
  color: white;
  text-shadow: 1px 1px 2px black;
}

.desktop-icon img {
  width: 32px;
  height: 32px;
  margin-bottom: 4px;
}

.taskbar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 28px;
  background: #c0c0c0;
  border-top: 2px solid #ffffff;
  display: flex;
  align-items: center;
  padding: 2px;
}

.start-button {
  height: 24px;
  padding: 0 8px;
  background: #c0c0c0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: bold;
  cursor: pointer;
}

.start-button:active {
  border-color: #000000 #ffffff #ffffff #000000;
}

.system-tray {
  margin-left: auto;
  padding: 0 8px;
  border: 2px solid;
  border-color: #808080 #ffffff #ffffff #808080;
  height: 20px;
  display: flex;
  align-items: center;
}

.clock {
  font-size: 11px;
}
</style>
```

#### Step 2: Create Window Component

```vue
<!-- src/client/components/windows95/Windows95Window.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps<{
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
}>();

const emit = defineEmits<{
  close: [];
  focus: [];
  minimize: [];
  maximize: [];
}>();

const position = ref({ x: props.x, y: props.y });
const size = ref({ width: props.width, height: props.height });
const isDragging = ref(false);
const isResizing = ref(false);
let dragStart = { x: 0, y: 0 };

const windowStyle = computed(() => ({
  left: `${position.value.x}px`,
  top: `${position.value.y}px`,
  width: `${size.value.width}px`,
  height: `${size.value.height}px`,
  zIndex: props.zIndex,
}));

const startDrag = (e: MouseEvent) => {
  isDragging.value = true;
  dragStart = {
    x: e.clientX - position.value.x,
    y: e.clientY - position.value.y,
  };
  emit('focus');
  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', stopDrag);
  e.preventDefault();
};

const onDrag = (e: MouseEvent) => {
  if (!isDragging.value) return;
  position.value = {
    x: e.clientX - dragStart.x,
    y: e.clientY - dragStart.y,
  };
};

const stopDrag = () => {
  isDragging.value = false;
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDrag);
};
</script>

<template>
  <div class="windows95-window" :style="windowStyle" @mousedown="emit('focus')">
    <!-- Title Bar -->
    <div class="title-bar" @mousedown="startDrag">
      <span class="title-text">{{ title }}</span>
      <div class="title-buttons">
        <button class="title-button minimize" @click.stop="emit('minimize')">
          <span>_</span>
        </button>
        <button class="title-button maximize" @click.stop="emit('maximize')">
          <span>□</span>
        </button>
        <button class="title-button close" @click.stop="emit('close')">
          <span>×</span>
        </button>
      </div>
    </div>

    <!-- Menu Bar (optional) -->
    <div class="menu-bar">
      <span class="menu-item">File</span>
      <span class="menu-item">Edit</span>
      <span class="menu-item">View</span>
      <span class="menu-item">Help</span>
    </div>

    <!-- Window Content -->
    <div class="window-content">
      <slot />
    </div>

    <!-- Status Bar (optional) -->
    <div class="status-bar">
      Ready
    </div>
  </div>
</template>

<style scoped>
.windows95-window {
  position: absolute;
  background: #c0c0c0;
  border: 2px solid;
  border-color: #dfdfdf #0a0a0a #0a0a0a #dfdfdf;
  box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
}

.title-bar {
  background: linear-gradient(to right, #000080, #1084d0);
  color: white;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2px 4px;
  cursor: move;
  user-select: none;
}

.title-text {
  font-weight: bold;
  font-size: 11px;
  flex: 1;
}

.title-buttons {
  display: flex;
  gap: 2px;
}

.title-button {
  width: 16px;
  height: 14px;
  background: #c0c0c0;
  border: 1px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  cursor: pointer;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.title-button:active {
  border-color: #000000 #ffffff #ffffff #000000;
}

.menu-bar {
  background: #c0c0c0;
  border-bottom: 1px solid #808080;
  display: flex;
  gap: 10px;
  padding: 2px 4px;
  font-size: 11px;
}

.menu-item {
  cursor: pointer;
  padding: 2px 4px;
}

.menu-item:hover {
  background: #000080;
  color: white;
}

.window-content {
  flex: 1;
  background: white;
  overflow: auto;
  padding: 8px;
}

.status-bar {
  background: #c0c0c0;
  border-top: 1px solid #808080;
  height: 18px;
  padding: 2px 4px;
  font-size: 11px;
  display: flex;
  align-items: center;
}
</style>
```

### Phase 2: File Browser

Create a file browser component that integrates with the backend API:

```vue
<!-- src/client/components/windows95/Windows95Explorer.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue';

interface FileItem {
  name: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: string;
}

const currentPath = ref('C:\\');
const files = ref<FileItem[]>([]);
const loading = ref(false);

const loadFiles = async () => {
  loading.value = true;
  try {
    const response = await fetch(`/api/files/list?path=${encodeURIComponent(currentPath.value)}`);
    const data = await response.json();
    files.value = data.files || [];
  } catch (error) {
    console.error('Failed to load files:', error);
  } finally {
    loading.value = false;
  }
};

const openItem = (item: FileItem) => {
  if (item.type === 'directory') {
    currentPath.value = `${currentPath.value}\\${item.name}`;
    loadFiles();
  }
};

onMounted(() => {
  loadFiles();
});
</script>

<template>
  <div class="windows95-explorer">
    <div class="address-bar">
      <span class="label">Address:</span>
      <input v-model="currentPath" class="address-input" @keyup.enter="loadFiles">
    </div>

    <div class="file-list">
      <div
        v-for="file in files"
        :key="file.name"
        class="file-item"
        @dblclick="openItem(file)"
      >
        <img :src="`/icons/${file.type}.png`" :alt="file.type" class="file-icon">
        <span class="file-name">{{ file.name }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.windows95-explorer {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.address-bar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  background: #c0c0c0;
  border-bottom: 1px solid #808080;
}

.address-input {
  flex: 1;
  border: 2px solid;
  border-color: #808080 #ffffff #ffffff #808080;
  padding: 2px 4px;
  font-size: 11px;
}

.file-list {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 10px;
  padding: 10px;
  overflow-y: auto;
}

.file-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  padding: 4px;
}

.file-item:hover {
  background: rgba(0, 0, 128, 0.1);
}

.file-icon {
  width: 32px;
  height: 32px;
  margin-bottom: 4px;
}

.file-name {
  font-size: 11px;
  text-align: center;
  word-break: break-word;
}
</style>
```

---

## Component Naming Conventions

Use a consistent prefix for all components in your theme:

**Good Examples:**
- `Windows95Desktop.vue`
- `Windows95Window.vue`
- `Windows95Taskbar.vue`
- `Windows95StartMenu.vue`
- `Windows95Notepad.vue`

**Bad Examples:**
- `Desktop.vue` (too generic, will conflict)
- `Win95Window.vue` (inconsistent abbreviation)
- `WindowsNinetyFiveDesktop.vue` (too verbose)

---

## Styling Best Practices

### 1. Use Authentic Colors

Research the exact hex codes used in the original OS. Create CSS variables:

```css
:root {
  /* Windows 95 Colors */
  --win95-gray: #c0c0c0;
  --win95-dark-gray: #808080;
  --win95-white: #ffffff;
  --win95-black: #000000;
  --win95-active-title: #000080;
  --win95-inactive-title: #808080;
  --win95-desktop: #008080;
}
```

### 2. Authentic Borders

Classic OSes used beveled borders for 3D effects:

```css
/* Raised border (buttons, title bars) */
.raised {
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
}

/* Sunken border (text inputs, panels) */
.sunken {
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
}
```

### 3. System Fonts

Research which fonts the OS used and provide web-safe fallbacks:

```css
/* Windows 95 / 98 */
font-family: 'MS Sans Serif', 'Tahoma', Arial, sans-serif;

/* Mac OS System 7-9 */
font-family: 'Chicago', 'Charcoal', 'Geneva', sans-serif;

/* Amiga Workbench */
font-family: 'Topaz', 'Press Start 2P', monospace;
```

If the original font isn't available as a web font, find the closest alternative or convert the original font (respecting licensing).

### 4. Match Animation Speeds

Retro OSes had different animation philosophies:

```css
/* Instant (Amiga, early Windows) */
transition: none;

/* Quick (Windows 95/98) */
transition: all 0.1s ease;

/* Smooth (Mac OS 9, later systems) */
transition: all 0.2s ease-out;
```

### 5. Scoped Styles

Always use `<style scoped>` to avoid conflicts with other themes:

```vue
<style scoped>
.windows95-window {
  /* Your styles */
}
</style>
```

---

## Testing Your Theme

### 1. Visual Testing

Compare your implementation side-by-side with screenshots:

- Open your theme and an original OS screenshot
- Check colors, fonts, spacing, borders
- Test all interactive states (hover, active, focus)
- Verify window chrome details match

### 2. Functional Testing

- **Window Management**: Drag, resize, minimize, maximize, close
- **Multi-window**: Open multiple windows, verify z-index layering
- **File Operations**: Browse folders, select files
- **Applications**: Test built-in apps (notepad, calculator, etc.)
- **Responsiveness**: Test on different screen sizes

### 3. Browser Testing

Test in multiple browsers:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

### 4. Performance Testing

- Open 10+ windows - does it lag?
- Check browser DevTools console for errors
- Monitor memory usage

---

## Common Patterns

### Window Dragging

```typescript
const isDragging = ref(false);
let dragOffset = { x: 0, y: 0 };

const startDrag = (e: MouseEvent) => {
  isDragging.value = true;
  dragOffset = {
    x: e.clientX - position.value.x,
    y: e.clientY - position.value.y,
  };
  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', stopDrag);
  e.preventDefault();
};

const onDrag = (e: MouseEvent) => {
  if (!isDragging.value) return;
  position.value = {
    x: e.clientX - dragOffset.x,
    y: e.clientY - dragOffset.y,
  };
};

const stopDrag = () => {
  isDragging.value = false;
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDrag);
};

// Don't forget to clean up!
onUnmounted(() => {
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDrag);
});
```

### Window Resizing

```typescript
const isResizing = ref(false);
let resizeStart = { x: 0, y: 0, width: 0, height: 0 };

const startResize = (e: MouseEvent) => {
  isResizing.value = true;
  resizeStart = {
    x: e.clientX,
    y: e.clientY,
    width: size.value.width,
    height: size.value.height,
  };
  document.addEventListener('mousemove', onResize);
  document.addEventListener('mouseup', stopResize);
  e.preventDefault();
};

const onResize = (e: MouseEvent) => {
  if (!isResizing.value) return;
  const deltaX = e.clientX - resizeStart.x;
  const deltaY = e.clientY - resizeStart.y;
  size.value = {
    width: Math.max(200, resizeStart.width + deltaX),
    height: Math.max(150, resizeStart.height + deltaY),
  };
};

const stopResize = () => {
  isResizing.value = false;
  document.removeEventListener('mousemove', onResize);
  document.removeEventListener('mouseup', stopResize);
};
```

### Z-Index Management

```typescript
const bringToFront = (windowId: number) => {
  const window = windows.value.find(w => w.id === windowId);
  if (window) {
    // Use timestamp for unique z-index
    window.zIndex = Date.now();
  }
};
```

---

## Examples from Amiga Workbench

The Amiga Workbench implementation (`src/client/components/Amiga*.vue`) is the reference implementation. Study these files:

### AmigaDesktop.vue

Key features to learn from:
- Window management with array of open windows
- Desktop icon layout with disks
- System clock with setInterval
- Menu bar with dropdowns
- Proper TypeScript interfaces

```typescript
interface DiskIcon {
  id: string;
  name: string;
  type: 'floppy' | 'harddisk' | 'ram';
  icon: string;
}

interface OpenWindow {
  id: number;
  title: string;
  component: string;
  data?: any;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
}
```

### AmigaWindow.vue

Key features:
- Draggable title bar
- Resizable corner handle
- Close/depth/zoom buttons
- Border styling with authentic bevels
- Z-index focus on mousedown

### AmigaFolder.vue

Key features:
- Icon grid layout
- Multi-select with Ctrl/Cmd key
- Double-click to open
- Integration with file API
- Different views for different disk types

---

## Getting Help

- **Ask in Discussions**: [GitHub Discussions](../../discussions)
- **Open an Issue**: Stuck on something? Ask for help!
- **Reference Existing Code**: The Amiga implementation is well-documented
- **Join the Community**: Connect with other contributors

---

## Final Checklist

Before submitting your PR:

- [ ] All components use consistent naming (e.g., `[OS]Component.vue`)
- [ ] Styles are scoped to avoid conflicts
- [ ] Colors and fonts match authentic OS
- [ ] Windows can be dragged and resized (if OS supports it)
- [ ] File browser integrates with `/api/files` endpoints
- [ ] Code includes TypeScript types
- [ ] No console errors
- [ ] Tested in Chrome, Firefox, Safari
- [ ] Screenshots included in PR showing authenticity
- [ ] Documentation added explaining design choices

---

## Additional Resources

- **[CONTRIBUTING.md](CONTRIBUTING.md)** - General contribution guidelines
- **[CLAUDE.md](CLAUDE.md)** - Detailed technical architecture
- **Amiga Components** - Reference implementation in `src/client/components/`
- **GUI Gallery** - https://guidebookgallery.org/
- **Toasty Tech** - http://toastytech.com/guis/

---

**Questions?** Open a [Discussion](../../discussions) or comment on your Retro OS Proposal issue!

**Happy retro coding!** 🖥️ 💾 🎮

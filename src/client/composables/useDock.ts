import { ref, computed } from 'vue';

export interface DockItem {
  id: string;
  name: string;
  icon?: string;
  pinned: boolean;
  running: boolean;
  windowCount: number;
  type: 'app' | 'window';
  action?: () => void;
  data?: any;
}

interface DockSettings {
  size: 'small' | 'medium' | 'large';
  autoHide: boolean;
  magnification: boolean;
}

const STORAGE_KEY = 'amiga-dock-settings';
const PINNED_APPS_KEY = 'amiga-dock-pinned-apps';

// Default pinned apps configuration
const DEFAULT_PINNED_APPS = [
  { id: 'workbench', name: 'Workbench', icon: '💾', type: 'app' as const },
  { id: 'system', name: 'System', icon: '🗂️', type: 'app' as const },
  { id: 'shell', name: 'Shell', icon: '⌨️', type: 'app' as const },
  { id: 'calculator', name: 'Calculator', icon: '🔢', type: 'app' as const },
  { id: 'paint', name: 'Paint', icon: '🎨', type: 'app' as const },
  { id: 'notepad', name: 'NotePad', icon: '📝', type: 'app' as const },
  { id: 'utilities', name: 'Utilities', icon: '📁', type: 'app' as const }
];

// Dock state
const dockItems = ref<DockItem[]>([]);
const dockSettings = ref<DockSettings>({
  size: 'medium',
  autoHide: false,
  magnification: true
});
const minimizedWindows = ref<Map<string, any>>(new Map());
const isAutoHidden = ref(false);

// Load settings from localStorage
const loadSettings = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      dockSettings.value = JSON.parse(saved);
    }
  } catch (error) {
    console.error('Failed to load dock settings:', error);
  }
};

// Save settings to localStorage
const saveSettings = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dockSettings.value));
  } catch (error) {
    console.error('Failed to save dock settings:', error);
  }
};

// Load pinned apps from localStorage or use defaults
const loadPinnedApps = (): DockItem[] => {
  try {
    const saved = localStorage.getItem(PINNED_APPS_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Failed to load pinned apps:', error);
  }

  // Return defaults
  return DEFAULT_PINNED_APPS.map(app => ({
    ...app,
    pinned: true,
    running: false,
    windowCount: 0
  }));
};

// Save pinned apps to localStorage
const savePinnedApps = (items: DockItem[]) => {
  try {
    const pinnedOnly = items.filter(item => item.pinned && item.type === 'app');
    localStorage.setItem(PINNED_APPS_KEY, JSON.stringify(pinnedOnly));
  } catch (error) {
    console.error('Failed to save pinned apps:', error);
  }
};

// Initialize dock
const initializeDock = () => {
  loadSettings();
  const pinnedApps = loadPinnedApps();
  dockItems.value = pinnedApps;
};

// Add or update a running window
const addRunningWindow = (windowId: string, windowTitle: string, appId: string) => {
  const existingIndex = dockItems.value.findIndex(
    item => item.type === 'window' && item.id === windowId
  );

  if (existingIndex !== -1) {
    // Window already in dock
    dockItems.value[existingIndex].windowCount++;
  } else {
    // Add new window to dock
    const newWindowItem: DockItem = {
      id: windowId,
      name: windowTitle,
      pinned: false,
      running: true,
      windowCount: 1,
      type: 'window',
      data: { appId }
    };
    dockItems.value.push(newWindowItem);
  }

  // Update running count for the app
  const appItem = dockItems.value.find(item => item.id === appId && item.type === 'app');
  if (appItem) {
    appItem.running = true;
    appItem.windowCount++;
  }
};

// Remove a running window
const removeRunningWindow = (windowId: string, appId: string) => {
  const windowIndex = dockItems.value.findIndex(
    item => item.type === 'window' && item.id === windowId
  );

  if (windowIndex !== -1) {
    dockItems.value.splice(windowIndex, 1);
  }

  // Update running count for the app
  const appItem = dockItems.value.find(item => item.id === appId && item.type === 'app');
  if (appItem) {
    appItem.windowCount = Math.max(0, appItem.windowCount - 1);
    if (appItem.windowCount === 0) {
      appItem.running = false;
    }
  }
};

// Minimize a window
const minimizeWindow = (windowId: string, windowData: any) => {
  minimizedWindows.value.set(windowId, windowData);
};

// Restore a minimized window
const restoreWindow = (windowId: string) => {
  const windowData = minimizedWindows.value.get(windowId);
  minimizedWindows.value.delete(windowId);
  return windowData;
};

// Check if window is minimized
const isWindowMinimized = (windowId: string): boolean => {
  return minimizedWindows.value.has(windowId);
};

// Get minimized window
const getMinimizedWindow = (windowId: string) => {
  return minimizedWindows.value.get(windowId);
};

// Pin/unpin an app
const togglePin = (itemId: string) => {
  const item = dockItems.value.find(i => i.id === itemId);
  if (item && item.type === 'app') {
    item.pinned = !item.pinned;
    if (!item.pinned && !item.running) {
      // Remove unpinned, non-running apps
      const index = dockItems.value.indexOf(item);
      if (index !== -1) {
        dockItems.value.splice(index, 1);
      }
    }
    savePinnedApps(dockItems.value);
  }
};

// Reorder dock items
const reorderItems = (fromIndex: number, toIndex: number) => {
  if (fromIndex < 0 || fromIndex >= dockItems.value.length ||
      toIndex < 0 || toIndex >= dockItems.value.length) {
    return;
  }

  const items = [...dockItems.value];
  const [movedItem] = items.splice(fromIndex, 1);
  items.splice(toIndex, 0, movedItem);
  dockItems.value = items;

  // Save the new order
  savePinnedApps(dockItems.value);
};

// Update dock settings
const updateDockSettings = (settings: Partial<DockSettings>) => {
  dockSettings.value = { ...dockSettings.value, ...settings };
  saveSettings();
};

// Toggle auto-hide
const toggleAutoHide = () => {
  dockSettings.value.autoHide = !dockSettings.value.autoHide;
  saveSettings();
};

// Set dock visibility for auto-hide
const setAutoHidden = (hidden: boolean) => {
  isAutoHidden.value = hidden;
};

// Computed properties
const pinnedItems = computed(() =>
  dockItems.value.filter(item => item.pinned && item.type === 'app')
);

const runningWindowItems = computed(() =>
  dockItems.value.filter(item => item.type === 'window' || (item.type === 'app' && item.running))
);

const dockHeight = computed(() => {
  const sizes = {
    small: 48,
    medium: 64,
    large: 80
  };
  return sizes[dockSettings.value.size];
});

const dockItemSize = computed(() => {
  const sizes = {
    small: 40,
    medium: 52,
    large: 66
  };
  return sizes[dockSettings.value.size];
});

export const useDock = () => {
  return {
    // State
    dockItems,
    dockSettings,
    minimizedWindows,
    isAutoHidden,

    // Methods
    initializeDock,
    addRunningWindow,
    removeRunningWindow,
    minimizeWindow,
    restoreWindow,
    isWindowMinimized,
    getMinimizedWindow,
    togglePin,
    reorderItems,
    updateDockSettings,
    toggleAutoHide,
    setAutoHidden,
    loadSettings,
    saveSettings,

    // Computed
    pinnedItems,
    runningWindowItems,
    dockHeight,
    dockItemSize
  };
};

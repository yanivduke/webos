import { ref, watch, type Ref } from 'vue';
import type { BackdropSettings } from './useBackdrop';
import type { IconPositions } from './useIconPositions';

export interface DesktopWindow {
  id: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  component: any;
  data?: any;
  typeId?: string;
}

export interface VirtualDesktop {
  id: number;
  name: string;
  iconPositions: IconPositions;
  windows: DesktopWindow[];
  backdrop: BackdropSettings;
  active: boolean;
}

export interface WorkspaceState {
  currentDesktopId: number;
  desktops: VirtualDesktop[];
}

// Default backdrop settings for each workspace
const defaultBackdrops: BackdropSettings[] = [
  { pattern: 'solid', color: '#a0a0a0', opacity: 1.0 },
  { pattern: 'solid', color: '#2a2a2a', opacity: 1.0 },
  { pattern: 'solid', color: '#0055aa', opacity: 1.0 },
  { pattern: 'solid', color: '#008888', opacity: 1.0 }
];

// Default icon positions (same for all workspaces initially)
const defaultIconPositions: IconPositions = {
  'df0': { x: 20, y: 20 },
  'dh0': { x: 20, y: 120 },
  'dh1': { x: 20, y: 220 },
  'ram': { x: 20, y: 320 },
  'utils': { x: 20, y: 420 },
  'trash': { x: 20, y: 520 }
};

// Initialize default workspace state
const createDefaultWorkspace = (): WorkspaceState => {
  return {
    currentDesktopId: 1,
    desktops: [
      {
        id: 1,
        name: 'Desktop 1',
        iconPositions: { ...defaultIconPositions },
        windows: [],
        backdrop: { ...defaultBackdrops[0] },
        active: true
      },
      {
        id: 2,
        name: 'Desktop 2',
        iconPositions: { ...defaultIconPositions },
        windows: [],
        backdrop: { ...defaultBackdrops[1] },
        active: false
      },
      {
        id: 3,
        name: 'Desktop 3',
        iconPositions: { ...defaultIconPositions },
        windows: [],
        backdrop: { ...defaultBackdrops[2] },
        active: false
      },
      {
        id: 4,
        name: 'Desktop 4',
        iconPositions: { ...defaultIconPositions },
        windows: [],
        backdrop: { ...defaultBackdrops[3] },
        active: false
      }
    ]
  };
};

// Load workspace state from localStorage
const loadWorkspaceState = (): WorkspaceState => {
  try {
    const stored = localStorage.getItem('webos-virtual-desktops');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Ensure all desktops have required properties
      parsed.desktops = parsed.desktops.map((desktop: VirtualDesktop) => ({
        ...desktop,
        iconPositions: desktop.iconPositions || { ...defaultIconPositions },
        windows: desktop.windows || [],
        backdrop: desktop.backdrop || defaultBackdrops[desktop.id - 1]
      }));
      return parsed;
    }
  } catch (error) {
    console.error('Failed to load virtual desktops state:', error);
  }
  return createDefaultWorkspace();
};

// Global workspace state
const workspaceState = ref<WorkspaceState>(loadWorkspaceState());

// Save workspace state to localStorage
const saveWorkspaceState = () => {
  try {
    localStorage.setItem('webos-virtual-desktops', JSON.stringify(workspaceState.value));
  } catch (error) {
    console.error('Failed to save virtual desktops state:', error);
  }
};

// Watch for changes and save to localStorage
watch(workspaceState, () => {
  saveWorkspaceState();
}, { deep: true });

export const useVirtualDesktops = () => {
  // Get current desktop
  const getCurrentDesktop = (): VirtualDesktop => {
    return workspaceState.value.desktops.find(d => d.id === workspaceState.value.currentDesktopId)
      || workspaceState.value.desktops[0];
  };

  // Get desktop by ID
  const getDesktopById = (id: number): VirtualDesktop | undefined => {
    return workspaceState.value.desktops.find(d => d.id === id);
  };

  // Switch to a specific desktop
  const switchToDesktop = (desktopId: number): boolean => {
    const targetDesktop = getDesktopById(desktopId);
    if (!targetDesktop) {
      console.error(`Desktop ${desktopId} not found`);
      return false;
    }

    // Mark current desktop as inactive
    const currentDesktop = getCurrentDesktop();
    if (currentDesktop) {
      currentDesktop.active = false;
    }

    // Activate target desktop
    targetDesktop.active = true;
    workspaceState.value.currentDesktopId = desktopId;

    return true;
  };

  // Update desktop name
  const updateDesktopName = (desktopId: number, newName: string) => {
    const desktop = getDesktopById(desktopId);
    if (desktop) {
      desktop.name = newName;
    }
  };

  // Update icon positions for current desktop
  const updateIconPositions = (positions: IconPositions) => {
    const currentDesktop = getCurrentDesktop();
    if (currentDesktop) {
      currentDesktop.iconPositions = { ...positions };
    }
  };

  // Update windows for current desktop
  const updateWindows = (windows: DesktopWindow[]) => {
    const currentDesktop = getCurrentDesktop();
    if (currentDesktop) {
      currentDesktop.windows = [...windows];
    }
  };

  // Update backdrop for current desktop
  const updateBackdrop = (backdrop: BackdropSettings) => {
    const currentDesktop = getCurrentDesktop();
    if (currentDesktop) {
      currentDesktop.backdrop = { ...backdrop };
    }
  };

  // Add window to current desktop
  const addWindow = (window: DesktopWindow) => {
    const currentDesktop = getCurrentDesktop();
    if (currentDesktop) {
      currentDesktop.windows.push(window);
    }
  };

  // Remove window from current desktop
  const removeWindow = (windowId: string) => {
    const currentDesktop = getCurrentDesktop();
    if (currentDesktop) {
      const index = currentDesktop.windows.findIndex(w => w.id === windowId);
      if (index !== -1) {
        currentDesktop.windows.splice(index, 1);
      }
    }
  };

  // Move window to another desktop
  const moveWindowToDesktop = (windowId: string, targetDesktopId: number) => {
    const currentDesktop = getCurrentDesktop();
    const targetDesktop = getDesktopById(targetDesktopId);

    if (!currentDesktop || !targetDesktop) {
      return false;
    }

    const windowIndex = currentDesktop.windows.findIndex(w => w.id === windowId);
    if (windowIndex === -1) {
      return false;
    }

    const window = currentDesktop.windows[windowIndex];
    currentDesktop.windows.splice(windowIndex, 1);
    targetDesktop.windows.push(window);

    return true;
  };

  // Get all desktops
  const getAllDesktops = (): VirtualDesktop[] => {
    return workspaceState.value.desktops;
  };

  // Reset to default state
  const resetToDefault = () => {
    workspaceState.value = createDefaultWorkspace();
  };

  // Get window count for a desktop
  const getWindowCount = (desktopId: number): number => {
    const desktop = getDesktopById(desktopId);
    return desktop ? desktop.windows.length : 0;
  };

  return {
    workspaceState,
    getCurrentDesktop,
    getDesktopById,
    switchToDesktop,
    updateDesktopName,
    updateIconPositions,
    updateWindows,
    updateBackdrop,
    addWindow,
    removeWindow,
    moveWindowToDesktop,
    getAllDesktops,
    resetToDefault,
    getWindowCount
  };
};

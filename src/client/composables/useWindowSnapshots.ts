import { ref } from 'vue';

export interface WindowSnapshot {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type WindowSnapshots = Record<string, WindowSnapshot>;

const STORAGE_KEY = 'webos-window-snapshots';

// Load snapshots from localStorage
const loadSnapshots = (): WindowSnapshots => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Failed to load window snapshots:', error);
    return {};
  }
};

// Save snapshots to localStorage
const saveSnapshots = (snapshots: WindowSnapshots): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots));
  } catch (error) {
    console.error('Failed to save window snapshots:', error);
  }
};

// In-memory snapshots
const snapshots = ref<WindowSnapshots>(loadSnapshots());

export const useWindowSnapshots = () => {
  /**
   * Get snapshot for a specific window type (by windowId)
   */
  const getSnapshot = (windowId: string): WindowSnapshot | null => {
    return snapshots.value[windowId] || null;
  };

  /**
   * Save snapshot for a specific window type
   */
  const saveSnapshot = (windowId: string, snapshot: WindowSnapshot): void => {
    snapshots.value[windowId] = snapshot;
    saveSnapshots(snapshots.value);
  };

  /**
   * Remove snapshot for a specific window type (Unsnapshot)
   */
  const removeSnapshot = (windowId: string): void => {
    delete snapshots.value[windowId];
    saveSnapshots(snapshots.value);
  };

  /**
   * Check if a snapshot exists for a window type
   */
  const hasSnapshot = (windowId: string): boolean => {
    return !!snapshots.value[windowId];
  };

  /**
   * Clear all snapshots
   */
  const clearAllSnapshots = (): void => {
    snapshots.value = {};
    saveSnapshots(snapshots.value);
  };

  /**
   * Get all snapshots (for debugging)
   */
  const getAllSnapshots = (): WindowSnapshots => {
    return { ...snapshots.value };
  };

  return {
    getSnapshot,
    saveSnapshot,
    removeSnapshot,
    hasSnapshot,
    clearAllSnapshots,
    getAllSnapshots
  };
};

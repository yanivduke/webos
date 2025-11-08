/**
 * Window History Tracker for WebOS
 * Tracks recently closed windows for easy restoration
 */

import type { WindowState } from './session-manager';

export interface WindowHistoryItem {
  id: string;
  window: WindowState;
  closedAt: number;
  closedFrom: string; // workspace ID where it was closed
  reopened: boolean;
}

export interface WindowHistoryConfig {
  maxHistorySize: number;
  storageKey: string;
  persistHistory: boolean;
  autoCleanupDays: number;
}

const DEFAULT_CONFIG: WindowHistoryConfig = {
  maxHistorySize: 20,
  storageKey: 'webos_window_history',
  persistHistory: true,
  autoCleanupDays: 7
};

export class WindowHistory {
  private config: WindowHistoryConfig;
  private history: WindowHistoryItem[];
  private onHistoryChangeCallback: (() => void) | null = null;

  constructor(config: Partial<WindowHistoryConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.history = [];

    if (this.config.persistHistory) {
      this.loadFromStorage();
      this.cleanupOldEntries();
    }
  }

  /**
   * Add window to history when closed
   */
  addToHistory(window: WindowState, workspaceId: string = 'default'): void {
    const historyItem: WindowHistoryItem = {
      id: this.generateId(),
      window: this.cloneWindowState(window),
      closedAt: Date.now(),
      closedFrom: workspaceId,
      reopened: false
    };

    // Add to beginning of array
    this.history.unshift(historyItem);

    // Limit size
    if (this.history.length > this.config.maxHistorySize) {
      this.history = this.history.slice(0, this.config.maxHistorySize);
    }

    if (this.config.persistHistory) {
      this.saveToStorage();
    }

    this.notifyChange();
  }

  /**
   * Get window from history
   */
  getHistoryItem(id: string): WindowHistoryItem | null {
    return this.history.find(item => item.id === id) || null;
  }

  /**
   * Get all history items
   */
  getHistory(includeReopened: boolean = false): WindowHistoryItem[] {
    if (includeReopened) {
      return [...this.history];
    }
    return this.history.filter(item => !item.reopened);
  }

  /**
   * Get recent history (last N items)
   */
  getRecentHistory(count: number = 5, includeReopened: boolean = false): WindowHistoryItem[] {
    const items = this.getHistory(includeReopened);
    return items.slice(0, count);
  }

  /**
   * Get history for specific workspace
   */
  getHistoryForWorkspace(workspaceId: string, includeReopened: boolean = false): WindowHistoryItem[] {
    return this.getHistory(includeReopened).filter(item => item.closedFrom === workspaceId);
  }

  /**
   * Get history by window type
   */
  getHistoryByType(type: string, includeReopened: boolean = false): WindowHistoryItem[] {
    return this.getHistory(includeReopened).filter(item => item.window.type === type);
  }

  /**
   * Restore window from history
   */
  restoreWindow(historyId: string): WindowState | null {
    const historyItem = this.history.find(item => item.id === historyId);
    if (!historyItem) {
      return null;
    }

    // Mark as reopened
    historyItem.reopened = true;

    if (this.config.persistHistory) {
      this.saveToStorage();
    }

    this.notifyChange();

    // Return cloned window state with new ID
    return {
      ...this.cloneWindowState(historyItem.window),
      id: this.generateWindowId()
    };
  }

  /**
   * Remove item from history
   */
  removeFromHistory(historyId: string): boolean {
    const index = this.history.findIndex(item => item.id === historyId);
    if (index === -1) {
      return false;
    }

    this.history.splice(index, 1);

    if (this.config.persistHistory) {
      this.saveToStorage();
    }

    this.notifyChange();
    return true;
  }

  /**
   * Clear all history
   */
  clearHistory(): void {
    this.history = [];

    if (this.config.persistHistory) {
      this.saveToStorage();
    }

    this.notifyChange();
  }

  /**
   * Clear reopened items
   */
  clearReopened(): void {
    this.history = this.history.filter(item => !item.reopened);

    if (this.config.persistHistory) {
      this.saveToStorage();
    }

    this.notifyChange();
  }

  /**
   * Search history
   */
  searchHistory(query: string): WindowHistoryItem[] {
    const lowerQuery = query.toLowerCase();
    return this.history.filter(item =>
      item.window.title.toLowerCase().includes(lowerQuery) ||
      item.window.type.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalClosed: number;
    totalReopened: number;
    closedToday: number;
    mostClosedType: string | null;
    averageLifetime: number;
  } {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    const closedToday = this.history.filter(item => item.closedAt > oneDayAgo).length;
    const reopened = this.history.filter(item => item.reopened).length;

    // Count by type
    const typeCounts: Record<string, number> = {};
    this.history.forEach(item => {
      const type = item.window.type;
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    const mostClosedType = Object.keys(typeCounts).length > 0
      ? Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0][0]
      : null;

    // Calculate average lifetime (simplified - time between creation and closing)
    // This would need window creation timestamps to be fully accurate
    const averageLifetime = 0; // Placeholder

    return {
      totalClosed: this.history.length,
      totalReopened: reopened,
      closedToday,
      mostClosedType,
      averageLifetime
    };
  }

  /**
   * Export history to JSON
   */
  exportHistory(): string {
    return JSON.stringify(this.history, null, 2);
  }

  /**
   * Import history from JSON
   */
  importHistory(json: string, merge: boolean = false): boolean {
    try {
      const items = JSON.parse(json) as WindowHistoryItem[];

      if (!Array.isArray(items)) {
        throw new Error('Invalid format: expected array');
      }

      if (merge) {
        // Merge with existing history
        const existingIds = new Set(this.history.map(item => item.id));
        const newItems = items.filter(item => !existingIds.has(item.id));
        this.history = [...newItems, ...this.history];
      } else {
        // Replace history
        this.history = items;
      }

      // Limit size
      if (this.history.length > this.config.maxHistorySize) {
        this.history = this.history.slice(0, this.config.maxHistorySize);
      }

      if (this.config.persistHistory) {
        this.saveToStorage();
      }

      this.notifyChange();
      return true;
    } catch (error) {
      console.error('Failed to import history:', error);
      return false;
    }
  }

  /**
   * Cleanup old entries
   */
  cleanupOldEntries(): void {
    const cutoffTime = Date.now() - this.config.autoCleanupDays * 24 * 60 * 60 * 1000;

    const originalLength = this.history.length;
    this.history = this.history.filter(item => item.closedAt > cutoffTime);

    if (this.history.length !== originalLength) {
      if (this.config.persistHistory) {
        this.saveToStorage();
      }
      this.notifyChange();
    }
  }

  /**
   * Set callback for history changes
   */
  onHistoryChange(callback: () => void): void {
    this.onHistoryChangeCallback = callback;
  }

  /**
   * Notify change
   */
  private notifyChange(): void {
    if (this.onHistoryChangeCallback) {
      this.onHistoryChangeCallback();
    }
  }

  /**
   * Clone window state
   */
  private cloneWindowState(window: WindowState): WindowState {
    return {
      ...window,
      data: JSON.parse(JSON.stringify(window.data))
    };
  }

  /**
   * Save to localStorage
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem(this.config.storageKey, JSON.stringify(this.history));
    } catch (error) {
      console.error('Failed to save window history to storage:', error);
    }
  }

  /**
   * Load from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.config.storageKey);
      if (stored) {
        this.history = JSON.parse(stored) as WindowHistoryItem[];
      }
    } catch (error) {
      console.error('Failed to load window history from storage:', error);
      this.history = [];
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate window ID
   */
  private generateWindowId(): string {
    return `window_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get quick restore list (most recent unopened windows)
   */
  getQuickRestoreList(count: number = 5): WindowHistoryItem[] {
    return this.history
      .filter(item => !item.reopened)
      .slice(0, count);
  }

  /**
   * Restore all windows from a specific time period
   */
  restoreFromPeriod(startTime: number, endTime: number): WindowState[] {
    const items = this.history.filter(
      item => item.closedAt >= startTime && item.closedAt <= endTime && !item.reopened
    );

    items.forEach(item => {
      item.reopened = true;
    });

    if (this.config.persistHistory) {
      this.saveToStorage();
    }

    this.notifyChange();

    return items.map(item => ({
      ...this.cloneWindowState(item.window),
      id: this.generateWindowId()
    }));
  }

  /**
   * Undo last close (restore most recently closed window)
   */
  undoLastClose(): WindowState | null {
    const lastClosed = this.history.find(item => !item.reopened);
    if (!lastClosed) {
      return null;
    }

    return this.restoreWindow(lastClosed.id);
  }

  /**
   * Get grouped history by date
   */
  getGroupedByDate(): Map<string, WindowHistoryItem[]> {
    const grouped = new Map<string, WindowHistoryItem[]>();

    this.history.forEach(item => {
      const date = new Date(item.closedAt);
      const dateKey = date.toLocaleDateString();

      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }

      grouped.get(dateKey)!.push(item);
    });

    return grouped;
  }

  /**
   * Get grouped history by workspace
   */
  getGroupedByWorkspace(): Map<string, WindowHistoryItem[]> {
    const grouped = new Map<string, WindowHistoryItem[]>();

    this.history.forEach(item => {
      const workspace = item.closedFrom;

      if (!grouped.has(workspace)) {
        grouped.set(workspace, []);
      }

      grouped.get(workspace)!.push(item);
    });

    return grouped;
  }

  /**
   * Get grouped history by type
   */
  getGroupedByType(): Map<string, WindowHistoryItem[]> {
    const grouped = new Map<string, WindowHistoryItem[]>();

    this.history.forEach(item => {
      const type = item.window.type;

      if (!grouped.has(type)) {
        grouped.set(type, []);
      }

      grouped.get(type)!.push(item);
    });

    return grouped;
  }
}

// Singleton instance
let windowHistoryInstance: WindowHistory | null = null;

export function getWindowHistory(): WindowHistory {
  if (!windowHistoryInstance) {
    windowHistoryInstance = new WindowHistory();
  }
  return windowHistoryInstance;
}

export function initializeWindowHistory(config?: Partial<WindowHistoryConfig>): WindowHistory {
  windowHistoryInstance = new WindowHistory(config);
  return windowHistoryInstance;
}

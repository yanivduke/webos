/**
 * Workspace Switcher for WebOS
 * Handles multiple workspace profiles with different window configurations
 */

import type { WindowState } from './session-manager';

export interface WorkspaceSettings {
  wallpaper?: string;
  theme?: string;
  iconLayout?: 'grid' | 'list';
  showSystemInfo?: boolean;
  autoHideMenuBar?: boolean;
}

export interface AutoSwitchSchedule {
  enabled: boolean;
  startTime: string; // "HH:MM" format
  endTime: string;
  days: number[]; // 0-6, Sunday-Saturday
}

export interface WorkspaceProfile {
  id: string;
  name: string;
  icon: string;
  color: string;
  sessionId: string | null; // Reference to saved session
  windows: WindowState[];
  settings: WorkspaceSettings;
  autoSwitch?: AutoSwitchSchedule;
  created: number;
  modified: number;
  order: number;
}

export interface WorkspaceSwitcherConfig {
  storageKey: string;
  maxWorkspaces: number;
  enableKeyboardShortcuts: boolean;
}

const DEFAULT_CONFIG: WorkspaceSwitcherConfig = {
  storageKey: 'webos_workspaces',
  maxWorkspaces: 9,
  enableKeyboardShortcuts: true
};

// Available workspace icons
export const WORKSPACE_ICONS = [
  '🖥️', '💼', '🏠', '💻', '🎮', '🎵', '🎨', '📚', '⚙️',
  '🔬', '📊', '📝', '🌐', '🎬', '📷', '🎯', '⭐', '🔥',
  '💎', '🚀', '🌟', '🎪', '🏆', '🎓'
];

// Predefined workspace colors (Amiga-compatible palette)
export const WORKSPACE_COLORS = [
  '#0055aa', // Amiga blue
  '#aa0055', // Magenta
  '#00aa55', // Green
  '#aa5500', // Orange
  '#5500aa', // Purple
  '#aa5555', // Red
  '#55aa00', // Lime
  '#0055aa', // Cyan
  '#ffaa00'  // Gold
];

export class WorkspaceSwitcher {
  private config: WorkspaceSwitcherConfig;
  private workspaces: Map<string, WorkspaceProfile>;
  private currentWorkspaceId: string | null = null;
  private keyboardShortcutHandlers: Map<string, (e: KeyboardEvent) => void>;
  private autoSwitchInterval: number | null = null;

  constructor(config: Partial<WorkspaceSwitcherConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.workspaces = new Map();
    this.keyboardShortcutHandlers = new Map();
    this.loadFromStorage();
    this.initializeDefaults();

    if (this.config.enableKeyboardShortcuts) {
      this.setupKeyboardShortcuts();
    }

    this.startAutoSwitchMonitor();
  }

  /**
   * Initialize default workspaces if none exist
   */
  private initializeDefaults(): void {
    if (this.workspaces.size === 0) {
      const defaultWorkspaces = [
        {
          name: 'Default',
          icon: '🖥️',
          color: '#0055aa',
          settings: {}
        },
        {
          name: 'Work',
          icon: '💼',
          color: '#aa5500',
          settings: {},
          autoSwitch: {
            enabled: false,
            startTime: '09:00',
            endTime: '17:00',
            days: [1, 2, 3, 4, 5] // Monday-Friday
          }
        },
        {
          name: 'Personal',
          icon: '🏠',
          color: '#00aa55',
          settings: {}
        },
        {
          name: 'Development',
          icon: '💻',
          color: '#5500aa',
          settings: {}
        },
        {
          name: 'Media',
          icon: '🎵',
          color: '#aa0055',
          settings: {}
        },
        {
          name: 'Gaming',
          icon: '🎮',
          color: '#aa5555',
          settings: {}
        }
      ];

      defaultWorkspaces.forEach((ws, index) => {
        this.createWorkspace(ws.name, ws.icon, ws.color, ws.settings, ws.autoSwitch, index);
      });

      // Set first workspace as current
      const firstWorkspace = Array.from(this.workspaces.values())[0];
      if (firstWorkspace) {
        this.currentWorkspaceId = firstWorkspace.id;
      }

      this.saveToStorage();
    }
  }

  /**
   * Create a new workspace
   */
  createWorkspace(
    name: string,
    icon: string = '🖥️',
    color: string = '#0055aa',
    settings: WorkspaceSettings = {},
    autoSwitch?: AutoSwitchSchedule,
    order?: number
  ): WorkspaceProfile {
    if (this.workspaces.size >= this.config.maxWorkspaces) {
      throw new Error(`Maximum workspace limit (${this.config.maxWorkspaces}) reached`);
    }

    const id = this.generateId();
    const now = Date.now();

    const workspace: WorkspaceProfile = {
      id,
      name,
      icon,
      color,
      sessionId: null,
      windows: [],
      settings,
      autoSwitch,
      created: now,
      modified: now,
      order: order ?? this.workspaces.size
    };

    this.workspaces.set(id, workspace);
    this.saveToStorage();

    return workspace;
  }

  /**
   * Update workspace
   */
  updateWorkspace(id: string, updates: Partial<WorkspaceProfile>): WorkspaceProfile | null {
    const workspace = this.workspaces.get(id);
    if (!workspace) {
      return null;
    }

    // Merge updates
    Object.assign(workspace, updates);
    workspace.modified = Date.now();

    this.workspaces.set(id, workspace);
    this.saveToStorage();

    return workspace;
  }

  /**
   * Delete workspace
   */
  deleteWorkspace(id: string): boolean {
    // Don't allow deletion if it's the only workspace
    if (this.workspaces.size <= 1) {
      return false;
    }

    // Don't allow deletion of current workspace without switching
    if (id === this.currentWorkspaceId) {
      const workspaces = this.getAllWorkspaces();
      const nextWorkspace = workspaces.find(w => w.id !== id);
      if (nextWorkspace) {
        this.currentWorkspaceId = nextWorkspace.id;
      }
    }

    const result = this.workspaces.delete(id);
    if (result) {
      this.saveToStorage();
    }

    return result;
  }

  /**
   * Get workspace by ID
   */
  getWorkspace(id: string): WorkspaceProfile | null {
    return this.workspaces.get(id) || null;
  }

  /**
   * Get all workspaces sorted by order
   */
  getAllWorkspaces(): WorkspaceProfile[] {
    return Array.from(this.workspaces.values()).sort((a, b) => a.order - b.order);
  }

  /**
   * Get current workspace
   */
  getCurrentWorkspace(): WorkspaceProfile | null {
    if (!this.currentWorkspaceId) {
      return null;
    }
    return this.workspaces.get(this.currentWorkspaceId) || null;
  }

  /**
   * Switch to workspace
   */
  switchWorkspace(id: string, saveCurrentState?: WindowState[]): WorkspaceProfile | null {
    const targetWorkspace = this.workspaces.get(id);
    if (!targetWorkspace) {
      return null;
    }

    // Save current workspace state if provided
    if (saveCurrentState && this.currentWorkspaceId) {
      const currentWorkspace = this.workspaces.get(this.currentWorkspaceId);
      if (currentWorkspace) {
        currentWorkspace.windows = this.cloneWindowStates(saveCurrentState);
        currentWorkspace.modified = Date.now();
        this.workspaces.set(this.currentWorkspaceId, currentWorkspace);
      }
    }

    this.currentWorkspaceId = id;
    this.saveToStorage();

    return targetWorkspace;
  }

  /**
   * Switch to next workspace
   */
  switchToNext(): WorkspaceProfile | null {
    const workspaces = this.getAllWorkspaces();
    if (workspaces.length === 0) {
      return null;
    }

    const currentIndex = workspaces.findIndex(w => w.id === this.currentWorkspaceId);
    const nextIndex = (currentIndex + 1) % workspaces.length;

    return this.switchWorkspace(workspaces[nextIndex].id);
  }

  /**
   * Switch to previous workspace
   */
  switchToPrevious(): WorkspaceProfile | null {
    const workspaces = this.getAllWorkspaces();
    if (workspaces.length === 0) {
      return null;
    }

    const currentIndex = workspaces.findIndex(w => w.id === this.currentWorkspaceId);
    const prevIndex = (currentIndex - 1 + workspaces.length) % workspaces.length;

    return this.switchWorkspace(workspaces[prevIndex].id);
  }

  /**
   * Switch by number (1-9)
   */
  switchByNumber(num: number): WorkspaceProfile | null {
    const workspaces = this.getAllWorkspaces();
    if (num < 1 || num > workspaces.length) {
      return null;
    }

    return this.switchWorkspace(workspaces[num - 1].id);
  }

  /**
   * Reorder workspaces
   */
  reorderWorkspaces(orderedIds: string[]): boolean {
    // Validate all IDs exist
    if (orderedIds.some(id => !this.workspaces.has(id))) {
      return false;
    }

    orderedIds.forEach((id, index) => {
      const workspace = this.workspaces.get(id);
      if (workspace) {
        workspace.order = index;
        workspace.modified = Date.now();
        this.workspaces.set(id, workspace);
      }
    });

    this.saveToStorage();
    return true;
  }

  /**
   * Duplicate workspace
   */
  duplicateWorkspace(id: string, newName?: string): WorkspaceProfile | null {
    const original = this.workspaces.get(id);
    if (!original) {
      return null;
    }

    if (this.workspaces.size >= this.config.maxWorkspaces) {
      throw new Error(`Maximum workspace limit (${this.config.maxWorkspaces}) reached`);
    }

    const newId = this.generateId();
    const now = Date.now();

    const duplicate: WorkspaceProfile = {
      ...original,
      id: newId,
      name: newName || `${original.name} (Copy)`,
      windows: this.cloneWindowStates(original.windows),
      settings: { ...original.settings },
      autoSwitch: original.autoSwitch ? { ...original.autoSwitch } : undefined,
      created: now,
      modified: now,
      order: this.workspaces.size
    };

    this.workspaces.set(newId, duplicate);
    this.saveToStorage();

    return duplicate;
  }

  /**
   * Setup keyboard shortcuts
   */
  private setupKeyboardShortcuts(): void {
    // Ctrl/Cmd + 1-9 for workspace switching
    for (let i = 1; i <= 9; i++) {
      const handler = (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === i.toString()) {
          e.preventDefault();
          this.switchByNumber(i);
        }
      };

      this.keyboardShortcutHandlers.set(`workspace-${i}`, handler);
      document.addEventListener('keydown', handler);
    }

    // Ctrl/Cmd + Tab for next workspace
    const nextHandler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        this.switchToNext();
      }
    };
    this.keyboardShortcutHandlers.set('workspace-next', nextHandler);
    document.addEventListener('keydown', nextHandler);

    // Ctrl/Cmd + Shift + Tab for previous workspace
    const prevHandler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Tab' && e.shiftKey) {
        e.preventDefault();
        this.switchToPrevious();
      }
    };
    this.keyboardShortcutHandlers.set('workspace-prev', prevHandler);
    document.addEventListener('keydown', prevHandler);
  }

  /**
   * Remove keyboard shortcuts
   */
  removeKeyboardShortcuts(): void {
    this.keyboardShortcutHandlers.forEach((handler, _key) => {
      document.removeEventListener('keydown', handler);
    });
    this.keyboardShortcutHandlers.clear();
  }

  /**
   * Start auto-switch monitor
   */
  private startAutoSwitchMonitor(): void {
    // Check every minute
    this.autoSwitchInterval = window.setInterval(() => {
      this.checkAutoSwitch();
    }, 60000);

    // Check immediately
    this.checkAutoSwitch();
  }

  /**
   * Check if any workspace should auto-switch
   */
  private checkAutoSwitch(): void {
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const workspaces = this.getAllWorkspaces();

    for (const workspace of workspaces) {
      if (!workspace.autoSwitch || !workspace.autoSwitch.enabled) {
        continue;
      }

      const schedule = workspace.autoSwitch;

      // Check if current day is in schedule
      if (!schedule.days.includes(currentDay)) {
        continue;
      }

      // Check if current time is within range
      if (currentTime >= schedule.startTime && currentTime < schedule.endTime) {
        // Should be in this workspace
        if (this.currentWorkspaceId !== workspace.id) {
          this.switchWorkspace(workspace.id);
          break; // Only switch to first matching workspace
        }
      }
    }
  }

  /**
   * Stop auto-switch monitor
   */
  stopAutoSwitchMonitor(): void {
    if (this.autoSwitchInterval !== null) {
      clearInterval(this.autoSwitchInterval);
      this.autoSwitchInterval = null;
    }
  }

  /**
   * Export workspace
   */
  exportWorkspace(id: string): string | null {
    const workspace = this.workspaces.get(id);
    if (!workspace) {
      return null;
    }

    return JSON.stringify(workspace, null, 2);
  }

  /**
   * Import workspace
   */
  importWorkspace(json: string): WorkspaceProfile | null {
    try {
      const workspace = JSON.parse(json) as WorkspaceProfile;

      if (!workspace.name) {
        throw new Error('Invalid workspace format');
      }

      if (this.workspaces.size >= this.config.maxWorkspaces) {
        throw new Error(`Maximum workspace limit (${this.config.maxWorkspaces}) reached`);
      }

      const newId = this.generateId();
      workspace.id = newId;
      workspace.modified = Date.now();
      workspace.order = this.workspaces.size;

      this.workspaces.set(newId, workspace);
      this.saveToStorage();

      return workspace;
    } catch (error) {
      console.error('Failed to import workspace:', error);
      return null;
    }
  }

  /**
   * Clone window states
   */
  private cloneWindowStates(windows: WindowState[]): WindowState[] {
    return windows.map(window => ({
      ...window,
      data: JSON.parse(JSON.stringify(window.data))
    }));
  }

  /**
   * Save to localStorage
   */
  private saveToStorage(): void {
    try {
      const data = {
        workspaces: Array.from(this.workspaces.entries()),
        currentWorkspaceId: this.currentWorkspaceId
      };
      localStorage.setItem(this.config.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save workspaces to storage:', error);
    }
  }

  /**
   * Load from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.config.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.workspaces = new Map(data.workspaces);
        this.currentWorkspaceId = data.currentWorkspaceId;
      }
    } catch (error) {
      console.error('Failed to load workspaces from storage:', error);
      this.workspaces = new Map();
      this.currentWorkspaceId = null;
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `workspace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.removeKeyboardShortcuts();
    this.stopAutoSwitchMonitor();
  }
}

// Singleton instance
let workspaceSwitcherInstance: WorkspaceSwitcher | null = null;

export function getWorkspaceSwitcher(): WorkspaceSwitcher {
  if (!workspaceSwitcherInstance) {
    workspaceSwitcherInstance = new WorkspaceSwitcher();
  }
  return workspaceSwitcherInstance;
}

export function initializeWorkspaceSwitcher(config?: Partial<WorkspaceSwitcherConfig>): WorkspaceSwitcher {
  if (workspaceSwitcherInstance) {
    workspaceSwitcherInstance.destroy();
  }
  workspaceSwitcherInstance = new WorkspaceSwitcher(config);
  return workspaceSwitcherInstance;
}

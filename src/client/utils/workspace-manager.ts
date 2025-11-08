/**
 * Virtual Desktops/Workspaces Manager
 * Manages up to 9 virtual workspaces with independent window states
 */

export interface WorkspaceWindow {
  id: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  component: any;
  data?: any;
}

export interface Workspace {
  id: number;
  name: string;
  windows: WorkspaceWindow[];
  background?: string;
  created: number;
  lastAccessed: number;
}

export interface WorkspaceManagerConfig {
  maxWorkspaces: number;
  currentWorkspace: number;
  persistState: boolean;
  showNotifications: boolean;
}

type WorkspaceChangeListener = (workspaceId: number) => void;
type WorkspaceUpdateListener = () => void;

class WorkspaceManager {
  private workspaces: Map<number, Workspace> = new Map();
  private config: WorkspaceManagerConfig = {
    maxWorkspaces: 9,
    currentWorkspace: 1,
    persistState: true,
    showNotifications: false
  };
  private changeListeners: Set<WorkspaceChangeListener> = new Set();
  private updateListeners: Set<WorkspaceUpdateListener> = new Set();

  constructor() {
    this.initialize();
  }

  /**
   * Initialize workspace manager with default workspace
   */
  private initialize() {
    // Load persisted state or create default workspace
    if (this.config.persistState) {
      this.loadState();
    }

    // Ensure at least one workspace exists
    if (this.workspaces.size === 0) {
      this.createWorkspace('Workspace 1');
    }

    // Set up keyboard shortcuts
    this.setupKeyboardShortcuts();
  }

  /**
   * Create a new workspace
   */
  createWorkspace(name?: string): number {
    if (this.workspaces.size >= this.config.maxWorkspaces) {
      throw new Error(`Maximum ${this.config.maxWorkspaces} workspaces allowed`);
    }

    // Find next available ID
    let id = 1;
    while (this.workspaces.has(id)) {
      id++;
    }

    const workspace: Workspace = {
      id,
      name: name || `Workspace ${id}`,
      windows: [],
      created: Date.now(),
      lastAccessed: Date.now()
    };

    this.workspaces.set(id, workspace);
    this.saveState();
    this.notifyUpdate();

    return id;
  }

  /**
   * Delete a workspace
   */
  deleteWorkspace(id: number): boolean {
    if (this.workspaces.size <= 1) {
      throw new Error('Cannot delete the last workspace');
    }

    if (!this.workspaces.has(id)) {
      return false;
    }

    // If deleting current workspace, switch to another
    if (this.config.currentWorkspace === id) {
      const nextId = this.getNextWorkspaceId(id);
      this.switchWorkspace(nextId);
    }

    this.workspaces.delete(id);
    this.saveState();
    this.notifyUpdate();

    return true;
  }

  /**
   * Switch to a different workspace
   */
  switchWorkspace(id: number): boolean {
    if (!this.workspaces.has(id)) {
      return false;
    }

    const previousWorkspace = this.config.currentWorkspace;
    this.config.currentWorkspace = id;

    // Update last accessed time
    const workspace = this.workspaces.get(id);
    if (workspace) {
      workspace.lastAccessed = Date.now();
    }

    this.saveState();
    this.notifyChange(id);

    if (this.config.showNotifications && previousWorkspace !== id) {
      const workspaceName = workspace?.name || `Workspace ${id}`;
      console.log(`Switched to ${workspaceName}`);
    }

    return true;
  }

  /**
   * Get current workspace ID
   */
  getCurrentWorkspaceId(): number {
    return this.config.currentWorkspace;
  }

  /**
   * Get current workspace
   */
  getCurrentWorkspace(): Workspace | undefined {
    return this.workspaces.get(this.config.currentWorkspace);
  }

  /**
   * Get workspace by ID
   */
  getWorkspace(id: number): Workspace | undefined {
    return this.workspaces.get(id);
  }

  /**
   * Get all workspaces
   */
  getAllWorkspaces(): Workspace[] {
    return Array.from(this.workspaces.values()).sort((a, b) => a.id - b.id);
  }

  /**
   * Rename workspace
   */
  renameWorkspace(id: number, name: string): boolean {
    const workspace = this.workspaces.get(id);
    if (!workspace) {
      return false;
    }

    workspace.name = name;
    this.saveState();
    this.notifyUpdate();
    return true;
  }

  /**
   * Set workspace background
   */
  setWorkspaceBackground(id: number, background: string): boolean {
    const workspace = this.workspaces.get(id);
    if (!workspace) {
      return false;
    }

    workspace.background = background;
    this.saveState();
    this.notifyUpdate();
    return true;
  }

  /**
   * Get windows for current workspace
   */
  getCurrentWindows(): WorkspaceWindow[] {
    const workspace = this.getCurrentWorkspace();
    return workspace ? [...workspace.windows] : [];
  }

  /**
   * Set windows for current workspace
   */
  setCurrentWindows(windows: WorkspaceWindow[]): void {
    const workspace = this.getCurrentWorkspace();
    if (workspace) {
      workspace.windows = [...windows];
      this.saveState();
      this.notifyUpdate();
    }
  }

  /**
   * Add window to current workspace
   */
  addWindow(window: WorkspaceWindow): void {
    const workspace = this.getCurrentWorkspace();
    if (workspace) {
      workspace.windows.push(window);
      this.saveState();
      this.notifyUpdate();
    }
  }

  /**
   * Remove window from current workspace
   */
  removeWindow(windowId: string): void {
    const workspace = this.getCurrentWorkspace();
    if (workspace) {
      workspace.windows = workspace.windows.filter(w => w.id !== windowId);
      this.saveState();
      this.notifyUpdate();
    }
  }

  /**
   * Update window in current workspace
   */
  updateWindow(windowId: string, updates: Partial<WorkspaceWindow>): void {
    const workspace = this.getCurrentWorkspace();
    if (workspace) {
      const window = workspace.windows.find(w => w.id === windowId);
      if (window) {
        Object.assign(window, updates);
        this.saveState();
        this.notifyUpdate();
      }
    }
  }

  /**
   * Move window to another workspace
   */
  moveWindowToWorkspace(windowId: string, targetWorkspaceId: number): boolean {
    const currentWorkspace = this.getCurrentWorkspace();
    const targetWorkspace = this.workspaces.get(targetWorkspaceId);

    if (!currentWorkspace || !targetWorkspace) {
      return false;
    }

    const windowIndex = currentWorkspace.windows.findIndex(w => w.id === windowId);
    if (windowIndex === -1) {
      return false;
    }

    const [window] = currentWorkspace.windows.splice(windowIndex, 1);
    targetWorkspace.windows.push(window);

    this.saveState();
    this.notifyUpdate();
    return true;
  }

  /**
   * Get workspace window count
   */
  getWorkspaceWindowCount(id: number): number {
    const workspace = this.workspaces.get(id);
    return workspace ? workspace.windows.length : 0;
  }

  /**
   * Check if workspace has windows
   */
  hasWindows(id: number): boolean {
    return this.getWorkspaceWindowCount(id) > 0;
  }

  /**
   * Get next workspace ID (circular)
   */
  private getNextWorkspaceId(currentId: number): number {
    const ids = Array.from(this.workspaces.keys()).sort((a, b) => a - b);
    const currentIndex = ids.indexOf(currentId);
    const nextIndex = (currentIndex + 1) % ids.length;
    return ids[nextIndex];
  }

  /**
   * Get previous workspace ID (circular)
   */
  private getPreviousWorkspaceId(currentId: number): number {
    const ids = Array.from(this.workspaces.keys()).sort((a, b) => a - b);
    const currentIndex = ids.indexOf(currentId);
    const prevIndex = (currentIndex - 1 + ids.length) % ids.length;
    return ids[prevIndex];
  }

  /**
   * Switch to next workspace
   */
  switchToNext(): void {
    const nextId = this.getNextWorkspaceId(this.config.currentWorkspace);
    this.switchWorkspace(nextId);
  }

  /**
   * Switch to previous workspace
   */
  switchToPrevious(): void {
    const prevId = this.getPreviousWorkspaceId(this.config.currentWorkspace);
    this.switchWorkspace(prevId);
  }

  /**
   * Set up keyboard shortcuts
   */
  private setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      // Ctrl+Alt+[1-9] to switch workspaces
      if (e.ctrlKey && e.altKey && !e.shiftKey) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= 9) {
          e.preventDefault();
          if (this.workspaces.has(num)) {
            this.switchWorkspace(num);
          }
        }
      }

      // Ctrl+Alt+Left/Right to switch to previous/next workspace
      if (e.ctrlKey && e.altKey && !e.shiftKey) {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          this.switchToNext();
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          this.switchToPrevious();
        }
      }
    });
  }

  /**
   * Subscribe to workspace changes
   */
  subscribe(listener: WorkspaceChangeListener): () => void {
    this.changeListeners.add(listener);
    return () => {
      this.changeListeners.delete(listener);
    };
  }

  /**
   * Subscribe to workspace updates (any change)
   */
  subscribeToUpdates(listener: WorkspaceUpdateListener): () => void {
    this.updateListeners.add(listener);
    return () => {
      this.updateListeners.delete(listener);
    };
  }

  /**
   * Notify listeners of workspace change
   */
  private notifyChange(workspaceId: number): void {
    this.changeListeners.forEach(listener => listener(workspaceId));
  }

  /**
   * Notify listeners of any workspace update
   */
  private notifyUpdate(): void {
    this.updateListeners.forEach(listener => listener());
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<WorkspaceManagerConfig>): void {
    this.config = { ...this.config, ...config };
    this.saveState();
  }

  /**
   * Get configuration
   */
  getConfig(): WorkspaceManagerConfig {
    return { ...this.config };
  }

  /**
   * Save state to localStorage
   */
  private saveState(): void {
    if (!this.config.persistState) {
      return;
    }

    try {
      const state = {
        config: this.config,
        workspaces: Array.from(this.workspaces.entries()).map(([id, workspace]) => ({
          id,
          name: workspace.name,
          background: workspace.background,
          created: workspace.created,
          lastAccessed: workspace.lastAccessed,
          windows: workspace.windows.map(w => ({
            id: w.id,
            title: w.title,
            x: w.x,
            y: w.y,
            width: w.width,
            height: w.height,
            // Don't persist component instances
            data: w.data
          }))
        }))
      };

      localStorage.setItem('webos-workspaces', JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to save workspace state', error);
    }
  }

  /**
   * Load state from localStorage
   */
  private loadState(): void {
    try {
      const saved = localStorage.getItem('webos-workspaces');
      if (!saved) {
        return;
      }

      const state = JSON.parse(saved);

      // Restore config
      if (state.config) {
        this.config = { ...this.config, ...state.config };
      }

      // Restore workspaces (but not windows - they'll be empty on reload)
      if (state.workspaces && Array.isArray(state.workspaces)) {
        this.workspaces.clear();
        state.workspaces.forEach((ws: any) => {
          this.workspaces.set(ws.id, {
            id: ws.id,
            name: ws.name,
            windows: [], // Windows are not persisted across page reloads
            background: ws.background,
            created: ws.created,
            lastAccessed: ws.lastAccessed
          });
        });
      }
    } catch (error) {
      console.warn('Failed to load workspace state', error);
    }
  }

  /**
   * Clear all data
   */
  clearAll(): void {
    this.workspaces.clear();
    this.createWorkspace('Workspace 1');
    this.config.currentWorkspace = 1;
    this.saveState();
    this.notifyUpdate();
  }

  /**
   * Export workspace configuration
   */
  export(): string {
    return JSON.stringify({
      config: this.config,
      workspaces: Array.from(this.workspaces.entries())
    });
  }

  /**
   * Import workspace configuration
   */
  import(data: string): boolean {
    try {
      const parsed = JSON.parse(data);
      this.config = parsed.config;
      this.workspaces = new Map(parsed.workspaces);
      this.saveState();
      this.notifyUpdate();
      return true;
    } catch (error) {
      console.error('Failed to import workspace configuration', error);
      return false;
    }
  }
}

// Singleton instance
const workspaceManager = new WorkspaceManager();

export default workspaceManager;

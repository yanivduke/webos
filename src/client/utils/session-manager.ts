/**
 * Session Manager for WebOS
 * Handles saving, restoring, and managing window sessions
 */

export interface WindowState {
  id: string;
  type: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  data: any;
  minimized: boolean;
  maximized: boolean;
  zIndex?: number;
}

export interface SessionProfile {
  id: string;
  name: string;
  windows: WindowState[];
  created: number;
  modified: number;
  thumbnail?: string;
  description?: string;
}

export interface SessionHistory {
  id: string;
  timestamp: number;
  windows: WindowState[];
}

export interface SessionManagerConfig {
  autoSaveInterval: number; // milliseconds
  maxHistoryLength: number;
  storageKey: string;
  historyKey: string;
}

const DEFAULT_CONFIG: SessionManagerConfig = {
  autoSaveInterval: 30000, // 30 seconds
  maxHistoryLength: 10,
  storageKey: 'webos_sessions',
  historyKey: 'webos_session_history'
};

export class SessionManager {
  private config: SessionManagerConfig;
  private sessions: Map<string, SessionProfile>;
  private history: SessionHistory[];
  private autoSaveTimer: number | null = null;
  private currentSessionId: string | null = null;
  private lastSavedState: string = '';

  constructor(config: Partial<SessionManagerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.sessions = new Map();
    this.history = [];
    this.loadFromStorage();
  }

  /**
   * Capture current window state
   */
  captureCurrentSession(windows: WindowState[]): WindowState[] {
    return windows.map(window => ({
      id: window.id,
      type: window.type,
      title: window.title,
      x: window.x,
      y: window.y,
      width: window.width,
      height: window.height,
      data: JSON.parse(JSON.stringify(window.data)), // Deep clone
      minimized: window.minimized || false,
      maximized: window.maximized || false,
      zIndex: window.zIndex
    }));
  }

  /**
   * Save current session with a name
   */
  saveSession(name: string, windows: WindowState[], description?: string): SessionProfile {
    const id = this.generateId();
    const now = Date.now();

    const profile: SessionProfile = {
      id,
      name,
      windows: this.captureCurrentSession(windows),
      created: now,
      modified: now,
      description
    };

    // Generate thumbnail (simplified representation)
    profile.thumbnail = this.generateThumbnail(profile.windows);

    this.sessions.set(id, profile);
    this.currentSessionId = id;
    this.saveToStorage();

    return profile;
  }

  /**
   * Update an existing session
   */
  updateSession(id: string, windows: WindowState[], name?: string, description?: string): SessionProfile | null {
    const session = this.sessions.get(id);
    if (!session) {
      return null;
    }

    session.windows = this.captureCurrentSession(windows);
    session.modified = Date.now();
    session.thumbnail = this.generateThumbnail(session.windows);

    if (name !== undefined) {
      session.name = name;
    }
    if (description !== undefined) {
      session.description = description;
    }

    this.sessions.set(id, session);
    this.saveToStorage();

    return session;
  }

  /**
   * Restore a saved session
   */
  restoreSession(profileId: string): WindowState[] | null {
    const profile = this.sessions.get(profileId);
    if (!profile) {
      return null;
    }

    this.currentSessionId = profileId;

    // Deep clone to prevent mutations
    return profile.windows.map(window => ({
      ...window,
      data: JSON.parse(JSON.stringify(window.data))
    }));
  }

  /**
   * Delete a session
   */
  deleteSession(profileId: string): boolean {
    const result = this.sessions.delete(profileId);
    if (result) {
      if (this.currentSessionId === profileId) {
        this.currentSessionId = null;
      }
      this.saveToStorage();
    }
    return result;
  }

  /**
   * Get all sessions
   */
  getAllSessions(): SessionProfile[] {
    return Array.from(this.sessions.values()).sort((a, b) => b.modified - a.modified);
  }

  /**
   * Get session by id
   */
  getSession(id: string): SessionProfile | null {
    return this.sessions.get(id) || null;
  }

  /**
   * Export session to JSON
   */
  exportSession(profileId: string): string | null {
    const profile = this.sessions.get(profileId);
    if (!profile) {
      return null;
    }

    return JSON.stringify(profile, null, 2);
  }

  /**
   * Import session from JSON
   */
  importSession(json: string): SessionProfile | null {
    try {
      const profile = JSON.parse(json) as SessionProfile;

      // Validate profile structure
      if (!profile.name || !Array.isArray(profile.windows)) {
        throw new Error('Invalid session format');
      }

      // Generate new ID to avoid conflicts
      const newId = this.generateId();
      profile.id = newId;
      profile.modified = Date.now();

      this.sessions.set(newId, profile);
      this.saveToStorage();

      return profile;
    } catch (error) {
      console.error('Failed to import session:', error);
      return null;
    }
  }

  /**
   * Export all sessions
   */
  exportAllSessions(): string {
    const allSessions = Array.from(this.sessions.values());
    return JSON.stringify(allSessions, null, 2);
  }

  /**
   * Import multiple sessions
   */
  importMultipleSessions(json: string): number {
    try {
      const profiles = JSON.parse(json) as SessionProfile[];

      if (!Array.isArray(profiles)) {
        throw new Error('Invalid format: expected array of sessions');
      }

      let importedCount = 0;
      profiles.forEach(profile => {
        if (profile.name && Array.isArray(profile.windows)) {
          const newId = this.generateId();
          profile.id = newId;
          profile.modified = Date.now();
          this.sessions.set(newId, profile);
          importedCount++;
        }
      });

      if (importedCount > 0) {
        this.saveToStorage();
      }

      return importedCount;
    } catch (error) {
      console.error('Failed to import sessions:', error);
      return 0;
    }
  }

  /**
   * Add state to history for undo functionality
   */
  addToHistory(windows: WindowState[]): void {
    const stateString = JSON.stringify(windows);

    // Don't add if identical to last state
    if (stateString === this.lastSavedState) {
      return;
    }

    this.lastSavedState = stateString;

    const historyItem: SessionHistory = {
      id: this.generateId(),
      timestamp: Date.now(),
      windows: this.captureCurrentSession(windows)
    };

    this.history.unshift(historyItem);

    // Limit history size
    if (this.history.length > this.config.maxHistoryLength) {
      this.history = this.history.slice(0, this.config.maxHistoryLength);
    }

    this.saveHistoryToStorage();
  }

  /**
   * Get session history
   */
  getHistory(): SessionHistory[] {
    return [...this.history];
  }

  /**
   * Restore from history
   */
  restoreFromHistory(historyId: string): WindowState[] | null {
    const historyItem = this.history.find(h => h.id === historyId);
    if (!historyItem) {
      return null;
    }

    return historyItem.windows.map(window => ({
      ...window,
      data: JSON.parse(JSON.stringify(window.data))
    }));
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.history = [];
    this.lastSavedState = '';
    this.saveHistoryToStorage();
  }

  /**
   * Auto-save current session
   */
  startAutoSave(getCurrentWindows: () => WindowState[]): void {
    this.stopAutoSave();

    this.autoSaveTimer = window.setInterval(() => {
      const windows = getCurrentWindows();
      if (windows.length > 0) {
        this.autoSaveCurrentSession(windows);
      }
    }, this.config.autoSaveInterval);
  }

  /**
   * Stop auto-save
   */
  stopAutoSave(): void {
    if (this.autoSaveTimer !== null) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  /**
   * Auto-save implementation
   */
  private autoSaveCurrentSession(windows: WindowState[]): void {
    const autoSaveId = '_autosave_';
    const existing = this.sessions.get(autoSaveId);

    if (existing) {
      this.updateSession(autoSaveId, windows);
    } else {
      const profile: SessionProfile = {
        id: autoSaveId,
        name: 'Auto-saved Session',
        windows: this.captureCurrentSession(windows),
        created: Date.now(),
        modified: Date.now(),
        description: 'Automatically saved session'
      };
      this.sessions.set(autoSaveId, profile);
    }

    this.addToHistory(windows);
    this.saveToStorage();
  }

  /**
   * Get auto-saved session
   */
  getAutoSavedSession(): SessionProfile | null {
    return this.sessions.get('_autosave_') || null;
  }

  /**
   * Restore last session (auto-saved)
   */
  restoreLastSession(): WindowState[] | null {
    const autoSave = this.getAutoSavedSession();
    if (autoSave && autoSave.windows.length > 0) {
      return this.restoreSession('_autosave_');
    }
    return null;
  }

  /**
   * Generate thumbnail representation
   */
  private generateThumbnail(windows: WindowState[]): string {
    // Create a simple data representation of window layout
    // This could be enhanced to generate actual canvas thumbnails
    const thumbnailData = {
      count: windows.length,
      layout: windows.map(w => ({
        x: Math.round(w.x / 10),
        y: Math.round(w.y / 10),
        w: Math.round(w.width / 10),
        h: Math.round(w.height / 10),
        type: w.type
      }))
    };

    return JSON.stringify(thumbnailData);
  }

  /**
   * Save sessions to localStorage
   */
  private saveToStorage(): void {
    try {
      const sessionsArray = Array.from(this.sessions.entries());
      localStorage.setItem(this.config.storageKey, JSON.stringify(sessionsArray));
    } catch (error) {
      console.error('Failed to save sessions to storage:', error);
    }
  }

  /**
   * Load sessions from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.config.storageKey);
      if (stored) {
        const sessionsArray = JSON.parse(stored) as [string, SessionProfile][];
        this.sessions = new Map(sessionsArray);
      }

      const historyStored = localStorage.getItem(this.config.historyKey);
      if (historyStored) {
        this.history = JSON.parse(historyStored) as SessionHistory[];
      }
    } catch (error) {
      console.error('Failed to load sessions from storage:', error);
      this.sessions = new Map();
      this.history = [];
    }
  }

  /**
   * Save history to localStorage
   */
  private saveHistoryToStorage(): void {
    try {
      localStorage.setItem(this.config.historyKey, JSON.stringify(this.history));
    } catch (error) {
      console.error('Failed to save history to storage:', error);
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalSessions: number;
    totalWindows: number;
    oldestSession: number | null;
    newestSession: number | null;
  } {
    const sessions = Array.from(this.sessions.values()).filter(s => s.id !== '_autosave_');

    return {
      totalSessions: sessions.length,
      totalWindows: sessions.reduce((sum, s) => sum + s.windows.length, 0),
      oldestSession: sessions.length > 0 ? Math.min(...sessions.map(s => s.created)) : null,
      newestSession: sessions.length > 0 ? Math.max(...sessions.map(s => s.modified)) : null
    };
  }

  /**
   * Clear all sessions (except auto-save)
   */
  clearAllSessions(): void {
    const autoSave = this.sessions.get('_autosave_');
    this.sessions.clear();
    if (autoSave) {
      this.sessions.set('_autosave_', autoSave);
    }
    this.currentSessionId = null;
    this.saveToStorage();
  }

  /**
   * Duplicate session
   */
  duplicateSession(profileId: string, newName?: string): SessionProfile | null {
    const original = this.sessions.get(profileId);
    if (!original) {
      return null;
    }

    const newId = this.generateId();
    const now = Date.now();

    const duplicate: SessionProfile = {
      ...original,
      id: newId,
      name: newName || `${original.name} (Copy)`,
      created: now,
      modified: now,
      windows: this.captureCurrentSession(original.windows)
    };

    this.sessions.set(newId, duplicate);
    this.saveToStorage();

    return duplicate;
  }

  /**
   * Search sessions by name
   */
  searchSessions(query: string): SessionProfile[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.sessions.values())
      .filter(s => s.id !== '_autosave_')
      .filter(s =>
        s.name.toLowerCase().includes(lowerQuery) ||
        (s.description && s.description.toLowerCase().includes(lowerQuery))
      )
      .sort((a, b) => b.modified - a.modified);
  }

  /**
   * Get current session ID
   */
  getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }

  /**
   * Rename session
   */
  renameSession(profileId: string, newName: string): boolean {
    const session = this.sessions.get(profileId);
    if (!session) {
      return false;
    }

    session.name = newName;
    session.modified = Date.now();
    this.sessions.set(profileId, session);
    this.saveToStorage();

    return true;
  }

  /**
   * Cleanup old auto-saves from history
   */
  cleanupOldHistory(olderThanMs: number = 24 * 60 * 60 * 1000): void {
    const cutoff = Date.now() - olderThanMs;
    this.history = this.history.filter(h => h.timestamp > cutoff);
    this.saveHistoryToStorage();
  }
}

// Singleton instance
let sessionManagerInstance: SessionManager | null = null;

export function getSessionManager(): SessionManager {
  if (!sessionManagerInstance) {
    sessionManagerInstance = new SessionManager();
  }
  return sessionManagerInstance;
}

export function initializeSessionManager(config?: Partial<SessionManagerConfig>): SessionManager {
  sessionManagerInstance = new SessionManager(config);
  return sessionManagerInstance;
}

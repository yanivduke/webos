/**
 * Keyboard Shortcuts Manager for WebOS
 * Handles global keyboard shortcut registration, conflict detection, and persistence
 */

export interface ShortcutModifiers {
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
}

export interface ShortcutDefinition {
  id: string;
  key: string;
  modifiers: ShortcutModifiers;
  action: () => void;
  description: string;
  category: 'file' | 'edit' | 'view' | 'window' | 'tools' | 'help';
  enabled?: boolean;
}

export interface ShortcutProfile {
  name: string;
  version: string;
  shortcuts: Array<{
    id: string;
    key: string;
    modifiers: ShortcutModifiers;
    enabled: boolean;
  }>;
}

class KeyboardManager {
  private shortcuts: Map<string, ShortcutDefinition> = new Map();
  private keyMap: Map<string, string> = new Map(); // keyCombo -> shortcut ID
  private listener: ((e: KeyboardEvent) => void) | null = null;
  private enabled: boolean = true;
  private readonly STORAGE_KEY = 'webos_keyboard_shortcuts';

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Initialize the keyboard manager and start listening for key events
   */
  initialize(): void {
    this.listener = this.handleKeyPress.bind(this);
    document.addEventListener('keydown', this.listener);
  }

  /**
   * Clean up event listeners
   */
  destroy(): void {
    if (this.listener) {
      document.removeEventListener('keydown', this.listener);
      this.listener = null;
    }
  }

  /**
   * Register a new keyboard shortcut
   */
  registerShortcut(shortcut: ShortcutDefinition): boolean {
    // Check for conflicts
    const keyCombo = this.getKeyCombo(shortcut.key, shortcut.modifiers);
    const existingId = this.keyMap.get(keyCombo);

    if (existingId && existingId !== shortcut.id) {
      const existing = this.shortcuts.get(existingId);
      console.warn(
        `Shortcut conflict: ${keyCombo} is already bound to "${existing?.description}" (${existingId})`
      );
      return false;
    }

    // Remove old key combo if this shortcut ID already exists
    const existing = this.shortcuts.get(shortcut.id);
    if (existing) {
      const oldCombo = this.getKeyCombo(existing.key, existing.modifiers);
      this.keyMap.delete(oldCombo);
    }

    // Register the shortcut
    this.shortcuts.set(shortcut.id, { ...shortcut, enabled: shortcut.enabled !== false });
    this.keyMap.set(keyCombo, shortcut.id);

    this.saveToStorage();
    return true;
  }

  /**
   * Unregister a keyboard shortcut
   */
  unregisterShortcut(id: string): boolean {
    const shortcut = this.shortcuts.get(id);
    if (!shortcut) return false;

    const keyCombo = this.getKeyCombo(shortcut.key, shortcut.modifiers);
    this.keyMap.delete(keyCombo);
    this.shortcuts.delete(id);

    this.saveToStorage();
    return true;
  }

  /**
   * Update an existing shortcut with new key binding
   */
  updateShortcut(id: string, key: string, modifiers: ShortcutModifiers): boolean {
    const shortcut = this.shortcuts.get(id);
    if (!shortcut) return false;

    // Remove old binding
    const oldCombo = this.getKeyCombo(shortcut.key, shortcut.modifiers);
    this.keyMap.delete(oldCombo);

    // Check for conflicts with new binding
    const newCombo = this.getKeyCombo(key, modifiers);
    const conflictId = this.keyMap.get(newCombo);

    if (conflictId && conflictId !== id) {
      // Restore old binding
      this.keyMap.set(oldCombo, id);
      return false;
    }

    // Update shortcut
    shortcut.key = key;
    shortcut.modifiers = modifiers;
    this.keyMap.set(newCombo, id);

    this.saveToStorage();
    return true;
  }

  /**
   * Toggle a shortcut's enabled state
   */
  toggleShortcut(id: string, enabled: boolean): boolean {
    const shortcut = this.shortcuts.get(id);
    if (!shortcut) return false;

    shortcut.enabled = enabled;
    this.saveToStorage();
    return true;
  }

  /**
   * Get all registered shortcuts
   */
  getAllShortcuts(): ShortcutDefinition[] {
    return Array.from(this.shortcuts.values());
  }

  /**
   * Get shortcuts by category
   */
  getShortcutsByCategory(category: string): ShortcutDefinition[] {
    return Array.from(this.shortcuts.values()).filter(s => s.category === category);
  }

  /**
   * Get a specific shortcut by ID
   */
  getShortcut(id: string): ShortcutDefinition | undefined {
    return this.shortcuts.get(id);
  }

  /**
   * Check if a key combination is already in use
   */
  checkConflict(key: string, modifiers: ShortcutModifiers, excludeId?: string): string | null {
    const keyCombo = this.getKeyCombo(key, modifiers);
    const existingId = this.keyMap.get(keyCombo);

    if (existingId && existingId !== excludeId) {
      return existingId;
    }

    return null;
  }

  /**
   * Handle keyboard events
   */
  private handleKeyPress(e: KeyboardEvent): void {
    if (!this.enabled) return;

    // Don't trigger shortcuts when typing in input fields
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      // Allow Escape key even in input fields
      if (e.key !== 'Escape') {
        return;
      }
    }

    const key = this.normalizeKey(e.key);
    const modifiers: ShortcutModifiers = {
      ctrl: e.ctrlKey,
      alt: e.altKey,
      shift: e.shiftKey,
      meta: e.metaKey
    };

    const keyCombo = this.getKeyCombo(key, modifiers);
    const shortcutId = this.keyMap.get(keyCombo);

    if (shortcutId) {
      const shortcut = this.shortcuts.get(shortcutId);
      if (shortcut && shortcut.enabled !== false) {
        e.preventDefault();
        e.stopPropagation();

        try {
          shortcut.action();
        } catch (error) {
          console.error(`Error executing shortcut ${shortcutId}:`, error);
        }
      }
    }
  }

  /**
   * Generate a unique key combination string
   */
  private getKeyCombo(key: string, modifiers: ShortcutModifiers): string {
    const parts: string[] = [];

    if (modifiers.ctrl) parts.push('ctrl');
    if (modifiers.alt) parts.push('alt');
    if (modifiers.shift) parts.push('shift');
    if (modifiers.meta) parts.push('meta');

    parts.push(this.normalizeKey(key));

    return parts.join('+').toLowerCase();
  }

  /**
   * Normalize key names for consistency
   */
  private normalizeKey(key: string): string {
    const normalized: Record<string, string> = {
      ' ': 'space',
      'escape': 'esc',
      'arrowup': 'up',
      'arrowdown': 'down',
      'arrowleft': 'left',
      'arrowright': 'right',
      'delete': 'del'
    };

    const lower = key.toLowerCase();
    return normalized[lower] || lower;
  }

  /**
   * Format a shortcut for display
   */
  formatShortcut(shortcut: ShortcutDefinition): string {
    const parts: string[] = [];

    // Use platform-appropriate modifier names
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

    if (shortcut.modifiers.ctrl) parts.push(isMac ? '⌃' : 'Ctrl');
    if (shortcut.modifiers.alt) parts.push(isMac ? '⌥' : 'Alt');
    if (shortcut.modifiers.shift) parts.push(isMac ? '⇧' : 'Shift');
    if (shortcut.modifiers.meta) parts.push(isMac ? '⌘' : 'Win');

    parts.push(shortcut.key.toUpperCase());

    return parts.join(isMac ? '' : '+');
  }

  /**
   * Export current shortcuts as a profile
   */
  exportProfile(name: string = 'Default'): ShortcutProfile {
    const shortcuts = Array.from(this.shortcuts.values()).map(s => ({
      id: s.id,
      key: s.key,
      modifiers: s.modifiers,
      enabled: s.enabled !== false
    }));

    return {
      name,
      version: '1.0',
      shortcuts
    };
  }

  /**
   * Import shortcuts from a profile
   */
  importProfile(profile: ShortcutProfile): boolean {
    try {
      // Validate profile
      if (!profile.shortcuts || !Array.isArray(profile.shortcuts)) {
        throw new Error('Invalid profile format');
      }

      // Update existing shortcuts with profile data
      for (const profileShortcut of profile.shortcuts) {
        const existing = this.shortcuts.get(profileShortcut.id);
        if (existing) {
          this.updateShortcut(
            profileShortcut.id,
            profileShortcut.key,
            profileShortcut.modifiers
          );
          this.toggleShortcut(profileShortcut.id, profileShortcut.enabled);
        }
      }

      this.saveToStorage();
      return true;
    } catch (error) {
      console.error('Failed to import profile:', error);
      return false;
    }
  }

  /**
   * Reset all shortcuts to defaults
   */
  resetToDefaults(): void {
    // Keep the action callbacks but restore default key bindings
    const defaults = this.getDefaultShortcuts();

    for (const [id] of this.shortcuts.entries()) {
      const defaultShortcut = defaults.find(d => d.id === id);
      if (defaultShortcut) {
        this.updateShortcut(id, defaultShortcut.key, defaultShortcut.modifiers);
        this.toggleShortcut(id, true);
      }
    }
  }

  /**
   * Get default shortcuts configuration
   */
  private getDefaultShortcuts(): Array<Omit<ShortcutDefinition, 'action'>> {
    return [
      { id: 'new-window', key: 'n', modifiers: { ctrl: true }, description: 'New Window', category: 'file' },
      { id: 'close-window', key: 'w', modifiers: { ctrl: true }, description: 'Close Window', category: 'file' },
      { id: 'quit', key: 'q', modifiers: { ctrl: true }, description: 'Quit Application', category: 'file' },
      { id: 'command-palette', key: 'k', modifiers: { ctrl: true }, description: 'Open Command Palette', category: 'tools' },
      { id: 'quick-look', key: 'space', modifiers: {}, description: 'Quick Look', category: 'view' },
      { id: 'select-all', key: 'a', modifiers: { ctrl: true }, description: 'Select All', category: 'edit' },
      { id: 'copy', key: 'c', modifiers: { ctrl: true }, description: 'Copy', category: 'edit' },
      { id: 'paste', key: 'v', modifiers: { ctrl: true }, description: 'Paste', category: 'edit' },
      { id: 'cut', key: 'x', modifiers: { ctrl: true }, description: 'Cut', category: 'edit' },
      { id: 'undo', key: 'z', modifiers: { ctrl: true }, description: 'Undo', category: 'edit' },
      { id: 'redo', key: 'y', modifiers: { ctrl: true }, description: 'Redo', category: 'edit' },
      { id: 'find', key: 'f', modifiers: { ctrl: true }, description: 'Find', category: 'edit' },
      { id: 'refresh', key: 'r', modifiers: { ctrl: true }, description: 'Refresh', category: 'view' },
      { id: 'minimize', key: 'm', modifiers: { ctrl: true }, description: 'Minimize Window', category: 'window' },
      { id: 'maximize', key: 'up', modifiers: { ctrl: true }, description: 'Maximize Window', category: 'window' },
      { id: 'preferences', key: ',', modifiers: { ctrl: true }, description: 'Open Preferences', category: 'tools' },
      { id: 'help', key: 'f1', modifiers: {}, description: 'Open Help', category: 'help' },
      { id: 'escape', key: 'esc', modifiers: {}, description: 'Cancel/Close', category: 'view' }
    ];
  }

  /**
   * Save shortcuts to localStorage
   */
  private saveToStorage(): void {
    try {
      const profile = this.exportProfile('User Settings');
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(profile));
    } catch (error) {
      console.error('Failed to save shortcuts to storage:', error);
    }
  }

  /**
   * Load shortcuts from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const profile: ShortcutProfile = JSON.parse(stored);
        // Store for later use when actions are registered
        (this as any)._storedProfile = profile;
      }
    } catch (error) {
      console.error('Failed to load shortcuts from storage:', error);
    }
  }

  /**
   * Apply stored profile if it exists (call after registering all actions)
   */
  applyStoredProfile(): void {
    const profile = (this as any)._storedProfile;
    if (profile) {
      this.importProfile(profile);
      delete (this as any)._storedProfile;
    }
  }

  /**
   * Enable or disable the keyboard manager
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Check if keyboard manager is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

// Export singleton instance
export const keyboardManager = new KeyboardManager();
export default keyboardManager;

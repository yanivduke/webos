/**
 * Accessibility Manager
 *
 * Centralized accessibility settings and management system for WebOS.
 * Handles screen reader support, visual adjustments, motion preferences,
 * and keyboard navigation enhancements.
 */

export interface AccessibilitySettings {
  screenReader: boolean;
  screenReaderVerbosity: 'low' | 'medium' | 'high';
  highContrast: boolean;
  textScale: number; // 100-200 (percentage)
  reducedMotion: boolean;
  colorBlindMode: 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia' | 'monochromacy';
  focusIndicators: boolean;
  keyboardNavigationHelp: boolean;
  voiceCommands: boolean; // Experimental
}

export interface AriaLiveRegion {
  id: string;
  element: HTMLElement;
  politeness: 'polite' | 'assertive';
}

class AccessibilityManager {
  private settings: AccessibilitySettings;
  private liveRegions: Map<string, AriaLiveRegion>;
  private focusTrapStack: HTMLElement[];
  private listeners: Set<(settings: AccessibilitySettings) => void>;
  private readonly STORAGE_KEY = 'webos_accessibility_settings';

  constructor() {
    this.settings = this.getDefaultSettings();
    this.liveRegions = new Map();
    this.focusTrapStack = [];
    this.listeners = new Set();

    this.loadSettings();
    this.initializeAriaRegions();
    this.applySettings();
  }

  /**
   * Get default accessibility settings
   */
  private getDefaultSettings(): AccessibilitySettings {
    return {
      screenReader: false,
      screenReaderVerbosity: 'medium',
      highContrast: false,
      textScale: 100,
      reducedMotion: false,
      colorBlindMode: 'none',
      focusIndicators: true,
      keyboardNavigationHelp: false,
      voiceCommands: false
    };
  }

  /**
   * Load settings from localStorage
   */
  private loadSettings(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.settings = { ...this.getDefaultSettings(), ...parsed };
      }
    } catch (error) {
      console.error('Failed to load accessibility settings:', error);
    }
  }

  /**
   * Save settings to localStorage
   */
  private saveSettings(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error('Failed to save accessibility settings:', error);
    }
  }

  /**
   * Initialize ARIA live regions for announcements
   */
  private initializeAriaRegions(): void {
    // Create polite live region
    const politeRegion = document.createElement('div');
    politeRegion.id = 'aria-live-polite';
    politeRegion.className = 'sr-only';
    politeRegion.setAttribute('aria-live', 'polite');
    politeRegion.setAttribute('aria-atomic', 'true');
    document.body.appendChild(politeRegion);

    this.liveRegions.set('polite', {
      id: 'polite',
      element: politeRegion,
      politeness: 'polite'
    });

    // Create assertive live region
    const assertiveRegion = document.createElement('div');
    assertiveRegion.id = 'aria-live-assertive';
    assertiveRegion.className = 'sr-only';
    assertiveRegion.setAttribute('aria-live', 'assertive');
    assertiveRegion.setAttribute('aria-atomic', 'true');
    document.body.appendChild(assertiveRegion);

    this.liveRegions.set('assertive', {
      id: 'assertive',
      element: assertiveRegion,
      politeness: 'assertive'
    });
  }

  /**
   * Apply all accessibility settings to the DOM
   */
  private applySettings(): void {
    const root = document.documentElement;

    // High contrast mode
    if (this.settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Text scale
    root.style.fontSize = `${this.settings.textScale}%`;

    // Reduced motion
    if (this.settings.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }

    // Color blind mode
    root.setAttribute('data-colorblind-mode', this.settings.colorBlindMode);

    // Focus indicators
    if (this.settings.focusIndicators) {
      root.classList.add('show-focus-indicators');
    } else {
      root.classList.remove('show-focus-indicators');
    }

    // Screen reader
    root.setAttribute('data-screen-reader', this.settings.screenReader.toString());

    this.notifyListeners();
  }

  /**
   * Get current accessibility settings
   */
  getSettings(): AccessibilitySettings {
    return { ...this.settings };
  }

  /**
   * Update accessibility settings
   */
  updateSettings(updates: Partial<AccessibilitySettings>): void {
    this.settings = { ...this.settings, ...updates };
    this.saveSettings();
    this.applySettings();
  }

  /**
   * Reset settings to defaults
   */
  resetSettings(): void {
    this.settings = this.getDefaultSettings();
    this.saveSettings();
    this.applySettings();
  }

  /**
   * Enable screen reader mode
   */
  enableScreenReader(enabled: boolean): void {
    this.updateSettings({ screenReader: enabled });
    if (enabled) {
      this.announce('Screen reader enabled', 'polite');
    }
  }

  /**
   * Set text scale (100-200%)
   */
  setTextScale(scale: number): void {
    const clampedScale = Math.max(100, Math.min(200, scale));
    this.updateSettings({ textScale: clampedScale });
  }

  /**
   * Set color blind mode
   */
  setColorBlindMode(mode: AccessibilitySettings['colorBlindMode']): void {
    this.updateSettings({ colorBlindMode: mode });
    if (mode !== 'none') {
      this.announce(`Color blind mode set to ${mode}`, 'polite');
    }
  }

  /**
   * Toggle reduced motion
   */
  toggleReducedMotion(enabled: boolean): void {
    this.updateSettings({ reducedMotion: enabled });
  }

  /**
   * Toggle high contrast mode
   */
  toggleHighContrast(enabled: boolean): void {
    this.updateSettings({ highContrast: enabled });
    if (enabled) {
      this.announce('High contrast mode enabled', 'polite');
    }
  }

  /**
   * Announce message to screen reader
   */
  announce(message: string, politeness: 'polite' | 'assertive' = 'polite'): void {
    if (!this.settings.screenReader) return;

    const region = this.liveRegions.get(politeness);
    if (region) {
      // Clear and set new message to trigger announcement
      region.element.textContent = '';
      setTimeout(() => {
        region.element.textContent = message;
      }, 100);
    }
  }

  /**
   * Add focus trap to element (pushes to stack)
   */
  addFocusTrap(element: HTMLElement): void {
    this.focusTrapStack.push(element);
  }

  /**
   * Remove focus trap from element (pops from stack)
   */
  removeFocusTrap(element: HTMLElement): void {
    const index = this.focusTrapStack.indexOf(element);
    if (index > -1) {
      this.focusTrapStack.splice(index, 1);
    }
  }

  /**
   * Get currently active focus trap
   */
  getActiveFocusTrap(): HTMLElement | null {
    return this.focusTrapStack.length > 0
      ? this.focusTrapStack[this.focusTrapStack.length - 1]
      : null;
  }

  /**
   * Get all focusable elements within a container
   */
  getFocusableElements(container: HTMLElement): HTMLElement[] {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');

    return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors));
  }

  /**
   * Focus first focusable element in container
   */
  focusFirstElement(container: HTMLElement): void {
    const focusable = this.getFocusableElements(container);
    if (focusable.length > 0) {
      focusable[0].focus();
    }
  }

  /**
   * Focus last focusable element in container
   */
  focusLastElement(container: HTMLElement): void {
    const focusable = this.getFocusableElements(container);
    if (focusable.length > 0) {
      focusable[focusable.length - 1].focus();
    }
  }

  /**
   * Add settings change listener
   */
  addListener(callback: (settings: AccessibilitySettings) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners of settings change
   */
  private notifyListeners(): void {
    this.listeners.forEach(callback => callback(this.settings));
  }

  /**
   * Check if user prefers reduced motion (system level)
   */
  prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Check if user prefers high contrast (system level)
   */
  prefersHighContrast(): boolean {
    return window.matchMedia('(prefers-contrast: high)').matches;
  }

  /**
   * Auto-detect system preferences and apply
   */
  applySystemPreferences(): void {
    const updates: Partial<AccessibilitySettings> = {};

    if (this.prefersReducedMotion()) {
      updates.reducedMotion = true;
    }

    if (this.prefersHighContrast()) {
      updates.highContrast = true;
    }

    if (Object.keys(updates).length > 0) {
      this.updateSettings(updates);
    }
  }

  /**
   * Get keyboard shortcut map for accessibility features
   */
  getKeyboardShortcuts(): Record<string, string> {
    return {
      'Alt + A': 'Open Accessibility Preferences',
      'Alt + H': 'Toggle High Contrast',
      'Alt + +': 'Increase Text Size',
      'Alt + -': 'Decrease Text Size',
      'Tab': 'Navigate forward',
      'Shift + Tab': 'Navigate backward',
      'Enter / Space': 'Activate element',
      'Escape': 'Close dialog / Cancel',
      'Arrow Keys': 'Navigate lists and menus',
      'Home': 'Jump to first item',
      'End': 'Jump to last item'
    };
  }
}

// Export singleton instance
export const accessibilityManager = new AccessibilityManager();

// Auto-detect system preferences on load
if (typeof window !== 'undefined') {
  accessibilityManager.applySystemPreferences();
}

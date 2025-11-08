/**
 * Theme Manager for WebOS
 * Handles theme application, persistence, and management
 */

export interface ThemeColors {
  primary: string;
  background: string;
  text: string;
  textInverse: string;
  border: string;
  borderLight: string;
  borderDark: string;
  windowChrome: string;
  windowTitle: string;
  windowTitleText: string;
  highlight: string;
  highlightText: string;
  shadow: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  disabled: string;
  inputBg: string;
  inputText: string;
  inputBorder: string;
  scrollbarTrack: string;
  scrollbarThumb: string;
  menuBg: string;
  menuText: string;
  menuHighlight: string;
  menuHighlightText: string;
}

export interface ThemeFonts {
  primary: string;
  secondary: string;
  size: {
    small: string;
    medium: string;
    large: string;
  };
}

export interface ThemeWindowChrome {
  borderWidth: string;
  borderRadius: string;
  shadow: string;
  titleBarHeight: string;
}

export interface ThemeSpacing {
  small: string;
  medium: string;
  large: string;
}

export interface ThemeAnimation {
  duration: string;
  easing: string;
}

export interface ThemeDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  colors: ThemeColors;
  fonts: ThemeFonts;
  windowChrome: ThemeWindowChrome;
  spacing: ThemeSpacing;
  animation: ThemeAnimation;
}

class ThemeManager {
  private currentTheme: ThemeDefinition | null = null;
  private customThemes: Map<string, ThemeDefinition> = new Map();
  private readonly STORAGE_KEY = 'webos-theme';
  private readonly CUSTOM_THEMES_KEY = 'webos-custom-themes';
  private listeners: Set<(theme: ThemeDefinition) => void> = new Set();

  constructor() {
    this.loadCustomThemes();
  }

  /**
   * Apply a theme to the document
   */
  applyTheme(theme: ThemeDefinition): void {
    this.currentTheme = theme;

    // Apply CSS custom properties
    const root = document.documentElement;

    // Colors
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--theme-${this.kebabCase(key)}`, value);
    });

    // Fonts
    root.style.setProperty('--theme-font-primary', theme.fonts.primary);
    root.style.setProperty('--theme-font-secondary', theme.fonts.secondary);
    root.style.setProperty('--theme-font-size-small', theme.fonts.size.small);
    root.style.setProperty('--theme-font-size-medium', theme.fonts.size.medium);
    root.style.setProperty('--theme-font-size-large', theme.fonts.size.large);

    // Window Chrome
    root.style.setProperty('--theme-border-width', theme.windowChrome.borderWidth);
    root.style.setProperty('--theme-border-radius', theme.windowChrome.borderRadius);
    root.style.setProperty('--theme-shadow', theme.windowChrome.shadow);
    root.style.setProperty('--theme-title-bar-height', theme.windowChrome.titleBarHeight);

    // Spacing
    root.style.setProperty('--theme-spacing-small', theme.spacing.small);
    root.style.setProperty('--theme-spacing-medium', theme.spacing.medium);
    root.style.setProperty('--theme-spacing-large', theme.spacing.large);

    // Animation
    root.style.setProperty('--theme-animation-duration', theme.animation.duration);
    root.style.setProperty('--theme-animation-easing', theme.animation.easing);

    // Persist to localStorage
    this.saveThemePreference(theme.id);

    // Notify listeners
    this.notifyListeners(theme);
  }

  /**
   * Get current theme
   */
  getCurrentTheme(): ThemeDefinition | null {
    return this.currentTheme;
  }

  /**
   * Load a theme by ID from pre-built or custom themes
   */
  async loadTheme(themeId: string): Promise<ThemeDefinition> {
    // Check if it's a custom theme
    if (this.customThemes.has(themeId)) {
      const theme = this.customThemes.get(themeId)!;
      this.applyTheme(theme);
      return theme;
    }

    // Load from JSON file
    try {
      const response = await fetch(`/themes/${themeId}.json`);
      if (!response.ok) {
        throw new Error(`Theme ${themeId} not found`);
      }
      const theme: ThemeDefinition = await response.json();
      this.applyTheme(theme);
      return theme;
    } catch (error) {
      console.error(`Failed to load theme ${themeId}:`, error);
      // Fall back to default theme
      return this.loadDefaultTheme();
    }
  }

  /**
   * Load default Classic Amiga theme
   */
  async loadDefaultTheme(): Promise<ThemeDefinition> {
    return this.loadTheme('classic-amiga');
  }

  /**
   * Get list of available built-in themes
   */
  getBuiltInThemes(): string[] {
    return [
      'classic-amiga',
      'dark-mode',
      'high-contrast',
      'modern',
      'workbench-13'
    ];
  }

  /**
   * Get list of custom themes
   */
  getCustomThemes(): ThemeDefinition[] {
    return Array.from(this.customThemes.values());
  }

  /**
   * Save a custom theme
   */
  saveCustomTheme(theme: ThemeDefinition): void {
    this.customThemes.set(theme.id, theme);
    this.persistCustomThemes();
  }

  /**
   * Delete a custom theme
   */
  deleteCustomTheme(themeId: string): boolean {
    const result = this.customThemes.delete(themeId);
    if (result) {
      this.persistCustomThemes();
    }
    return result;
  }

  /**
   * Export theme as JSON
   */
  exportTheme(theme: ThemeDefinition): string {
    return JSON.stringify(theme, null, 2);
  }

  /**
   * Import theme from JSON string
   */
  importTheme(jsonString: string): ThemeDefinition {
    try {
      const theme: ThemeDefinition = JSON.parse(jsonString);

      // Validate theme structure
      this.validateTheme(theme);

      // Save as custom theme
      this.saveCustomTheme(theme);

      return theme;
    } catch (error) {
      throw new Error(`Invalid theme JSON: ${error}`);
    }
  }

  /**
   * Download theme as JSON file
   */
  downloadTheme(theme: ThemeDefinition): void {
    const json = this.exportTheme(theme);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${theme.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Create a new theme from template
   */
  createThemeFromTemplate(name: string, baseThemeId: string = 'classic-amiga'): ThemeDefinition {
    // Generate unique ID
    const id = this.generateThemeId(name);

    // Get base theme or use default
    const baseTheme = this.customThemes.get(baseThemeId) || this.currentTheme;

    if (!baseTheme) {
      throw new Error('No base theme available');
    }

    // Deep copy base theme
    const newTheme: ThemeDefinition = JSON.parse(JSON.stringify(baseTheme));
    newTheme.id = id;
    newTheme.name = name;
    newTheme.description = `Custom theme based on ${baseTheme.name}`;
    newTheme.version = '1.0.0';

    return newTheme;
  }

  /**
   * Register a listener for theme changes
   */
  onChange(callback: (theme: ThemeDefinition) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Restore theme preference from localStorage
   */
  async restoreThemePreference(): Promise<void> {
    const savedThemeId = localStorage.getItem(this.STORAGE_KEY);
    if (savedThemeId) {
      await this.loadTheme(savedThemeId);
    } else {
      await this.loadDefaultTheme();
    }
  }

  // Private methods

  private saveThemePreference(themeId: string): void {
    localStorage.setItem(this.STORAGE_KEY, themeId);
  }

  private loadCustomThemes(): void {
    const saved = localStorage.getItem(this.CUSTOM_THEMES_KEY);
    if (saved) {
      try {
        const themes: ThemeDefinition[] = JSON.parse(saved);
        themes.forEach(theme => {
          this.customThemes.set(theme.id, theme);
        });
      } catch (error) {
        console.error('Failed to load custom themes:', error);
      }
    }
  }

  private persistCustomThemes(): void {
    const themes = Array.from(this.customThemes.values());
    localStorage.setItem(this.CUSTOM_THEMES_KEY, JSON.stringify(themes));
  }

  private validateTheme(theme: ThemeDefinition): void {
    if (!theme.id || !theme.name) {
      throw new Error('Theme must have id and name');
    }

    if (!theme.colors || !theme.fonts || !theme.windowChrome) {
      throw new Error('Theme must have colors, fonts, and windowChrome');
    }

    // Validate required color properties
    const requiredColors = [
      'primary', 'background', 'text', 'border', 'borderLight', 'borderDark'
    ];

    for (const color of requiredColors) {
      if (!theme.colors[color as keyof ThemeColors]) {
        throw new Error(`Theme missing required color: ${color}`);
      }
    }
  }

  private generateThemeId(name: string): string {
    const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    let id = base;
    let counter = 1;

    while (this.customThemes.has(id)) {
      id = `${base}-${counter}`;
      counter++;
    }

    return id;
  }

  private kebabCase(str: string): string {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  }

  private notifyListeners(theme: ThemeDefinition): void {
    this.listeners.forEach(callback => {
      try {
        callback(theme);
      } catch (error) {
        console.error('Theme listener error:', error);
      }
    });
  }
}

// Export singleton instance
export const themeManager = new ThemeManager();

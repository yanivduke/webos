/**
 * Theme Management Composable
 * Handles theme loading, application, and persistence
 */

import { ref, watch } from 'vue';

interface ThemeMetadata {
  id: string;
  name: string;
  description: string;
}

interface Theme {
  id: string;
  name: string;
  description: string;
  desktop: {
    backgroundColor: string;
    backgroundImage: string;
    backgroundRepeat: string;
    backgroundSize: string;
    backgroundPosition: string;
  };
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    borderLight: string;
    borderDark: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
    selection: string;
    shadow: string;
  };
  typography: {
    fontFamily: string;
    fontFamilyMono: string;
    fontSize: {
      base: string;
      small: string;
      large: string;
      title: string;
      menu: string;
    };
    fontWeight: {
      normal: string;
      bold: string;
    };
    lineHeight: string;
  };
  window: {
    borderWidth: string;
    borderStyle: string;
    titleBarHeight: string;
    titleBarBackground: string;
    titleBarTextColor: string;
    contentBackground: string;
    shadowEnabled: boolean;
    shadowColor: string;
    shadowBlur: string;
    shadowOffset: string;
    borderRadius: string;
  };
  button: {
    background: string;
    textColor: string;
    borderWidth: string;
    borderStyle: string;
    padding: string;
    borderRadius: string;
    hoverBackground: string;
    activeBackground: string;
    disabledBackground: string;
    disabledTextColor: string;
  };
  icon: {
    folderColor: string;
    diskColor: string;
    fileColor: string;
    executableColor: string;
    size: {
      small: string;
      medium: string;
      large: string;
    };
  };
  menu: {
    backgroundColor: string;
    textColor: string;
    hoverBackground: string;
    hoverTextColor: string;
    separatorColor: string;
    borderColor: string;
  };
  scrollbar: {
    width: string;
    trackColor: string;
    thumbColor: string;
    thumbHoverColor: string;
    buttonColor: string;
    arrowColor: string;
  };
  systemBar: {
    height: string;
    backgroundColor: string;
    textColor: string;
    borderColor: string;
  };
  animations: {
    enabled: boolean;
    duration: string;
    easing: string;
  };
}

const currentTheme = ref<Theme | null>(null);
const availableThemes = ref<ThemeMetadata[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);

export function useTheme() {
  /**
   * Fetch all available theme metadata
   */
  async function fetchThemeList(): Promise<ThemeMetadata[]> {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await fetch('/api/themes');
      if (!response.ok) {
        throw new Error(`Failed to fetch themes: ${response.statusText}`);
      }

      const data = await response.json();
      availableThemes.value = data.themes || [];
      return availableThemes.value;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch themes';
      console.error('Error fetching theme list:', err);
      return [];
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Load a specific theme by ID
   */
  async function loadTheme(themeId: string): Promise<Theme | null> {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await fetch(`/api/themes/${themeId}`);
      if (!response.ok) {
        throw new Error(`Failed to load theme '${themeId}': ${response.statusText}`);
      }

      const data = await response.json();
      currentTheme.value = data.theme;
      return currentTheme.value;
    } catch (err) {
      error.value = err instanceof Error ? err.message : `Failed to load theme '${themeId}'`;
      console.error('Error loading theme:', err);
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Apply theme by setting CSS custom properties (variables)
   */
  function applyTheme(theme: Theme) {
    const root = document.documentElement;

    // Desktop
    root.style.setProperty('--desktop-bg-color', theme.desktop.backgroundColor);
    root.style.setProperty('--desktop-bg-image', theme.desktop.backgroundImage ? `url(${theme.desktop.backgroundImage})` : 'none');
    root.style.setProperty('--desktop-bg-repeat', theme.desktop.backgroundRepeat);
    root.style.setProperty('--desktop-bg-size', theme.desktop.backgroundSize);
    root.style.setProperty('--desktop-bg-position', theme.desktop.backgroundPosition);

    // Colors
    root.style.setProperty('--color-primary', theme.colors.primary);
    root.style.setProperty('--color-secondary', theme.colors.secondary);
    root.style.setProperty('--color-background', theme.colors.background);
    root.style.setProperty('--color-surface', theme.colors.surface);
    root.style.setProperty('--color-text', theme.colors.text);
    root.style.setProperty('--color-text-secondary', theme.colors.textSecondary);
    root.style.setProperty('--color-border', theme.colors.border);
    root.style.setProperty('--color-border-light', theme.colors.borderLight);
    root.style.setProperty('--color-border-dark', theme.colors.borderDark);
    root.style.setProperty('--color-accent', theme.colors.accent);
    root.style.setProperty('--color-success', theme.colors.success);
    root.style.setProperty('--color-warning', theme.colors.warning);
    root.style.setProperty('--color-error', theme.colors.error);
    root.style.setProperty('--color-selection', theme.colors.selection);
    root.style.setProperty('--color-shadow', theme.colors.shadow);

    // Typography
    root.style.setProperty('--font-family', theme.typography.fontFamily);
    root.style.setProperty('--font-family-mono', theme.typography.fontFamilyMono);
    root.style.setProperty('--font-size-base', theme.typography.fontSize.base);
    root.style.setProperty('--font-size-small', theme.typography.fontSize.small);
    root.style.setProperty('--font-size-large', theme.typography.fontSize.large);
    root.style.setProperty('--font-size-title', theme.typography.fontSize.title);
    root.style.setProperty('--font-size-menu', theme.typography.fontSize.menu);
    root.style.setProperty('--font-weight-normal', theme.typography.fontWeight.normal);
    root.style.setProperty('--font-weight-bold', theme.typography.fontWeight.bold);
    root.style.setProperty('--line-height', theme.typography.lineHeight);

    // Window
    root.style.setProperty('--window-border-width', theme.window.borderWidth);
    root.style.setProperty('--window-border-style', theme.window.borderStyle);
    root.style.setProperty('--window-titlebar-height', theme.window.titleBarHeight);
    root.style.setProperty('--window-titlebar-bg', theme.window.titleBarBackground);
    root.style.setProperty('--window-titlebar-text', theme.window.titleBarTextColor);
    root.style.setProperty('--window-content-bg', theme.window.contentBackground);
    root.style.setProperty('--window-shadow', theme.window.shadowEnabled
      ? `${theme.window.shadowOffset} ${theme.window.shadowBlur} ${theme.window.shadowColor}`
      : 'none');
    root.style.setProperty('--window-border-radius', theme.window.borderRadius);

    // Button
    root.style.setProperty('--button-bg', theme.button.background);
    root.style.setProperty('--button-text', theme.button.textColor);
    root.style.setProperty('--button-border-width', theme.button.borderWidth);
    root.style.setProperty('--button-border-style', theme.button.borderStyle);
    root.style.setProperty('--button-padding', theme.button.padding);
    root.style.setProperty('--button-border-radius', theme.button.borderRadius);
    root.style.setProperty('--button-hover-bg', theme.button.hoverBackground);
    root.style.setProperty('--button-active-bg', theme.button.activeBackground);
    root.style.setProperty('--button-disabled-bg', theme.button.disabledBackground);
    root.style.setProperty('--button-disabled-text', theme.button.disabledTextColor);

    // Icon
    root.style.setProperty('--icon-folder-color', theme.icon.folderColor);
    root.style.setProperty('--icon-disk-color', theme.icon.diskColor);
    root.style.setProperty('--icon-file-color', theme.icon.fileColor);
    root.style.setProperty('--icon-executable-color', theme.icon.executableColor);
    root.style.setProperty('--icon-size-small', theme.icon.size.small);
    root.style.setProperty('--icon-size-medium', theme.icon.size.medium);
    root.style.setProperty('--icon-size-large', theme.icon.size.large);

    // Menu
    root.style.setProperty('--menu-bg', theme.menu.backgroundColor);
    root.style.setProperty('--menu-text', theme.menu.textColor);
    root.style.setProperty('--menu-hover-bg', theme.menu.hoverBackground);
    root.style.setProperty('--menu-hover-text', theme.menu.hoverTextColor);
    root.style.setProperty('--menu-separator', theme.menu.separatorColor);
    root.style.setProperty('--menu-border', theme.menu.borderColor);

    // Scrollbar
    root.style.setProperty('--scrollbar-width', theme.scrollbar.width);
    root.style.setProperty('--scrollbar-track', theme.scrollbar.trackColor);
    root.style.setProperty('--scrollbar-thumb', theme.scrollbar.thumbColor);
    root.style.setProperty('--scrollbar-thumb-hover', theme.scrollbar.thumbHoverColor);
    root.style.setProperty('--scrollbar-button', theme.scrollbar.buttonColor);
    root.style.setProperty('--scrollbar-arrow', theme.scrollbar.arrowColor);

    // System bar
    root.style.setProperty('--systembar-height', theme.systemBar.height);
    root.style.setProperty('--systembar-bg', theme.systemBar.backgroundColor);
    root.style.setProperty('--systembar-text', theme.systemBar.textColor);
    root.style.setProperty('--systembar-border', theme.systemBar.borderColor);

    // Animations
    root.style.setProperty('--animation-duration', theme.animations.duration);
    root.style.setProperty('--animation-easing', theme.animations.easing);

    currentTheme.value = theme;
  }

  /**
   * Switch to a new theme
   */
  async function switchTheme(themeId: string): Promise<boolean> {
    try {
      const theme = await loadTheme(themeId);
      if (!theme) {
        return false;
      }

      applyTheme(theme);

      // Save theme preference to settings
      await saveThemePreference(themeId);

      return true;
    } catch (err) {
      console.error('Error switching theme:', err);
      return false;
    }
  }

  /**
   * Save theme preference to server settings
   */
  async function saveThemePreference(themeId: string): Promise<void> {
    try {
      const response = await fetch('/api/settings/theme', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentTheme: themeId,
        }),
      });

      if (!response.ok) {
        console.warn('Failed to save theme preference:', response.statusText);
      }
    } catch (err) {
      console.warn('Failed to save theme preference:', err);
    }
  }

  /**
   * Load saved theme preference
   */
  async function loadSavedTheme(): Promise<void> {
    try {
      const response = await fetch('/api/settings/theme');
      if (!response.ok) {
        console.warn('Failed to load theme preference, using default');
        await switchTheme('amiga');
        return;
      }

      const data = await response.json();
      const themeId = data.settings?.currentTheme || 'amiga';
      await switchTheme(themeId);
    } catch (err) {
      console.warn('Failed to load theme preference:', err);
      await switchTheme('amiga');
    }
  }

  /**
   * Initialize theme system
   */
  async function initializeTheme(): Promise<void> {
    await fetchThemeList();
    await loadSavedTheme();
  }

  return {
    currentTheme,
    availableThemes,
    isLoading,
    error,
    fetchThemeList,
    loadTheme,
    applyTheme,
    switchTheme,
    saveThemePreference,
    loadSavedTheme,
    initializeTheme,
  };
}

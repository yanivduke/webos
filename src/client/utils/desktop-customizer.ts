/**
 * Desktop Customization Manager
 * Handles desktop wallpapers, patterns, and themes
 */

export interface DesktopPattern {
  id: string;
  name: string;
  type: 'solid' | 'gradient' | 'pattern' | 'image';
  value: string; // CSS background value
}

export interface DesktopTheme {
  id: string;
  name: string;
  colors: {
    background: string;
    menuBar: string;
    menuText: string;
    windowTitle: string;
    windowBorder: string;
    highlight: string;
    text: string;
  };
  pattern?: DesktopPattern;
}

class DesktopCustomizer {
  private currentTheme: DesktopTheme;
  private currentPattern: DesktopPattern;

  // Classic Amiga patterns
  private readonly patterns: DesktopPattern[] = [
    {
      id: 'amiga-gray',
      name: 'Amiga Gray',
      type: 'solid',
      value: '#a0a0a0'
    },
    {
      id: 'dark-gray',
      name: 'Dark Gray',
      type: 'solid',
      value: '#707070'
    },
    {
      id: 'light-gray',
      name: 'Light Gray',
      type: 'solid',
      value: '#c0c0c0'
    },
    {
      id: 'blue-gradient',
      name: 'Blue Gradient',
      type: 'gradient',
      value: 'linear-gradient(180deg, #0055aa 0%, #003388 100%)'
    },
    {
      id: 'orange-gradient',
      name: 'Orange Gradient',
      type: 'gradient',
      value: 'linear-gradient(180deg, #ff6600 0%, #cc5500 100%)'
    },
    {
      id: 'checkerboard',
      name: 'Checkerboard',
      type: 'pattern',
      value: 'repeating-conic-gradient(#a0a0a0 0% 25%, #808080 0% 50%) 50% / 20px 20px'
    },
    {
      id: 'stripes',
      name: 'Stripes',
      type: 'pattern',
      value: 'repeating-linear-gradient(45deg, #a0a0a0, #a0a0a0 10px, #909090 10px, #909090 20px)'
    },
    {
      id: 'dots',
      name: 'Dots',
      type: 'pattern',
      value: 'radial-gradient(circle, #808080 1px, transparent 1px) 0 0 / 10px 10px, #a0a0a0'
    },
    {
      id: 'grid',
      name: 'Grid',
      type: 'pattern',
      value: `
        linear-gradient(#808080 1px, transparent 1px),
        linear-gradient(90deg, #808080 1px, transparent 1px),
        #a0a0a0
      `.replace(/\s+/g, ' ').trim()
    }
  ];

  // Classic Amiga themes
  private readonly themes: DesktopTheme[] = [
    {
      id: 'workbench-31',
      name: 'Workbench 3.1',
      colors: {
        background: '#a0a0a0',
        menuBar: '#ffffff',
        menuText: '#000000',
        windowTitle: '#0055aa',
        windowBorder: '#000000',
        highlight: '#0055aa',
        text: '#000000'
      }
    },
    {
      id: 'workbench-20',
      name: 'Workbench 2.0',
      colors: {
        background: '#888888',
        menuBar: '#cccccc',
        menuText: '#000000',
        windowTitle: '#0055aa',
        windowBorder: '#000000',
        highlight: '#0055aa',
        text: '#000000'
      }
    },
    {
      id: 'dark-mode',
      name: 'Dark Mode',
      colors: {
        background: '#2a2a2a',
        menuBar: '#1a1a1a',
        menuText: '#ffffff',
        windowTitle: '#0088cc',
        windowBorder: '#444444',
        highlight: '#0088cc',
        text: '#ffffff'
      }
    },
    {
      id: 'amber',
      name: 'Amber Monitor',
      colors: {
        background: '#2a1a0a',
        menuBar: '#3a2a1a',
        menuText: '#ffaa00',
        windowTitle: '#ff8800',
        windowBorder: '#ff8800',
        highlight: '#ffaa00',
        text: '#ffaa00'
      }
    },
    {
      id: 'green-screen',
      name: 'Green Screen',
      colors: {
        background: '#0a2a0a',
        menuBar: '#1a3a1a',
        menuText: '#00ff00',
        windowTitle: '#00dd00',
        windowBorder: '#00dd00',
        highlight: '#00ff00',
        text: '#00ff00'
      }
    }
  ];

  constructor() {
    this.currentPattern = this.patterns[0]; // Default to Amiga Gray
    this.currentTheme = this.themes[0]; // Default to Workbench 3.1
    this.loadCustomization();
  }

  /**
   * Get all available patterns
   */
  getPatterns(): DesktopPattern[] {
    return [...this.patterns];
  }

  /**
   * Get all available themes
   */
  getThemes(): DesktopTheme[] {
    return [...this.themes];
  }

  /**
   * Get current pattern
   */
  getCurrentPattern(): DesktopPattern {
    return { ...this.currentPattern };
  }

  /**
   * Get current theme
   */
  getCurrentTheme(): DesktopTheme {
    return { ...this.currentTheme };
  }

  /**
   * Set desktop pattern
   */
  setPattern(patternId: string): boolean {
    const pattern = this.patterns.find(p => p.id === patternId);
    if (!pattern) return false;

    this.currentPattern = pattern;
    this.applyPattern();
    this.saveCustomization();
    return true;
  }

  /**
   * Set desktop theme
   */
  setTheme(themeId: string): boolean {
    const theme = this.themes.find(t => t.id === themeId);
    if (!theme) return false;

    this.currentTheme = theme;
    this.applyTheme();
    this.saveCustomization();
    return true;
  }

  /**
   * Apply current pattern to desktop
   */
  private applyPattern() {
    const desktop = document.querySelector('.desktop-background') as HTMLElement;
    if (!desktop) return;

    if (this.currentPattern.type === 'pattern' && this.currentPattern.value.includes(',')) {
      // Multiple backgrounds (like grid)
      desktop.style.background = this.currentPattern.value;
      desktop.style.backgroundSize = '15px 15px, 15px 15px, 100% 100%';
    } else {
      desktop.style.background = this.currentPattern.value;
    }
  }

  /**
   * Apply current theme colors
   */
  private applyTheme() {
    const root = document.documentElement;
    const theme = this.currentTheme;

    root.style.setProperty('--color-background', theme.colors.background);
    root.style.setProperty('--color-menu-bar', theme.colors.menuBar);
    root.style.setProperty('--color-menu-text', theme.colors.menuText);
    root.style.setProperty('--color-window-title', theme.colors.windowTitle);
    root.style.setProperty('--color-window-border', theme.colors.windowBorder);
    root.style.setProperty('--color-highlight', theme.colors.highlight);
    root.style.setProperty('--color-text', theme.colors.text);
  }

  /**
   * Set custom image as background
   */
  async setCustomImage(imageUrl: string): Promise<boolean> {
    try {
      // Validate image can be loaded
      await this.loadImage(imageUrl);

      const customPattern: DesktopPattern = {
        id: 'custom-image',
        name: 'Custom Image',
        type: 'image',
        value: `url(${imageUrl}) center/cover no-repeat, #a0a0a0`
      };

      this.currentPattern = customPattern;
      this.applyPattern();
      this.saveCustomization();
      return true;
    } catch (error) {
      console.error('Failed to load custom image:', error);
      return false;
    }
  }

  /**
   * Load image helper
   */
  private loadImage(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = url;
    });
  }

  /**
   * Reset to default customization
   */
  resetToDefault() {
    this.currentPattern = this.patterns[0];
    this.currentTheme = this.themes[0];
    this.applyPattern();
    this.applyTheme();
    this.saveCustomization();
  }

  /**
   * Load customization from localStorage
   */
  private loadCustomization() {
    try {
      const saved = localStorage.getItem('webos-desktop-customization');
      if (!saved) return;

      const data = JSON.parse(saved);

      if (data.patternId) {
        const pattern = this.patterns.find(p => p.id === data.patternId);
        if (pattern) {
          this.currentPattern = pattern;
        } else if (data.customPattern) {
          // Restore custom pattern
          this.currentPattern = data.customPattern;
        }
      }

      if (data.themeId) {
        const theme = this.themes.find(t => t.id === data.themeId);
        if (theme) {
          this.currentTheme = theme;
        }
      }

      this.applyPattern();
      this.applyTheme();
    } catch (error) {
      console.warn('Failed to load desktop customization:', error);
    }
  }

  /**
   * Save customization to localStorage
   */
  private saveCustomization() {
    try {
      const data = {
        patternId: this.currentPattern.id,
        themeId: this.currentTheme.id,
        customPattern: this.currentPattern.type === 'image' ? this.currentPattern : null
      };

      localStorage.setItem('webos-desktop-customization', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save desktop customization:', error);
    }
  }
}

// Singleton instance
const desktopCustomizer = new DesktopCustomizer();

export default desktopCustomizer;

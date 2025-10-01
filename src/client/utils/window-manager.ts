/**
 * Advanced Window Manager
 * Handles window snapping, tiling, and advanced positioning
 */

export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SnapZone {
  type: 'left' | 'right' | 'top' | 'bottom' | 'topleft' | 'topright' | 'bottomleft' | 'bottomright' | 'maximize';
  bounds: WindowBounds;
}

export interface WindowManagerConfig {
  snapEnabled: boolean;
  snapThreshold: number; // pixels from edge to trigger snap
  showSnapPreview: boolean;
}

class WindowManager {
  private config: WindowManagerConfig = {
    snapEnabled: true,
    snapThreshold: 20,
    showSnapPreview: true
  };

  private desktopBounds: WindowBounds = {
    x: 0,
    y: 0,
    width: 0,
    height: 0
  };

  constructor() {
    this.updateDesktopBounds();
    window.addEventListener('resize', () => this.updateDesktopBounds());
  }

  /**
   * Update desktop bounds based on current window size
   */
  private updateDesktopBounds() {
    // Account for menu bar (top) and footer (bottom)
    const menuBarHeight = 30;
    const footerHeight = 25;
    const sidebarWidth = 120; // Desktop icons area

    this.desktopBounds = {
      x: sidebarWidth,
      y: menuBarHeight,
      width: window.innerWidth - sidebarWidth - 20,
      height: window.innerHeight - menuBarHeight - footerHeight - 40
    };
  }

  /**
   * Get desktop bounds
   */
  getDesktopBounds(): WindowBounds {
    return { ...this.desktopBounds };
  }

  /**
   * Check if window should snap and return snap zone
   */
  getSnapZone(windowBounds: WindowBounds, isDragging: boolean = true): SnapZone | null {
    if (!this.config.snapEnabled || !isDragging) return null;

    const threshold = this.config.snapThreshold;
    const desktop = this.desktopBounds;

    // Check left edge
    if (windowBounds.x < desktop.x + threshold) {
      // Top-left corner
      if (windowBounds.y < desktop.y + threshold) {
        return {
          type: 'topleft',
          bounds: {
            x: desktop.x,
            y: desktop.y,
            width: Math.floor(desktop.width / 2),
            height: Math.floor(desktop.height / 2)
          }
        };
      }
      // Bottom-left corner
      if (windowBounds.y + windowBounds.height > desktop.y + desktop.height - threshold) {
        return {
          type: 'bottomleft',
          bounds: {
            x: desktop.x,
            y: desktop.y + Math.floor(desktop.height / 2),
            width: Math.floor(desktop.width / 2),
            height: Math.floor(desktop.height / 2)
          }
        };
      }
      // Left half
      return {
        type: 'left',
        bounds: {
          x: desktop.x,
          y: desktop.y,
          width: Math.floor(desktop.width / 2),
          height: desktop.height
        }
      };
    }

    // Check right edge
    if (windowBounds.x + windowBounds.width > desktop.x + desktop.width - threshold) {
      // Top-right corner
      if (windowBounds.y < desktop.y + threshold) {
        return {
          type: 'topright',
          bounds: {
            x: desktop.x + Math.floor(desktop.width / 2),
            y: desktop.y,
            width: Math.floor(desktop.width / 2),
            height: Math.floor(desktop.height / 2)
          }
        };
      }
      // Bottom-right corner
      if (windowBounds.y + windowBounds.height > desktop.y + desktop.height - threshold) {
        return {
          type: 'bottomright',
          bounds: {
            x: desktop.x + Math.floor(desktop.width / 2),
            y: desktop.y + Math.floor(desktop.height / 2),
            width: Math.floor(desktop.width / 2),
            height: Math.floor(desktop.height / 2)
          }
        };
      }
      // Right half
      return {
        type: 'right',
        bounds: {
          x: desktop.x + Math.floor(desktop.width / 2),
          y: desktop.y,
          width: Math.floor(desktop.width / 2),
          height: desktop.height
        }
      };
    }

    // Check top edge (maximize)
    if (windowBounds.y < desktop.y + threshold) {
      return {
        type: 'maximize',
        bounds: {
          x: desktop.x,
          y: desktop.y,
          width: desktop.width,
          height: desktop.height
        }
      };
    }

    // Check bottom edge (bottom half)
    if (windowBounds.y + windowBounds.height > desktop.y + desktop.height - threshold) {
      return {
        type: 'bottom',
        bounds: {
          x: desktop.x,
          y: desktop.y + Math.floor(desktop.height / 2),
          width: desktop.width,
          height: Math.floor(desktop.height / 2)
        }
      };
    }

    return null;
  }

  /**
   * Apply snap to window bounds
   */
  applySnap(snapZone: SnapZone): WindowBounds {
    return { ...snapZone.bounds };
  }

  /**
   * Cascade windows starting from a base position
   */
  cascadeWindows(windows: WindowBounds[], baseX: number = 100, baseY: number = 80): WindowBounds[] {
    const cascade = 30; // Offset for each window
    return windows.map((window, index) => ({
      ...window,
      x: baseX + (index * cascade),
      y: baseY + (index * cascade)
    }));
  }

  /**
   * Tile windows in a grid
   */
  tileWindows(windowCount: number): WindowBounds[] {
    const desktop = this.desktopBounds;
    const results: WindowBounds[] = [];

    if (windowCount === 0) return results;

    // Calculate grid dimensions
    const cols = Math.ceil(Math.sqrt(windowCount));
    const rows = Math.ceil(windowCount / cols);

    const windowWidth = Math.floor(desktop.width / cols);
    const windowHeight = Math.floor(desktop.height / rows);

    for (let i = 0; i < windowCount; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);

      results.push({
        x: desktop.x + (col * windowWidth),
        y: desktop.y + (row * windowHeight),
        width: windowWidth,
        height: windowHeight
      });
    }

    return results;
  }

  /**
   * Stack windows vertically
   */
  stackVertically(windowCount: number): WindowBounds[] {
    const desktop = this.desktopBounds;
    const results: WindowBounds[] = [];
    const windowHeight = Math.floor(desktop.height / windowCount);

    for (let i = 0; i < windowCount; i++) {
      results.push({
        x: desktop.x,
        y: desktop.y + (i * windowHeight),
        width: desktop.width,
        height: windowHeight
      });
    }

    return results;
  }

  /**
   * Stack windows horizontally
   */
  stackHorizontally(windowCount: number): WindowBounds[] {
    const desktop = this.desktopBounds;
    const results: WindowBounds[] = [];
    const windowWidth = Math.floor(desktop.width / windowCount);

    for (let i = 0; i < windowCount; i++) {
      results.push({
        x: desktop.x + (i * windowWidth),
        y: desktop.y,
        width: windowWidth,
        height: desktop.height
      });
    }

    return results;
  }

  /**
   * Center a window
   */
  centerWindow(windowBounds: WindowBounds): WindowBounds {
    const desktop = this.desktopBounds;
    return {
      ...windowBounds,
      x: desktop.x + Math.floor((desktop.width - windowBounds.width) / 2),
      y: desktop.y + Math.floor((desktop.height - windowBounds.height) / 2)
    };
  }

  /**
   * Constrain window to desktop bounds
   */
  constrainToBounds(windowBounds: WindowBounds): WindowBounds {
    const desktop = this.desktopBounds;
    const minWidth = 200;
    const minHeight = 150;

    let { x, y, width, height } = windowBounds;

    // Ensure minimum size
    width = Math.max(width, minWidth);
    height = Math.max(height, minHeight);

    // Constrain to desktop
    x = Math.max(desktop.x, Math.min(x, desktop.x + desktop.width - width));
    y = Math.max(desktop.y, Math.min(y, desktop.y + desktop.height - height));

    return { x, y, width, height };
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<WindowManagerConfig>) {
    this.config = { ...this.config, ...config };
    this.saveConfig();
  }

  /**
   * Get current configuration
   */
  getConfig(): WindowManagerConfig {
    return { ...this.config };
  }

  /**
   * Load config from localStorage
   */
  loadConfig() {
    try {
      const saved = localStorage.getItem('webos-window-config');
      if (saved) {
        this.config = { ...this.config, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.warn('Failed to load window config', error);
    }
  }

  /**
   * Save config to localStorage
   */
  private saveConfig() {
    try {
      localStorage.setItem('webos-window-config', JSON.stringify(this.config));
    } catch (error) {
      console.warn('Failed to save window config', error);
    }
  }
}

// Singleton instance
const windowManager = new WindowManager();
windowManager.loadConfig();

export default windowManager;

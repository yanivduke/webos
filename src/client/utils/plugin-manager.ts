/**
 * WebOS Plugin/Extension Manager
 * Handles plugin lifecycle, sandboxing, and API access
 */

import notificationManager from './notification-manager';

export interface PluginMetadata {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  permissions: PluginPermission[];
  dependencies?: string[];
  minWebOSVersion?: string;
  icon?: string;
  category?: PluginCategory;
}

export type PluginPermission = 'filesystem' | 'network' | 'ui' | 'storage' | 'system' | 'notifications';
export type PluginCategory = 'utility' | 'theme' | 'productivity' | 'system' | 'entertainment' | 'developer';
export type PluginStatus = 'installed' | 'enabled' | 'disabled' | 'error';

export interface InstalledPlugin {
  metadata: PluginMetadata;
  status: PluginStatus;
  installedAt: number;
  enabledAt?: number;
  size?: number;
  error?: string;
}

export interface PluginAPI {
  // Desktop API
  addDesktopIcon: (icon: DesktopIcon) => void;
  removeDesktopIcon: (iconId: string) => void;
  addMenuItem: (menu: string, item: MenuItem) => void;
  openWindow: (window: WindowConfig) => void;

  // Notification API
  showNotification: (type: 'info' | 'success' | 'warning' | 'error', title: string, message: string) => void;

  // Storage API
  getData: (key: string) => any;
  setData: (key: string, value: any) => void;
  removeData: (key: string) => void;

  // Events API
  on: (event: string, callback: Function) => void;
  off: (event: string, callback: Function) => void;
  emit: (event: string, data?: any) => void;

  // System API (requires 'system' permission)
  getSystemInfo?: () => Promise<any>;

  // UI API (requires 'ui' permission)
  setDesktopBackground?: (color: string) => void;
  addWidget?: (widget: Widget) => void;
}

export interface DesktopIcon {
  id: string;
  name: string;
  icon: string;
  onClick: () => void;
}

export interface MenuItem {
  label: string;
  onClick: () => void;
  shortcut?: string;
}

export interface WindowConfig {
  title: string;
  width: number;
  height: number;
  component: any;
  data?: any;
}

export interface Widget {
  id: string;
  component: any;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

export interface Plugin {
  metadata: PluginMetadata;
  initialize: (api: PluginAPI) => void | Promise<void>;
  destroy: () => void | Promise<void>;
}

interface PluginConfig {
  autoUpdate: boolean;
  allowExperimental: boolean;
  maxPlugins: number;
}

type PluginChangeListener = (plugins: InstalledPlugin[]) => void;

class PluginManager {
  private plugins: Map<string, InstalledPlugin> = new Map();
  private loadedPlugins: Map<string, Plugin> = new Map();
  private eventListeners: Map<string, Set<Function>> = new Map();
  private changeListeners: Set<PluginChangeListener> = new Set();
  private desktopIcons: Map<string, DesktopIcon> = new Map();
  private menuItems: Map<string, MenuItem[]> = new Map();
  private widgets: Map<string, Widget> = new Map();

  private config: PluginConfig = {
    autoUpdate: true,
    allowExperimental: false,
    maxPlugins: 50
  };

  // Callbacks for integrating with the desktop
  private onOpenWindowCallback?: (window: WindowConfig) => void;
  private onDesktopIconChangeCallback?: (icons: DesktopIcon[]) => void;
  private onDesktopBackgroundChangeCallback?: (color: string) => void;
  private onWidgetChangeCallback?: (widgets: Widget[]) => void;

  constructor() {
    this.loadPluginsFromStorage();
    this.loadConfig();
  }

  /**
   * Install a plugin
   */
  async installPlugin(plugin: Plugin): Promise<boolean> {
    try {
      const { metadata } = plugin;

      // Validate plugin
      if (!this.validatePlugin(plugin)) {
        throw new Error('Invalid plugin structure');
      }

      // Check if already installed
      if (this.plugins.has(metadata.id)) {
        throw new Error('Plugin already installed');
      }

      // Check max plugins limit
      if (this.plugins.size >= this.config.maxPlugins) {
        throw new Error('Maximum number of plugins reached');
      }

      // Check version compatibility
      if (!this.checkVersionCompatibility(metadata.minWebOSVersion)) {
        throw new Error('Incompatible WebOS version');
      }

      // Check dependencies
      if (metadata.dependencies) {
        for (const depId of metadata.dependencies) {
          if (!this.plugins.has(depId)) {
            throw new Error(`Missing dependency: ${depId}`);
          }
        }
      }

      // Create installed plugin entry
      const installedPlugin: InstalledPlugin = {
        metadata,
        status: 'installed',
        installedAt: Date.now(),
        size: this.estimatePluginSize(plugin)
      };

      // Store plugin
      this.plugins.set(metadata.id, installedPlugin);
      this.loadedPlugins.set(metadata.id, plugin);

      this.savePluginsToStorage();
      this.notifyListeners();

      notificationManager.success(
        'Plugin Installed',
        `${metadata.name} v${metadata.version} installed successfully`
      );

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      notificationManager.error('Installation Failed', message);
      console.error('Plugin installation error:', error);
      return false;
    }
  }

  /**
   * Enable a plugin
   */
  async enablePlugin(pluginId: string): Promise<boolean> {
    try {
      const installedPlugin = this.plugins.get(pluginId);
      const plugin = this.loadedPlugins.get(pluginId);

      if (!installedPlugin || !plugin) {
        throw new Error('Plugin not found');
      }

      if (installedPlugin.status === 'enabled') {
        return true; // Already enabled
      }

      // Check permissions
      if (!this.checkPermissions(installedPlugin.metadata.permissions)) {
        throw new Error('Insufficient permissions');
      }

      // Create sandboxed API
      const api = this.createPluginAPI(pluginId, installedPlugin.metadata.permissions);

      // Initialize plugin
      await plugin.initialize(api);

      // Update status
      installedPlugin.status = 'enabled';
      installedPlugin.enabledAt = Date.now();
      installedPlugin.error = undefined;

      this.savePluginsToStorage();
      this.notifyListeners();

      notificationManager.success(
        'Plugin Enabled',
        `${installedPlugin.metadata.name} is now active`
      );

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      const installedPlugin = this.plugins.get(pluginId);

      if (installedPlugin) {
        installedPlugin.status = 'error';
        installedPlugin.error = message;
        this.savePluginsToStorage();
        this.notifyListeners();
      }

      notificationManager.error('Plugin Error', message);
      console.error('Plugin enable error:', error);
      return false;
    }
  }

  /**
   * Disable a plugin
   */
  async disablePlugin(pluginId: string): Promise<boolean> {
    try {
      const installedPlugin = this.plugins.get(pluginId);
      const plugin = this.loadedPlugins.get(pluginId);

      if (!installedPlugin || !plugin) {
        throw new Error('Plugin not found');
      }

      if (installedPlugin.status === 'disabled') {
        return true; // Already disabled
      }

      // Destroy plugin
      await plugin.destroy();

      // Clean up plugin resources
      this.cleanupPluginResources(pluginId);

      // Update status
      installedPlugin.status = 'disabled';
      installedPlugin.enabledAt = undefined;

      this.savePluginsToStorage();
      this.notifyListeners();

      notificationManager.info(
        'Plugin Disabled',
        `${installedPlugin.metadata.name} has been disabled`
      );

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      notificationManager.error('Disable Failed', message);
      console.error('Plugin disable error:', error);
      return false;
    }
  }

  /**
   * Uninstall a plugin
   */
  async uninstallPlugin(pluginId: string): Promise<boolean> {
    try {
      const installedPlugin = this.plugins.get(pluginId);

      if (!installedPlugin) {
        throw new Error('Plugin not found');
      }

      // Check if other plugins depend on this one
      const dependents = this.getDependentPlugins(pluginId);
      if (dependents.length > 0) {
        throw new Error(`Cannot uninstall: required by ${dependents.join(', ')}`);
      }

      // Disable first if enabled
      if (installedPlugin.status === 'enabled') {
        await this.disablePlugin(pluginId);
      }

      // Remove plugin
      this.plugins.delete(pluginId);
      this.loadedPlugins.delete(pluginId);

      this.savePluginsToStorage();
      this.notifyListeners();

      notificationManager.success(
        'Plugin Uninstalled',
        `${installedPlugin.metadata.name} has been removed`
      );

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      notificationManager.error('Uninstall Failed', message);
      console.error('Plugin uninstall error:', error);
      return false;
    }
  }

  /**
   * Get all installed plugins
   */
  getInstalledPlugins(): InstalledPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get plugin by ID
   */
  getPlugin(pluginId: string): InstalledPlugin | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * Get enabled plugins
   */
  getEnabledPlugins(): InstalledPlugin[] {
    return this.getInstalledPlugins().filter(p => p.status === 'enabled');
  }

  /**
   * Clear plugin cache
   */
  clearCache(): void {
    // Clear any cached plugin data
    localStorage.removeItem('webos-plugin-cache');
    notificationManager.info('Cache Cleared', 'Plugin cache has been cleared');
  }

  /**
   * Get plugin statistics
   */
  getStatistics() {
    const plugins = this.getInstalledPlugins();
    return {
      total: plugins.length,
      enabled: plugins.filter(p => p.status === 'enabled').length,
      disabled: plugins.filter(p => p.status === 'disabled').length,
      error: plugins.filter(p => p.status === 'error').length,
      totalSize: plugins.reduce((sum, p) => sum + (p.size || 0), 0)
    };
  }

  /**
   * Subscribe to plugin changes
   */
  subscribe(listener: PluginChangeListener): () => void {
    this.changeListeners.add(listener);
    listener(this.getInstalledPlugins());

    return () => {
      this.changeListeners.delete(listener);
    };
  }

  /**
   * Set desktop integration callbacks
   */
  setDesktopCallbacks(callbacks: {
    onOpenWindow?: (window: WindowConfig) => void;
    onDesktopIconChange?: (icons: DesktopIcon[]) => void;
    onDesktopBackgroundChange?: (color: string) => void;
    onWidgetChange?: (widgets: Widget[]) => void;
  }) {
    this.onOpenWindowCallback = callbacks.onOpenWindow;
    this.onDesktopIconChangeCallback = callbacks.onDesktopIconChange;
    this.onDesktopBackgroundChangeCallback = callbacks.onDesktopBackgroundChange;
    this.onWidgetChangeCallback = callbacks.onWidgetChange;
  }

  /**
   * Get/Set configuration
   */
  getConfig(): PluginConfig {
    return { ...this.config };
  }

  setConfig(config: Partial<PluginConfig>) {
    this.config = { ...this.config, ...config };
    this.saveConfig();
  }

  // Private methods

  private validatePlugin(plugin: Plugin): boolean {
    const { metadata } = plugin;

    if (!metadata.id || !metadata.name || !metadata.version || !metadata.author) {
      return false;
    }

    if (!plugin.initialize || typeof plugin.initialize !== 'function') {
      return false;
    }

    if (!plugin.destroy || typeof plugin.destroy !== 'function') {
      return false;
    }

    return true;
  }

  private checkVersionCompatibility(minVersion?: string): boolean {
    if (!minVersion) return true;

    // Simple version check - in production, use semver library
    const currentVersion = '2.0.0';
    return currentVersion >= minVersion;
  }

  private checkPermissions(_permissions: PluginPermission[]): boolean {
    // For now, allow all permissions
    // In production, implement proper permission checking
    return true;
  }

  private createPluginAPI(pluginId: string, permissions: PluginPermission[]): PluginAPI {
    const api: PluginAPI = {
      // Desktop API
      addDesktopIcon: (icon: DesktopIcon) => {
        this.desktopIcons.set(`${pluginId}:${icon.id}`, icon);
        this.onDesktopIconChangeCallback?.(Array.from(this.desktopIcons.values()));
      },
      removeDesktopIcon: (iconId: string) => {
        this.desktopIcons.delete(`${pluginId}:${iconId}`);
        this.onDesktopIconChangeCallback?.(Array.from(this.desktopIcons.values()));
      },
      addMenuItem: (menu: string, item: MenuItem) => {
        if (!this.menuItems.has(menu)) {
          this.menuItems.set(menu, []);
        }
        this.menuItems.get(menu)!.push(item);
      },
      openWindow: (window: WindowConfig) => {
        this.onOpenWindowCallback?.(window);
      },

      // Notification API
      showNotification: (type, title, message) => {
        notificationManager.show(type, title, message);
      },

      // Storage API
      getData: (key: string) => {
        try {
          const data = localStorage.getItem(`plugin:${pluginId}:${key}`);
          return data ? JSON.parse(data) : null;
        } catch {
          return null;
        }
      },
      setData: (key: string, value: any) => {
        try {
          localStorage.setItem(`plugin:${pluginId}:${key}`, JSON.stringify(value));
        } catch (error) {
          console.error('Plugin storage error:', error);
        }
      },
      removeData: (key: string) => {
        localStorage.removeItem(`plugin:${pluginId}:${key}`);
      },

      // Events API
      on: (event: string, callback: Function) => {
        const eventKey = `${pluginId}:${event}`;
        if (!this.eventListeners.has(eventKey)) {
          this.eventListeners.set(eventKey, new Set());
        }
        this.eventListeners.get(eventKey)!.add(callback);
      },
      off: (event: string, callback: Function) => {
        const eventKey = `${pluginId}:${event}`;
        this.eventListeners.get(eventKey)?.delete(callback);
      },
      emit: (event: string, data?: any) => {
        const eventKey = `${pluginId}:${event}`;
        this.eventListeners.get(eventKey)?.forEach(callback => callback(data));
      }
    };

    // Add conditional APIs based on permissions
    if (permissions.includes('system')) {
      api.getSystemInfo = async () => {
        const response = await fetch('/api/system/status');
        return response.json();
      };
    }

    if (permissions.includes('ui')) {
      api.setDesktopBackground = (color: string) => {
        this.onDesktopBackgroundChangeCallback?.(color);
      };
      api.addWidget = (widget: Widget) => {
        this.widgets.set(`${pluginId}:${widget.id}`, widget);
        this.onWidgetChangeCallback?.(Array.from(this.widgets.values()));
      };
    }

    return api;
  }

  private cleanupPluginResources(pluginId: string) {
    // Remove desktop icons
    for (const [key] of this.desktopIcons) {
      if (key.startsWith(`${pluginId}:`)) {
        this.desktopIcons.delete(key);
      }
    }
    this.onDesktopIconChangeCallback?.(Array.from(this.desktopIcons.values()));

    // Remove widgets
    for (const [key] of this.widgets) {
      if (key.startsWith(`${pluginId}:`)) {
        this.widgets.delete(key);
      }
    }
    this.onWidgetChangeCallback?.(Array.from(this.widgets.values()));

    // Remove event listeners
    for (const [key] of this.eventListeners) {
      if (key.startsWith(`${pluginId}:`)) {
        this.eventListeners.delete(key);
      }
    }

    // Remove storage
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(`plugin:${pluginId}:`)) {
        localStorage.removeItem(key);
      }
    });
  }

  private getDependentPlugins(pluginId: string): string[] {
    const dependents: string[] = [];

    for (const [_id, plugin] of this.plugins) {
      if (plugin.metadata.dependencies?.includes(pluginId)) {
        dependents.push(plugin.metadata.name);
      }
    }

    return dependents;
  }

  private estimatePluginSize(plugin: Plugin): number {
    // Rough estimate in bytes
    const str = JSON.stringify(plugin.metadata);
    return str.length * 2; // UTF-16
  }

  private notifyListeners() {
    const plugins = this.getInstalledPlugins();
    this.changeListeners.forEach(listener => listener(plugins));
  }

  private loadPluginsFromStorage() {
    try {
      const saved = localStorage.getItem('webos-installed-plugins');
      if (saved) {
        const plugins: InstalledPlugin[] = JSON.parse(saved);
        plugins.forEach(plugin => {
          this.plugins.set(plugin.metadata.id, plugin);
        });
      }
    } catch (error) {
      console.warn('Failed to load plugins from storage', error);
    }
  }

  private savePluginsToStorage() {
    try {
      const plugins = this.getInstalledPlugins();
      localStorage.setItem('webos-installed-plugins', JSON.stringify(plugins));
    } catch (error) {
      console.warn('Failed to save plugins to storage', error);
    }
  }

  private loadConfig() {
    try {
      const saved = localStorage.getItem('webos-plugin-config');
      if (saved) {
        this.config = { ...this.config, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.warn('Failed to load plugin config', error);
    }
  }

  private saveConfig() {
    try {
      localStorage.setItem('webos-plugin-config', JSON.stringify(this.config));
    } catch (error) {
      console.warn('Failed to save plugin config', error);
    }
  }
}

// Singleton instance
const pluginManager = new PluginManager();

export default pluginManager;

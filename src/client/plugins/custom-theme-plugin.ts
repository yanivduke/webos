/**
 * Custom Theme Plugin
 * Allows customizing the desktop background color
 */

import type { Plugin, PluginAPI } from '../utils/plugin-manager';

const customThemePlugin: Plugin = {
  metadata: {
    id: 'custom-theme',
    name: 'Custom Theme',
    version: '1.0.0',
    author: 'WebOS Team',
    description: 'Customize desktop background color and appearance',
    permissions: ['ui', 'storage', 'notifications'],
    category: 'theme',
    icon: '🎨'
  },

  async initialize(api: PluginAPI) {
    console.log('[Custom Theme Plugin] Initializing...');

    // Load saved theme
    const savedColor = api.getData('backgroundColor');
    if (savedColor && api.setDesktopBackground) {
      api.setDesktopBackground(savedColor);
    }

    // Add desktop icon for theme selector
    api.addDesktopIcon({
      id: 'theme-selector',
      name: 'Themes',
      icon: '🎨',
      onClick: () => {
        // Show theme selector window
        api.openWindow({
          title: 'Theme Selector',
          width: 400,
          height: 300,
          component: 'div', // Would be a Vue component in full implementation
          data: {
            html: `
              <div style="padding: 20px; font-family: 'Press Start 2P', monospace;">
                <h3>Select Background Color</h3>
                <div style="margin-top: 20px;">
                  <button onclick="changeTheme('#a0a0a0')">Classic Gray</button>
                  <button onclick="changeTheme('#87ceeb')">Sky Blue</button>
                  <button onclick="changeTheme('#98fb98')">Pale Green</button>
                  <button onclick="changeTheme('#dda0dd')">Plum</button>
                  <button onclick="changeTheme('#f0e68c')">Khaki</button>
                </div>
              </div>
            `
          }
        });
      }
    });

    // Add menu item
    api.addMenuItem('Tools', {
      label: 'Theme Selector',
      onClick: () => {
        api.showNotification(
          'info',
          'Theme Selector',
          'Choose a desktop theme'
        );
      }
    });

    // Define theme changing function
    (window as any).changeTheme = (color: string) => {
      if (api.setDesktopBackground) {
        api.setDesktopBackground(color);
        api.setData('backgroundColor', color);
        api.showNotification(
          'success',
          'Theme Changed',
          `Desktop background set to ${color}`
        );
      }
    };

    api.showNotification(
      'success',
      'Custom Theme Loaded',
      'You can now customize your desktop appearance'
    );

    console.log('[Custom Theme Plugin] Initialized successfully');
  },

  async destroy() {
    console.log('[Custom Theme Plugin] Destroying...');

    // Reset to default theme
    const api = (window as any).pluginAPI;
    if (api?.setDesktopBackground) {
      api.setDesktopBackground('#a0a0a0');
    }

    // Clean up global function
    delete (window as any).changeTheme;
  }
};

export default customThemePlugin;

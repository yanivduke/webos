/**
 * Hello World Plugin
 * Simple demonstration plugin that shows a notification
 */

import type { Plugin, PluginAPI } from '../utils/plugin-manager';

const helloWorldPlugin: Plugin = {
  metadata: {
    id: 'hello-world',
    name: 'Hello World',
    version: '1.0.0',
    author: 'WebOS Team',
    description: 'A simple demonstration plugin that displays a welcome message',
    permissions: ['notifications', 'ui'],
    category: 'utility',
    icon: '👋'
  },

  async initialize(api: PluginAPI) {
    console.log('[Hello World Plugin] Initializing...');

    // Show welcome notification
    api.showNotification(
      'info',
      'Hello World!',
      'The Hello World plugin has been loaded successfully!'
    );

    // Add a desktop icon
    api.addDesktopIcon({
      id: 'hello-world-icon',
      name: 'Hello',
      icon: '👋',
      onClick: () => {
        api.showNotification(
          'success',
          'Hello!',
          'You clicked the Hello World icon!'
        );
      }
    });

    // Listen for custom events
    api.on('custom-event', (data: any) => {
      console.log('[Hello World Plugin] Received event:', data);
    });

    // Store some data
    api.setData('initialized', true);
    api.setData('initTime', Date.now());

    console.log('[Hello World Plugin] Initialized successfully');
  },

  async destroy() {
    console.log('[Hello World Plugin] Destroying...');
    // Cleanup is handled automatically by plugin manager
  }
};

export default helloWorldPlugin;

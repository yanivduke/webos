# WebOS Plugin System

## Overview

The WebOS Plugin/Extension System allows developers to extend WebOS functionality through installable plugins. Plugins can add new features, customize the UI, integrate with system APIs, and more.

## Architecture

### Core Components

1. **Plugin Manager** (`src/client/utils/plugin-manager.ts`)
   - Handles plugin lifecycle (install, enable, disable, uninstall)
   - Manages plugin registry and metadata
   - Provides sandboxed plugin API
   - Persists plugin state to localStorage

2. **Plugin Manager UI** (`src/client/components/apps/AmigaPluginManager.vue`)
   - Desktop application for managing plugins
   - Three tabs: Installed, Available, Settings
   - Amiga Workbench-style interface

3. **Server API** (`src/server/routes/plugins.route.js`)
   - GET `/api/plugins/available` - List available plugins
   - GET `/api/plugins/:id/info` - Get plugin details
   - POST `/api/plugins/install` - Install plugin
   - GET `/api/plugins/categories` - List categories
   - GET `/api/plugins/featured` - Get featured plugins

## Plugin Structure

```typescript
interface Plugin {
  metadata: {
    id: string;              // Unique identifier
    name: string;            // Display name
    version: string;         // Semantic version
    author: string;          // Author name
    description: string;     // Short description
    permissions: string[];   // Required permissions
    dependencies?: string[]; // Plugin dependencies
    category?: string;       // Category
    icon?: string;           // Icon emoji
  };
  initialize: (api: PluginAPI) => void | Promise<void>;
  destroy: () => void | Promise<void>;
}
```

## Plugin API

Plugins receive a sandboxed API object with the following capabilities:

### Desktop API
```typescript
api.addDesktopIcon(icon: DesktopIcon)
api.removeDesktopIcon(iconId: string)
api.addMenuItem(menu: string, item: MenuItem)
api.openWindow(window: WindowConfig)
```

### Notification API
```typescript
api.showNotification(
  type: 'info' | 'success' | 'warning' | 'error',
  title: string,
  message: string
)
```

### Storage API
```typescript
api.getData(key: string): any
api.setData(key: string, value: any): void
api.removeData(key: string): void
```

### Events API
```typescript
api.on(event: string, callback: Function): void
api.off(event: string, callback: Function): void
api.emit(event: string, data?: any): void
```

### Conditional APIs

With `system` permission:
```typescript
api.getSystemInfo(): Promise<any>
```

With `ui` permission:
```typescript
api.setDesktopBackground(color: string): void
api.addWidget(widget: Widget): void
```

## Creating a Plugin

### Example: Hello World Plugin

```typescript
import type { Plugin, PluginAPI } from '../utils/plugin-manager';

const helloWorldPlugin: Plugin = {
  metadata: {
    id: 'hello-world',
    name: 'Hello World',
    version: '1.0.0',
    author: 'Your Name',
    description: 'A simple demonstration plugin',
    permissions: ['notifications', 'ui'],
    category: 'utility',
    icon: '👋'
  },

  async initialize(api: PluginAPI) {
    // Show notification
    api.showNotification(
      'info',
      'Hello!',
      'Plugin loaded successfully'
    );

    // Add desktop icon
    api.addDesktopIcon({
      id: 'hello-icon',
      name: 'Hello',
      icon: '👋',
      onClick: () => {
        api.showNotification('success', 'Click!', 'You clicked me!');
      }
    });

    // Store data
    api.setData('initialized', true);
  },

  async destroy() {
    // Cleanup happens automatically
  }
};

export default helloWorldPlugin;
```

## Permission System

Plugins must declare required permissions:

- `filesystem` - Access file system operations
- `network` - Make network requests
- `ui` - Modify UI (desktop, themes, widgets)
- `storage` - Access localStorage
- `system` - Access system information
- `notifications` - Show notifications

## Sample Plugins

### 1. Hello World (`hello-world-plugin.ts`)
Simple demonstration showing notifications and desktop icons.

**Features:**
- Welcome notification
- Desktop icon that responds to clicks
- Data storage example

**Permissions:** `notifications`, `ui`

### 2. Custom Theme (`custom-theme-plugin.ts`)
Customize desktop background color and appearance.

**Features:**
- Theme selector window
- Multiple color presets
- Saves user preferences

**Permissions:** `ui`, `storage`, `notifications`

### 3. Quick Notes (`quick-notes-plugin.ts`)
Sticky notes widget for the desktop.

**Features:**
- Desktop notes widget
- Add/remove notes
- Persistent storage
- Keyboard shortcuts

**Permissions:** `ui`, `storage`, `notifications`

## Installation

### Using Plugin Manager UI

1. Open Plugin Manager from Tools menu
2. Navigate to "Available" tab
3. Click "Install" on desired plugin
4. Plugin will be installed and can be enabled

### Programmatic Installation

```typescript
import pluginManager from './utils/plugin-manager';
import myPlugin from './plugins/my-plugin';

// Install
await pluginManager.installPlugin(myPlugin);

// Enable
await pluginManager.enablePlugin('my-plugin-id');

// Disable
await pluginManager.disablePlugin('my-plugin-id');

// Uninstall
await pluginManager.uninstallPlugin('my-plugin-id');
```

## Security Features

1. **Permission System** - Plugins must request permissions
2. **Sandboxed Execution** - Limited API access
3. **Version Compatibility** - Checks WebOS version
4. **Dependency Validation** - Ensures dependencies are met
5. **Resource Isolation** - Plugins can't access each other's data

## Configuration

Plugin Manager settings (accessible via Settings tab):

- **Auto-update plugins** - Automatically update plugins
- **Allow experimental plugins** - Enable beta plugins
- **Maximum plugins** - Limit number of installed plugins (1-100)

## Storage

- **Plugin metadata**: `localStorage['webos-installed-plugins']`
- **Plugin config**: `localStorage['webos-plugin-config']`
- **Plugin data**: `localStorage['plugin:{pluginId}:{key}']`

## Best Practices

1. **Use semantic versioning** (e.g., 1.0.0)
2. **Minimize permissions** - Only request what you need
3. **Handle errors gracefully** - Use try/catch
4. **Clean up resources** - Implement proper destroy()
5. **Document your plugin** - Add clear descriptions
6. **Test thoroughly** - Verify enable/disable cycles

## Troubleshooting

### Plugin won't install
- Check version compatibility
- Verify all dependencies are installed
- Ensure plugin ID is unique

### Plugin won't enable
- Check permission requirements
- Review browser console for errors
- Verify plugin structure is correct

### Plugin data lost
- Plugins use localStorage - check browser settings
- Clear cache may remove plugin data
- Always backup important data

## Future Enhancements

- Plugin marketplace
- Plugin ratings and reviews
- Automatic updates
- Plugin sandboxing improvements
- Remote plugin loading
- Plugin development SDK
- Hot reload for development

## Support

For issues or questions:
- Check browser console for errors
- Review plugin documentation
- Contact plugin author
- File issue in WebOS repository

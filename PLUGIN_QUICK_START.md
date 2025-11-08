# WebOS Plugin System - Quick Start Guide

## Accessing Plugin Manager

### Method 1: Tools Menu
1. Click **Tools** in the menu bar
2. Select **Plugin Manager**

### Method 2: Desktop Icon
1. Double-click the **Plugins** icon in the desktop sidebar
   - Purple puzzle piece icon
   - Located below Archiver

## Installing a Sample Plugin

1. **Open Plugin Manager**
2. **Click "Available" tab**
3. **Choose a plugin:**
   - 👋 **Hello World** - Simple demo with notifications
   - 🎨 **Custom Theme** - Change desktop colors
   - 📝 **Quick Notes** - Add sticky notes
4. **Click "Install"** button
5. **Go to "Installed" tab**
6. **Click "Enable"** on the plugin
7. **See confirmation notification**

## Using Installed Plugins

### Hello World
- Look for 👋 icon on desktop
- Click it to see a notification
- Shows how plugins work

### Custom Theme
- Look for 🎨 icon on desktop
- Click to open theme selector
- Choose from 5 color presets
- Changes desktop background instantly

### Quick Notes
- Look for 📝 icon on desktop
- Click to open notes window
- Type notes and click "Add Note"
- Notes persist across sessions

## Managing Plugins

### Enable/Disable
- Open Plugin Manager → Installed tab
- Click "Enable" or "Disable" button
- Plugin activates/deactivates immediately

### Uninstall
- Open Plugin Manager → Installed tab
- Click "Uninstall" button
- Confirm the action
- Plugin removed completely

### View Details
- In Installed tab, click a plugin
- See permissions, size, version
- Check status indicator:
  - ✓ Green = Enabled
  - ⊗ Gray = Disabled
  - ⚠ Red = Error

## Settings

Open **Settings tab** to configure:

- ☑ **Auto-update plugins** - Update automatically
- ☑ **Allow experimental plugins** - Enable beta features
- **Maximum plugins** - Set limit (1-100)
- **Clear Cache** - Remove temporary data

## Statistics

View in Settings tab:
- Total Plugins
- Enabled Count
- Disabled Count
- Total Size

## Testing the API

### Server Endpoints

```bash
# List available plugins
curl http://localhost:3001/api/plugins/available

# Get plugin details
curl http://localhost:3001/api/plugins/hello-world/info

# List categories
curl http://localhost:3001/api/plugins/categories

# Get featured plugins
curl http://localhost:3001/api/plugins/featured
```

## Creating Your First Plugin

### 1. Create plugin file

`src/client/plugins/my-first-plugin.ts`:

```typescript
import type { Plugin, PluginAPI } from '../utils/plugin-manager';

const myPlugin: Plugin = {
  metadata: {
    id: 'my-first-plugin',
    name: 'My First Plugin',
    version: '1.0.0',
    author: 'Your Name',
    description: 'My first WebOS plugin',
    permissions: ['notifications'],
    icon: '🚀'
  },

  async initialize(api: PluginAPI) {
    api.showNotification(
      'success',
      'Hello!',
      'My first plugin is running!'
    );
  },

  async destroy() {
    console.log('Plugin stopped');
  }
};

export default myPlugin;
```

### 2. Install it

In your code:

```typescript
import pluginManager from './utils/plugin-manager';
import myPlugin from './plugins/my-first-plugin';

await pluginManager.installPlugin(myPlugin);
await pluginManager.enablePlugin('my-first-plugin');
```

### 3. See it work!

You'll see a notification when the plugin loads.

## Common Permissions

- `notifications` - Show toast messages
- `ui` - Add icons, menus, widgets
- `storage` - Save data
- `filesystem` - Access files
- `network` - Make HTTP requests
- `system` - Get system info

## Tips

1. **Start Simple** - Begin with notifications
2. **Check Examples** - Review sample plugins
3. **Use Console** - Check for errors
4. **Test Enable/Disable** - Verify cleanup works
5. **Save Data** - Use storage API for persistence

## Troubleshooting

**Plugin won't install?**
- Check plugin ID is unique
- Verify metadata is complete
- Review browser console

**Plugin won't enable?**
- Check permissions are declared
- Look for errors in console
- Try disabling and re-enabling

**Changes not visible?**
- Refresh the page
- Check plugin is enabled
- Verify plugin code is correct

## Next Steps

1. ✅ Install sample plugins
2. ✅ Test each plugin's features
3. ✅ Explore Plugin Manager settings
4. ✅ Read full documentation in `src/client/plugins/README.md`
5. ✅ Create your own plugin!

## Quick Reference

### File Locations
```
src/client/
  ├── utils/plugin-manager.ts         # Core manager
  ├── components/apps/
  │   └── AmigaPluginManager.vue      # UI app
  └── plugins/
      ├── hello-world-plugin.ts       # Sample 1
      ├── custom-theme-plugin.ts      # Sample 2
      ├── quick-notes-plugin.ts       # Sample 3
      └── README.md                   # Full docs

src/server/
  └── routes/plugins.route.js         # API endpoints
```

### API Endpoints
- `GET /api/plugins/available` - List plugins
- `GET /api/plugins/:id/info` - Plugin details
- `POST /api/plugins/install` - Install plugin
- `GET /api/plugins/categories` - List categories
- `GET /api/plugins/featured` - Featured plugins

---

**For detailed documentation, see:**
- `/home/user/webos/PLUGIN_SYSTEM_IMPLEMENTATION.md`
- `/home/user/webos/src/client/plugins/README.md`

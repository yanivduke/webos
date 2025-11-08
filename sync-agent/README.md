# WebOS Sync Agent

Desktop synchronization agent for WebOS - sync your local files with cloud WebOS safely and securely.

## Features

- 🔄 **Real-time Synchronization**: Automatically sync files between your desktop and WebOS cloud
- 🔐 **Secure Authentication**: Token-based authentication with WebOS server
- 🖥️ **Cross-Platform**: Available for Windows, macOS, and Linux
- 📁 **Flexible Folder Selection**: Choose any folder on your system to sync
- ⚡ **Efficient Syncing**: Only uploads/downloads changed files
- 🔔 **Notifications**: Get notified about sync events (optional)
- 🎯 **Conflict Resolution**: Smart handling of file conflicts
- 📊 **Activity Tracking**: See all sync activity in real-time

## Installation

### Windows

1. Download `WebOS-Sync-Agent-Setup.exe` from the releases page
2. Run the installer
3. Follow the installation wizard
4. Launch WebOS Sync Agent from the Start Menu

### macOS

1. Download `WebOS-Sync-Agent.dmg` from the releases page
2. Open the DMG file
3. Drag WebOS Sync Agent to your Applications folder
4. Launch from Applications

### Linux

**Ubuntu/Debian:**
```bash
sudo dpkg -i webos-sync-agent_1.0.0_amd64.deb
```

**Fedora/RHEL:**
```bash
sudo rpm -i webos-sync-agent-1.0.0.x86_64.rpm
```

**AppImage (Universal):**
```bash
chmod +x WebOS-Sync-Agent-1.0.0.AppImage
./WebOS-Sync-Agent-1.0.0.AppImage
```

## Getting Started

1. **Connect to WebOS Server**
   - Launch WebOS Sync Agent
   - Enter your WebOS server URL (e.g., `http://localhost:3001`)
   - Enter your username and password
   - Click "Connect"

2. **Select Sync Folder**
   - Click "Change" next to "Sync Folder"
   - Select the folder you want to sync
   - By default, it will create a "WebOS" folder in your home directory

3. **Start Syncing**
   - Click "Start Sync" to begin automatic synchronization
   - Files will be synced every 30 seconds (configurable)
   - You can also manually trigger a sync with "Sync Now"

## Configuration

### Sync Settings

- **Sync Interval**: How often to check for changes (default: 30 seconds)
- **Conflict Resolution**: What to do when files conflict
  - Ask me: Prompt for each conflict
  - Use local version: Always prefer local files
  - Use remote version: Always prefer remote files
- **Notifications**: Enable/disable desktop notifications
- **Auto Start**: Start sync automatically when you login

### Advanced

The configuration is stored in:
- **Windows**: `%APPDATA%\webos-sync-config\config.json`
- **macOS**: `~/Library/Application Support/webos-sync-config/config.json`
- **Linux**: `~/.config/webos-sync-config/config.json`

## How It Works

1. **File Watching**: The agent watches your selected folder for changes using efficient file system watchers
2. **Change Detection**: When a file changes, it calculates the MD5 hash to verify actual changes
3. **Smart Sync**: Only changed files are uploaded/downloaded to save bandwidth
4. **Bidirectional**: Changes on either the desktop or WebOS are synchronized
5. **Conflict Resolution**: If both versions change, your conflict resolution setting determines the outcome

## Security

- **Token-Based Auth**: Uses secure session tokens, never stores passwords
- **Path Sanitization**: All file paths are sanitized to prevent traversal attacks
- **HTTPS Support**: Connect to WebOS servers via HTTPS for encrypted transfers
- **Local Storage**: Configuration is stored locally with OS-level security

## Building from Source

### Prerequisites

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build for All Platforms

```bash
npm run build:all
```

### Build for Specific Platform

```bash
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux
```

## Troubleshooting

### Cannot Connect to Server

- Verify the server URL is correct
- Ensure the WebOS server is running
- Check firewall settings
- Try using the IP address instead of hostname

### Files Not Syncing

- Check that sync is started (not stopped or paused)
- Verify the sync folder path is correct
- Check the Activity tab for errors
- Ensure you have read/write permissions to the sync folder

### High CPU Usage

- Increase the sync interval in settings
- Reduce the number of files being synced
- Check for rapid file changes (e.g., logs, temp files)

## System Tray

The app runs in your system tray for quick access:

- **Click** to open the main window
- **Right-click** for quick actions:
  - Open WebOS Sync
  - Sync Status
  - Pause/Resume Sync
  - Quit

## Support

For issues and feature requests, please visit:
- GitHub Issues: [webos/issues](https://github.com/yourusername/webos/issues)
- Documentation: [docs.webos.com](https://docs.webos.com)

## License

MIT License - see LICENSE file for details

## Version

Current version: 1.0.0

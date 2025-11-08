# Installation Guide - WebOS Sync Agent

## Quick Install

### Windows

1. **Download** the installer:
   - From WebOS interface: Open "Utilities" → "Sync Agent" → Click "Windows"
   - Direct: Download `WebOS-Sync-Agent-Setup.exe`

2. **Run** the installer:
   - Double-click `WebOS-Sync-Agent-Setup.exe`
   - If Windows SmartScreen appears, click "More info" → "Run anyway"
   - Follow the installation wizard

3. **Launch** the application:
   - Find "WebOS Sync Agent" in Start Menu
   - Or desktop shortcut if created during install

### macOS

1. **Download** the DMG:
   - From WebOS interface: Open "Utilities" → "Sync Agent" → Click "macOS"
   - Direct: Download `WebOS-Sync-Agent.dmg`

2. **Install**:
   - Double-click the DMG file
   - Drag "WebOS Sync Agent" to Applications folder
   - Eject the DMG

3. **Launch**:
   - Open Applications folder
   - Double-click "WebOS Sync Agent"
   - If macOS blocks it: Right-click → "Open" → "Open"

4. **Grant permissions** (if prompted):
   - File system access
   - Network access

### Linux

#### Option 1: AppImage (Universal)

```bash
# Download
wget http://your-server:3001/api/downloads/sync-agent/WebOS-Sync-Agent.AppImage

# Make executable
chmod +x WebOS-Sync-Agent.AppImage

# Run
./WebOS-Sync-Agent.AppImage
```

#### Option 2: Debian/Ubuntu (.deb)

```bash
# Download
wget http://your-server:3001/api/downloads/sync-agent/webos-sync-agent_1.0.0_amd64.deb

# Install
sudo dpkg -i webos-sync-agent_1.0.0_amd64.deb

# Fix dependencies if needed
sudo apt-get install -f

# Run
webos-sync-agent
```

#### Option 3: Fedora/RHEL (.rpm)

```bash
# Download
wget http://your-server:3001/api/downloads/sync-agent/webos-sync-agent-1.0.0.x86_64.rpm

# Install
sudo rpm -i webos-sync-agent-1.0.0.x86_64.rpm

# Or with dnf
sudo dnf install ./webos-sync-agent-1.0.0.x86_64.rpm

# Run
webos-sync-agent
```

## First-Time Setup

### 1. Connect to Server

1. Launch WebOS Sync Agent
2. Enter your WebOS server URL:
   - Local: `http://localhost:3001`
   - Remote: `http://your-server-ip:3001`
   - HTTPS: `https://your-server.com`
3. Enter your username (default: `admin`)
4. Enter your password (default: `admin`)
5. Click "Connect"

### 2. Select Sync Folder

1. Click "Change" next to "Sync Folder"
2. Choose a folder on your computer
3. Default: `~/WebOS` (recommended)

### 3. Start Syncing

1. Click "Start Sync"
2. Files will sync automatically
3. Check "Activity" tab to see sync progress

## Configuration

### Settings Tab

- **Sync Interval**: How often to check for changes (default: 30s)
- **Conflict Resolution**:
  - "Ask me" - Prompt for each conflict
  - "Use local version" - Prefer local files
  - "Use remote version" - Prefer server files
- **Notifications**: Desktop notifications for sync events
- **Auto Start**: Start sync when you login

### System Tray

The agent runs in your system tray:
- **Windows**: Bottom-right corner
- **macOS**: Top-right menu bar
- **Linux**: Top panel (depends on desktop environment)

Right-click the icon for quick actions.

## Uninstallation

### Windows

1. Open "Settings" → "Apps"
2. Find "WebOS Sync Agent"
3. Click "Uninstall"

Or use the uninstaller in:
`C:\Program Files\WebOS Sync Agent\Uninstall.exe`

### macOS

1. Open Applications folder
2. Drag "WebOS Sync Agent" to Trash
3. Empty Trash

Remove config files (optional):
```bash
rm -rf ~/Library/Application\ Support/webos-sync-config
```

### Linux

**If installed via .deb:**
```bash
sudo apt remove webos-sync-agent
```

**If installed via .rpm:**
```bash
sudo rpm -e webos-sync-agent
```

**If using AppImage:**
```bash
rm WebOS-Sync-Agent.AppImage
```

Remove config files (optional):
```bash
rm -rf ~/.config/webos-sync-config
```

## Troubleshooting

### Cannot Connect to Server

**Issue**: "Cannot connect to server" error

**Solutions**:
1. Verify server URL is correct
2. Check server is running: `curl http://localhost:3001/api/health`
3. Check firewall settings
4. Try IP address instead of hostname

### Files Not Syncing

**Issue**: Files don't sync after changes

**Solutions**:
1. Check sync is running (not stopped/paused)
2. Verify folder path is correct
3. Check Activity tab for errors
4. Ensure you have write permissions
5. Try "Sync Now" button

### Authentication Failed

**Issue**: "Invalid username or password"

**Solutions**:
1. Verify credentials are correct
2. Check server is running
3. Try resetting password on server

### High CPU/Memory Usage

**Issue**: Sync agent uses too many resources

**Solutions**:
1. Increase sync interval (Settings tab)
2. Reduce number of files being synced
3. Exclude temporary files/folders
4. Restart the application

### Permission Denied

**Issue**: Cannot read/write files

**Solutions**:
- **Windows**: Run as Administrator (right-click → "Run as administrator")
- **macOS**: Grant Full Disk Access (System Preferences → Security & Privacy)
- **Linux**: Check file permissions with `ls -la`

### Sync Conflicts

**Issue**: Files keep conflicting

**Solutions**:
1. Choose consistent conflict resolution in Settings
2. Stop making changes on both sides simultaneously
3. Manually resolve conflicts:
   - Pick which version to keep
   - Delete or rename the other version
   - Sync again

## Advanced Configuration

### Custom Server Port

If your server runs on a different port, update the URL:
```
http://localhost:8080
```

### HTTPS with Self-Signed Certificate

If using HTTPS with self-signed cert, you may need to:

**Node.js:**
```bash
export NODE_TLS_REJECT_UNAUTHORIZED=0
```

**Not recommended for production!** Use proper SSL certificates instead.

### Multiple Accounts

To sync multiple accounts:
1. Create separate folders for each account
2. Logout and login with different credentials
3. Change sync folder for each account

### Selective Sync

Currently, all files in the sync folder are synced. To exclude files:
1. Move them outside the sync folder
2. Or use `.gitignore`-style exclusions (future feature)

## Getting Help

- Check the [README](README.md) for features and how-to
- Check the [BUILD](BUILD.md) guide if building from source
- Report issues at: https://github.com/yourusername/webos/issues
- Server logs: Check server console for errors
- Client logs: Check Activity tab in the application

## Security Best Practices

1. **Use strong passwords** - Change default credentials
2. **Use HTTPS** - Enable SSL on your server
3. **Firewall** - Only expose necessary ports
4. **Updates** - Keep the sync agent updated
5. **Backups** - Don't rely solely on sync for backups
6. **Private networks** - Use VPN when syncing over internet

## What Gets Synced?

**Synced:**
- All files in your sync folder
- Subdirectories and their contents
- File modifications
- New files
- Deletions (moved to trash)

**Not Synced:**
- Hidden files (starting with `.`)
- System files
- Files outside sync folder
- File permissions (Windows/Linux differences)

## Sync Folder Structure

Your local sync folder maps to `df0` (the main disk) in WebOS:

```
Local: ~/WebOS/Documents/file.txt
WebOS: df0/Documents/file.txt
```

## Data Storage

**Configuration**: Stored locally in:
- Windows: `%APPDATA%\webos-sync-config\config.json`
- macOS: `~/Library/Application Support/webos-sync-config/config.json`
- Linux: `~/.config/webos-sync-config/config.json`

**Synced Files**: In your selected sync folder

**Server Storage**: On the WebOS server at `src/server/storage/workbench/`

## Next Steps

After installation:
1. Explore the WebOS interface in your browser
2. Create some files/folders in WebOS
3. Watch them sync to your desktop
4. Edit files locally and see them update in WebOS
5. Enjoy seamless file synchronization!

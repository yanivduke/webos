# WebOS Desktop Sync Agent - Complete Guide

## Overview

The WebOS Desktop Sync Agent allows you to synchronize files between your physical desktop operating system (Windows, macOS, or Linux) and your cloud WebOS environment. Files are automatically synced in real-time, providing seamless access to your documents across both environments.

## Architecture

```
┌─────────────────────┐         ┌──────────────────────┐
│  Desktop Computer   │         │   WebOS Server       │
│                     │         │                      │
│  ┌───────────────┐  │  HTTPS  │  ┌────────────────┐  │
│  │  Sync Agent   │◄─┼────────►│  │  REST API      │  │
│  │  (Electron)   │  │         │  │  (Express)     │  │
│  └───────┬───────┘  │         │  └────────┬───────┘  │
│          │          │         │           │          │
│  ┌───────▼───────┐  │         │  ┌────────▼───────┐  │
│  │  Local Folder │  │         │  │  File Storage  │  │
│  │  ~/WebOS      │  │         │  │  (df0, dh0)    │  │
│  └───────────────┘  │         │  └────────────────┘  │
└─────────────────────┘         └──────────────────────┘
```

## Features

### ✅ Real-Time Synchronization
- File watcher monitors changes using `chokidar`
- Automatic upload/download when files change
- Bidirectional sync (desktop ↔ cloud)

### 🔐 Security
- Token-based authentication (no stored passwords)
- Path sanitization to prevent directory traversal
- HTTPS support for encrypted transfers
- Session-based access control

### 📁 File Operations
- **Upload**: New/modified local files → WebOS
- **Download**: New/modified WebOS files → Desktop
- **Delete**: Deletions synced (moved to trash)
- **Folders**: Full directory structure preserved

### ⚙️ Configuration
- Configurable sync interval (default: 30s)
- Conflict resolution strategies:
  - Ask user for each conflict
  - Always use local version
  - Always use remote version
- Optional desktop notifications
- Auto-start on system login

### 🎯 Smart Syncing
- MD5 hash comparison (only sync actual changes)
- Ignores hidden files (dotfiles)
- Waits for file writes to stabilize
- Queue-based sync to prevent conflicts

## Project Structure

```
sync-agent/
├── src/
│   ├── main.js              # Electron main process
│   ├── renderer.js          # UI logic (IPC)
│   ├── auth-manager.js      # Authentication
│   ├── config-manager.js    # Configuration storage
│   ├── sync-engine.js       # Core sync logic
│   ├── index.html           # UI template
│   └── style.css            # UI styling
├── assets/
│   ├── icon.png             # App icon
│   └── tray-icon.png        # System tray icon
├── dist/                    # Build output
├── package.json             # Dependencies & build config
├── README.md                # User documentation
├── BUILD.md                 # Build instructions
└── INSTALL.md               # Installation guide
```

## Core Components

### 1. Main Process (`main.js`)

**Responsibilities:**
- Create application window
- Manage system tray
- Handle IPC communication with renderer
- Initialize sync engine and managers

**Key IPC Handlers:**
- `login` - Authenticate with WebOS server
- `logout` - End session and stop sync
- `start-sync` - Begin synchronization
- `stop-sync` - Pause synchronization
- `trigger-sync` - Manual sync trigger
- `select-folder` - Choose sync folder
- `get-config` - Retrieve configuration
- `update-config` - Save configuration

### 2. Auth Manager (`auth-manager.js`)

**Responsibilities:**
- Login/logout with WebOS server
- Token management
- Session validation

**Key Methods:**
```javascript
login(serverUrl, username, password) → token
logout() → void
validateToken() → boolean
getAuthHeaders() → Object
```

### 3. Config Manager (`config-manager.js`)

**Responsibilities:**
- Persistent configuration storage using `electron-store`
- Default settings management

**Configuration Schema:**
```javascript
{
  serverUrl: 'http://localhost:3001',
  username: null,
  authToken: null,
  syncFolder: '~/WebOS',
  syncEnabled: false,
  syncInterval: 30000,
  conflictResolution: 'ask',
  notifications: true,
  autoStart: false,
  lastSync: null
}
```

### 4. Sync Engine (`sync-engine.js`)

**Responsibilities:**
- File watching with `chokidar`
- Periodic sync scheduling
- File comparison and reconciliation
- Upload/download file operations

**Sync Algorithm:**

1. **Initial Sync:**
   ```
   GET remote file list from WebOS
   GET local file list from disk
   FOR EACH file:
     IF exists only remotely → download
     IF exists only locally → upload
     IF exists both sides:
       COMPARE modification times
       IF remote newer → download
       IF local newer → upload
   ```

2. **Real-Time Sync:**
   ```
   WATCH local folder for changes
   ON file added → upload to WebOS
   ON file changed → upload to WebOS
   ON file deleted → delete from WebOS
   ```

3. **Periodic Sync:**
   ```
   EVERY syncInterval seconds:
     IF not paused AND not syncing:
       Perform full reconciliation
   ```

**Key Methods:**
```javascript
start() → void                          // Start sync engine
stop() → void                           // Stop sync engine
syncNow() → Promise                     // Manual sync
uploadFile(filePath) → Promise
downloadFile(remotePath) → Promise
getRemoteFileList() → Promise<Array>
getLocalFileList() → Promise<Array>
reconcileFiles(local, remote) → Promise
```

### 5. Renderer Process (`renderer.js`)

**Responsibilities:**
- UI updates and user interaction
- IPC communication with main process
- Display sync status and activity

**Key Features:**
- Login screen with server connection
- Sync controls (start/stop/sync now)
- Settings configuration
- Activity log with real-time updates
- Statistics display (uploaded/downloaded/errors)

## API Integration

### WebOS Server Endpoints Used

**Authentication:**
```
POST /api/auth/login
  Body: { username, password }
  Response: { session: { token, user } }

POST /api/auth/logout
  Headers: { Authorization: Bearer <token> }

GET /api/auth/session
  Headers: { Authorization: Bearer <token> }
```

**File Operations:**
```
GET /api/files/list?path=<path>
  Response: { items: [...], path, parentPath }

POST /api/files/read
  Body: { path }
  Response: { content, name, size, modified }

POST /api/files/write
  Body: { path, content }

POST /api/files/create
  Body: { path, name, type, content }

DELETE /api/files/delete?path=<path>
```

**Downloads:**
```
GET /api/downloads/sync-agent
  Response: { downloads: [...] }

GET /api/downloads/sync-agent/:filename
  Response: <binary file stream>
```

## Workflow Examples

### User Workflow: First-Time Setup

1. User downloads sync agent from WebOS interface
2. Installs on their OS (Windows/Mac/Linux)
3. Launches application
4. Enters server URL (e.g., `http://localhost:3001`)
5. Enters credentials (username/password)
6. Selects local sync folder (default: `~/WebOS`)
7. Clicks "Start Sync"
8. Files begin synchronizing automatically

### Technical Workflow: File Upload

```javascript
// 1. User creates file locally
~/WebOS/document.txt

// 2. Chokidar detects change
watcher.on('add', '/Users/john/WebOS/document.txt')

// 3. Sync engine processes
onFileAdded('/Users/john/WebOS/document.txt')
  → uploadFile('/Users/john/WebOS/document.txt')

// 4. Convert to WebOS path
toRemotePath('document.txt') → 'df0/document.txt'

// 5. Read file content
content = await fs.readFile(filePath, 'utf-8')

// 6. Upload via API
POST /api/files/write
{
  path: 'df0/document.txt',
  content: '...'
}

// 7. Update file hash
fileHashes.set(filePath, md5Hash)

// 8. Emit event
emit('file-changed', { type: 'add', path })
```

### Technical Workflow: Conflict Resolution

```javascript
// Scenario: File modified on both sides

// Local file: document.txt (modified: 2025-11-08 10:00)
// Remote file: df0/document.txt (modified: 2025-11-08 10:05)

// During reconciliation:
const localTime = new Date('2025-11-08 10:00').getTime()
const remoteTime = new Date('2025-11-08 10:05').getTime()

if (remoteTime > localTime) {
  // Remote is newer
  if (conflictResolution === 'remote') {
    await downloadFile('df0/document.txt')
  } else if (conflictResolution === 'local') {
    await uploadFile('~/WebOS/document.txt')
  } else {
    // conflictResolution === 'ask'
    showConflictDialog()
  }
}
```

## Building and Distribution

### Development
```bash
cd sync-agent
npm install
npm run dev
```

### Production Build
```bash
# All platforms
npm run build:all

# Specific platform
npm run build:win
npm run build:mac
npm run build:linux
```

### Output Files
- **Windows**: `dist/WebOS-Sync-Agent-Setup.exe` (~85 MB)
- **macOS**: `dist/WebOS-Sync-Agent.dmg` (~90 MB)
- **Linux**: `dist/WebOS-Sync-Agent.AppImage` (~88 MB)

### Distribution via WebOS

1. Build the sync agent
2. Copy binaries to server:
   ```bash
   cp dist/*.{exe,dmg,AppImage} ../src/server/downloads/
   ```
3. Users download from WebOS UI:
   - Open "Utilities" drawer
   - Click "Sync Agent" icon
   - Select their OS
   - Download begins

## Security Considerations

### Implemented Security Measures

1. **Authentication:**
   - Session token-based (not password storage)
   - Token validation on each API call
   - 24-hour session expiration

2. **Path Sanitization:**
   - All paths sanitized on server side
   - Prevents directory traversal attacks
   - Restricts access to storage directory

3. **Network Security:**
   - HTTPS support (configure server with SSL)
   - CORS properly configured
   - No sensitive data in URLs

4. **Local Storage:**
   - Config stored with OS-level encryption
   - Tokens stored securely using `electron-store`

### Recommendations

1. **Use HTTPS:** Configure WebOS server with SSL certificate
2. **Strong Passwords:** Change default credentials
3. **Firewall:** Only expose necessary ports
4. **VPN:** Use VPN when syncing over internet
5. **Regular Updates:** Keep sync agent updated

## Performance Optimization

### Current Optimizations

1. **File Watching:**
   - `awaitWriteFinish` prevents partial uploads
   - Ignore hidden files to reduce overhead
   - Debounced file change detection

2. **Hash-Based Comparison:**
   - Only sync files that actually changed
   - MD5 hash prevents unnecessary transfers
   - Cached hashes reduce computation

3. **Efficient Sync:**
   - Configurable sync interval
   - Pause/resume capability
   - Queue-based upload/download

### Performance Tips

1. **Increase Sync Interval:** For large folders (60-120 seconds)
2. **Exclude Temp Files:** Don't sync `.tmp`, cache directories
3. **Smaller Sync Folder:** Don't sync entire home directory
4. **Close Unused Files:** Reduce file change events

## Troubleshooting

### Common Issues

**Cannot Connect:**
- Check server URL
- Verify server is running
- Check firewall settings

**Files Not Syncing:**
- Ensure sync is started
- Check Activity tab for errors
- Verify folder permissions

**High CPU Usage:**
- Increase sync interval
- Reduce number of files
- Check for rapid file changes

### Debug Mode

Run with debug logging:
```bash
npm run dev -- --dev
```

Logs appear in:
- Main process: Terminal
- Renderer process: DevTools Console

## Future Enhancements

Potential improvements:

1. **Selective Sync:** Choose which folders/files to sync
2. **Bandwidth Control:** Limit upload/download speed
3. **File Versioning:** Keep history of file changes
4. **End-to-End Encryption:** Encrypt files before upload
5. **Multi-Account Support:** Sync multiple WebOS accounts
6. **Conflict UI:** Better conflict resolution interface
7. **Progress Indicators:** Show upload/download progress
8. **Compression:** Compress files before transfer
9. **Delta Sync:** Only transfer changed portions
10. **Mobile Apps:** iOS/Android sync agents

## Conclusion

The WebOS Desktop Sync Agent provides a robust, cross-platform solution for file synchronization between desktop environments and the WebOS cloud. Built with Electron, it offers native performance and a familiar user experience across Windows, macOS, and Linux.

The architecture prioritizes security, reliability, and ease of use, making it accessible to both technical and non-technical users. With automatic synchronization, conflict resolution, and real-time updates, it seamlessly bridges the gap between your desktop and cloud workspaces.

## Additional Resources

- [User README](sync-agent/README.md) - Features and user guide
- [Build Guide](sync-agent/BUILD.md) - Building from source
- [Install Guide](sync-agent/INSTALL.md) - Installation instructions
- [WebOS Project](CLAUDE.md) - Main project documentation

## Support

For issues, feature requests, or contributions:
- GitHub Issues: [webos/issues](https://github.com/yourusername/webos/issues)
- Documentation: Project README files
- Server Logs: Check WebOS server console
- Client Logs: Check sync agent Activity tab

---

**Version:** 1.0.0
**Last Updated:** November 2025
**License:** MIT

# 📡 WebOS API Documentation v2.0

Complete API reference for the WebOS Amiga Workbench server.

---

## 🌐 Base URL

```
http://localhost:3001
```

---

## 📋 Table of Contents

1. [Health & System](#health--system)
2. [File Operations](#file-operations)
3. [Shell Commands](#shell-commands)
4. [Application State](#application-state)
5. [Settings](#settings)
6. [System Information](#system-information)

---

## Health & System

### GET / - Root Endpoint
Returns server information and available endpoints.

**Response:**
```json
{
  "name": "WebOS Server",
  "version": "2.0.0",
  "description": "Backend API for Amiga Workbench-style WebOS",
  "endpoints": {
    "health": "/api/health",
    "system": "/api/system",
    "files": "/api/files",
    "settings": "/api/settings",
    "appState": "/api/app-state",
    "shell": "/api/shell"
  },
  "features": [
    "Real file system with persistence",
    "Application state management",
    "Shell command execution",
    "System settings persistence",
    "5 working applications"
  ]
}
```

### GET /api/health - Health Check
Check if server is running and get uptime.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-01T12:00:00.000Z",
  "uptime": 123.456,
  "message": "WebOS Server is running",
  "version": "2.0.0"
}
```

---

## File Operations

### GET /api/files/list - List Directory
List files and folders in a directory.

**Query Parameters:**
- `path` (string) - Directory path (e.g., "dh0", "df0")

**Example:**
```bash
curl "http://localhost:3001/api/files/list?path=dh0"
```

**Response:**
```json
{
  "path": "dh0",
  "parentPath": null,
  "name": "dh0",
  "items": [
    {
      "id": "d_Documents",
      "name": "Documents",
      "type": "folder",
      "size": null,
      "created": "2025-10-01T08:00:00.000Z",
      "modified": "2025-10-01T08:00:00.000Z",
      "path": "dh0/Documents",
      "isDirectory": true
    },
    {
      "id": "f_readme.txt",
      "name": "readme.txt",
      "type": "file",
      "size": "1.2K",
      "created": "2025-10-01T08:00:00.000Z",
      "modified": "2025-10-01T09:00:00.000Z",
      "path": "dh0/readme.txt",
      "isDirectory": false
    }
  ]
}
```

### POST /api/files/create - Create File or Folder
Create a new file or directory.

**Body:**
```json
{
  "path": "dh0",
  "name": "newfile.txt",
  "type": "file",
  "content": "Hello World"
}
```

**Parameters:**
- `path` (string, required) - Parent directory path
- `name` (string, required) - File/folder name
- `type` (string, required) - "file" or "folder"
- `content` (string, optional) - File content (only for files)

**Response:**
```json
{
  "success": true,
  "path": "dh0/newfile.txt",
  "item": {
    "name": "newfile.txt",
    "type": "file",
    "size": "11",
    "created": "2025-10-01T12:00:00.000Z"
  }
}
```

### POST /api/files/read - Read File
Read file contents.

**Body:**
```json
{
  "path": "dh0/readme.txt"
}
```

**Response:**
```json
{
  "path": "dh0/readme.txt",
  "content": "File content here...",
  "size": "1.2K",
  "modified": "2025-10-01T09:00:00.000Z"
}
```

### POST /api/files/write - Write File
Write or update file contents.

**Body:**
```json
{
  "path": "dh0/readme.txt",
  "content": "Updated content"
}
```

**Response:**
```json
{
  "success": true,
  "path": "dh0/readme.txt",
  "size": "15",
  "modified": "2025-10-01T12:00:00.000Z"
}
```

### POST /api/files/rename - Rename File or Folder
Rename a file or directory.

**Body:**
```json
{
  "path": "dh0/oldname.txt",
  "newName": "newname.txt"
}
```

**Response:**
```json
{
  "success": true,
  "oldPath": "dh0/oldname.txt",
  "newPath": "dh0/newname.txt"
}
```

### DELETE /api/files/delete - Delete File or Folder
Delete (move to trash) a file or directory.

**Query Parameters:**
- `path` (string, required) - File/folder path to delete

**Example:**
```bash
curl -X DELETE "http://localhost:3001/api/files/delete?path=dh0/oldfile.txt"
```

**Response:**
```json
{
  "success": true,
  "path": "dh0/oldfile.txt",
  "trashedAs": "trash/oldfile.txt_1696176000000"
}
```

---

## Shell Commands

### POST /api/shell/execute - Execute Shell Command
Execute a shell command and get output.

**Body:**
```json
{
  "command": "ls",
  "currentPath": "dh0"
}
```

**Parameters:**
- `command` (string, required) - Command to execute
- `currentPath` (string, optional) - Current directory path (default: "dh0")

**Available Commands:**
- `ls`, `dir` - List files
- `cd <path>` - Change directory
- `pwd` - Print working directory
- `cat <file>`, `type <file>` - Read file
- `mkdir <name>` - Create directory
- `rm <file>`, `delete <file>` - Remove file
- `echo <text>` - Display text
- `date` - Show date/time
- `clear`, `cls` - Clear screen
- `help` - Show help
- `version` - Show version
- `about` - About screen

**Response:**
```json
{
  "command": "ls",
  "output": "DIR  Documents\n     readme.txt    237\n",
  "error": null,
  "currentPath": "dh0",
  "savedAt": "2025-10-01T12:00:00.000Z"
}
```

**Error Response:**
```json
{
  "command": "cat nonexistent.txt",
  "output": "",
  "error": "cat: nonexistent.txt: No such file",
  "currentPath": "dh0"
}
```

---

## Application State

### GET /api/app-state/:appId - Get Application State
Load saved state for an application.

**Parameters:**
- `appId` (string) - Application identifier (e.g., "notepad", "paint", "calculator")

**Example:**
```bash
curl "http://localhost:3001/api/app-state/notepad"
```

**Response:**
```json
{
  "appId": "notepad",
  "state": {
    "content": "Draft content",
    "filename": "draft.txt",
    "savedAt": "2025-10-01T11:00:00.000Z"
  },
  "timestamp": "2025-10-01T12:00:00.000Z"
}
```

**404 Response (No state):**
```json
{
  "error": "State not found",
  "appId": "notepad",
  "message": "No saved state exists for this application"
}
```

### POST /api/app-state/:appId - Save Application State
Save application state to persistent storage.

**Body:**
```json
{
  "state": {
    "content": "Draft content",
    "filename": "draft.txt",
    "preferences": {
      "fontSize": 12,
      "wordWrap": true
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "appId": "notepad",
  "message": "State saved successfully"
}
```

### DELETE /api/app-state/:appId - Delete Application State
Delete saved state for an application.

**Example:**
```bash
curl -X DELETE "http://localhost:3001/api/app-state/notepad"
```

**Response:**
```json
{
  "success": true,
  "appId": "notepad",
  "message": "State deleted successfully"
}
```

### GET /api/app-state - List All Application States
Get list of all applications with saved states.

**Response:**
```json
{
  "count": 3,
  "states": [
    {
      "appId": "notepad",
      "savedAt": "2025-10-01T12:00:00.000Z",
      "hasData": true
    },
    {
      "appId": "paint",
      "savedAt": "2025-10-01T11:00:00.000Z",
      "hasData": true
    },
    {
      "appId": "calculator",
      "savedAt": "2025-10-01T10:00:00.000Z",
      "hasData": true
    }
  ]
}
```

---

## Settings

### GET /api/settings - Get All Settings
Retrieve all system settings.

**Response:**
```json
{
  "display": {
    "screenMode": "Workbench",
    "resolution": "640x256",
    "colors": 16,
    "scanlines": true,
    "backdrop": "pattern"
  },
  "sound": {
    "enabled": true,
    "volume": 80,
    "diskSounds": true,
    "clickSounds": true
  },
  "workbench": {
    "font": "Topaz",
    "fontSize": 8,
    "showHiddenFiles": false,
    "snapIcons": true,
    "iconSize": "medium"
  },
  "system": {
    "dateFormat": "DD-MMM-YY",
    "timeFormat": "24h",
    "startupSound": true,
    "confirmDelete": true
  }
}
```

### GET /api/settings/:category - Get Category Settings
Get settings for a specific category.

**Parameters:**
- `category` (string) - Category name ("display", "sound", "workbench", "system")

**Example:**
```bash
curl "http://localhost:3001/api/settings/display"
```

**Response:**
```json
{
  "category": "display",
  "settings": {
    "screenMode": "Workbench",
    "resolution": "640x256",
    "colors": 16,
    "scanlines": true,
    "backdrop": "pattern"
  }
}
```

### PUT /api/settings/:category - Update Category Settings
Update settings for a specific category.

**Body:**
```json
{
  "colors": 32,
  "scanlines": false
}
```

**Response:**
```json
{
  "message": "Settings updated successfully",
  "category": "display",
  "settings": {
    "screenMode": "Workbench",
    "resolution": "640x256",
    "colors": 32,
    "scanlines": false,
    "backdrop": "pattern"
  }
}
```

### POST /api/settings/reset - Reset All Settings
Reset all settings to default values.

**Response:**
```json
{
  "message": "Settings reset to defaults",
  "settings": {
    // ... default settings
  }
}
```

---

## System Information

### GET /api/system/status - Get System Status
Get simulated Amiga system information.

**Response:**
```json
{
  "timestamp": "2025-10-01T12:00:00.000Z",
  "uptime": 3600.5,
  "memory": {
    "chipMem": "512K",
    "fastMem": "512K",
    "total": 9043968,
    "used": 7749624,
    "free": 1293504
  },
  "cpu": {
    "model": "Motorola 68040 (Simulated)",
    "speed": "25 MHz",
    "usage": 45.6
  },
  "disks": [
    {
      "id": "df0",
      "name": "Workbench3.1",
      "type": "floppy",
      "capacity": "880K",
      "used": "720K",
      "free": "160K"
    },
    {
      "id": "dh0",
      "name": "System",
      "type": "hard",
      "capacity": "40MB",
      "used": "28MB",
      "free": "12MB"
    }
  ],
  "screen": {
    "width": 640,
    "height": 256,
    "colors": 16,
    "mode": "Workbench"
  }
}
```

### GET /api/system/info - Get System Info
Get Amiga OS version information.

**Response:**
```json
{
  "os": "Workbench 3.1",
  "version": "40.42",
  "kickstart": "40.68",
  "workbench": "40.42",
  "platform": "Amiga 4000",
  "architecture": "68040"
}
```

---

## Error Responses

All endpoints may return error responses in this format:

### 400 Bad Request
```json
{
  "error": "Invalid request",
  "message": "Missing required parameter: path"
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Cannot GET /api/invalid",
  "availableEndpoints": [...]
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "File system error: EACCES"
}
```

---

## Rate Limiting

Currently no rate limiting is implemented. This is suitable for local development only.

---

## CORS

CORS is enabled for all origins in development mode. Configure appropriately for production.

---

## File Storage Structure

Files are stored in the server filesystem:

```
src/server/storage/
├── workbench/           # File system storage
│   ├── df0/            # Floppy disk
│   ├── dh0/            # Hard drive 1
│   ├── dh1/            # Hard drive 2
│   ├── ram/            # RAM disk
│   └── trash/          # Deleted items
└── state/              # Application state (JSON files)
    ├── app_notepad.json
    ├── app_paint.json
    ├── app_calculator.json
    ├── app_shell.json
    └── app_clock.json
```

---

## Testing with cURL

### Example: Create and read a file
```bash
# Create file
echo '{"path":"dh0","name":"test.txt","type":"file","content":"Hello"}' | \
  curl -X POST http://localhost:3001/api/files/create \
  -H "Content-Type: application/json" -d @-

# Read file
echo '{"path":"dh0/test.txt"}' | \
  curl -X POST http://localhost:3001/api/files/read \
  -H "Content-Type: application/json" -d @-
```

### Example: Execute shell commands
```bash
# List files
echo '{"command":"ls","currentPath":"dh0"}' | \
  curl -X POST http://localhost:3001/api/shell/execute \
  -H "Content-Type: application/json" -d @-

# Create directory
echo '{"command":"mkdir TestDir","currentPath":"dh0"}' | \
  curl -X POST http://localhost:3001/api/shell/execute \
  -H "Content-Type: application/json" -d @-
```

### Example: Save app state
```bash
# Save notepad state
echo '{"state":{"content":"Draft","filename":"draft.txt"}}' | \
  curl -X POST http://localhost:3001/api/app-state/notepad \
  -H "Content-Type: application/json" -d @-

# Load notepad state
curl http://localhost:3001/api/app-state/notepad
```

---

## Client Integration Examples

### JavaScript/TypeScript

```typescript
// File operations
async function listFiles(path: string) {
  const response = await fetch(`/api/files/list?path=${path}`);
  return await response.json();
}

async function createFile(path: string, name: string, content: string) {
  const response = await fetch('/api/files/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, name, type: 'file', content })
  });
  return await response.json();
}

// Shell commands
async function executeCommand(command: string, currentPath: string) {
  const response = await fetch('/api/shell/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command, currentPath })
  });
  return await response.json();
}

// App state
async function saveAppState(appId: string, state: any) {
  const response = await fetch(`/api/app-state/${appId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ state })
  });
  return await response.json();
}

async function loadAppState(appId: string) {
  const response = await fetch(`/api/app-state/${appId}`);
  if (response.ok) {
    return await response.json();
  }
  return null;
}
```

---

## Version History

### v2.0.0 (2025-10-01)
- Added app state management API
- Added shell command execution API
- Enhanced file operations with metadata
- Added JSON state persistence
- Increased payload limit to 50MB
- Improved error handling

### v1.0.0 (2025-09-30)
- Initial release
- Basic file operations
- System status endpoint
- Settings management

---

**Server Version:** 2.0.0
**Last Updated:** October 1, 2025
**Status:** ✅ Production Ready

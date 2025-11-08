const { app, BrowserWindow, ipcMain, dialog, Tray, Menu } = require('electron');
const path = require('path');
const SyncEngine = require('./sync-engine');
const AuthManager = require('./auth-manager');
const ConfigManager = require('./config-manager');

let mainWindow = null;
let tray = null;
let syncEngine = null;
let authManager = null;
let configManager = null;

const isDev = process.argv.includes('--dev');

/**
 * Create the main application window
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    title: 'WebOS Sync Agent',
    icon: path.join(__dirname, '../assets/icon.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    show: false
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      return false;
    }
  });

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
}

/**
 * Create system tray icon
 */
function createTray() {
  const iconPath = path.join(__dirname, '../assets/tray-icon.png');
  tray = new Tray(iconPath);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open WebOS Sync',
      click: () => {
        mainWindow.show();
      }
    },
    {
      label: 'Sync Status',
      click: () => {
        const status = syncEngine ? syncEngine.getStatus() : { state: 'stopped' };
        dialog.showMessageBox(mainWindow, {
          type: 'info',
          title: 'Sync Status',
          message: `Status: ${status.state}\nLast sync: ${status.lastSync || 'Never'}`
        });
      }
    },
    { type: 'separator' },
    {
      label: 'Pause Sync',
      click: () => {
        if (syncEngine) syncEngine.pause();
      }
    },
    {
      label: 'Resume Sync',
      click: () => {
        if (syncEngine) syncEngine.resume();
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
  tray.setToolTip('WebOS Sync Agent');

  tray.on('click', () => {
    mainWindow.show();
  });
}

/**
 * Initialize managers and engine
 */
async function initializeApp() {
  configManager = new ConfigManager();
  authManager = new AuthManager(configManager);

  const config = configManager.getConfig();

  if (config.serverUrl && config.authToken) {
    syncEngine = new SyncEngine(configManager, authManager);

    // Check if authenticated
    const isValid = await authManager.validateToken();
    if (isValid && config.syncEnabled) {
      await syncEngine.start();
    }
  }
}

// App lifecycle
app.whenReady().then(async () => {
  createWindow();
  createTray();
  await initializeApp();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Don't quit on window close, keep running in tray
  if (process.platform !== 'darwin') {
    // On macOS, keep app running even if all windows closed
  }
});

app.on('before-quit', () => {
  app.isQuitting = true;
  if (syncEngine) {
    syncEngine.stop();
  }
});

// IPC Handlers

/**
 * Login to WebOS server
 */
ipcMain.handle('login', async (event, { serverUrl, username, password }) => {
  try {
    const token = await authManager.login(serverUrl, username, password);
    configManager.setConfig({
      serverUrl,
      username,
      authToken: token
    });

    return { success: true, token };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

/**
 * Logout from WebOS server
 */
ipcMain.handle('logout', async () => {
  try {
    await authManager.logout();
    if (syncEngine) {
      await syncEngine.stop();
      syncEngine = null;
    }
    configManager.clearAuth();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

/**
 * Get current configuration
 */
ipcMain.handle('get-config', () => {
  return configManager.getConfig();
});

/**
 * Update configuration
 */
ipcMain.handle('update-config', (event, config) => {
  configManager.setConfig(config);
  return { success: true };
});

/**
 * Select sync folder
 */
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory']
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return { success: true, path: result.filePaths[0] };
  }

  return { success: false };
});

/**
 * Start sync
 */
ipcMain.handle('start-sync', async () => {
  try {
    if (!syncEngine) {
      syncEngine = new SyncEngine(configManager, authManager);
    }

    await syncEngine.start();
    configManager.setConfig({ syncEnabled: true });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

/**
 * Stop sync
 */
ipcMain.handle('stop-sync', async () => {
  try {
    if (syncEngine) {
      await syncEngine.stop();
    }
    configManager.setConfig({ syncEnabled: false });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

/**
 * Get sync status
 */
ipcMain.handle('get-sync-status', () => {
  if (syncEngine) {
    return syncEngine.getStatus();
  }
  return { state: 'stopped', lastSync: null };
});

/**
 * Manual sync trigger
 */
ipcMain.handle('trigger-sync', async () => {
  try {
    if (syncEngine) {
      await syncEngine.syncNow();
      return { success: true };
    }
    return { success: false, error: 'Sync engine not initialized' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Send sync events to renderer
if (syncEngine) {
  syncEngine.on('sync-started', () => {
    if (mainWindow) {
      mainWindow.webContents.send('sync-event', { type: 'started' });
    }
  });

  syncEngine.on('sync-completed', (stats) => {
    if (mainWindow) {
      mainWindow.webContents.send('sync-event', { type: 'completed', stats });
    }
  });

  syncEngine.on('sync-error', (error) => {
    if (mainWindow) {
      mainWindow.webContents.send('sync-event', { type: 'error', error: error.message });
    }
  });

  syncEngine.on('file-changed', (file) => {
    if (mainWindow) {
      mainWindow.webContents.send('sync-event', { type: 'file-changed', file });
    }
  });
}

module.exports = { app, mainWindow };

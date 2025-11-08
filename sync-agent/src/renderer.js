const { ipcRenderer } = require('electron');

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const mainScreen = document.getElementById('main-screen');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const connectionStatus = document.getElementById('connection-status');
const connectionText = document.getElementById('connection-text');
const serverInfo = document.getElementById('server-info');

// Sync controls
const startSyncBtn = document.getElementById('start-sync-btn');
const stopSyncBtn = document.getElementById('stop-sync-btn');
const syncNowBtn = document.getElementById('sync-now-btn');
const changeFolderBtn = document.getElementById('change-folder-btn');

// Status displays
const syncStatusText = document.getElementById('sync-status-text');
const lastSyncText = document.getElementById('last-sync-text');
const syncFolderText = document.getElementById('sync-folder-text');

// Stats
const uploadedCount = document.getElementById('uploaded-count');
const downloadedCount = document.getElementById('downloaded-count');
const deletedCount = document.getElementById('deleted-count');
const errorCount = document.getElementById('error-count');

// Settings
const syncIntervalInput = document.getElementById('sync-interval');
const conflictResolutionSelect = document.getElementById('conflict-resolution');
const notificationsCheckbox = document.getElementById('notifications-enabled');
const autoStartCheckbox = document.getElementById('auto-start-enabled');
const saveSettingsBtn = document.getElementById('save-settings-btn');
const logoutBtn = document.getElementById('logout-btn');

// Activity log
const activityLog = document.getElementById('activity-log');

// Tab buttons
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

// State
let currentStats = {
  uploaded: 0,
  downloaded: 0,
  deleted: 0,
  errors: 0
};

/**
 * Initialize the app
 */
async function init() {
  const config = await ipcRenderer.invoke('get-config');

  if (config.authToken && config.serverUrl) {
    showMainScreen(config);
  } else {
    showLoginScreen();
  }

  // Setup event listeners
  setupEventListeners();

  // Start status polling
  setInterval(updateSyncStatus, 2000);
}

/**
 * Show login screen
 */
function showLoginScreen() {
  loginScreen.classList.add('active');
  mainScreen.classList.remove('active');
  updateConnectionStatus(false);
}

/**
 * Show main screen
 */
async function showMainScreen(config) {
  loginScreen.classList.remove('active');
  mainScreen.classList.add('active');
  updateConnectionStatus(true, config.username);

  // Load configuration into UI
  if (config.syncFolder) {
    syncFolderText.textContent = config.syncFolder;
  }

  if (config.syncInterval) {
    syncIntervalInput.value = config.syncInterval / 1000;
  }

  if (config.conflictResolution) {
    conflictResolutionSelect.value = config.conflictResolution;
  }

  notificationsCheckbox.checked = config.notifications !== false;
  autoStartCheckbox.checked = config.autoStart === true;

  if (config.serverUrl) {
    serverInfo.textContent = `Connected to ${config.serverUrl}`;
  }

  // Update sync status
  await updateSyncStatus();
}

/**
 * Update connection status indicator
 */
function updateConnectionStatus(connected, username = '') {
  if (connected) {
    connectionStatus.classList.add('online');
    connectionStatus.classList.remove('offline');
    connectionText.textContent = username ? `Connected as ${username}` : 'Connected';
  } else {
    connectionStatus.classList.add('offline');
    connectionStatus.classList.remove('online');
    connectionText.textContent = 'Disconnected';
  }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Login form
  loginForm.addEventListener('submit', handleLogin);

  // Sync controls
  startSyncBtn.addEventListener('click', handleStartSync);
  stopSyncBtn.addEventListener('click', handleStopSync);
  syncNowBtn.addEventListener('click', handleSyncNow);
  changeFolderBtn.addEventListener('click', handleChangeFolder);

  // Settings
  saveSettingsBtn.addEventListener('click', handleSaveSettings);
  logoutBtn.addEventListener('click', handleLogout);

  // Tab switching
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.getAttribute('data-tab');
      switchTab(tabName);
    });
  });

  // Sync events from main process
  ipcRenderer.on('sync-event', (event, data) => {
    handleSyncEvent(data);
  });
}

/**
 * Handle login
 */
async function handleLogin(e) {
  e.preventDefault();

  const serverUrl = document.getElementById('server-url').value;
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  loginError.classList.add('hidden');

  try {
    const result = await ipcRenderer.invoke('login', {
      serverUrl,
      username,
      password
    });

    if (result.success) {
      const config = await ipcRenderer.invoke('get-config');
      showMainScreen(config);
    } else {
      loginError.textContent = result.error || 'Login failed';
      loginError.classList.remove('hidden');
    }
  } catch (error) {
    loginError.textContent = error.message;
    loginError.classList.remove('hidden');
  }
}

/**
 * Handle logout
 */
async function handleLogout() {
  try {
    await ipcRenderer.invoke('logout');
    showLoginScreen();
    serverInfo.textContent = '';

    // Reset stats
    currentStats = { uploaded: 0, downloaded: 0, deleted: 0, errors: 0 };
    updateStatsDisplay();
  } catch (error) {
    console.error('Logout error:', error);
  }
}

/**
 * Handle start sync
 */
async function handleStartSync() {
  try {
    const result = await ipcRenderer.invoke('start-sync');

    if (result.success) {
      startSyncBtn.classList.add('hidden');
      stopSyncBtn.classList.remove('hidden');
      addActivityItem('Sync started', 'upload');
    } else {
      alert(result.error || 'Failed to start sync');
    }
  } catch (error) {
    alert(error.message);
  }
}

/**
 * Handle stop sync
 */
async function handleStopSync() {
  try {
    const result = await ipcRenderer.invoke('stop-sync');

    if (result.success) {
      startSyncBtn.classList.remove('hidden');
      stopSyncBtn.classList.add('hidden');
      addActivityItem('Sync stopped', 'error');
    } else {
      alert(result.error || 'Failed to stop sync');
    }
  } catch (error) {
    alert(error.message);
  }
}

/**
 * Handle sync now
 */
async function handleSyncNow() {
  try {
    syncNowBtn.disabled = true;
    syncNowBtn.textContent = 'Syncing...';

    const result = await ipcRenderer.invoke('trigger-sync');

    if (!result.success) {
      alert(result.error || 'Failed to sync');
    }
  } catch (error) {
    alert(error.message);
  } finally {
    syncNowBtn.disabled = false;
    syncNowBtn.textContent = 'Sync Now';
  }
}

/**
 * Handle change folder
 */
async function handleChangeFolder() {
  try {
    const result = await ipcRenderer.invoke('select-folder');

    if (result.success && result.path) {
      syncFolderText.textContent = result.path;
      await ipcRenderer.invoke('update-config', { syncFolder: result.path });
    }
  } catch (error) {
    alert(error.message);
  }
}

/**
 * Handle save settings
 */
async function handleSaveSettings() {
  try {
    const config = {
      syncInterval: parseInt(syncIntervalInput.value) * 1000,
      conflictResolution: conflictResolutionSelect.value,
      notifications: notificationsCheckbox.checked,
      autoStart: autoStartCheckbox.checked
    };

    await ipcRenderer.invoke('update-config', config);
    alert('Settings saved successfully');
  } catch (error) {
    alert('Failed to save settings: ' + error.message);
  }
}

/**
 * Update sync status
 */
async function updateSyncStatus() {
  try {
    const status = await ipcRenderer.invoke('get-sync-status');

    if (status.state === 'running') {
      syncStatusText.textContent = 'Running';
      syncStatusText.style.color = '#4caf50';
      startSyncBtn.classList.add('hidden');
      stopSyncBtn.classList.remove('hidden');
    } else if (status.state === 'paused') {
      syncStatusText.textContent = 'Paused';
      syncStatusText.style.color = '#ff9800';
    } else {
      syncStatusText.textContent = 'Stopped';
      syncStatusText.style.color = '#f44336';
      startSyncBtn.classList.remove('hidden');
      stopSyncBtn.classList.add('hidden');
    }

    if (status.lastSync) {
      const date = new Date(status.lastSync);
      lastSyncText.textContent = date.toLocaleString();
    }
  } catch (error) {
    console.error('Failed to update sync status:', error);
  }
}

/**
 * Handle sync events
 */
function handleSyncEvent(data) {
  switch (data.type) {
    case 'started':
      syncStatusText.textContent = 'Syncing...';
      syncStatusText.style.color = '#2196f3';
      break;

    case 'completed':
      if (data.stats) {
        currentStats.uploaded += data.stats.uploaded || 0;
        currentStats.downloaded += data.stats.downloaded || 0;
        currentStats.deleted += data.stats.deleted || 0;
        currentStats.errors += data.stats.errors || 0;
        updateStatsDisplay();

        addActivityItem(
          `Sync completed: ${data.stats.uploaded} uploaded, ${data.stats.downloaded} downloaded`,
          'upload'
        );
      }
      break;

    case 'error':
      currentStats.errors++;
      updateStatsDisplay();
      addActivityItem(`Error: ${data.error}`, 'error');
      break;

    case 'file-changed':
      if (data.file) {
        const action = data.file.type === 'add' ? 'Added' :
                      data.file.type === 'change' ? 'Modified' : 'Deleted';
        addActivityItem(`${action}: ${data.file.path}`, data.file.type);
      }
      break;
  }
}

/**
 * Update stats display
 */
function updateStatsDisplay() {
  uploadedCount.textContent = currentStats.uploaded;
  downloadedCount.textContent = currentStats.downloaded;
  deletedCount.textContent = currentStats.deleted;
  errorCount.textContent = currentStats.errors;
}

/**
 * Add activity item
 */
function addActivityItem(message, type = 'upload') {
  // Remove empty message if present
  const emptyMsg = activityLog.querySelector('.activity-empty');
  if (emptyMsg) {
    emptyMsg.remove();
  }

  const item = document.createElement('div');
  item.className = 'activity-item';

  const icon = document.createElement('div');
  icon.className = `activity-icon ${type}`;
  icon.textContent = type === 'upload' ? '↑' :
                     type === 'download' ? '↓' :
                     type === 'delete' ? '×' : '!';

  const details = document.createElement('div');
  details.className = 'activity-details';

  const title = document.createElement('div');
  title.className = 'activity-title';
  title.textContent = message;

  const time = document.createElement('div');
  time.className = 'activity-time';
  time.textContent = new Date().toLocaleTimeString();

  details.appendChild(title);
  details.appendChild(time);

  item.appendChild(icon);
  item.appendChild(details);

  activityLog.insertBefore(item, activityLog.firstChild);

  // Keep only last 50 items
  while (activityLog.children.length > 50) {
    activityLog.removeChild(activityLog.lastChild);
  }
}

/**
 * Switch tab
 */
function switchTab(tabName) {
  tabButtons.forEach(button => {
    if (button.getAttribute('data-tab') === tabName) {
      button.classList.add('active');
    } else {
      button.classList.remove('active');
    }
  });

  tabContents.forEach(content => {
    if (content.id === `${tabName}-tab`) {
      content.classList.add('active');
    } else {
      content.classList.remove('active');
    }
  });
}

// Initialize on load
init();

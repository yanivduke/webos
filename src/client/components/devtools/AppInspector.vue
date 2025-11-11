<template>
  <div class="app-inspector">
    <div class="tool-header">
      <h3>🔍 App Inspector</h3>
      <p class="tool-desc">Debug and monitor running applications</p>
    </div>

    <div class="inspector-layout">
      <!-- Left Sidebar: Running Apps List -->
      <div class="inspector-sidebar">
        <div class="sidebar-header">
          <h4>Running Apps</h4>
          <span class="app-count">{{ runningApps.length }}</span>
        </div>

        <div v-if="runningApps.length === 0" class="empty-apps">
          <p>No apps running</p>
          <p class="hint">Launch an app to inspect it</p>
        </div>

        <div v-else class="apps-list">
          <div
            v-for="app in runningApps"
            :key="getInstanceId(app)"
            class="app-list-item"
            :class="{ active: selectedApp === getInstanceId(app) }"
            @click="selectApp(getInstanceId(app))"
          >
            <div class="app-icon">📱</div>
            <div class="app-info">
              <div class="app-name">{{ app.manifest.name }}</div>
              <div class="app-status">
                <span class="status-badge" :class="app.state">{{ app.state }}</span>
                <span class="uptime">{{ getUptime(app.startTime) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Panel: App Details -->
      <div class="inspector-main">
        <div v-if="!selectedApp" class="no-selection">
          <p>Select an app to inspect</p>
        </div>

        <div v-else-if="!selectedAppData" class="app-not-found">
          <p>App not found or has been closed</p>
          <button class="amiga-button small" @click="selectedApp = null">Clear Selection</button>
        </div>

        <div v-else class="inspector-content">
          <!-- Tab Navigation -->
          <div class="inspector-tabs">
            <div
              v-for="tab in tabs"
              :key="tab.id"
              class="tab-button"
              :class="{ active: activeTab === tab.id }"
              @click="activeTab = tab.id"
            >
              {{ tab.label }}
            </div>
          </div>

          <!-- Tab Content -->
          <div class="tab-content">
            <!-- Overview Tab -->
            <div v-if="activeTab === 'overview'" class="overview-tab">
              <div class="section">
                <h4>App Manifest</h4>
                <div class="data-table">
                  <div class="data-row">
                    <span class="label">Name:</span>
                    <span class="value">{{ selectedAppData.manifest.name }}</span>
                  </div>
                  <div class="data-row">
                    <span class="label">Version:</span>
                    <span class="value">{{ selectedAppData.manifest.version }}</span>
                  </div>
                  <div class="data-row">
                    <span class="label">Author:</span>
                    <span class="value">{{ selectedAppData.manifest.author }}</span>
                  </div>
                  <div class="data-row">
                    <span class="label">ID:</span>
                    <span class="value mono">{{ selectedAppData.manifest.id }}</span>
                  </div>
                  <div class="data-row">
                    <span class="label">Category:</span>
                    <span class="value">{{ selectedAppData.manifest.category }}</span>
                  </div>
                  <div class="data-row">
                    <span class="label">Description:</span>
                    <span class="value">{{ selectedAppData.manifest.description }}</span>
                  </div>
                </div>
              </div>

              <div class="section">
                <h4>Runtime Information</h4>
                <div class="data-table">
                  <div class="data-row">
                    <span class="label">Instance ID:</span>
                    <span class="value mono">{{ selectedApp }}</span>
                  </div>
                  <div class="data-row">
                    <span class="label">State:</span>
                    <span class="value">
                      <span class="status-badge" :class="selectedAppData.state">
                        {{ selectedAppData.state }}
                      </span>
                    </span>
                  </div>
                  <div class="data-row">
                    <span class="label">Uptime:</span>
                    <span class="value">{{ getUptime(selectedAppData.startTime) }}</span>
                  </div>
                  <div class="data-row">
                    <span class="label">Started:</span>
                    <span class="value">{{ formatTimestamp(selectedAppData.startTime) }}</span>
                  </div>
                  <div class="data-row">
                    <span class="label">Multi-Instance:</span>
                    <span class="value">{{ selectedAppData.manifest.runtime.multiInstance ? 'Yes' : 'No' }}</span>
                  </div>
                  <div class="data-row">
                    <span class="label">Runtime Type:</span>
                    <span class="value">{{ selectedAppData.manifest.runtime.type }}</span>
                  </div>
                </div>
              </div>

              <div class="section">
                <h4>Window Information</h4>
                <div class="data-table">
                  <div class="data-row">
                    <span class="label">Window ID:</span>
                    <span class="value mono">{{ selectedAppData.windowId || 'N/A' }}</span>
                  </div>
                  <div class="data-row">
                    <span class="label">Size:</span>
                    <span class="value">
                      {{ selectedAppData.manifest.window.width }} × {{ selectedAppData.manifest.window.height }}
                    </span>
                  </div>
                  <div class="data-row">
                    <span class="label">Resizable:</span>
                    <span class="value">{{ selectedAppData.manifest.window.resizable !== false ? 'Yes' : 'No' }}</span>
                  </div>
                  <div class="data-row">
                    <span class="label">Maximizable:</span>
                    <span class="value">{{ selectedAppData.manifest.window.maximizable !== false ? 'Yes' : 'No' }}</span>
                  </div>
                </div>
              </div>

              <div class="section">
                <h4>Actions</h4>
                <div class="action-buttons">
                  <button class="amiga-button" @click="restartApp">
                    🔄 Restart
                  </button>
                  <button
                    class="amiga-button"
                    @click="togglePause"
                    :disabled="selectedAppData.state === 'stopped'"
                  >
                    {{ selectedAppData.state === 'paused' ? '▶ Resume' : '⏸ Pause' }}
                  </button>
                  <button class="amiga-button danger" @click="killApp">
                    ⚠ Kill App
                  </button>
                </div>
              </div>
            </div>

            <!-- Permissions Tab -->
            <div v-if="activeTab === 'permissions'" class="permissions-tab">
              <div class="section">
                <h4>Requested Permissions</h4>
                <p class="section-desc">
                  Manage what this app can access. Changing permissions may affect app functionality.
                </p>

                <div v-if="selectedAppData.manifest.permissions.requested.length === 0" class="empty-state">
                  This app has not requested any permissions.
                </div>

                <div v-else class="permissions-list">
                  <div
                    v-for="permission in selectedAppData.manifest.permissions.requested"
                    :key="permission"
                    class="permission-item"
                  >
                    <div class="permission-info">
                      <div class="permission-name">{{ permission }}</div>
                      <div class="permission-desc">
                        {{ getPermissionDescription(permission) }}
                      </div>
                    </div>
                    <div class="permission-control">
                      <label class="toggle-switch">
                        <input
                          type="checkbox"
                          :checked="isPermissionGranted(permission)"
                          @change="togglePermission(permission, $event)"
                        />
                        <span class="slider"></span>
                      </label>
                      <span class="permission-status">
                        {{ isPermissionGranted(permission) ? 'Granted' : 'Denied' }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="permissionWarning" class="warning-banner">
                <strong>⚠ Warning:</strong> Changing {{ permissionWarning }} may cause the app to malfunction.
                Changes take effect immediately.
              </div>
            </div>

            <!-- Storage Tab -->
            <div v-if="activeTab === 'storage'" class="storage-tab">
              <div class="section">
                <div class="section-header">
                  <h4>Local Storage</h4>
                  <div class="header-actions">
                    <button class="amiga-button small" @click="addStorageEntry">
                      ➕ Add Entry
                    </button>
                    <button class="amiga-button small danger" @click="clearAllStorage">
                      Clear All
                    </button>
                  </div>
                </div>

                <div v-if="storageEntries.length === 0" class="empty-state">
                  No storage entries for this app.
                </div>

                <div v-else class="storage-list">
                  <div
                    v-for="(entry, index) in storageEntries"
                    :key="index"
                    class="storage-item"
                  >
                    <div class="storage-key">
                      <input
                        v-if="editingEntry === index"
                        v-model="entry.key"
                        type="text"
                        class="amiga-input small"
                      />
                      <span v-else class="mono">{{ entry.key }}</span>
                    </div>
                    <div class="storage-value">
                      <textarea
                        v-if="editingEntry === index"
                        v-model="entry.value"
                        class="amiga-textarea"
                        rows="3"
                      ></textarea>
                      <pre v-else>{{ formatStorageValue(entry.value) }}</pre>
                    </div>
                    <div class="storage-actions">
                      <button
                        v-if="editingEntry === index"
                        class="amiga-button tiny"
                        @click="saveStorageEntry(index)"
                      >
                        Save
                      </button>
                      <button
                        v-else
                        class="amiga-button tiny"
                        @click="editStorageEntry(index)"
                      >
                        Edit
                      </button>
                      <button
                        class="amiga-button tiny danger"
                        @click="deleteStorageEntry(index)"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Console Tab -->
            <div v-if="activeTab === 'console'" class="console-tab">
              <div class="console-controls">
                <div class="left-controls">
                  <button
                    v-for="level in logLevels"
                    :key="level.name"
                    class="amiga-button tiny"
                    :class="{ active: activeLogLevels.includes(level.name), [level.name]: true }"
                    @click="toggleLogLevel(level.name)"
                  >
                    {{ level.label }} ({{ getLogCountByLevel(level.name) }})
                  </button>
                </div>
                <div class="right-controls">
                  <label class="auto-scroll-label">
                    <input type="checkbox" v-model="autoScrollConsole" class="amiga-checkbox" />
                    Auto-scroll
                  </label>
                  <button class="amiga-button tiny" @click="clearLogs">Clear</button>
                </div>
              </div>

              <div class="console-output" ref="consoleOutputRef">
                <div v-if="filteredLogs.length === 0" class="empty-state">
                  No console logs captured for this app.
                </div>

                <div
                  v-for="(log, index) in filteredLogs"
                  :key="index"
                  class="console-entry"
                  :class="log.level"
                >
                  <span class="log-time">{{ log.time }}</span>
                  <span class="log-level" :class="log.level">{{ log.level.toUpperCase() }}</span>
                  <span class="log-message">{{ log.message }}</span>
                </div>
              </div>
            </div>

            <!-- Performance Tab -->
            <div v-if="activeTab === 'performance'" class="performance-tab">
              <div class="section">
                <h4>Memory & Resources</h4>
                <div class="metrics-grid">
                  <div class="metric-card">
                    <div class="metric-label">Memory Estimate</div>
                    <div class="metric-value">{{ performanceMetrics.memoryEstimate }}</div>
                  </div>
                  <div class="metric-card">
                    <div class="metric-label">API Calls</div>
                    <div class="metric-value">{{ performanceMetrics.apiCalls }}</div>
                  </div>
                  <div class="metric-card">
                    <div class="metric-label">Event Listeners</div>
                    <div class="metric-value">{{ performanceMetrics.eventListeners }}</div>
                  </div>
                  <div class="metric-card">
                    <div class="metric-label">DOM Nodes</div>
                    <div class="metric-value">{{ performanceMetrics.domNodes }}</div>
                  </div>
                </div>
              </div>

              <div class="section">
                <h4>SDK API Usage</h4>
                <div class="api-usage-list">
                  <div
                    v-for="api in performanceMetrics.apiUsage"
                    :key="api.name"
                    class="api-usage-item"
                  >
                    <div class="api-name">{{ api.name }}</div>
                    <div class="api-count">{{ api.count }} calls</div>
                    <div class="api-bar">
                      <div
                        class="api-bar-fill"
                        :style="{ width: `${(api.count / maxApiCalls) * 100}%` }"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="section">
                <div class="section-header">
                  <h4>Performance Stats</h4>
                  <button class="amiga-button small" @click="refreshMetrics">
                    🔄 Refresh
                  </button>
                </div>
                <div class="data-table">
                  <div class="data-row">
                    <span class="label">Storage Used:</span>
                    <span class="value">{{ performanceMetrics.storageSize }}</span>
                  </div>
                  <div class="data-row">
                    <span class="label">Storage Keys:</span>
                    <span class="value">{{ storageEntries.length }}</span>
                  </div>
                  <div class="data-row">
                    <span class="label">Console Logs:</span>
                    <span class="value">{{ consoleLogs.length }}</span>
                  </div>
                  <div class="data-row">
                    <span class="label">Last Activity:</span>
                    <span class="value">{{ performanceMetrics.lastActivity }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { appRegistry } from '@/sdk/lifecycle/app-registry';
import type { RunningApp, AppState } from '@/sdk/types/sdk-interfaces';
import type { PermissionType } from '@/sdk/types/app-manifest';

interface StorageEntry {
  key: string;
  value: string;
}

interface ConsoleLog {
  time: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
}

interface PerformanceMetrics {
  memoryEstimate: string;
  apiCalls: number;
  eventListeners: number;
  domNodes: number;
  storageSize: string;
  lastActivity: string;
  apiUsage: Array<{ name: string; count: number }>;
}

// Reactive state
const runningApps = ref<RunningApp[]>([]);
const selectedApp = ref<string | null>(null);
const activeTab = ref('overview');
const editingEntry = ref<number | null>(null);
const permissionWarning = ref<string | null>(null);
const autoScrollConsole = ref(true);
const consoleOutputRef = ref<HTMLElement | null>(null);

// Permissions state
const grantedPermissions = ref<Set<PermissionType>>(new Set());

// Storage state
const storageEntries = ref<StorageEntry[]>([]);

// Console state
const consoleLogs = ref<ConsoleLog[]>([]);
const activeLogLevels = ref<string[]>(['info', 'warn', 'error', 'debug']);

// Performance metrics
const performanceMetrics = ref<PerformanceMetrics>({
  memoryEstimate: 'N/A',
  apiCalls: 0,
  eventListeners: 0,
  domNodes: 0,
  storageSize: '0 KB',
  lastActivity: 'N/A',
  apiUsage: []
});

// Tabs configuration
const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'permissions', label: 'Permissions' },
  { id: 'storage', label: 'Storage' },
  { id: 'console', label: 'Console' },
  { id: 'performance', label: 'Performance' }
];

const logLevels = [
  { name: 'info', label: 'INFO' },
  { name: 'warn', label: 'WARN' },
  { name: 'error', label: 'ERROR' },
  { name: 'debug', label: 'DEBUG' }
];

// Computed properties
const selectedAppData = computed(() => {
  if (!selectedApp.value) return null;
  return runningApps.value.find(app => getInstanceId(app) === selectedApp.value) || null;
});

const filteredLogs = computed(() => {
  return consoleLogs.value.filter(log => activeLogLevels.value.includes(log.level));
});

const maxApiCalls = computed(() => {
  const counts = performanceMetrics.value.apiUsage.map(api => api.count);
  return Math.max(...counts, 1);
});

// Helper functions
function getInstanceId(app: RunningApp): string {
  // Generate instance ID similar to app-registry
  const baseId = app.manifest.id;
  const instances = runningApps.value.filter(a => a.manifest.id === baseId);
  if (instances.length > 1 || app.manifest.runtime.multiInstance) {
    const index = instances.indexOf(app);
    return `${baseId}:${index}`;
  }
  return baseId;
}

function selectApp(instanceId: string) {
  selectedApp.value = instanceId;
  loadAppData(instanceId);
}

function loadAppData(instanceId: string) {
  const app = runningApps.value.find(a => getInstanceId(a) === instanceId);
  if (!app) return;

  // Load permissions
  grantedPermissions.value = new Set(app.manifest.permissions.requested);

  // Load storage entries
  loadStorageEntries(instanceId);

  // Load console logs (simulate)
  loadConsoleLogs(instanceId);

  // Load performance metrics
  loadPerformanceMetrics(instanceId);
}

function loadStorageEntries(instanceId: string) {
  // Simulate loading from localStorage
  const storagePrefix = `webos_app_${instanceId}_`;
  const entries: StorageEntry[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(storagePrefix)) {
      const value = localStorage.getItem(key) || '';
      entries.push({
        key: key.replace(storagePrefix, ''),
        value
      });
    }
  }

  storageEntries.value = entries;
}

function loadConsoleLogs(instanceId: string) {
  // Simulate console logs
  const now = Date.now();
  consoleLogs.value = [
    {
      time: new Date(now - 5000).toLocaleTimeString(),
      timestamp: now - 5000,
      level: 'info',
      message: `App ${instanceId} initialized successfully`
    },
    {
      time: new Date(now - 3000).toLocaleTimeString(),
      timestamp: now - 3000,
      level: 'debug',
      message: 'Loading app configuration...'
    },
    {
      time: new Date(now - 1000).toLocaleTimeString(),
      timestamp: now - 1000,
      level: 'info',
      message: 'App UI rendered'
    }
  ];
}

function loadPerformanceMetrics(instanceId: string) {
  // Simulate performance metrics
  performanceMetrics.value = {
    memoryEstimate: '~2.4 MB',
    apiCalls: 47,
    eventListeners: 12,
    domNodes: 156,
    storageSize: calculateStorageSize(),
    lastActivity: 'Just now',
    apiUsage: [
      { name: 'fs.read', count: 15 },
      { name: 'window.setTitle', count: 8 },
      { name: 'storage.get', count: 12 },
      { name: 'storage.set', count: 7 },
      { name: 'ui.showDialog', count: 5 }
    ]
  };
}

function calculateStorageSize(): string {
  let totalSize = 0;
  storageEntries.value.forEach(entry => {
    totalSize += entry.key.length + entry.value.length;
  });
  return totalSize < 1024 ? `${totalSize} B` : `${(totalSize / 1024).toFixed(2)} KB`;
}

function getUptime(startTime: number): string {
  const now = Date.now();
  const uptime = now - startTime;
  const seconds = Math.floor(uptime / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

function getPermissionDescription(permission: PermissionType): string {
  const descriptions: Record<string, string> = {
    'filesystem:read': 'Read files and directories',
    'filesystem:write': 'Create and modify files',
    'filesystem:delete': 'Delete files and directories',
    'network:fetch': 'Make HTTP requests',
    'network:websocket': 'Use WebSocket connections',
    'clipboard:read': 'Read clipboard contents',
    'clipboard:write': 'Write to clipboard',
    'notifications:show': 'Show system notifications',
    'system:info': 'Access system information',
    'windows:manage': 'Manage window properties'
  };
  return descriptions[permission] || 'Unknown permission';
}

function isPermissionGranted(permission: PermissionType): boolean {
  return grantedPermissions.value.has(permission);
}

function togglePermission(permission: PermissionType, event: Event) {
  const checkbox = event.target as HTMLInputElement;
  const isGranted = checkbox.checked;

  if (isGranted) {
    grantedPermissions.value.add(permission);
  } else {
    grantedPermissions.value.delete(permission);
    // Show warning for critical permissions
    if (permission.includes('filesystem') || permission.includes('network')) {
      permissionWarning.value = permission;
      setTimeout(() => {
        permissionWarning.value = null;
      }, 5000);
    }
  }

  // In a real implementation, this would call an API endpoint
  console.log(`Permission ${permission} ${isGranted ? 'granted' : 'revoked'} for ${selectedApp.value}`);
}

function formatStorageValue(value: string): string {
  try {
    const parsed = JSON.parse(value);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return value;
  }
}

function addStorageEntry() {
  storageEntries.value.push({
    key: 'new_key',
    value: ''
  });
  editingEntry.value = storageEntries.value.length - 1;
}

function editStorageEntry(index: number) {
  editingEntry.value = index;
}

function saveStorageEntry(index: number) {
  const entry = storageEntries.value[index];
  if (!entry.key) {
    alert('Key cannot be empty');
    return;
  }

  // In a real implementation, this would save to the app's storage
  const storageKey = `webos_app_${selectedApp.value}_${entry.key}`;
  localStorage.setItem(storageKey, entry.value);

  editingEntry.value = null;
  console.log(`Saved storage entry: ${entry.key} = ${entry.value}`);
}

function deleteStorageEntry(index: number) {
  if (confirm('Delete this storage entry?')) {
    const entry = storageEntries.value[index];
    const storageKey = `webos_app_${selectedApp.value}_${entry.key}`;
    localStorage.removeItem(storageKey);
    storageEntries.value.splice(index, 1);
    if (editingEntry.value === index) {
      editingEntry.value = null;
    }
  }
}

function clearAllStorage() {
  if (confirm('Clear all storage entries for this app? This action cannot be undone.')) {
    storageEntries.value.forEach(entry => {
      const storageKey = `webos_app_${selectedApp.value}_${entry.key}`;
      localStorage.removeItem(storageKey);
    });
    storageEntries.value = [];
    console.log('Cleared all storage for app:', selectedApp.value);
  }
}

function toggleLogLevel(level: string) {
  const index = activeLogLevels.value.indexOf(level);
  if (index > -1) {
    activeLogLevels.value.splice(index, 1);
  } else {
    activeLogLevels.value.push(level);
  }
}

function getLogCountByLevel(level: string): number {
  return consoleLogs.value.filter(log => log.level === level).length;
}

function clearLogs() {
  if (confirm('Clear all console logs?')) {
    consoleLogs.value = [];
  }
}

function scrollConsoleToBottom() {
  nextTick(() => {
    if (consoleOutputRef.value && autoScrollConsole.value) {
      consoleOutputRef.value.scrollTop = consoleOutputRef.value.scrollHeight;
    }
  });
}

function refreshMetrics() {
  if (selectedApp.value) {
    loadPerformanceMetrics(selectedApp.value);
  }
}

function restartApp() {
  if (confirm(`Restart ${selectedAppData.value?.manifest.name}?`)) {
    console.log('Restarting app:', selectedApp.value);
    // In a real implementation, this would restart the app
    alert('App restart functionality would be triggered here');
  }
}

function togglePause() {
  if (!selectedAppData.value) return;

  const newState: AppState = selectedAppData.value.state === 'paused' ? 'running' : 'paused';
  appRegistry.setState(selectedApp.value!, newState);

  // Refresh the apps list
  refreshAppsList();

  console.log(`App ${selectedApp.value} ${newState === 'paused' ? 'paused' : 'resumed'}`);
}

function killApp() {
  if (!selectedAppData.value) return;

  if (confirm(`Kill ${selectedAppData.value.manifest.name}? This will forcefully close the app.`)) {
    console.log('Killing app:', selectedApp.value);
    // In a real implementation, this would close the app window and unregister it
    appRegistry.unregister(selectedApp.value!);
    refreshAppsList();
    selectedApp.value = null;
    alert('App killed successfully');
  }
}

function refreshAppsList() {
  runningApps.value = appRegistry.getAllApps();
}

// Lifecycle
let refreshInterval: number | undefined;

onMounted(() => {
  refreshAppsList();

  // Refresh running apps list every second
  refreshInterval = window.setInterval(() => {
    refreshAppsList();
  }, 1000);
});

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});

// Watch for console logs changes to auto-scroll
watch(consoleLogs, () => {
  scrollConsoleToBottom();
}, { deep: true });
</script>

<style scoped>
.app-inspector {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #a0a0a0;
  font-family: 'Press Start 2P', monospace;
  overflow: hidden;
}

.tool-header {
  background: #0055aa;
  color: #ffffff;
  padding: 12px;
  border-bottom: 2px solid #000000;
}

.tool-header h3 {
  margin: 0 0 4px 0;
  font-size: 11px;
}

.tool-desc {
  margin: 0;
  font-size: 8px;
  opacity: 0.9;
}

.inspector-layout {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* Sidebar */
.inspector-sidebar {
  width: 280px;
  background: #888888;
  border-right: 2px solid #000000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: #666666;
  border-bottom: 2px solid #000000;
}

.sidebar-header h4 {
  margin: 0;
  font-size: 9px;
  color: #ffffff;
}

.app-count {
  background: #0055aa;
  color: #ffffff;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 7px;
}

.empty-apps {
  padding: 40px 20px;
  text-align: center;
  color: #ffffff;
}

.empty-apps p {
  margin: 0 0 8px 0;
  font-size: 8px;
}

.empty-apps .hint {
  font-size: 7px;
  opacity: 0.7;
}

.apps-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px;
}

.app-list-item {
  display: flex;
  gap: 8px;
  padding: 8px;
  margin-bottom: 4px;
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  cursor: pointer;
  transition: background 0.1s;
}

.app-list-item:hover {
  background: #b0b0b0;
}

.app-list-item.active {
  background: #0055aa;
  border-color: #000000 #ffffff #ffffff #000000;
}

.app-list-item.active .app-name,
.app-list-item.active .app-status {
  color: #ffffff;
}

.app-icon {
  font-size: 16px;
  line-height: 1;
}

.app-info {
  flex: 1;
  min-width: 0;
}

.app-name {
  font-size: 8px;
  font-weight: bold;
  margin-bottom: 4px;
  color: #000000;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.app-status {
  display: flex;
  gap: 6px;
  align-items: center;
  font-size: 7px;
  color: #333333;
}

.status-badge {
  padding: 2px 4px;
  border-radius: 2px;
  font-size: 6px;
  text-transform: uppercase;
}

.status-badge.running {
  background: #00aa00;
  color: #ffffff;
}

.status-badge.paused {
  background: #ffaa00;
  color: #000000;
}

.status-badge.stopped {
  background: #ff0000;
  color: #ffffff;
}

.uptime {
  font-size: 6px;
  opacity: 0.8;
}

/* Main Content */
.inspector-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #a0a0a0;
}

.no-selection,
.app-not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 12px;
}

.no-selection p,
.app-not-found p {
  font-size: 9px;
  color: #666666;
  margin: 0;
}

.inspector-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Tabs */
.inspector-tabs {
  display: flex;
  gap: 2px;
  padding: 8px 8px 0 8px;
  background: #a0a0a0;
  border-bottom: 2px solid #000000;
}

.tab-button {
  padding: 6px 12px;
  background: #888888;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  border-bottom: none;
  font-size: 7px;
  color: #ffffff;
  cursor: pointer;
  transition: background 0.1s;
}

.tab-button:hover {
  background: #999999;
}

.tab-button.active {
  background: #a0a0a0;
  border-color: #ffffff #000000 transparent #ffffff;
  color: #000000;
}

.tab-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  background: #a0a0a0;
}

/* Sections */
.section {
  margin-bottom: 20px;
  padding: 12px;
  background: #ffffff;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
}

.section h4 {
  margin: 0 0 10px 0;
  font-size: 9px;
  color: #0055aa;
  border-bottom: 1px solid #cccccc;
  padding-bottom: 6px;
}

.section-desc {
  margin: 0 0 12px 0;
  font-size: 7px;
  color: #666666;
  line-height: 1.5;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.section-header h4 {
  margin: 0;
  border: none;
  padding: 0;
}

.header-actions {
  display: flex;
  gap: 6px;
}

/* Data Table */
.data-table {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-family: 'Courier New', monospace;
}

.data-row {
  display: flex;
  gap: 8px;
  font-size: 8px;
}

.data-row .label {
  min-width: 140px;
  color: #666666;
  font-family: 'Press Start 2P', monospace;
}

.data-row .value {
  color: #000000;
  word-break: break-all;
}

.data-row .value.mono {
  font-family: 'Courier New', monospace;
  font-size: 9px;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.amiga-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 6px 12px;
  font-size: 8px;
  font-family: 'Press Start 2P', monospace;
  color: #000000;
  cursor: pointer;
  white-space: nowrap;
}

.amiga-button:hover {
  background: #b0b0b0;
}

.amiga-button:active {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}

.amiga-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.amiga-button.small {
  padding: 4px 8px;
  font-size: 7px;
}

.amiga-button.tiny {
  padding: 2px 6px;
  font-size: 6px;
}

.amiga-button.danger {
  background: #ffaaaa;
}

.amiga-button.danger:hover {
  background: #ff8888;
}

.amiga-button.danger:active {
  background: #ff6666;
}

/* Permissions */
.permissions-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.permission-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: #f5f5f5;
  border: 1px solid #cccccc;
  gap: 12px;
}

.permission-info {
  flex: 1;
}

.permission-name {
  font-size: 8px;
  font-weight: bold;
  color: #000000;
  margin-bottom: 4px;
  font-family: 'Courier New', monospace;
}

.permission-desc {
  font-size: 7px;
  color: #666666;
  font-family: 'Courier New', monospace;
}

.permission-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.permission-status {
  font-size: 7px;
  min-width: 50px;
  color: #666666;
}

/* Toggle Switch */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 20px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #cccccc;
  transition: 0.2s;
  border: 2px solid #888888;
}

.slider:before {
  position: absolute;
  content: "";
  height: 12px;
  width: 12px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: 0.2s;
}

input:checked + .slider {
  background-color: #00aa00;
}

input:checked + .slider:before {
  transform: translateX(20px);
}

.warning-banner {
  margin-top: 12px;
  padding: 10px;
  background: #ffeecc;
  border: 2px solid #ffaa00;
  font-size: 7px;
  line-height: 1.5;
  color: #000000;
}

/* Storage */
.storage-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.storage-item {
  display: grid;
  grid-template-columns: 150px 1fr auto;
  gap: 8px;
  padding: 8px;
  background: #f5f5f5;
  border: 1px solid #cccccc;
  align-items: start;
}

.storage-key {
  font-size: 8px;
  font-weight: bold;
  color: #0055aa;
  word-break: break-all;
}

.storage-key .mono {
  font-family: 'Courier New', monospace;
}

.storage-value {
  font-size: 7px;
  font-family: 'Courier New', monospace;
  overflow-x: auto;
}

.storage-value pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  color: #000000;
}

.storage-actions {
  display: flex;
  gap: 4px;
  flex-direction: column;
}

.amiga-input {
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 4px 8px;
  font-size: 8px;
  font-family: 'Courier New', monospace;
  color: #000000;
  width: 100%;
}

.amiga-input.small {
  font-size: 7px;
  padding: 2px 4px;
}

.amiga-textarea {
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 4px 8px;
  font-size: 7px;
  font-family: 'Courier New', monospace;
  color: #000000;
  width: 100%;
  resize: vertical;
}

/* Console */
.console-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  padding: 8px;
  background: #ffffff;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
}

.left-controls,
.right-controls {
  display: flex;
  gap: 6px;
  align-items: center;
}

.amiga-button.info {
  border-color: #0055aa;
}

.amiga-button.warn {
  border-color: #ff8800;
}

.amiga-button.error {
  border-color: #ff0000;
}

.amiga-button.debug {
  border-color: #888888;
}

.amiga-button.active {
  background: #00aa00;
  color: #ffffff;
}

.auto-scroll-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 7px;
}

.amiga-checkbox {
  width: 12px;
  height: 12px;
}

.console-output {
  flex: 1;
  background: #000000;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 8px;
  overflow-y: auto;
  font-family: 'Courier New', monospace;
  font-size: 8px;
  max-height: 400px;
}

.console-entry {
  display: grid;
  grid-template-columns: 80px 60px 1fr;
  gap: 8px;
  padding: 4px;
  margin-bottom: 2px;
  border-left: 3px solid transparent;
}

.console-entry.info {
  border-left-color: #0055aa;
}

.console-entry.warn {
  border-left-color: #ff8800;
}

.console-entry.error {
  border-left-color: #ff0000;
}

.console-entry.debug {
  border-left-color: #888888;
}

.log-time {
  color: #666666;
}

.log-level {
  font-weight: bold;
}

.log-level.info {
  color: #00aaff;
}

.log-level.warn {
  color: #ffaa00;
}

.log-level.error {
  color: #ff0000;
}

.log-level.debug {
  color: #888888;
}

.log-message {
  color: #ffffff;
}

/* Performance */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.metric-card {
  padding: 12px;
  background: #f5f5f5;
  border: 2px solid;
  border-color: #ffffff #888888 #888888 #ffffff;
  text-align: center;
}

.metric-label {
  font-size: 7px;
  color: #666666;
  margin-bottom: 8px;
}

.metric-value {
  font-size: 11px;
  color: #0055aa;
  font-weight: bold;
}

.api-usage-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.api-usage-item {
  display: grid;
  grid-template-columns: 150px 80px 1fr;
  gap: 8px;
  align-items: center;
  padding: 6px;
  background: #f5f5f5;
  border: 1px solid #cccccc;
}

.api-name {
  font-size: 7px;
  font-family: 'Courier New', monospace;
  color: #000000;
}

.api-count {
  font-size: 7px;
  color: #666666;
  text-align: right;
}

.api-bar {
  height: 12px;
  background: #cccccc;
  border: 1px solid #888888;
  position: relative;
}

.api-bar-fill {
  height: 100%;
  background: #0055aa;
  transition: width 0.3s;
}

.empty-state {
  padding: 40px;
  text-align: center;
  color: #666666;
  font-size: 8px;
}
</style>

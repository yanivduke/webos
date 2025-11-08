<template>
  <div class="amiga-taskmgr">
    <!-- Toolbar -->
    <div class="toolbar">
      <div class="toolbar-left">
        <button class="amiga-button small" @click="refreshTasks" title="Refresh">
          &#x21bb;
        </button>
        <button
          class="amiga-button small"
          :class="{ active: autoRefresh }"
          @click="toggleAutoRefresh"
          title="Auto-refresh"
        >
          Auto
        </button>
        <div class="search-box">
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Search tasks..."
            class="search-input"
          />
        </div>
      </div>
      <div class="toolbar-right">
        <span class="task-count">{{ filteredTasks.length }} tasks</span>
      </div>
    </div>

    <!-- Quick Actions Panel -->
    <div class="actions-panel" v-if="selectedTasks.size > 0">
      <div class="actions-title">Quick Actions ({{ selectedTasks.size }} selected)</div>
      <div class="actions-buttons">
        <button class="amiga-button tiny" @click="switchToSelected" :disabled="selectedTasks.size !== 1">
          Switch To
        </button>
        <button class="amiga-button tiny" @click="minimizeSelected">
          Minimize
        </button>
        <button class="amiga-button tiny" @click="restoreSelected">
          Restore
        </button>
        <button class="amiga-button tiny danger" @click="endTaskSelected">
          End Task
        </button>
        <button class="amiga-button tiny" @click="setPriorityDialog">
          Priority
        </button>
        <button class="amiga-button tiny" @click="setAlwaysOnTopDialog">
          Always On Top
        </button>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="content-area">
      <!-- Tab Bar -->
      <div class="tab-bar">
        <div
          v-for="tab in tabs"
          :key="tab.id"
          class="tab"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          {{ tab.name }}
        </div>
      </div>

      <!-- Tasks Tab -->
      <div v-if="activeTab === 'tasks'" class="tab-panel">
        <!-- Task Table -->
        <div class="task-table">
          <div class="task-row header">
            <div class="col-select">
              <input type="checkbox" @change="toggleSelectAll" :checked="isAllSelected" />
            </div>
            <div class="col-name" @click="sortBy('name')">
              Name {{ getSortIndicator('name') }}
            </div>
            <div class="col-type" @click="sortBy('type')">
              Type {{ getSortIndicator('type') }}
            </div>
            <div class="col-memory" @click="sortBy('memory')">
              Memory {{ getSortIndicator('memory') }}
            </div>
            <div class="col-cpu" @click="sortBy('cpu')">
              CPU% {{ getSortIndicator('cpu') }}
            </div>
            <div class="col-uptime" @click="sortBy('uptime')">
              Uptime {{ getSortIndicator('uptime') }}
            </div>
            <div class="col-status" @click="sortBy('status')">
              Status {{ getSortIndicator('status') }}
            </div>
            <div class="col-priority">Priority</div>
          </div>
          <div
            v-for="task in sortedTasks"
            :key="task.id"
            class="task-row"
            :class="{ selected: selectedTasks.has(task.id) }"
            @click="handleRowClick(task.id, $event)"
            @dblclick="switchToTask(task.id)"
          >
            <div class="col-select">
              <input
                type="checkbox"
                :checked="selectedTasks.has(task.id)"
                @click.stop
                @change="toggleTaskSelection(task.id)"
              />
            </div>
            <div class="col-name">{{ task.name }}</div>
            <div class="col-type">{{ task.type }}</div>
            <div class="col-memory">{{ formatBytes(task.memory) }}</div>
            <div class="col-cpu">{{ task.cpu.toFixed(1) }}%</div>
            <div class="col-uptime">{{ formatUptime(task.startTime) }}</div>
            <div class="col-status">
              <span class="status-badge" :class="getStatusClass(task.status)">
                {{ task.status }}
              </span>
            </div>
            <div class="col-priority">
              <select
                class="priority-select"
                :value="task.priority || 'normal'"
                @click.stop
                @change="changePriority(task.id, $event)"
              >
                <option value="high">High</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Window Actions Bar -->
        <div class="window-actions">
          <button class="amiga-button" @click="cascadeWindows">
            &#x25A8; Cascade Windows
          </button>
          <button class="amiga-button" @click="tileWindows">
            &#x25A6; Tile Windows
          </button>
          <button class="amiga-button" @click="minimizeAllWindows">
            &#x25BC; Minimize All
          </button>
          <button class="amiga-button danger" @click="closeAllWindows">
            &#x2715; Close All
          </button>
          <button class="amiga-button" @click="openAppLauncher">
            + New Task
          </button>
        </div>
      </div>

      <!-- History Tab -->
      <div v-if="activeTab === 'history'" class="tab-panel">
        <div class="history-header">
          <div class="history-title">Task History (Last 50 closed windows)</div>
          <button class="amiga-button small" @click="clearHistory">Clear History</button>
        </div>
        <div class="history-list">
          <div
            v-for="item in taskHistory"
            :key="item.id"
            class="history-item"
          >
            <div class="history-icon">&#x1F5D7;</div>
            <div class="history-info">
              <div class="history-name">{{ item.name }}</div>
              <div class="history-meta">
                {{ item.type }} | Closed: {{ formatTimestamp(item.closedAt) }} |
                Runtime: {{ formatDuration(item.runtime) }}
              </div>
            </div>
            <button class="amiga-button tiny" @click="reopenTask(item)" title="Reopen">
              &#x21bb;
            </button>
          </div>
          <div v-if="taskHistory.length === 0" class="empty-state">
            No task history yet
          </div>
        </div>
      </div>

      <!-- Settings Tab -->
      <div v-if="activeTab === 'settings'" class="tab-panel">
        <div class="settings-grid">
          <div class="setting-section">
            <div class="setting-header">Auto-close Settings</div>
            <div class="setting-row">
              <label>
                <input
                  type="checkbox"
                  v-model="settings.autoCloseIdle"
                />
                Auto-close idle windows
              </label>
            </div>
            <div class="setting-row" v-if="settings.autoCloseIdle">
              <label>
                Idle timeout (minutes):
                <input
                  type="number"
                  v-model.number="settings.idleTimeout"
                  min="1"
                  max="60"
                  class="number-input"
                />
              </label>
            </div>
          </div>

          <div class="setting-section">
            <div class="setting-header">Window Behavior</div>
            <div class="setting-row">
              <label>
                Default window priority:
                <select v-model="settings.defaultPriority" class="priority-select">
                  <option value="high">High</option>
                  <option value="normal">Normal</option>
                  <option value="low">Low</option>
                </select>
              </label>
            </div>
            <div class="setting-row">
              <label>
                <input
                  type="checkbox"
                  v-model="settings.confirmCloseAll"
                />
                Confirm before closing all windows
              </label>
            </div>
          </div>

          <div class="setting-section">
            <div class="setting-header">Display Options</div>
            <div class="setting-row">
              <label>
                Auto-refresh interval (seconds):
                <input
                  type="number"
                  v-model.number="settings.refreshInterval"
                  min="1"
                  max="60"
                  class="number-input"
                />
              </label>
            </div>
            <div class="setting-row">
              <label>
                Max history items:
                <input
                  type="number"
                  v-model.number="settings.maxHistoryItems"
                  min="10"
                  max="100"
                  class="number-input"
                />
              </label>
            </div>
          </div>

          <div class="setting-section">
            <div class="setting-header">Advanced Options</div>
            <div class="setting-row">
              <label>
                Window opacity:
                <input
                  type="range"
                  v-model.number="settings.windowOpacity"
                  min="50"
                  max="100"
                  class="range-input"
                />
                <span class="opacity-value">{{ settings.windowOpacity }}%</span>
              </label>
            </div>
            <div class="setting-row">
              <label>
                <input
                  type="checkbox"
                  v-model="settings.showNotifications"
                />
                Show task notifications
              </label>
            </div>
          </div>
        </div>

        <div class="setting-actions">
          <button class="amiga-button" @click="saveSettings">Save Settings</button>
          <button class="amiga-button" @click="resetSettings">Reset to Defaults</button>
        </div>
      </div>
    </div>

    <!-- App Launcher Dialog -->
    <div v-if="showAppLauncher" class="modal-overlay" @click="closeAppLauncher">
      <div class="modal-dialog" @click.stop>
        <AmigaAppLauncher @close="closeAppLauncher" @launch="handleAppLaunch" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { performanceMonitor } from '../../utils/performance-monitor';
import AmigaAppLauncher from './AmigaAppLauncher.vue';

interface Task {
  id: string;
  name: string;
  type: string;
  memory: number;
  cpu: number;
  startTime: number;
  status: 'running' | 'minimized' | 'not-responding';
  priority?: 'high' | 'normal' | 'low';
  alwaysOnTop?: boolean;
  opacity?: number;
}

interface HistoryItem {
  id: string;
  name: string;
  type: string;
  closedAt: number;
  runtime: number;
}

interface Tab {
  id: string;
  name: string;
}

const emit = defineEmits<{
  openTool: [toolName: string];
  switchTo: [taskId: string];
  endTask: [taskId: string];
  cascadeWindows: [];
  tileWindows: [];
  minimizeAll: [];
  closeAll: [];
}>();

const tabs: Tab[] = [
  { id: 'tasks', name: 'Tasks' },
  { id: 'history', name: 'History' },
  { id: 'settings', name: 'Settings' },
];

const activeTab = ref('tasks');
const tasks = ref<Task[]>([]);
const selectedTasks = ref<Set<string>>(new Set());
const searchQuery = ref('');
const sortColumn = ref<string>('name');
const sortDirection = ref<'asc' | 'desc'>('asc');
const autoRefresh = ref(false);
const showAppLauncher = ref(false);

const taskHistory = ref<HistoryItem[]>([]);
const settings = ref({
  autoCloseIdle: false,
  idleTimeout: 5,
  defaultPriority: 'normal' as 'high' | 'normal' | 'low',
  confirmCloseAll: true,
  refreshInterval: 2,
  maxHistoryItems: 50,
  windowOpacity: 100,
  showNotifications: true,
});

let refreshInterval: number | undefined;

onMounted(() => {
  refreshTasks();
  loadSettings();
  loadHistory();
});

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});

watch(autoRefresh, (enabled) => {
  if (enabled) {
    refreshInterval = window.setInterval(refreshTasks, settings.value.refreshInterval * 1000);
  } else if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = undefined;
  }
});

const refreshTasks = () => {
  const processes = performanceMonitor.getProcesses();
  tasks.value = processes.map(p => ({
    id: p.id,
    name: p.name,
    type: p.type,
    memory: p.memory,
    cpu: p.cpu,
    startTime: p.startTime,
    status: p.status === 'running' ? 'running' : 'minimized',
    priority: 'normal',
    alwaysOnTop: false,
    opacity: 100,
  }));
};

const filteredTasks = computed(() => {
  if (!searchQuery.value) return tasks.value;
  const query = searchQuery.value.toLowerCase();
  return tasks.value.filter(t =>
    t.name.toLowerCase().includes(query) ||
    t.type.toLowerCase().includes(query)
  );
});

const sortedTasks = computed(() => {
  const sorted = [...filteredTasks.value];
  sorted.sort((a, b) => {
    let aVal: any = a[sortColumn.value as keyof Task];
    let bVal: any = b[sortColumn.value as keyof Task];

    if (sortColumn.value === 'uptime') {
      aVal = a.startTime;
      bVal = b.startTime;
    }

    if (typeof aVal === 'string') {
      return sortDirection.value === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }

    return sortDirection.value === 'asc'
      ? aVal - bVal
      : bVal - aVal;
  });
  return sorted;
});

const isAllSelected = computed(() => {
  return filteredTasks.value.length > 0 &&
         selectedTasks.value.size === filteredTasks.value.length;
});

const sortBy = (column: string) => {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortColumn.value = column;
    sortDirection.value = 'asc';
  }
};

const getSortIndicator = (column: string): string => {
  if (sortColumn.value !== column) return '';
  return sortDirection.value === 'asc' ? '▲' : '▼';
};

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedTasks.value.clear();
  } else {
    selectedTasks.value = new Set(filteredTasks.value.map(t => t.id));
  }
};

const toggleTaskSelection = (id: string) => {
  if (selectedTasks.value.has(id)) {
    selectedTasks.value.delete(id);
  } else {
    selectedTasks.value.add(id);
  }
};

const handleRowClick = (id: string, event: MouseEvent) => {
  if (event.ctrlKey || event.metaKey) {
    toggleTaskSelection(id);
  } else {
    selectedTasks.value.clear();
    selectedTasks.value.add(id);
  }
};

const toggleAutoRefresh = () => {
  autoRefresh.value = !autoRefresh.value;
};

const switchToTask = (id: string) => {
  emit('switchTo', id);
};

const switchToSelected = () => {
  const selected = Array.from(selectedTasks.value);
  if (selected.length === 1) {
    emit('switchTo', selected[0]);
  }
};

const minimizeSelected = () => {
  selectedTasks.value.forEach(id => {
    const task = tasks.value.find(t => t.id === id);
    if (task) task.status = 'minimized';
  });
};

const restoreSelected = () => {
  selectedTasks.value.forEach(id => {
    const task = tasks.value.find(t => t.id === id);
    if (task) task.status = 'running';
  });
};

const endTaskSelected = () => {
  if (confirm(`End ${selectedTasks.value.size} task(s)?`)) {
    selectedTasks.value.forEach(id => {
      addToHistory(id);
      emit('endTask', id);
      performanceMonitor.unregisterProcess(id);
    });
    selectedTasks.value.clear();
    refreshTasks();
  }
};

const setPriorityDialog = () => {
  const priority = prompt('Set priority (high/normal/low):');
  if (priority && ['high', 'normal', 'low'].includes(priority)) {
    selectedTasks.value.forEach(id => {
      const task = tasks.value.find(t => t.id === id);
      if (task) task.priority = priority as 'high' | 'normal' | 'low';
    });
  }
};

const setAlwaysOnTopDialog = () => {
  selectedTasks.value.forEach(id => {
    const task = tasks.value.find(t => t.id === id);
    if (task) task.alwaysOnTop = !task.alwaysOnTop;
  });
  alert(`Always-on-top ${tasks.value.find(t => selectedTasks.value.has(t.id))?.alwaysOnTop ? 'enabled' : 'disabled'} for selected tasks`);
};

const changePriority = (id: string, event: Event) => {
  const target = event.target as HTMLSelectElement;
  const task = tasks.value.find(t => t.id === id);
  if (task) {
    task.priority = target.value as 'high' | 'normal' | 'low';
  }
};

const cascadeWindows = () => {
  emit('cascadeWindows');
};

const tileWindows = () => {
  emit('tileWindows');
};

const minimizeAllWindows = () => {
  emit('minimizeAll');
};

const closeAllWindows = () => {
  if (settings.value.confirmCloseAll) {
    if (!confirm('Close all windows?')) return;
  }
  tasks.value.forEach(task => addToHistory(task.id));
  emit('closeAll');
};

const openAppLauncher = () => {
  showAppLauncher.value = true;
};

const closeAppLauncher = () => {
  showAppLauncher.value = false;
};

const handleAppLaunch = (appName: string) => {
  emit('openTool', appName);
  closeAppLauncher();
};

const getStatusClass = (status: string): string => {
  switch (status) {
    case 'running': return 'status-running';
    case 'minimized': return 'status-minimized';
    case 'not-responding': return 'status-error';
    default: return '';
  }
};

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

const formatUptime = (startTime: number): string => {
  const uptime = Date.now() - startTime;
  const seconds = Math.floor(uptime / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
};

const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString();
};

const formatDuration = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
};

const addToHistory = (taskId: string) => {
  const task = tasks.value.find(t => t.id === taskId);
  if (!task) return;

  const historyItem: HistoryItem = {
    id: taskId,
    name: task.name,
    type: task.type,
    closedAt: Date.now(),
    runtime: Date.now() - task.startTime,
  };

  taskHistory.value.unshift(historyItem);
  if (taskHistory.value.length > settings.value.maxHistoryItems) {
    taskHistory.value = taskHistory.value.slice(0, settings.value.maxHistoryItems);
  }
  saveHistory();
};

const clearHistory = () => {
  if (confirm('Clear all task history?')) {
    taskHistory.value = [];
    saveHistory();
  }
};

const reopenTask = (item: HistoryItem) => {
  // Emit to reopen the task (would need implementation in parent)
  alert(`Reopening ${item.name} - feature would be implemented in desktop`);
};

const saveSettings = () => {
  localStorage.setItem('taskManagerSettings', JSON.stringify(settings.value));
  alert('Settings saved!');
};

const resetSettings = () => {
  settings.value = {
    autoCloseIdle: false,
    idleTimeout: 5,
    defaultPriority: 'normal',
    confirmCloseAll: true,
    refreshInterval: 2,
    maxHistoryItems: 50,
    windowOpacity: 100,
    showNotifications: true,
  };
  saveSettings();
};

const loadSettings = () => {
  const saved = localStorage.getItem('taskManagerSettings');
  if (saved) {
    settings.value = { ...settings.value, ...JSON.parse(saved) };
  }
};

const saveHistory = () => {
  localStorage.setItem('taskHistory', JSON.stringify(taskHistory.value));
};

const loadHistory = () => {
  const saved = localStorage.getItem('taskHistory');
  if (saved) {
    taskHistory.value = JSON.parse(saved);
  }
};
</script>

<style scoped>
.amiga-taskmgr {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #a0a0a0;
  font-family: 'Press Start 2P', monospace;
}

/* Toolbar */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #888;
  border-bottom: 2px solid #000;
  padding: 6px;
  gap: 8px;
}

.toolbar-left {
  display: flex;
  gap: 6px;
  align-items: center;
}

.toolbar-right {
  font-size: 7px;
  color: #fff;
}

.search-box {
  display: flex;
  align-items: center;
}

.search-input {
  background: #fff;
  border: 2px solid;
  border-color: #000 #fff #fff #000;
  padding: 4px 6px;
  font-size: 7px;
  font-family: 'Press Start 2P', monospace;
  width: 200px;
}

.task-count {
  font-weight: bold;
}

/* Actions Panel */
.actions-panel {
  background: #0055aa;
  border-bottom: 2px solid #000;
  padding: 6px;
}

.actions-title {
  font-size: 7px;
  color: #fff;
  margin-bottom: 4px;
  font-weight: bold;
}

.actions-buttons {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

/* Content Area */
.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Tab Bar */
.tab-bar {
  display: flex;
  background: #888;
  border-bottom: 2px solid #000;
  padding: 4px;
  gap: 2px;
}

.tab {
  padding: 6px 12px;
  font-size: 8px;
  cursor: pointer;
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  color: #000;
  transition: all 0.05s;
  user-select: none;
}

.tab:hover {
  background: #b0b0b0;
}

.tab.active {
  background: #0055aa;
  color: #ffffff;
  border-color: #000000 #ffffff #ffffff #000000;
}

/* Tab Panel */
.tab-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 8px;
  gap: 8px;
}

/* Task Table */
.task-table {
  background: #888;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  font-size: 7px;
  flex: 1;
  overflow-y: auto;
}

.task-row {
  display: grid;
  grid-template-columns: 40px 2fr 1fr 0.8fr 0.6fr 0.8fr 1fr 0.8fr;
  gap: 8px;
  padding: 6px 10px;
  border-bottom: 1px solid #666;
  align-items: center;
}

.task-row.header {
  background: #0055aa;
  color: #fff;
  font-weight: bold;
  position: sticky;
  top: 0;
  cursor: pointer;
  user-select: none;
}

.task-row:not(.header) {
  background: #a0a0a0;
  color: #000;
  cursor: pointer;
}

.task-row:not(.header):hover {
  background: #b0b0b0;
}

.task-row.selected {
  background: #0055aa !important;
  color: #fff;
}

.col-select {
  display: flex;
  justify-content: center;
}

.col-name { font-weight: bold; }

.status-badge {
  padding: 2px 6px;
  border-radius: 2px;
  font-size: 6px;
  font-weight: bold;
  display: inline-block;
}

.status-running {
  background: #00ff00;
  color: #000;
}

.status-minimized {
  background: #ffaa00;
  color: #000;
}

.status-error {
  background: #ff0000;
  color: #fff;
}

.priority-select {
  background: #fff;
  border: 1px solid #000;
  padding: 2px;
  font-size: 6px;
  font-family: 'Press Start 2P', monospace;
  width: 100%;
}

/* Window Actions */
.window-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  padding: 8px;
  background: #888;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
}

/* History */
.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.history-title {
  font-size: 8px;
  color: #000;
  font-weight: bold;
}

.history-list {
  background: #888;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 8px;
  flex: 1;
  overflow-y: auto;
}

.history-item {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 6px;
  background: #a0a0a0;
  border: 1px solid #666;
  margin-bottom: 6px;
}

.history-icon {
  font-size: 16px;
}

.history-info {
  flex: 1;
}

.history-name {
  font-size: 7px;
  font-weight: bold;
  color: #000;
  margin-bottom: 2px;
}

.history-meta {
  font-size: 6px;
  color: #333;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #666;
  font-size: 8px;
}

/* Settings */
.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
}

.setting-section {
  background: #888;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 10px;
}

.setting-header {
  font-size: 8px;
  color: #fff;
  margin-bottom: 8px;
  text-transform: uppercase;
  border-bottom: 1px solid #666;
  padding-bottom: 4px;
}

.setting-row {
  padding: 6px 0;
  font-size: 7px;
  color: #fff;
}

.setting-row label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.number-input,
.range-input {
  background: #fff;
  border: 2px solid;
  border-color: #000 #fff #fff #000;
  padding: 2px 4px;
  font-size: 7px;
  font-family: 'Press Start 2P', monospace;
  width: 60px;
}

.range-input {
  width: 120px;
}

.opacity-value {
  margin-left: 6px;
  color: #00ff00;
  font-weight: bold;
}

.setting-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

/* Buttons */
.amiga-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 6px 12px;
  font-size: 8px;
  cursor: pointer;
  color: #000000;
  font-family: 'Press Start 2P', monospace;
  transition: all 0.05s;
}

.amiga-button:hover {
  background: #b0b0b0;
}

.amiga-button:active {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}

.amiga-button.small {
  padding: 4px 10px;
  font-size: 7px;
}

.amiga-button.tiny {
  padding: 2px 6px;
  font-size: 6px;
}

.amiga-button.active {
  background: #0055aa;
  color: #fff;
}

.amiga-button.danger {
  color: #ff0000;
  font-weight: bold;
}

.amiga-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-dialog {
  max-width: 600px;
  max-height: 80vh;
}

/* Scrollbar */
::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

::-webkit-scrollbar-track {
  background: #666;
}

::-webkit-scrollbar-thumb {
  background: #a0a0a0;
  border: 1px solid #000;
}

::-webkit-scrollbar-thumb:hover {
  background: #b0b0b0;
}
</style>

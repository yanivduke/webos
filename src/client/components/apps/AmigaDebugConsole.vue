<template>
  <div class="amiga-debug-console amiga-bg">
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

    <!-- Logs Tab -->
    <div v-if="activeTab === 'logs'" class="tab-content">
      <!-- Toolbar -->
      <div class="toolbar amiga-bevel-in-thin">
        <!-- Level Filter -->
        <select v-model="selectedLevel" class="amiga-select">
          <option value="">All Levels</option>
          <option v-for="level in logLevels" :key="level.value" :value="level.value">
            {{ level.name }}
          </option>
        </select>

        <!-- Category Filter -->
        <select v-model="selectedCategory" class="amiga-select">
          <option value="">All Categories</option>
          <option v-for="cat in categories" :key="cat" :value="cat">
            {{ cat }}
          </option>
        </select>

        <!-- Search -->
        <input
          v-model="searchText"
          type="text"
          class="amiga-input search-input"
          placeholder="Search..."
        />

        <div class="spacer"></div>

        <!-- Auto-scroll toggle -->
        <label class="auto-scroll-toggle">
          <input type="checkbox" v-model="autoScroll" class="amiga-checkbox" />
          <span class="amiga-text-small">Auto-scroll</span>
        </label>

        <!-- Export -->
        <select v-model="exportFormat" class="amiga-select">
          <option value="json">JSON</option>
          <option value="csv">CSV</option>
          <option value="txt">TXT</option>
        </select>
        <button class="amiga-button amiga-button-small" @click="exportLogs">
          Export
        </button>

        <!-- Clear -->
        <button class="amiga-button amiga-button-small" @click="clearLogs">
          Clear
        </button>

        <!-- Refresh -->
        <button class="amiga-button amiga-button-small" @click="refreshLogs">
          Refresh
        </button>
      </div>

      <!-- Stats Bar -->
      <div class="stats-bar amiga-bevel-in-thin">
        <div class="stat-item">
          <span class="stat-label">Total:</span>
          <span class="stat-value">{{ stats.total }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Errors:</span>
          <span class="stat-value error">{{ stats.byLevel[3] }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Warnings:</span>
          <span class="stat-value warning">{{ stats.byLevel[2] }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Info:</span>
          <span class="stat-value info">{{ stats.byLevel[1] }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Debug:</span>
          <span class="stat-value debug">{{ stats.byLevel[0] }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Displayed:</span>
          <span class="stat-value">{{ filteredLogs.length }}</span>
        </div>
      </div>

      <!-- Log List with Virtual Scrolling -->
      <div ref="logContainer" class="log-container amiga-scrollbar" @scroll="handleScroll">
        <div class="log-list">
          <div
            v-for="log in visibleLogs"
            :key="log.id"
            class="log-entry"
            :class="[
              'level-' + getLevelName(log.level).toLowerCase(),
              { expanded: expandedLogs.has(log.id) }
            ]"
            @click="toggleExpand(log.id)"
          >
            <div class="log-header">
              <span class="log-timestamp">{{ formatTimestamp(log.timestamp) }}</span>
              <span class="log-level" :style="{ color: getLevelColor(log.level) }">
                {{ getLevelName(log.level) }}
              </span>
              <span class="log-category">[{{ log.category }}]</span>
              <span class="log-message">{{ log.message }}</span>
              <span class="expand-icon">{{ expandedLogs.has(log.id) ? '▼' : '▶' }}</span>
            </div>

            <div v-if="expandedLogs.has(log.id)" class="log-details">
              <div v-if="log.data" class="log-data">
                <div class="detail-label">Data:</div>
                <pre class="detail-content">{{ formatData(log.data) }}</pre>
              </div>
              <div v-if="log.stackTrace" class="log-stack">
                <div class="detail-label">Stack Trace:</div>
                <pre class="detail-content">{{ log.stackTrace }}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Network Tab -->
    <div v-if="activeTab === 'network'" class="tab-content">
      <!-- Toolbar -->
      <div class="toolbar amiga-bevel-in-thin">
        <!-- Method Filter -->
        <select v-model="networkMethodFilter" class="amiga-select">
          <option value="">All Methods</option>
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
          <option value="PATCH">PATCH</option>
        </select>

        <!-- URL Filter -->
        <input
          v-model="networkUrlFilter"
          type="text"
          class="amiga-input search-input"
          placeholder="Filter by URL..."
        />

        <div class="spacer"></div>

        <!-- Export -->
        <button class="amiga-button amiga-button-small" @click="exportNetwork">
          Export HAR
        </button>

        <!-- Clear -->
        <button class="amiga-button amiga-button-small" @click="clearNetwork">
          Clear
        </button>

        <!-- Refresh -->
        <button class="amiga-button amiga-button-small" @click="refreshNetwork">
          Refresh
        </button>
      </div>

      <!-- Network Stats -->
      <div class="stats-bar amiga-bevel-in-thin">
        <div class="stat-item">
          <span class="stat-label">Total:</span>
          <span class="stat-value">{{ networkStats.total }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Success:</span>
          <span class="stat-value success">{{ networkStats.successful }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Failed:</span>
          <span class="stat-value error">{{ networkStats.failed }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Avg Time:</span>
          <span class="stat-value">{{ networkStats.averageDuration.toFixed(0) }}ms</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Request Size:</span>
          <span class="stat-value">{{ formatBytes(networkStats.totalRequestSize) }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Response Size:</span>
          <span class="stat-value">{{ formatBytes(networkStats.totalResponseSize) }}</span>
        </div>
      </div>

      <!-- Network Request List -->
      <div class="network-container amiga-scrollbar">
        <div
          v-for="req in filteredNetworkRequests"
          :key="req.id"
          class="network-entry"
          :class="{
            expanded: expandedRequests.has(req.id),
            error: req.error || (req.status && req.status >= 400)
          }"
          @click="toggleRequestExpand(req.id)"
        >
          <div class="network-header">
            <span class="network-method" :class="'method-' + req.method.toLowerCase()">
              {{ req.method }}
            </span>
            <span class="network-status" :class="getStatusClass(req.status)">
              {{ req.status || 'pending' }}
            </span>
            <span class="network-url">{{ req.url }}</span>
            <span class="network-duration">{{ req.duration ? req.duration + 'ms' : '-' }}</span>
            <span class="expand-icon">{{ expandedRequests.has(req.id) ? '▼' : '▶' }}</span>
          </div>

          <div v-if="expandedRequests.has(req.id)" class="network-details">
            <div class="detail-section">
              <div class="detail-label">General:</div>
              <div class="detail-row">
                <span class="detail-key">URL:</span>
                <span class="detail-value">{{ req.url }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-key">Method:</span>
                <span class="detail-value">{{ req.method }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-key">Status:</span>
                <span class="detail-value">{{ req.status }} {{ req.statusText }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-key">Time:</span>
                <span class="detail-value">{{ formatTimestamp(req.timestamp) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-key">Duration:</span>
                <span class="detail-value">{{ req.duration }}ms</span>
              </div>
            </div>

            <div v-if="req.requestHeaders" class="detail-section">
              <div class="detail-label">Request Headers:</div>
              <pre class="detail-content">{{ formatData(req.requestHeaders) }}</pre>
            </div>

            <div v-if="req.requestBody" class="detail-section">
              <div class="detail-label">Request Body:</div>
              <pre class="detail-content">{{ formatData(req.requestBody) }}</pre>
            </div>

            <div v-if="req.responseHeaders" class="detail-section">
              <div class="detail-label">Response Headers:</div>
              <pre class="detail-content">{{ formatData(req.responseHeaders) }}</pre>
            </div>

            <div v-if="req.responseBody" class="detail-section">
              <div class="detail-label">Response Body:</div>
              <pre class="detail-content">{{ formatData(req.responseBody) }}</pre>
            </div>

            <div v-if="req.error" class="detail-section error-section">
              <div class="detail-label">Error:</div>
              <div class="detail-content">{{ req.error }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Performance Tab -->
    <div v-if="activeTab === 'performance'" class="tab-content">
      <!-- Performance Metrics -->
      <div class="performance-grid">
        <div class="metric-box amiga-bevel-in-thin">
          <div class="metric-header">CPU Usage</div>
          <div class="metric-value">{{ performanceMetrics.cpu.toFixed(1) }}%</div>
          <div class="bar-container">
            <div class="bar" :style="{ width: performanceMetrics.cpu + '%', background: '#0055aa' }"></div>
          </div>
        </div>

        <div class="metric-box amiga-bevel-in-thin">
          <div class="metric-header">Memory Usage</div>
          <div class="metric-value">{{ performanceMetrics.memory.percentage.toFixed(1) }}%</div>
          <div class="bar-container">
            <div class="bar" :style="{ width: performanceMetrics.memory.percentage + '%', background: '#ffaa00' }"></div>
          </div>
          <div class="metric-detail">
            {{ formatBytes(performanceMetrics.memory.used) }} / {{ formatBytes(performanceMetrics.memory.total) }}
          </div>
        </div>

        <div class="metric-box amiga-bevel-in-thin">
          <div class="metric-header">FPS</div>
          <div class="metric-value">{{ performanceMetrics.fps }}</div>
          <div class="bar-container">
            <div class="bar" :style="{ width: (performanceMetrics.fps / 60 * 100) + '%', background: '#00ff00' }"></div>
          </div>
        </div>

        <div class="metric-box amiga-bevel-in-thin">
          <div class="metric-header">Storage</div>
          <div class="metric-value">{{ performanceMetrics.storage.percentage.toFixed(1) }}%</div>
          <div class="bar-container">
            <div class="bar" :style="{ width: performanceMetrics.storage.percentage + '%', background: '#ff0000' }"></div>
          </div>
          <div class="metric-detail">
            {{ formatBytes(performanceMetrics.storage.used) }} / {{ formatBytes(performanceMetrics.storage.total) }}
          </div>
        </div>
      </div>

      <!-- Performance History Chart -->
      <div class="chart-container amiga-bevel-in-thin">
        <div class="chart-header">Performance History (Last 60s)</div>
        <svg viewBox="0 0 600 150" class="performance-chart">
          <!-- Grid -->
          <line v-for="i in 6" :key="'h' + i" :x1="0" :y1="i * 25" :x2="600" :y2="i * 25" stroke="#666" stroke-width="0.5" />
          <line v-for="i in 11" :key="'v' + i" :x1="i * 60" :y1="0" :x2="i * 60" :y2="150" stroke="#666" stroke-width="0.5" />

          <!-- CPU Line -->
          <polyline
            v-if="performanceHistory.length > 1"
            :points="getPerformancePoints('cpu')"
            fill="none"
            stroke="#0055aa"
            stroke-width="2"
          />

          <!-- Memory Line -->
          <polyline
            v-if="performanceHistory.length > 1"
            :points="getPerformancePoints('memory')"
            fill="none"
            stroke="#ffaa00"
            stroke-width="2"
          />

          <!-- FPS Line -->
          <polyline
            v-if="performanceHistory.length > 1"
            :points="getPerformancePoints('fps')"
            fill="none"
            stroke="#00ff00"
            stroke-width="2"
          />
        </svg>
        <div class="chart-legend">
          <span class="legend-item"><span class="legend-color" style="background: #0055aa;"></span> CPU</span>
          <span class="legend-item"><span class="legend-color" style="background: #ffaa00;"></span> Memory</span>
          <span class="legend-item"><span class="legend-color" style="background: #00ff00;"></span> FPS</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { systemLogger, LogLevel, type LogEntry, type LogFilter } from '../../utils/system-logger';
import { networkInspector, type NetworkRequest } from '../../utils/network-inspector';
import { performanceMonitor, type PerformanceMetrics } from '../../utils/performance-monitor';

// Tabs
const tabs = [
  { id: 'logs', name: 'Logs' },
  { id: 'network', name: 'Network' },
  { id: 'performance', name: 'Performance' }
];
const activeTab = ref('logs');

// Log Levels
const logLevels = [
  { value: LogLevel.DEBUG, name: 'DEBUG' },
  { value: LogLevel.INFO, name: 'INFO' },
  { value: LogLevel.WARNING, name: 'WARNING' },
  { value: LogLevel.ERROR, name: 'ERROR' },
  { value: LogLevel.CRITICAL, name: 'CRITICAL' }
];

// Filters
const selectedLevel = ref<LogLevel | ''>('');
const selectedCategory = ref('');
const searchText = ref('');
const autoScroll = ref(true);
const exportFormat = ref('json');

// Network filters
const networkMethodFilter = ref('');
const networkUrlFilter = ref('');

// State
const logs = ref<LogEntry[]>([]);
const categories = ref<string[]>([]);
const expandedLogs = ref<Set<string>>(new Set());
const logContainer = ref<HTMLElement | null>(null);

// Network state
const networkRequests = ref<NetworkRequest[]>([]);
const expandedRequests = ref<Set<string>>(new Set());

// Performance state
const performanceMetrics = ref<PerformanceMetrics>({
  timestamp: Date.now(),
  cpu: 0,
  memory: { used: 0, total: 0, percentage: 0 },
  network: { uploadSpeed: 0, downloadSpeed: 0, activeConnections: 0 },
  storage: { used: 0, total: 0, percentage: 0 },
  fps: 60
});
const performanceHistory = ref<PerformanceMetrics[]>([]);

// Intervals
let logRefreshInterval: number | undefined;
let networkRefreshInterval: number | undefined;
let performanceInterval: number | undefined;
let logSubscription: (() => void) | undefined;
let networkSubscription: (() => void) | undefined;

// Computed
const stats = computed(() => systemLogger.getStats());

const filteredLogs = computed(() => {
  const filter: LogFilter = {
    searchText: searchText.value
  };

  if (selectedLevel.value !== '') {
    filter.levels = [selectedLevel.value as LogLevel];
  }

  if (selectedCategory.value) {
    filter.categories = [selectedCategory.value];
  }

  return systemLogger.getFilteredLogs(filter);
});

// Virtual scrolling - show only visible logs
const visibleLogs = computed(() => {
  // For simplicity, show all filtered logs (can implement virtual scrolling later)
  return filteredLogs.value;
});

const networkStats = computed(() => networkInspector.getStats());

const filteredNetworkRequests = computed(() => {
  const filter: any = {};

  if (networkMethodFilter.value) {
    filter.method = networkMethodFilter.value;
  }

  if (networkUrlFilter.value) {
    filter.url = networkUrlFilter.value;
  }

  return networkInspector.getFilteredRequests(filter);
});

// Methods
const refreshLogs = () => {
  logs.value = systemLogger.getLogs();
  categories.value = systemLogger.getCategories();
};

const refreshNetwork = () => {
  networkRequests.value = networkInspector.getRequests();
};

const refreshPerformance = () => {
  performanceMetrics.value = performanceMonitor.collectMetrics();
  performanceHistory.value = performanceMonitor.getHistory();
};

const clearLogs = () => {
  if (confirm('Clear all logs? This action cannot be undone.')) {
    systemLogger.clearLogs();
    refreshLogs();
    expandedLogs.value.clear();
  }
};

const clearNetwork = () => {
  if (confirm('Clear all network requests?')) {
    networkInspector.clearRequests();
    refreshNetwork();
    expandedRequests.value.clear();
  }
};

const exportLogs = () => {
  let content = '';
  let filename = '';

  const filter: LogFilter = {
    searchText: searchText.value
  };

  if (selectedLevel.value !== '') {
    filter.levels = [selectedLevel.value as LogLevel];
  }

  if (selectedCategory.value) {
    filter.categories = [selectedCategory.value];
  }

  switch (exportFormat.value) {
    case 'json':
      content = systemLogger.exportToJson(filter);
      filename = `webos-logs-${Date.now()}.json`;
      break;
    case 'csv':
      content = systemLogger.exportToCsv(filter);
      filename = `webos-logs-${Date.now()}.csv`;
      break;
    case 'txt':
      content = systemLogger.exportToText(filter);
      filename = `webos-logs-${Date.now()}.txt`;
      break;
  }

  downloadFile(content, filename);
};

const exportNetwork = () => {
  const content = networkInspector.exportToHAR();
  const filename = `webos-network-${Date.now()}.har`;
  downloadFile(content, filename);
};

const downloadFile = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const toggleExpand = (id: string) => {
  if (expandedLogs.value.has(id)) {
    expandedLogs.value.delete(id);
  } else {
    expandedLogs.value.add(id);
  }
};

const toggleRequestExpand = (id: string) => {
  if (expandedRequests.value.has(id)) {
    expandedRequests.value.delete(id);
  } else {
    expandedRequests.value.add(id);
  }
};

const handleScroll = () => {
  if (!logContainer.value) return;

  const { scrollTop, scrollHeight, clientHeight } = logContainer.value;
  const isAtBottom = scrollHeight - scrollTop - clientHeight < 10;

  if (!isAtBottom) {
    autoScroll.value = false;
  }
};

const scrollToBottom = async () => {
  if (!autoScroll.value || !logContainer.value) return;

  await nextTick();
  logContainer.value.scrollTop = logContainer.value.scrollHeight;
};

const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const ms = String(date.getMilliseconds()).padStart(3, '0');
  return `${hours}:${minutes}:${seconds}.${ms}`;
};

const formatData = (data: any): string => {
  if (typeof data === 'string') return data;
  return JSON.stringify(data, null, 2);
};

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getLevelName = (level: LogLevel): string => {
  return LogLevel[level];
};

const getLevelColor = (level: LogLevel): string => {
  return systemLogger.getLevelColor(level);
};

const getStatusClass = (status?: number): string => {
  if (!status) return 'pending';
  if (status >= 200 && status < 300) return 'success';
  if (status >= 300 && status < 400) return 'redirect';
  if (status >= 400 && status < 500) return 'client-error';
  if (status >= 500) return 'server-error';
  return '';
};

const getPerformancePoints = (metric: 'cpu' | 'memory' | 'fps'): string => {
  const history = performanceHistory.value;
  if (history.length < 2) return '';

  const points = history.map((m, i) => {
    const x = (i / (history.length - 1)) * 600;
    let y = 0;

    switch (metric) {
      case 'cpu':
        y = 150 - (m.cpu / 100) * 150;
        break;
      case 'memory':
        y = 150 - (m.memory.percentage / 100) * 150;
        break;
      case 'fps':
        y = 150 - (m.fps / 60) * 150;
        break;
    }

    return `${x},${y}`;
  });

  return points.join(' ');
};

// Lifecycle
onMounted(() => {
  // Initial load
  refreshLogs();
  refreshNetwork();
  refreshPerformance();

  // Subscribe to new logs
  logSubscription = systemLogger.subscribe(() => {
    logs.value = systemLogger.getLogs();
    categories.value = systemLogger.getCategories();
    if (autoScroll.value && activeTab.value === 'logs') {
      scrollToBottom();
    }
  });

  // Subscribe to network requests
  networkSubscription = networkInspector.subscribe(() => {
    networkRequests.value = networkInspector.getRequests();
  });

  // Set up periodic refresh
  logRefreshInterval = window.setInterval(refreshLogs, 5000);
  networkRefreshInterval = window.setInterval(refreshNetwork, 2000);
  performanceInterval = window.setInterval(refreshPerformance, 1000);

  // Log that debug console is open
  systemLogger.info('Debug Console', 'Debug console opened');
});

onUnmounted(() => {
  if (logRefreshInterval) {
    clearInterval(logRefreshInterval);
  }
  if (networkRefreshInterval) {
    clearInterval(networkRefreshInterval);
  }
  if (performanceInterval) {
    clearInterval(performanceInterval);
  }
  if (logSubscription) {
    logSubscription();
  }
  if (networkSubscription) {
    networkSubscription();
  }

  systemLogger.info('Debug Console', 'Debug console closed');
});
</script>

<style scoped>
.amiga-debug-console {
  display: flex;
  flex-direction: column;
  height: 100%;
  font-family: 'Press Start 2P', monospace;
}

/* Tab Bar */
.tab-bar {
  display: flex;
  gap: 2px;
  background: #a0a0a0;
  padding: 4px;
  border-bottom: 2px solid #000;
}

.tab {
  padding: 4px 12px;
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  cursor: pointer;
  font-size: 9px;
  user-select: none;
}

.tab:hover {
  background: #c0c0c0;
}

.tab.active {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #707070;
  color: #ffffff;
}

/* Tab Content */
.tab-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Toolbar */
.toolbar {
  display: flex;
  gap: 4px;
  padding: 6px;
  background: #a0a0a0;
  align-items: center;
}

.spacer {
  flex: 1;
}

.search-input {
  flex: 1;
  min-width: 150px;
}

.auto-scroll-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 8px;
  cursor: pointer;
}

/* Stats Bar */
.stats-bar {
  display: flex;
  gap: 12px;
  padding: 6px;
  background: #a0a0a0;
  font-size: 8px;
}

.stat-item {
  display: flex;
  gap: 4px;
}

.stat-label {
  color: #000;
}

.stat-value {
  font-weight: bold;
  color: #000;
}

.stat-value.error {
  color: #ff0000;
}

.stat-value.warning {
  color: #ffaa00;
}

.stat-value.info {
  color: #0055aa;
}

.stat-value.debug {
  color: #888888;
}

.stat-value.success {
  color: #00aa00;
}

/* Log Container */
.log-container {
  flex: 1;
  overflow-y: auto;
  background: #000;
  padding: 4px;
}

.log-list {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

/* Log Entry */
.log-entry {
  background: #111;
  border-left: 3px solid;
  padding: 4px 6px;
  font-family: monospace;
  font-size: 10px;
  cursor: pointer;
  transition: background 0.1s;
}

.log-entry:hover {
  background: #222;
}

.log-entry.level-debug {
  border-color: #888888;
}

.log-entry.level-info {
  border-color: #0055aa;
}

.log-entry.level-warning {
  border-color: #ffaa00;
}

.log-entry.level-error {
  border-color: #ff0000;
}

.log-entry.level-critical {
  border-color: #ff0000;
  background: #330000;
}

.log-header {
  display: flex;
  gap: 8px;
  align-items: center;
  color: #fff;
}

.log-timestamp {
  color: #888;
  font-size: 9px;
}

.log-level {
  font-weight: bold;
  font-size: 9px;
  min-width: 60px;
}

.log-category {
  color: #aaa;
  font-size: 9px;
}

.log-message {
  flex: 1;
  color: #fff;
}

.expand-icon {
  color: #888;
  font-size: 8px;
}

/* Log Details */
.log-details {
  margin-top: 8px;
  padding: 8px;
  background: #0a0a0a;
  border: 1px solid #333;
}

.detail-label {
  color: #ffaa00;
  font-size: 9px;
  margin-bottom: 4px;
  font-weight: bold;
}

.detail-content {
  color: #ccc;
  font-size: 9px;
  white-space: pre-wrap;
  word-wrap: break-word;
  margin: 0;
  padding: 4px;
  background: #000;
  border: 1px solid #222;
  max-height: 300px;
  overflow-y: auto;
}

.log-data, .log-stack {
  margin-bottom: 8px;
}

/* Network Container */
.network-container {
  flex: 1;
  overflow-y: auto;
  background: #000;
  padding: 4px;
}

/* Network Entry */
.network-entry {
  background: #111;
  border-left: 3px solid #0055aa;
  padding: 4px 6px;
  font-family: monospace;
  font-size: 10px;
  cursor: pointer;
  transition: background 0.1s;
  margin-bottom: 1px;
}

.network-entry:hover {
  background: #222;
}

.network-entry.error {
  border-color: #ff0000;
}

.network-header {
  display: flex;
  gap: 8px;
  align-items: center;
  color: #fff;
}

.network-method {
  font-weight: bold;
  font-size: 9px;
  min-width: 50px;
}

.method-get { color: #00aa00; }
.method-post { color: #0055aa; }
.method-put { color: #ffaa00; }
.method-delete { color: #ff0000; }
.method-patch { color: #aa00aa; }

.network-status {
  font-size: 9px;
  min-width: 50px;
}

.network-status.success { color: #00aa00; }
.network-status.redirect { color: #ffaa00; }
.network-status.client-error { color: #ff6600; }
.network-status.server-error { color: #ff0000; }
.network-status.pending { color: #888; }

.network-url {
  flex: 1;
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.network-duration {
  color: #888;
  font-size: 9px;
  min-width: 60px;
  text-align: right;
}

/* Network Details */
.network-details {
  margin-top: 8px;
  padding: 8px;
  background: #0a0a0a;
  border: 1px solid #333;
}

.detail-section {
  margin-bottom: 12px;
}

.detail-row {
  display: flex;
  gap: 8px;
  margin: 2px 0;
  font-size: 9px;
}

.detail-key {
  color: #888;
  min-width: 120px;
}

.detail-value {
  color: #fff;
  word-break: break-all;
}

.error-section {
  background: #330000;
  border: 1px solid #ff0000;
  padding: 8px;
}

/* Performance Grid */
.performance-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 8px;
  padding: 8px;
}

.metric-box {
  padding: 8px;
  background: #a0a0a0;
}

.metric-header {
  font-size: 8px;
  color: #000;
  margin-bottom: 4px;
  font-weight: bold;
}

.metric-value {
  font-size: 16px;
  color: #000;
  margin-bottom: 4px;
  font-weight: bold;
}

.metric-detail {
  font-size: 7px;
  color: #333;
  margin-top: 4px;
}

.bar-container {
  height: 12px;
  background: #fff;
  border: 2px solid;
  border-color: #000 #fff #fff #000;
  overflow: hidden;
}

.bar {
  height: 100%;
  transition: width 0.3s;
}

/* Chart Container */
.chart-container {
  margin: 8px;
  padding: 8px;
  background: #a0a0a0;
}

.chart-header {
  font-size: 8px;
  color: #000;
  margin-bottom: 8px;
  font-weight: bold;
}

.performance-chart {
  width: 100%;
  height: 150px;
  background: #000;
  border: 2px solid;
  border-color: #000 #fff #fff #000;
}

.chart-legend {
  display: flex;
  gap: 16px;
  margin-top: 8px;
  font-size: 7px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.legend-color {
  width: 16px;
  height: 8px;
  display: inline-block;
  border: 1px solid #000;
}
</style>

<template>
  <div class="amiga-sysmon">
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

    <!-- Tab Content -->
    <div class="tab-content">
      <!-- Overview Tab -->
      <div v-if="activeTab === 'overview'" class="tab-panel">
        <div class="metric-grid">
          <!-- CPU Usage -->
          <div class="metric-box">
            <div class="metric-header">CPU Usage</div>
            <div class="metric-value" :class="getStatusClass(currentMetrics.cpu)">
              {{ currentMetrics.cpu.toFixed(1) }}%
            </div>
            <div class="bar-chart">
              <div
                class="bar"
                :class="getStatusClass(currentMetrics.cpu)"
                :style="{ width: currentMetrics.cpu + '%' }"
              ></div>
            </div>
          </div>

          <!-- Memory Usage -->
          <div class="metric-box">
            <div class="metric-header">Memory Usage</div>
            <div class="metric-value" :class="getStatusClass(currentMetrics.memory.percentage)">
              {{ currentMetrics.memory.percentage.toFixed(1) }}%
            </div>
            <div class="bar-chart">
              <div
                class="bar"
                :class="getStatusClass(currentMetrics.memory.percentage)"
                :style="{ width: currentMetrics.memory.percentage + '%' }"
              ></div>
            </div>
            <div class="metric-detail">
              {{ formatBytes(currentMetrics.memory.used) }} / {{ formatBytes(currentMetrics.memory.total) }}
            </div>
          </div>

          <!-- Storage Usage -->
          <div class="metric-box">
            <div class="metric-header">Storage (LocalStorage)</div>
            <div class="metric-value" :class="getStatusClass(currentMetrics.storage.percentage)">
              {{ currentMetrics.storage.percentage.toFixed(1) }}%
            </div>
            <div class="bar-chart">
              <div
                class="bar"
                :class="getStatusClass(currentMetrics.storage.percentage)"
                :style="{ width: currentMetrics.storage.percentage + '%' }"
              ></div>
            </div>
            <div class="metric-detail">
              {{ formatBytes(currentMetrics.storage.used) }} / {{ formatBytes(currentMetrics.storage.total) }}
            </div>
          </div>

          <!-- FPS -->
          <div class="metric-box">
            <div class="metric-header">Display FPS</div>
            <div class="metric-value" :class="getFpsStatusClass(currentMetrics.fps)">
              {{ currentMetrics.fps }}
            </div>
            <div class="bar-chart">
              <div
                class="bar"
                :class="getFpsStatusClass(currentMetrics.fps)"
                :style="{ width: (currentMetrics.fps / 60) * 100 + '%' }"
              ></div>
            </div>
          </div>
        </div>

        <!-- Performance Graph -->
        <div class="graph-container">
          <div class="graph-header">Performance History (60s)</div>
          <div class="graph">
            <svg viewBox="0 0 600 120" class="graph-svg">
              <!-- Grid lines -->
              <line v-for="i in 5" :key="'h' + i" :x1="0" :y1="i * 24" :x2="600" :y2="i * 24" stroke="#666" stroke-width="0.5" />
              <line v-for="i in 13" :key="'v' + i" :x1="i * 50" :y1="0" :x2="i * 50" :y2="120" stroke="#666" stroke-width="0.5" />

              <!-- CPU Line -->
              <polyline
                :points="getGraphPoints(history, 'cpu')"
                fill="none"
                stroke="#ff6600"
                stroke-width="2"
              />

              <!-- Memory Line -->
              <polyline
                :points="getGraphPoints(history, 'memory')"
                fill="none"
                stroke="#0055aa"
                stroke-width="2"
              />
            </svg>
          </div>
          <div class="graph-legend">
            <span class="legend-item"><span class="legend-color cpu"></span> CPU</span>
            <span class="legend-item"><span class="legend-color memory"></span> Memory</span>
          </div>
        </div>
      </div>

      <!-- Processes Tab -->
      <div v-if="activeTab === 'processes'" class="tab-panel">
        <div class="process-header">
          <div class="process-count">{{ processes.length }} processes running</div>
          <button class="amiga-button small" @click="refreshProcesses">Refresh</button>
        </div>
        <div class="process-table">
          <div class="process-row header">
            <div class="col-name">Name</div>
            <div class="col-type">Type</div>
            <div class="col-cpu">CPU</div>
            <div class="col-memory">Memory</div>
            <div class="col-time">Uptime</div>
            <div class="col-action">Action</div>
          </div>
          <div
            v-for="process in processes"
            :key="process.id"
            class="process-row"
          >
            <div class="col-name">{{ process.name }}</div>
            <div class="col-type">{{ process.type }}</div>
            <div class="col-cpu">{{ process.cpu.toFixed(1) }}%</div>
            <div class="col-memory">{{ formatBytes(process.memory) }}</div>
            <div class="col-time">{{ formatUptime(process.startTime) }}</div>
            <div class="col-action">
              <button class="amiga-button tiny" @click="killProcess(process.id)">Kill</button>
            </div>
          </div>
        </div>
      </div>

      <!-- System Info Tab -->
      <div v-if="activeTab === 'sysinfo'" class="tab-panel">
        <div class="info-grid">
          <div class="info-section">
            <div class="info-header">System Information</div>
            <div class="info-row">
              <span class="info-label">OS Version:</span>
              <span class="info-value">Workbench 3.1 (WebOS 2.0)</span>
            </div>
            <div class="info-row">
              <span class="info-label">Kickstart:</span>
              <span class="info-value">40.68</span>
            </div>
            <div class="info-row">
              <span class="info-label">Platform:</span>
              <span class="info-value">{{ systemInfo.os }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">CPU Cores:</span>
              <span class="info-value">{{ systemInfo.cores }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Uptime:</span>
              <span class="info-value">{{ serverUptime }}</span>
            </div>
          </div>

          <div class="info-section">
            <div class="info-header">Browser Information</div>
            <div class="info-row">
              <span class="info-label">Browser:</span>
              <span class="info-value">{{ systemInfo.browser }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Language:</span>
              <span class="info-value">{{ systemInfo.language }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Online:</span>
              <span class="info-value">{{ systemInfo.online ? 'Yes' : 'No' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Cookies:</span>
              <span class="info-value">{{ systemInfo.cookiesEnabled ? 'Enabled' : 'Disabled' }}</span>
            </div>
          </div>

          <div class="info-section">
            <div class="info-header">Display</div>
            <div class="info-row">
              <span class="info-label">Screen:</span>
              <span class="info-value">{{ systemInfo.screen.width }}x{{ systemInfo.screen.height }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Viewport:</span>
              <span class="info-value">{{ systemInfo.viewport.width }}x{{ systemInfo.viewport.height }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Color Depth:</span>
              <span class="info-value">{{ systemInfo.screen.colorDepth }} bits</span>
            </div>
          </div>

          <div class="info-section">
            <div class="info-header">Network Statistics</div>
            <div class="info-row">
              <span class="info-label">API Calls:</span>
              <span class="info-value">{{ apiCallCount }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Avg Response:</span>
              <span class="info-value">{{ avgResponseTime.toFixed(2) }}ms</span>
            </div>
            <div class="info-row">
              <span class="info-label">Download:</span>
              <span class="info-value">{{ currentMetrics.network.downloadSpeed.toFixed(2) }} kbps</span>
            </div>
            <div class="info-row">
              <span class="info-label">Upload:</span>
              <span class="info-value">{{ currentMetrics.network.uploadSpeed.toFixed(2) }} kbps</span>
            </div>
          </div>
        </div>

        <div class="action-buttons">
          <button class="amiga-button" @click="copySystemInfo">Copy to Clipboard</button>
          <button class="amiga-button" @click="exportJson">Export JSON</button>
          <button class="amiga-button" @click="exportCsv">Export CSV</button>
        </div>
      </div>

      <!-- Storage Tab -->
      <div v-if="activeTab === 'storage'" class="tab-panel">
        <div class="storage-header">
          <div class="storage-title">Disk Drives</div>
        </div>
        <div class="storage-list">
          <div v-for="disk in diskInfo" :key="disk.id" class="storage-item">
            <div class="storage-name">{{ disk.name }} ({{ disk.id }})</div>
            <div class="storage-bar">
              <div
                class="storage-fill"
                :class="getStorageStatusClass(disk.usedPercent)"
                :style="{ width: disk.usedPercent + '%' }"
              ></div>
            </div>
            <div class="storage-stats">
              <span>{{ disk.used }} / {{ disk.capacity }}</span>
              <span>{{ disk.usedPercent.toFixed(1) }}% used</span>
            </div>
          </div>
        </div>

        <div class="storage-header" style="margin-top: 20px;">
          <div class="storage-title">Local Storage</div>
        </div>
        <div class="storage-list">
          <div class="storage-item">
            <div class="storage-name">Browser Local Storage</div>
            <div class="storage-bar">
              <div
                class="storage-fill"
                :class="getStorageStatusClass(currentMetrics.storage.percentage)"
                :style="{ width: currentMetrics.storage.percentage + '%' }"
              ></div>
            </div>
            <div class="storage-stats">
              <span>{{ formatBytes(currentMetrics.storage.used) }} / {{ formatBytes(currentMetrics.storage.total) }}</span>
              <span>{{ currentMetrics.storage.percentage.toFixed(1) }}% used</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { performanceMonitor, type PerformanceMetrics, type ProcessInfo } from '../../utils/performance-monitor';

interface Tab {
  id: string;
  name: string;
}

const tabs: Tab[] = [
  { id: 'overview', name: 'Overview' },
  { id: 'processes', name: 'Processes' },
  { id: 'sysinfo', name: 'System Info' },
  { id: 'storage', name: 'Storage' },
];

const activeTab = ref('overview');
const currentMetrics = ref<PerformanceMetrics>({
  timestamp: Date.now(),
  cpu: 0,
  memory: { used: 0, total: 0, percentage: 0 },
  network: { uploadSpeed: 0, downloadSpeed: 0, activeConnections: 0 },
  storage: { used: 0, total: 0, percentage: 0 },
  fps: 60,
});

const history = ref<PerformanceMetrics[]>([]);
const processes = ref<ProcessInfo[]>([]);
const systemInfo = ref(performanceMonitor.getSystemInfo());
const apiCallCount = ref(0);
const avgResponseTime = ref(0);
const serverUptime = ref('0h 0m 0s');
const diskInfo = ref<any[]>([]);

let updateInterval: number | undefined;

onMounted(() => {
  // Initial data collection
  updateMetrics();
  fetchServerStatus();

  // Update every second
  updateInterval = window.setInterval(() => {
    updateMetrics();
  }, 1000);

  // Fetch server status every 5 seconds
  setInterval(fetchServerStatus, 5000);
});

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval);
  }
});

const updateMetrics = () => {
  currentMetrics.value = performanceMonitor.collectMetrics();
  history.value = performanceMonitor.getHistory();
  processes.value = performanceMonitor.getProcesses();
  apiCallCount.value = performanceMonitor.getApiCallCount();
  avgResponseTime.value = performanceMonitor.getAverageApiResponseTime();
  systemInfo.value = performanceMonitor.getSystemInfo();
};

const fetchServerStatus = async () => {
  try {
    const startTime = performance.now();
    const response = await fetch('/api/system/performance');
    const endTime = performance.now();

    performanceMonitor.trackApiCall(endTime - startTime);

    if (response.ok) {
      const data = await response.json();
      if (data.uptime) {
        serverUptime.value = formatServerUptime(data.uptime);
      }
      if (data.disks) {
        diskInfo.value = data.disks;
      }
    }
  } catch (error) {
    console.error('Failed to fetch server status:', error);
  }
};

const refreshProcesses = () => {
  processes.value = performanceMonitor.getProcesses();
};

const killProcess = (id: string) => {
  if (confirm('Kill this process?')) {
    performanceMonitor.unregisterProcess(id);
    // In a real implementation, this would emit an event to close the window
    console.log('Process killed:', id);
    refreshProcesses();
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

const formatServerUptime = (uptimeSeconds: number): string => {
  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = Math.floor(uptimeSeconds % 60);
  return `${hours}h ${minutes}m ${seconds}s`;
};

const getStatusClass = (value: number): string => {
  if (value >= 80) return 'critical';
  if (value >= 60) return 'warning';
  return 'good';
};

const getFpsStatusClass = (fps: number): string => {
  if (fps >= 55) return 'good';
  if (fps >= 30) return 'warning';
  return 'critical';
};

const getStorageStatusClass = (percentage: number): string => {
  if (percentage >= 90) return 'critical';
  if (percentage >= 70) return 'warning';
  return 'good';
};

const getGraphPoints = (metrics: PerformanceMetrics[], type: 'cpu' | 'memory'): string => {
  if (metrics.length === 0) return '';

  const maxPoints = 60;
  const data = metrics.slice(-maxPoints);
  const width = 600;
  const height = 120;
  const stepX = width / (maxPoints - 1);

  return data.map((m, i) => {
    const x = i * stepX;
    const value = type === 'cpu' ? m.cpu : m.memory.percentage;
    const y = height - (value / 100) * height;
    return `${x},${y}`;
  }).join(' ');
};

const copySystemInfo = () => {
  const info = `WebOS System Monitor Report
Generated: ${new Date().toLocaleString()}

System Information:
- OS: Workbench 3.1 (WebOS 2.0)
- Platform: ${systemInfo.value.os}
- Browser: ${systemInfo.value.browser}
- CPU Cores: ${systemInfo.value.cores}
- Language: ${systemInfo.value.language}

Performance:
- CPU Usage: ${currentMetrics.value.cpu.toFixed(1)}%
- Memory Usage: ${currentMetrics.value.memory.percentage.toFixed(1)}% (${formatBytes(currentMetrics.value.memory.used)} / ${formatBytes(currentMetrics.value.memory.total)})
- Storage: ${currentMetrics.value.storage.percentage.toFixed(1)}%
- FPS: ${currentMetrics.value.fps}

Display:
- Screen: ${systemInfo.value.screen.width}x${systemInfo.value.screen.height}
- Color Depth: ${systemInfo.value.screen.colorDepth} bits

Network:
- API Calls: ${apiCallCount.value}
- Avg Response: ${avgResponseTime.value.toFixed(2)}ms
`;

  navigator.clipboard.writeText(info).then(() => {
    alert('System information copied to clipboard!');
  }).catch(() => {
    alert('Failed to copy to clipboard');
  });
};

const exportJson = () => {
  const json = performanceMonitor.exportToJson();
  downloadFile(json, 'webos-performance-data.json', 'application/json');
};

const exportCsv = () => {
  const csv = performanceMonitor.exportToCsv();
  downloadFile(csv, 'webos-performance-data.csv', 'text/csv');
};

const downloadFile = (content: string, filename: string, type: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
</script>

<style scoped>
.amiga-sysmon {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #a0a0a0;
  font-family: 'Press Start 2P', monospace;
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

/* Tab Content */
.tab-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.tab-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Metric Grid */
.metric-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 12px;
}

.metric-box {
  background: #888;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 10px;
}

.metric-header {
  font-size: 8px;
  color: #fff;
  margin-bottom: 8px;
  text-transform: uppercase;
}

.metric-value {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 8px;
}

.metric-value.good { color: #00ff00; }
.metric-value.warning { color: #ffaa00; }
.metric-value.critical { color: #ff0000; }

.metric-detail {
  font-size: 7px;
  color: #ccc;
  margin-top: 4px;
}

.bar-chart {
  height: 16px;
  background: #000;
  border: 1px solid #fff;
  margin-top: 4px;
}

.bar {
  height: 100%;
  transition: width 0.3s ease;
}

.bar.good { background: #00ff00; }
.bar.warning { background: #ffaa00; }
.bar.critical { background: #ff0000; }

/* Graph */
.graph-container {
  background: #888;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 10px;
}

.graph-header {
  font-size: 8px;
  color: #fff;
  margin-bottom: 8px;
}

.graph {
  background: #000;
  border: 1px solid #fff;
  padding: 4px;
  min-height: 130px;
}

.graph-svg {
  width: 100%;
  height: 120px;
}

.graph-legend {
  display: flex;
  gap: 20px;
  margin-top: 8px;
  font-size: 7px;
  color: #fff;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.legend-color {
  width: 20px;
  height: 8px;
  border: 1px solid #fff;
}

.legend-color.cpu { background: #ff6600; }
.legend-color.memory { background: #0055aa; }

/* Process Table */
.process-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.process-count {
  font-size: 8px;
  color: #000;
}

.process-table {
  background: #888;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  font-size: 7px;
  max-height: 400px;
  overflow-y: auto;
}

.process-row {
  display: grid;
  grid-template-columns: 2fr 1fr 0.7fr 1fr 1fr 0.8fr;
  gap: 8px;
  padding: 6px 10px;
  border-bottom: 1px solid #666;
  align-items: center;
}

.process-row.header {
  background: #0055aa;
  color: #fff;
  font-weight: bold;
  position: sticky;
  top: 0;
}

.process-row:not(.header) {
  background: #a0a0a0;
  color: #000;
}

.process-row:not(.header):hover {
  background: #b0b0b0;
}

/* Info Grid */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
}

.info-section {
  background: #888;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 10px;
}

.info-header {
  font-size: 8px;
  color: #fff;
  margin-bottom: 8px;
  text-transform: uppercase;
  border-bottom: 1px solid #666;
  padding-bottom: 4px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  font-size: 7px;
  border-bottom: 1px solid #666;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  color: #ccc;
}

.info-value {
  color: #00ff00;
  font-weight: bold;
}

/* Storage */
.storage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.storage-title {
  font-size: 9px;
  color: #000;
  font-weight: bold;
}

.storage-list {
  background: #888;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 10px;
}

.storage-item {
  padding: 8px;
  background: #a0a0a0;
  border: 1px solid #666;
  margin-bottom: 8px;
}

.storage-item:last-child {
  margin-bottom: 0;
}

.storage-name {
  font-size: 8px;
  color: #000;
  margin-bottom: 6px;
  font-weight: bold;
}

.storage-bar {
  height: 12px;
  background: #000;
  border: 1px solid #fff;
  margin-bottom: 4px;
}

.storage-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.storage-stats {
  display: flex;
  justify-content: space-between;
  font-size: 6px;
  color: #000;
}

/* Buttons */
.action-buttons {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  flex-wrap: wrap;
}

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

/* Scrollbar Styling */
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

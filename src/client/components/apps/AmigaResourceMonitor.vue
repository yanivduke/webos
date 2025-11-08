<template>
  <div class="resource-monitor">
    <!-- Toolbar -->
    <div class="monitor-toolbar">
      <div class="toolbar-left">
        <select v-model="refreshInterval" class="refresh-select" @change="handleIntervalChange">
          <option :value="1000">1s</option>
          <option :value="5000">5s</option>
          <option :value="10000">10s</option>
          <option :value="30000">30s</option>
          <option :value="60000">60s</option>
          <option :value="0">Manual</option>
        </select>
        <button class="toolbar-button" @click="handleRefresh" :disabled="isRefreshing">
          {{ isRefreshing ? 'Refreshing...' : 'Refresh' }}
        </button>
      </div>
      <div class="toolbar-right">
        <button class="toolbar-button" @click="exportReport">Export Report</button>
        <button class="toolbar-button" @click="clearData">Clear History</button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="monitor-tabs">
      <div
        v-for="tab in tabs"
        :key="tab.id"
        class="tab"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </div>
    </div>

    <!-- Tab Content -->
    <div class="tab-content">
      <!-- Overview Tab -->
      <div v-show="activeTab === 'overview'" class="overview-tab">
        <div class="gauges-grid">
          <div class="gauge-card">
            <div class="gauge-title">CPU Usage</div>
            <div class="gauge-container">
              <svg viewBox="0 0 100 100" class="gauge">
                <circle cx="50" cy="50" r="45" class="gauge-bg" />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  class="gauge-fill"
                  :class="getGaugeClass(cpuUsage)"
                  :stroke-dasharray="`${cpuUsage * 2.827} 282.7`"
                />
                <text x="50" y="50" class="gauge-value">{{ cpuUsage.toFixed(1) }}%</text>
              </svg>
            </div>
            <div class="gauge-subtitle">{{ cpuInfo }}</div>
          </div>

          <div class="gauge-card">
            <div class="gauge-title">Memory Usage</div>
            <div class="gauge-container">
              <svg viewBox="0 0 100 100" class="gauge">
                <circle cx="50" cy="50" r="45" class="gauge-bg" />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  class="gauge-fill"
                  :class="getGaugeClass(memoryUsage)"
                  :stroke-dasharray="`${memoryUsage * 2.827} 282.7`"
                />
                <text x="50" y="50" class="gauge-value">{{ memoryUsage.toFixed(1) }}%</text>
              </svg>
            </div>
            <div class="gauge-subtitle">{{ memoryInfo }}</div>
          </div>

          <div class="gauge-card">
            <div class="gauge-title">Storage Usage</div>
            <div class="gauge-container">
              <svg viewBox="0 0 100 100" class="gauge">
                <circle cx="50" cy="50" r="45" class="gauge-bg" />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  class="gauge-fill"
                  :class="getGaugeClass(storageUsage)"
                  :stroke-dasharray="`${storageUsage * 2.827} 282.7`"
                />
                <text x="50" y="50" class="gauge-value">{{ storageUsage.toFixed(1) }}%</text>
              </svg>
            </div>
            <div class="gauge-subtitle">{{ storageInfo }}</div>
          </div>

          <div class="gauge-card">
            <div class="gauge-title">Network Activity</div>
            <div class="gauge-container">
              <svg viewBox="0 0 100 100" class="gauge">
                <circle cx="50" cy="50" r="45" class="gauge-bg" />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  class="gauge-fill gauge-normal"
                  :stroke-dasharray="`${networkActivity * 2.827} 282.7`"
                />
                <text x="50" y="50" class="gauge-value">{{ networkActivity.toFixed(0) }}%</text>
              </svg>
            </div>
            <div class="gauge-subtitle">{{ networkInfo }}</div>
          </div>
        </div>

        <!-- Mini charts -->
        <div class="mini-charts">
          <div class="mini-chart-card">
            <div class="mini-chart-title">CPU History (60s)</div>
            <AmigaLineChart
              :series="[{ label: 'CPU', data: cpuHistory, color: '#00ff00' }]"
              :width="250"
              :height="120"
              :show-legend="false"
              :show-x-labels="false"
              :y-axis-formatter="formatPercent"
            />
          </div>

          <div class="mini-chart-card">
            <div class="mini-chart-title">Memory History (60s)</div>
            <AmigaLineChart
              :series="[{ label: 'Memory', data: memoryHistory, color: '#ff6600' }]"
              :width="250"
              :height="120"
              :show-legend="false"
              :show-x-labels="false"
              :y-axis-formatter="formatPercent"
            />
          </div>
        </div>

        <!-- Alerts -->
        <div v-if="alerts.length > 0" class="alerts-panel">
          <div class="alerts-header">
            <span>⚠ System Alerts ({{ alerts.length }})</span>
            <button class="clear-alerts-btn" @click="clearAlerts">Clear All</button>
          </div>
          <div class="alerts-list">
            <div
              v-for="alert in alerts"
              :key="alert.id"
              class="alert-item"
              :class="'alert-' + alert.severity"
            >
              <div class="alert-message">{{ alert.message }}</div>
              <div class="alert-time">{{ formatAlertTime(alert.timestamp) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Processes Tab -->
      <div v-show="activeTab === 'processes'" class="processes-tab">
        <div class="processes-toolbar">
          <select v-model="processFilter" class="filter-select">
            <option value="all">All Processes</option>
            <option value="running">Running</option>
            <option value="sleeping">Sleeping</option>
            <option value="stopped">Stopped</option>
          </select>
          <input
            v-model="processSearch"
            type="text"
            placeholder="Search processes..."
            class="search-input"
          />
        </div>

        <div class="processes-table">
          <table>
            <thead>
              <tr>
                <th @click="sortProcesses('pid')">
                  PID {{ sortColumn === 'pid' ? (sortDesc ? '▼' : '▲') : '' }}
                </th>
                <th @click="sortProcesses('name')">
                  Name {{ sortColumn === 'name' ? (sortDesc ? '▼' : '▲') : '' }}
                </th>
                <th @click="sortProcesses('cpu')">
                  CPU % {{ sortColumn === 'cpu' ? (sortDesc ? '▼' : '▲') : '' }}
                </th>
                <th @click="sortProcesses('memory')">
                  Memory {{ sortColumn === 'memory' ? (sortDesc ? '▼' : '▲') : '' }}
                </th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="process in filteredProcesses" :key="process.pid">
                <td>{{ process.pid }}</td>
                <td class="process-name">{{ process.name }}</td>
                <td>{{ process.cpu.toFixed(1) }}%</td>
                <td>{{ formatBytes(process.memory) }}</td>
                <td>
                  <span class="status-badge" :class="'status-' + process.status">
                    {{ process.status }}
                  </span>
                </td>
                <td>
                  <button class="kill-button" @click="killProcess(process.pid)">Kill</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Storage Tab -->
      <div v-show="activeTab === 'storage'" class="storage-tab">
        <div class="storage-toolbar">
          <select v-model="selectedDisk" class="disk-select">
            <option v-for="disk in disks" :key="disk.id" :value="disk.id">
              {{ disk.name }} ({{ disk.id }})
            </option>
          </select>
          <button class="toolbar-button" @click="analyzeDisk" :disabled="isAnalyzing">
            {{ isAnalyzing ? 'Analyzing...' : 'Analyze Disk' }}
          </button>
        </div>

        <div v-if="diskAnalysis" class="storage-content">
          <!-- Disk usage pie chart -->
          <div class="storage-chart">
            <AmigaPieChart
              :data="diskUsageData"
              :width="300"
              :height="300"
              :donut-mode="true"
              center-text="Usage"
              :value-formatter="formatBytes"
            />
          </div>

          <!-- File type breakdown -->
          <div class="file-types-section">
            <div class="section-title">File Types</div>
            <div class="file-types-list">
              <div
                v-for="fileType in diskAnalysis.fileTypes.slice(0, 10)"
                :key="fileType.extension"
                class="file-type-item"
              >
                <div class="file-type-label">.{{ fileType.extension }}</div>
                <div class="file-type-bar">
                  <div
                    class="file-type-fill"
                    :style="{
                      width: fileType.percentage + '%',
                      background: getFileTypeColor(fileType.extension)
                    }"
                  ></div>
                </div>
                <div class="file-type-size">{{ formatBytes(fileType.totalSize) }}</div>
              </div>
            </div>
          </div>

          <!-- Largest files -->
          <div class="largest-section">
            <div class="section-title">Top 10 Largest Files</div>
            <div class="largest-list">
              <div
                v-for="(file, index) in diskAnalysis.largestFiles.slice(0, 10)"
                :key="index"
                class="largest-item"
              >
                <span class="item-rank">{{ index + 1 }}.</span>
                <span class="item-name">{{ file.name }}</span>
                <span class="item-size">{{ formatBytes(file.size) }}</span>
              </div>
            </div>
          </div>

          <!-- Tree map -->
          <div class="treemap-section">
            <div class="section-title">Disk Space Visualization</div>
            <AmigaTreeMap
              :data="diskAnalysis.treeMap"
              :width="700"
              :height="400"
            />
          </div>
        </div>
      </div>

      <!-- Optimization Tab -->
      <div v-show="activeTab === 'optimization'" class="optimization-tab">
        <div class="optimization-toolbar">
          <button class="toolbar-button" @click="generateSuggestions" :disabled="isGenerating">
            {{ isGenerating ? 'Analyzing...' : 'Refresh Suggestions' }}
          </button>
          <button
            class="toolbar-button toolbar-button-primary"
            @click="cleanupAll"
            :disabled="autoFixSuggestions.length === 0"
          >
            Clean All ({{ autoFixSuggestions.length }})
          </button>
        </div>

        <div v-if="optimizationReport" class="optimization-summary">
          <div class="summary-card">
            <div class="summary-label">Total Suggestions</div>
            <div class="summary-value">{{ optimizationReport.totalSuggestions }}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Potential Savings</div>
            <div class="summary-value">{{ formatBytes(optimizationReport.totalPotentialSavings) }}</div>
          </div>
        </div>

        <div class="suggestions-list">
          <div
            v-for="suggestion in suggestions"
            :key="suggestion.id"
            class="suggestion-card"
            :class="'severity-' + suggestion.severity"
          >
            <div class="suggestion-header">
              <div class="suggestion-icon">{{ getSuggestionIcon(suggestion.type) }}</div>
              <div class="suggestion-title">{{ suggestion.title }}</div>
              <div class="suggestion-savings">{{ formatBytes(suggestion.potentialSavings) }}</div>
            </div>
            <div class="suggestion-description">{{ suggestion.description }}</div>
            <div class="suggestion-actions">
              <button class="action-button" @click="executeSuggestion(suggestion.id)">
                {{ suggestion.action.label }}
              </button>
              <button class="action-button" @click="ignoreSuggestion(suggestion.id)">
                Ignore
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- History Tab -->
      <div v-show="activeTab === 'history'" class="history-tab">
        <div class="history-toolbar">
          <select v-model="historyDuration" class="duration-select">
            <option :value="60">Last Hour</option>
            <option :value="360">Last 6 Hours</option>
            <option :value="1440">Last Day</option>
            <option :value="10080">Last Week</option>
          </select>
          <button class="toolbar-button" @click="exportHistory">Export CSV</button>
        </div>

        <div class="history-charts">
          <div class="history-chart-card">
            <div class="chart-title">CPU Usage History</div>
            <AmigaLineChart
              :series="[{ label: 'CPU %', data: cpuLongHistory, color: '#00ff00' }]"
              :width="680"
              :height="200"
              :fill-area="true"
              :x-axis-formatter="formatHistoryTime"
              :y-axis-formatter="formatPercent"
            />
          </div>

          <div class="history-chart-card">
            <div class="chart-title">Memory Usage History</div>
            <AmigaLineChart
              :series="[{ label: 'Memory %', data: memoryLongHistory, color: '#ff6600' }]"
              :width="680"
              :height="200"
              :fill-area="true"
              :x-axis-formatter="formatHistoryTime"
              :y-axis-formatter="formatPercent"
            />
          </div>

          <div class="history-chart-card">
            <div class="chart-title">Disk Usage Trend</div>
            <AmigaLineChart
              :series="[{ label: 'Disk %', data: diskLongHistory, color: '#0099ff' }]"
              :width="680"
              :height="200"
              :fill-area="true"
              :x-axis-formatter="formatHistoryTime"
              :y-axis-formatter="formatPercent"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Cleanup Dialog -->
    <AmigaCleanupDialog
      :visible="cleanupDialogVisible"
      :title="cleanupDialogTitle"
      :description="cleanupDialogDescription"
      :items="cleanupDialogItems"
      :total-size="cleanupDialogSize"
      @confirm="handleCleanupConfirm"
      @cancel="cleanupDialogVisible = false"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import AmigaLineChart from '../visualizations/AmigaLineChart.vue';
import AmigaPieChart from '../visualizations/AmigaPieChart.vue';
import AmigaTreeMap from '../visualizations/AmigaTreeMap.vue';
import AmigaCleanupDialog from '../dialogs/AmigaCleanupDialog.vue';
import { resourceMonitor } from '../../utils/resource-monitor';
import { diskAnalyzer, formatBytes, getFileTypeColor, type DiskItem } from '../../utils/disk-analyzer';
import { optimizationEngine, type OptimizationSuggestion, type OptimizationReport } from '../../utils/optimization-suggestions';

// State
const activeTab = ref('overview');
const refreshInterval = ref(1000);
const isRefreshing = ref(false);
const isAnalyzing = ref(false);
const isGenerating = ref(false);

// Resources
const cpuUsage = ref(0);
const cpuInfo = ref('');
const memoryUsage = ref(0);
const memoryInfo = ref('');
const storageUsage = ref(0);
const storageInfo = ref('');
const networkActivity = ref(0);
const networkInfo = ref('');

// History
const cpuHistory = ref<Array<{ x: number; y: number }>>([]);
const memoryHistory = ref<Array<{ x: number; y: number }>>([]);
const historyDuration = ref(60);

// Alerts
const alerts = ref<any[]>([]);

// Processes
const processes = ref<any[]>([]);
const processFilter = ref('all');
const processSearch = ref('');
const sortColumn = ref('cpu');
const sortDesc = ref(true);

// Storage
const disks = ref<any[]>([]);
const selectedDisk = ref('dh0');
const diskAnalysis = ref<any>(null);

// Optimization
const suggestions = ref<OptimizationSuggestion[]>([]);
const optimizationReport = ref<OptimizationReport | null>(null);

// Cleanup dialog
const cleanupDialogVisible = ref(false);
const cleanupDialogTitle = ref('');
const cleanupDialogDescription = ref('');
const cleanupDialogItems = ref<string[]>([]);
const cleanupDialogSize = ref(0);
let pendingSuggestionId: string | null = null;

// Tabs
const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'processes', label: 'Processes' },
  { id: 'storage', label: 'Storage' },
  { id: 'optimization', label: 'Optimization' },
  { id: 'history', label: 'History' }
];

// Computed
const filteredProcesses = computed(() => {
  let filtered = processes.value;

  // Filter by status
  if (processFilter.value !== 'all') {
    filtered = filtered.filter(p => p.status === processFilter.value);
  }

  // Filter by search
  if (processSearch.value) {
    const search = processSearch.value.toLowerCase();
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(search) ||
      p.pid.toString().includes(search)
    );
  }

  // Sort
  filtered.sort((a, b) => {
    const aVal = a[sortColumn.value];
    const bVal = b[sortColumn.value];
    return sortDesc.value ? (bVal > aVal ? 1 : -1) : (aVal > bVal ? 1 : -1);
  });

  return filtered;
});

const diskUsageData = computed(() => {
  if (!diskAnalysis.value) return [];

  return [
    { label: 'Used', value: diskAnalysis.value.totalSize, color: '#ff6600' },
    {
      label: 'Free',
      value: Math.max(0, 1024 * 1024 * 1024 - diskAnalysis.value.totalSize),
      color: '#00ff00'
    }
  ];
});

const autoFixSuggestions = computed(() => {
  return suggestions.value.filter(s => s.autoFixable);
});

const cpuLongHistory = computed(() => {
  const history = resourceMonitor.getResourceHistory(historyDuration.value);
  return history.map(h => ({ x: h.timestamp, y: h.cpu }));
});

const memoryLongHistory = computed(() => {
  const history = resourceMonitor.getResourceHistory(historyDuration.value);
  return history.map(h => ({ x: h.timestamp, y: h.memory }));
});

const diskLongHistory = computed(() => {
  const history = resourceMonitor.getResourceHistory(historyDuration.value);
  return history.map(h => ({ x: h.timestamp, y: h.disk }));
});

// Lifecycle
onMounted(async () => {
  // Start monitoring
  resourceMonitor.start();
  resourceMonitor.setInterval(refreshInterval.value);

  // Subscribe to updates
  resourceMonitor.subscribe(handleResourceUpdate);
  resourceMonitor.subscribeToAlerts(handleAlert);

  // Initial load
  await handleRefresh();
  await generateSuggestions();
});

onUnmounted(() => {
  resourceMonitor.stop();
});

// Methods
async function handleRefresh(): Promise<void> {
  isRefreshing.value = true;

  try {
    const resources = await resourceMonitor.getCurrentResources();

    // Update CPU
    cpuUsage.value = resources.cpu.usage;
    cpuInfo.value = `${resources.cpu.cores} cores @ ${resources.cpu.speed} MHz`;

    // Update Memory
    memoryUsage.value = resources.memory.percentage;
    memoryInfo.value = `${formatBytes(resources.memory.used)} / ${formatBytes(resources.memory.total)}`;

    // Update Storage
    if (resources.disks.length > 0) {
      const avgUsage = resources.disks.reduce((sum, d) => sum + d.percentage, 0) / resources.disks.length;
      storageUsage.value = avgUsage;
      const totalUsed = resources.disks.reduce((sum, d) => sum + d.used, 0);
      const totalSpace = resources.disks.reduce((sum, d) => sum + d.total, 0);
      storageInfo.value = `${formatBytes(totalUsed)} / ${formatBytes(totalSpace)}`;
      disks.value = resources.disks;
    }

    // Update Network
    const maxSpeed = 1024 * 1024; // 1 MB/s
    networkActivity.value = Math.min(100, (resources.network.downloadSpeed / maxSpeed) * 100);
    networkInfo.value = `↓ ${formatBytes(resources.network.downloadSpeed)}/s ↑ ${formatBytes(resources.network.uploadSpeed)}/s`;

    // Update processes
    processes.value = resources.processes;

    // Update history
    updateHistory();
  } catch (error) {
    console.error('Failed to refresh resources:', error);
  } finally {
    isRefreshing.value = false;
  }
}

function handleResourceUpdate(resources: any): void {
  cpuUsage.value = resources.cpu.usage;
  memoryUsage.value = resources.memory.percentage;
  processes.value = resources.processes;
  updateHistory();
}

function handleAlert(alert: any): void {
  alerts.value.unshift(alert);
  if (alerts.value.length > 10) {
    alerts.value = alerts.value.slice(0, 10);
  }
}

function updateHistory(): void {
  const now = Date.now();

  cpuHistory.value.push({ x: now, y: cpuUsage.value });
  memoryHistory.value.push({ x: now, y: memoryUsage.value });

  // Keep last 60 points
  if (cpuHistory.value.length > 60) {
    cpuHistory.value = cpuHistory.value.slice(-60);
    memoryHistory.value = memoryHistory.value.slice(-60);
  }
}

function handleIntervalChange(): void {
  if (refreshInterval.value > 0) {
    resourceMonitor.setInterval(refreshInterval.value);
    resourceMonitor.start();
  } else {
    resourceMonitor.stop();
  }
}

function getGaugeClass(value: number): string {
  if (value >= 90) return 'gauge-critical';
  if (value >= 70) return 'gauge-warning';
  return 'gauge-normal';
}

function clearAlerts(): void {
  alerts.value = [];
  resourceMonitor.clearAllAlerts();
}

function sortProcesses(column: string): void {
  if (sortColumn.value === column) {
    sortDesc.value = !sortDesc.value;
  } else {
    sortColumn.value = column;
    sortDesc.value = true;
  }
}

async function killProcess(pid: number): Promise<void> {
  if (!confirm(`Kill process ${pid}?`)) return;

  const success = await resourceMonitor.killProcess(pid);
  if (success) {
    await handleRefresh();
  } else {
    alert('Failed to kill process');
  }
}

async function analyzeDisk(): Promise<void> {
  isAnalyzing.value = true;

  try {
    diskAnalysis.value = await diskAnalyzer.analyzeDisk(selectedDisk.value, false);
  } catch (error) {
    console.error('Disk analysis failed:', error);
    alert('Failed to analyze disk');
  } finally {
    isAnalyzing.value = false;
  }
}

async function generateSuggestions(): Promise<void> {
  isGenerating.value = true;

  try {
    optimizationReport.value = await optimizationEngine.generateSuggestions();
    suggestions.value = optimizationReport.value.suggestions;
  } catch (error) {
    console.error('Failed to generate suggestions:', error);
  } finally {
    isGenerating.value = false;
  }
}

function executeSuggestion(id: string): void {
  const suggestion = suggestions.value.find(s => s.id === id);
  if (!suggestion) return;

  pendingSuggestionId = id;
  cleanupDialogTitle.value = suggestion.title;
  cleanupDialogDescription.value = suggestion.description;
  cleanupDialogItems.value = suggestion.affectedItems;
  cleanupDialogSize.value = suggestion.potentialSavings;
  cleanupDialogVisible.value = true;
}

async function handleCleanupConfirm(moveToTrash: boolean): Promise<void> {
  if (!pendingSuggestionId) return;

  cleanupDialogVisible.value = false;

  try {
    const result = await optimizationEngine.executeSuggestion(pendingSuggestionId);

    if (result.success) {
      alert(`Cleanup successful! Freed ${formatBytes(result.freedSpace)}`);
      await generateSuggestions();
      await handleRefresh();
    } else {
      alert('Cleanup failed: ' + result.errors.join(', '));
    }
  } catch (error) {
    console.error('Cleanup error:', error);
    alert('Cleanup failed');
  } finally {
    pendingSuggestionId = null;
  }
}

function ignoreSuggestion(id: string): void {
  optimizationEngine.ignoreSuggestion(id);
  suggestions.value = suggestions.value.filter(s => s.id !== id);
}

async function cleanupAll(): Promise<void> {
  if (!confirm(`Execute all ${autoFixSuggestions.value.length} auto-fix suggestions?`)) return;

  const result = await optimizationEngine.executeAllAutoFix();

  if (result.success) {
    alert(`Cleanup successful! Freed ${formatBytes(result.freedSpace)}`);
  } else {
    alert(`Partial cleanup. Freed ${formatBytes(result.freedSpace)}. ${result.itemsFailed} items failed.`);
  }

  await generateSuggestions();
  await handleRefresh();
}

function getSuggestionIcon(type: string): string {
  const icons: Record<string, string> = {
    'large-files': '📦',
    'duplicates': '📋',
    'empty-folders': '📁',
    'temp-files': '🗑',
    'old-downloads': '⬇',
    'large-logs': '📝',
    'cache-cleanup': '🔄',
    'memory-optimization': '💾'
  };
  return icons[type] || '⚙';
}

function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

function formatAlertTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);

  if (minutes === 0) return 'Just now';
  if (minutes === 1) return '1 minute ago';
  if (minutes < 60) return `${minutes} minutes ago`;

  const hours = Math.floor(minutes / 60);
  if (hours === 1) return '1 hour ago';
  return `${hours} hours ago`;
}

function formatHistoryTime(value: number | string): string {
  if (typeof value !== 'number') return String(value);

  const date = new Date(value);
  return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function exportReport(): void {
  const report = {
    timestamp: new Date().toISOString(),
    cpu: cpuUsage.value,
    memory: memoryUsage.value,
    storage: storageUsage.value,
    processes: processes.value.length,
    suggestions: suggestions.value.length
  };

  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `system-report-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function clearData(): void {
  if (!confirm('Clear all historical data?')) return;

  resourceMonitor.clearHistory();
  cpuHistory.value = [];
  memoryHistory.value = [];
  alert('History cleared');
}

function exportHistory(): void {
  const csv = resourceMonitor.exportHistoryCSV();
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `resource-history-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
</script>

<style scoped>
@import '../../amiga-common.css';

.resource-monitor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #a0a0a0;
  font-family: 'Press Start 2P', monospace;
  overflow: hidden;
}

/* Toolbar */
.monitor-toolbar {
  display: flex;
  justify-content: space-between;
  padding: 8px;
  background: #888888;
  border-bottom: 2px solid #000000;
  gap: 8px;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  gap: 8px;
}

.refresh-select,
.filter-select,
.disk-select,
.duration-select {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 4px 8px;
  font-size: 8px;
  font-family: 'Press Start 2P', monospace;
  color: #000000;
}

.toolbar-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 4px 12px;
  font-size: 8px;
  cursor: pointer;
  color: #000000;
  font-family: 'Press Start 2P', monospace;
  transition: all 0.1s;
}

.toolbar-button:hover:not(:disabled) {
  background: #b0b0b0;
}

.toolbar-button:active:not(:disabled) {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}

.toolbar-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toolbar-button-primary {
  background: #0055aa;
  color: #ffffff;
}

/* Tabs */
.monitor-tabs {
  display: flex;
  background: #888888;
  border-bottom: 2px solid #000000;
}

.tab {
  padding: 8px 16px;
  font-size: 8px;
  cursor: pointer;
  border-right: 2px solid #000000;
  transition: all 0.1s;
}

.tab:hover {
  background: #999999;
}

.tab.active {
  background: #a0a0a0;
  color: #0055aa;
  font-weight: bold;
}

/* Tab Content */
.tab-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

/* Overview Tab */
.gauges-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.gauge-card {
  background: #000000;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 12px;
  text-align: center;
}

.gauge-title {
  font-size: 8px;
  color: #ffffff;
  margin-bottom: 8px;
}

.gauge-container {
  margin: 12px auto;
  max-width: 120px;
}

.gauge {
  transform: rotate(-90deg);
  width: 100%;
  height: 100%;
}

.gauge-bg {
  fill: none;
  stroke: #333333;
  stroke-width: 8;
}

.gauge-fill {
  fill: none;
  stroke-width: 8;
  transition: stroke-dasharray 0.3s ease;
  stroke-linecap: round;
}

.gauge-normal {
  stroke: #00ff00;
}

.gauge-warning {
  stroke: #ffaa00;
}

.gauge-critical {
  stroke: #ff0000;
}

.gauge-value {
  transform: rotate(90deg);
  font-size: 14px;
  fill: #ffffff;
  font-weight: bold;
  text-anchor: middle;
  dominant-baseline: middle;
}

.gauge-subtitle {
  font-size: 6px;
  color: #888888;
}

.mini-charts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.mini-chart-card {
  background: #888888;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 8px;
}

.mini-chart-title {
  font-size: 7px;
  color: #000000;
  margin-bottom: 8px;
  font-weight: bold;
}

/* Alerts */
.alerts-panel {
  background: #000000;
  border: 2px solid #ffaa00;
  padding: 12px;
}

.alerts-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 8px;
  color: #ffaa00;
}

.clear-alerts-btn {
  background: #333333;
  border: 1px solid #ffaa00;
  color: #ffaa00;
  padding: 2px 6px;
  font-size: 6px;
  cursor: pointer;
  font-family: 'Press Start 2P', monospace;
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.alert-item {
  padding: 6px;
  border-left: 4px solid;
  font-size: 7px;
}

.alert-warning {
  background: rgba(255, 170, 0, 0.1);
  border-color: #ffaa00;
  color: #ffaa00;
}

.alert-critical {
  background: rgba(255, 0, 0, 0.1);
  border-color: #ff0000;
  color: #ff0000;
}

.alert-message {
  margin-bottom: 4px;
}

.alert-time {
  font-size: 6px;
  opacity: 0.7;
}

/* Processes Tab */
.processes-toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.search-input {
  flex: 1;
  background: #000000;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 4px 8px;
  font-size: 8px;
  font-family: 'Press Start 2P', monospace;
  color: #00ff00;
}

.processes-table {
  background: #000000;
  border: 2px solid #ffffff;
  overflow: auto;
  max-height: 400px;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 7px;
  color: #00ff00;
}

thead {
  background: #333333;
  position: sticky;
  top: 0;
  z-index: 1;
}

th {
  padding: 8px;
  text-align: left;
  cursor: pointer;
  user-select: none;
  border-bottom: 2px solid #00ff00;
}

th:hover {
  background: #444444;
}

td {
  padding: 6px 8px;
  border-bottom: 1px solid #333333;
}

.process-name {
  font-weight: bold;
}

.status-badge {
  padding: 2px 6px;
  font-size: 6px;
  border-radius: 2px;
  text-transform: uppercase;
}

.status-running {
  background: #00ff00;
  color: #000000;
}

.status-sleeping {
  background: #ffaa00;
  color: #000000;
}

.status-stopped {
  background: #ff0000;
  color: #ffffff;
}

.kill-button {
  background: #ff0000;
  border: 1px solid #000000;
  color: #ffffff;
  padding: 2px 8px;
  font-size: 6px;
  cursor: pointer;
  font-family: 'Press Start 2P', monospace;
}

/* Storage Tab */
.storage-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.storage-chart {
  display: flex;
  justify-content: center;
  background: #888888;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 16px;
}

.section-title {
  font-size: 9px;
  color: #000000;
  margin-bottom: 8px;
  font-weight: bold;
  padding: 6px;
  background: #888888;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
}

.file-types-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.file-type-item {
  display: grid;
  grid-template-columns: 60px 1fr 100px;
  gap: 8px;
  align-items: center;
  font-size: 7px;
}

.file-type-label {
  color: #000000;
  font-weight: bold;
}

.file-type-bar {
  height: 12px;
  background: #333333;
  border: 1px solid #000000;
}

.file-type-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.file-type-size {
  text-align: right;
  color: #0055aa;
  font-weight: bold;
}

.largest-list {
  background: #000000;
  border: 2px solid #ffffff;
  padding: 8px;
}

.largest-item {
  display: grid;
  grid-template-columns: 30px 1fr 100px;
  gap: 8px;
  padding: 4px;
  font-size: 7px;
  color: #00ff00;
  border-bottom: 1px solid #333333;
}

.item-rank {
  color: #ffaa00;
  font-weight: bold;
}

.item-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-size {
  text-align: right;
  color: #0099ff;
  font-weight: bold;
}

.treemap-section {
  margin-top: 16px;
}

/* Optimization Tab */
.optimization-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.summary-card {
  background: #000000;
  border: 2px solid #00ff00;
  padding: 12px;
  text-align: center;
}

.summary-label {
  font-size: 7px;
  color: #888888;
  margin-bottom: 6px;
}

.summary-value {
  font-size: 12px;
  color: #00ff00;
  font-weight: bold;
}

.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.suggestion-card {
  background: #888888;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 12px;
}

.severity-high,
.severity-critical {
  border-color: #ff0000;
  background: rgba(255, 0, 0, 0.1);
}

.severity-medium {
  border-color: #ffaa00;
}

.suggestion-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.suggestion-icon {
  font-size: 16px;
}

.suggestion-title {
  flex: 1;
  font-size: 9px;
  font-weight: bold;
  color: #000000;
}

.suggestion-savings {
  font-size: 9px;
  color: #0055aa;
  font-weight: bold;
}

.suggestion-description {
  font-size: 7px;
  color: #333333;
  margin-bottom: 8px;
  line-height: 1.4;
}

.suggestion-actions {
  display: flex;
  gap: 8px;
}

.action-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 4px 12px;
  font-size: 7px;
  cursor: pointer;
  font-family: 'Press Start 2P', monospace;
  transition: all 0.1s;
}

.action-button:hover {
  background: #b0b0b0;
}

/* History Tab */
.history-charts {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.history-chart-card {
  background: #888888;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 12px;
}

.chart-title {
  font-size: 8px;
  color: #000000;
  margin-bottom: 12px;
  font-weight: bold;
}
</style>

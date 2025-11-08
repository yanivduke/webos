<template>
  <div class="log-viewer">
    <div class="tool-header">
      <h3>📜 Log Viewer</h3>
      <p class="tool-desc">Real-time log monitoring and analysis</p>
    </div>

    <div class="tool-content">
      <!-- Controls -->
      <div class="controls-bar">
        <div class="left-controls">
          <select v-model="selectedSource" class="amiga-select" @change="loadLogs">
            <option value="application">Application</option>
            <option value="server">Server</option>
            <option value="database">Database</option>
            <option value="nginx">Nginx</option>
            <option value="docker">Docker</option>
          </select>

          <button
            class="amiga-button small"
            :class="{ active: isLive }"
            @click="toggleLive"
          >
            {{ isLive ? '⏸ Pause' : '▶ Live' }}
          </button>

          <button class="amiga-button small" @click="clearLogs">Clear</button>
          <button class="amiga-button small" @click="exportLogs">Export</button>
        </div>

        <div class="right-controls">
          <label class="auto-scroll-label">
            <input type="checkbox" v-model="autoScroll" class="amiga-checkbox" />
            Auto-scroll
          </label>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-bar">
        <input
          v-model="searchFilter"
          type="text"
          class="amiga-input"
          placeholder="Search logs..."
        />

        <div class="level-filters">
          <button
            v-for="level in logLevels"
            :key="level.name"
            class="amiga-button tiny"
            :class="{ active: activeFilters.includes(level.name), [level.name]: true }"
            @click="toggleFilter(level.name)"
          >
            {{ level.label }} ({{ getCountByLevel(level.name) }})
          </button>
        </div>
      </div>

      <!-- Log Display -->
      <div class="log-display" ref="logDisplayRef">
        <div v-if="filteredLogs.length === 0" class="empty-state">
          No logs to display
        </div>

        <div
          v-for="(log, index) in filteredLogs"
          :key="index"
          class="log-entry"
          :class="log.level"
          @click="selectLog(log)"
        >
          <span class="log-time">{{ log.time }}</span>
          <span class="log-level" :class="log.level">{{ log.level.toUpperCase() }}</span>
          <span class="log-source">{{ log.source }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
      </div>

      <!-- Log Details Panel -->
      <div v-if="selectedLog" class="details-panel">
        <div class="details-header">
          <h4>Log Details</h4>
          <button class="amiga-button tiny" @click="selectedLog = null">Close</button>
        </div>

        <div class="details-content">
          <div class="detail-row">
            <span class="detail-label">Timestamp:</span>
            <span class="detail-value">{{ selectedLog.timestamp }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Level:</span>
            <span class="detail-value" :class="selectedLog.level">
              {{ selectedLog.level.toUpperCase() }}
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Source:</span>
            <span class="detail-value">{{ selectedLog.source }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Message:</span>
            <span class="detail-value">{{ selectedLog.message }}</span>
          </div>

          <div v-if="selectedLog.stack" class="stack-trace">
            <h5>Stack Trace:</h5>
            <pre>{{ selectedLog.stack }}</pre>
          </div>

          <div v-if="selectedLog.metadata" class="metadata">
            <h5>Metadata:</h5>
            <pre>{{ JSON.stringify(selectedLog.metadata, null, 2) }}</pre>
          </div>
        </div>
      </div>

      <!-- Statistics -->
      <div class="stats-bar">
        <span class="stat-item">Total: {{ logs.length }}</span>
        <span class="stat-item">Filtered: {{ filteredLogs.length }}</span>
        <span class="stat-item error">Errors: {{ getCountByLevel('error') }}</span>
        <span class="stat-item warning">Warnings: {{ getCountByLevel('warn') }}</span>
        <span class="stat-item info">Info: {{ getCountByLevel('info') }}</span>
        <span class="stat-item">Last: {{ lastUpdateTime }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';

interface Log {
  time: string;
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  source: string;
  message: string;
  stack?: string;
  metadata?: any;
}

const selectedSource = ref('application');
const isLive = ref(true);
const autoScroll = ref(true);
const searchFilter = ref('');
const activeFilters = ref<string[]>(['debug', 'info', 'warn', 'error']);
const selectedLog = ref<Log | null>(null);
const logDisplayRef = ref<HTMLElement | null>(null);
const lastUpdateTime = ref('--:--:--');

const logLevels = [
  { name: 'debug', label: 'DEBUG' },
  { name: 'info', label: 'INFO' },
  { name: 'warn', label: 'WARN' },
  { name: 'error', label: 'ERROR' }
];

const logs = ref<Log[]>([
  {
    time: '12:00:01',
    timestamp: '2024-01-15 12:00:01.123',
    level: 'info',
    source: 'server',
    message: 'Server started on port 3001'
  },
  {
    time: '12:00:05',
    timestamp: '2024-01-15 12:00:05.456',
    level: 'info',
    source: 'database',
    message: 'Database connection established'
  },
  {
    time: '12:00:12',
    timestamp: '2024-01-15 12:00:12.789',
    level: 'warn',
    source: 'api',
    message: 'Slow query detected: 1.2s',
    metadata: { query: 'SELECT * FROM users', duration: 1200 }
  },
  {
    time: '12:00:23',
    timestamp: '2024-01-15 12:00:23.321',
    level: 'error',
    source: 'auth',
    message: 'Authentication failed for user john@example.com',
    stack: 'Error: Invalid credentials\n  at authenticate (auth.js:45)\n  at login (routes.js:123)',
    metadata: { email: 'john@example.com', ip: '192.168.1.100' }
  },
  {
    time: '12:00:45',
    timestamp: '2024-01-15 12:00:45.654',
    level: 'info',
    source: 'cache',
    message: 'Cache cleared: 1234 entries removed'
  },
  {
    time: '12:01:02',
    timestamp: '2024-01-15 12:01:02.987',
    level: 'debug',
    source: 'router',
    message: 'GET /api/users - 200 OK (45ms)'
  }
]);

let liveInterval: number | undefined;

const filteredLogs = computed(() => {
  let result = logs.value;

  // Filter by level
  result = result.filter(log => activeFilters.value.includes(log.level));

  // Filter by search
  if (searchFilter.value) {
    const query = searchFilter.value.toLowerCase();
    result = result.filter(log =>
      log.message.toLowerCase().includes(query) ||
      log.source.toLowerCase().includes(query) ||
      log.level.toLowerCase().includes(query)
    );
  }

  return result;
});

const loadLogs = () => {
  console.log(`Loading logs from ${selectedSource.value}...`);
  // In a real implementation, this would fetch logs from the server
};

const toggleLive = () => {
  isLive.value = !isLive.value;

  if (isLive.value) {
    startLiveUpdates();
  } else {
    stopLiveUpdates();
  }
};

const startLiveUpdates = () => {
  liveInterval = window.setInterval(() => {
    // Simulate new log entries
    const levels: Array<'debug' | 'info' | 'warn' | 'error'> = ['debug', 'info', 'warn', 'error'];
    const sources = ['server', 'api', 'database', 'auth', 'cache', 'router'];
    const messages = [
      'Request processed successfully',
      'Cache hit: user_123',
      'Query executed in 23ms',
      'Session created for user',
      'Middleware executed',
      'File uploaded: document.pdf',
      'Email sent to user@example.com',
      'Background job completed'
    ];

    const now = new Date();
    const time = now.toLocaleTimeString();
    const timestamp = now.toISOString().replace('T', ' ').substring(0, 23);

    const newLog: Log = {
      time,
      timestamp,
      level: levels[Math.floor(Math.random() * levels.length)],
      source: sources[Math.floor(Math.random() * sources.length)],
      message: messages[Math.floor(Math.random() * messages.length)]
    };

    logs.value.push(newLog);

    // Keep only last 1000 logs
    if (logs.value.length > 1000) {
      logs.value.shift();
    }

    lastUpdateTime.value = time;

    // Auto-scroll if enabled
    if (autoScroll.value) {
      scrollToBottom();
    }
  }, 2000); // New log every 2 seconds
};

const stopLiveUpdates = () => {
  if (liveInterval) {
    clearInterval(liveInterval);
    liveInterval = undefined;
  }
};

const clearLogs = () => {
  if (confirm('Clear all logs?')) {
    logs.value = [];
    selectedLog.value = null;
  }
};

const exportLogs = () => {
  const content = filteredLogs.value
    .map(log => `[${log.timestamp}] [${log.level.toUpperCase()}] [${log.source}] ${log.message}`)
    .join('\n');

  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `logs_${selectedSource.value}_${new Date().toISOString()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
};

const toggleFilter = (level: string) => {
  const index = activeFilters.value.indexOf(level);
  if (index > -1) {
    activeFilters.value.splice(index, 1);
  } else {
    activeFilters.value.push(level);
  }
};

const selectLog = (log: Log) => {
  selectedLog.value = log;
};

const getCountByLevel = (level: string) => {
  return logs.value.filter(log => log.level === level).length;
};

const scrollToBottom = () => {
  setTimeout(() => {
    if (logDisplayRef.value) {
      logDisplayRef.value.scrollTop = logDisplayRef.value.scrollHeight;
    }
  }, 10);
};

onMounted(() => {
  if (isLive.value) {
    startLiveUpdates();
  }
  lastUpdateTime.value = new Date().toLocaleTimeString();
});

onUnmounted(() => {
  stopLiveUpdates();
});

watch(filteredLogs, () => {
  if (autoScroll.value) {
    scrollToBottom();
  }
});
</script>

<style scoped>
.log-viewer {
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

.tool-content {
  flex: 1;
  padding: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.controls-bar,
.filters-bar {
  display: flex;
  gap: 6px;
  align-items: center;
}

.controls-bar {
  justify-content: space-between;
}

.left-controls,
.right-controls {
  display: flex;
  gap: 6px;
  align-items: center;
}

.amiga-select {
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 4px 8px;
  font-size: 8px;
  font-family: 'Press Start 2P', monospace;
  color: #000000;
}

.amiga-input {
  flex: 1;
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 4px 8px;
  font-size: 9px;
  font-family: 'Courier New', monospace;
  color: #000000;
}

.amiga-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 6px 12px;
  font-size: 9px;
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

.amiga-button.small {
  padding: 4px 8px;
  font-size: 7px;
}

.amiga-button.tiny {
  padding: 2px 6px;
  font-size: 7px;
}

.amiga-button.active {
  background: #00aa00;
  color: #ffffff;
}

.amiga-button.debug {
  border-color: #888888;
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

.amiga-checkbox {
  width: 12px;
  height: 12px;
}

.auto-scroll-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 7px;
}

.level-filters {
  display: flex;
  gap: 4px;
}

.log-display {
  flex: 1;
  background: #000000;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 8px;
  overflow-y: auto;
  font-family: 'Courier New', monospace;
  font-size: 9px;
}

.empty-state {
  color: #666666;
  text-align: center;
  padding: 40px;
  font-size: 8px;
}

.log-entry {
  display: grid;
  grid-template-columns: 80px 60px 100px 1fr;
  gap: 8px;
  padding: 4px;
  margin-bottom: 2px;
  cursor: pointer;
  border-left: 3px solid transparent;
}

.log-entry:hover {
  background: #1a1a1a;
}

.log-entry.debug {
  border-left-color: #888888;
}

.log-entry.info {
  border-left-color: #0055aa;
}

.log-entry.warn {
  border-left-color: #ff8800;
}

.log-entry.error {
  border-left-color: #ff0000;
}

.log-time {
  color: #666666;
}

.log-level {
  font-weight: bold;
}

.log-level.debug {
  color: #888888;
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

.log-source {
  color: #00ff00;
}

.log-message {
  color: #ffffff;
}

.details-panel {
  background: #ffffff;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 12px;
  max-height: 200px;
  overflow-y: auto;
}

.details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 2px solid #000000;
}

.details-header h4 {
  margin: 0;
  font-size: 9px;
  color: #0055aa;
}

.details-content {
  font-size: 8px;
}

.detail-row {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
}

.detail-label {
  color: #666666;
  min-width: 100px;
}

.detail-value {
  color: #000000;
  font-family: 'Courier New', monospace;
}

.stack-trace,
.metadata {
  margin-top: 8px;
  padding: 6px;
  background: #f5f5f5;
  border: 1px solid #888888;
}

.stack-trace h5,
.metadata h5 {
  margin: 0 0 4px 0;
  font-size: 7px;
  color: #0055aa;
}

.stack-trace pre,
.metadata pre {
  margin: 0;
  font-size: 7px;
  font-family: 'Courier New', monospace;
  color: #000000;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.stats-bar {
  display: flex;
  gap: 12px;
  padding: 6px 8px;
  background: #ffffff;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  font-size: 7px;
}

.stat-item {
  color: #000000;
}

.stat-item.error {
  color: #ff0000;
  font-weight: bold;
}

.stat-item.warning {
  color: #ff8800;
  font-weight: bold;
}

.stat-item.info {
  color: #0055aa;
}
</style>

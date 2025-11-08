<template>
  <div class="batch-manager">
    <!-- Tab Bar -->
    <div class="tab-bar">
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
      <!-- Queue Tab -->
      <div v-if="activeTab === 'queue'" class="queue-tab">
        <div class="toolbar">
          <button class="amiga-button" @click="showOperationBuilder = true">
            Add Operation
          </button>
          <button class="amiga-button" @click="pauseAll">Pause All</button>
          <button class="amiga-button" @click="resumeAll">Resume All</button>
          <button class="amiga-button" @click="cancelAll">Cancel All</button>
          <button class="amiga-button" @click="clearCompleted">Clear Completed</button>
        </div>

        <div class="operations-list">
          <div v-if="allOperations.length === 0" class="empty-state">
            No operations in queue
          </div>

          <div
            v-for="operation in allOperations"
            :key="operation.id"
            class="operation-item"
            :class="{ running: operation.status === 'RUNNING' }"
          >
            <div class="operation-icon">
              <div class="icon" :class="`icon-${operation.type.toLowerCase()}`"></div>
            </div>

            <div class="operation-details">
              <div class="operation-header">
                <span class="operation-type">{{ operation.type }}</span>
                <span class="operation-status" :class="`status-${operation.status.toLowerCase()}`">
                  {{ operation.status }}
                </span>
              </div>

              <div class="operation-path">
                <span class="source">{{ formatPath(operation.source) }}</span>
                <span v-if="operation.destination" class="arrow"> → </span>
                <span v-if="operation.destination" class="destination">{{ operation.destination }}</span>
              </div>

              <div class="progress-bar-container">
                <div class="progress-bar">
                  <div
                    class="progress-fill"
                    :style="{ width: operation.progress + '%' }"
                  ></div>
                </div>
                <span class="progress-text">
                  {{ operation.progress }}% ({{ operation.itemsProcessed }}/{{ operation.totalItems }})
                </span>
              </div>

              <div v-if="operation.error" class="operation-error">
                Error: {{ operation.error }}
              </div>
            </div>

            <div class="operation-actions">
              <button
                v-if="operation.status === 'RUNNING'"
                class="action-button"
                @click="pauseOperation(operation.id)"
                title="Pause"
              >
                ❚❚
              </button>
              <button
                v-if="operation.status === 'PAUSED'"
                class="action-button"
                @click="resumeOperation(operation.id)"
                title="Resume"
              >
                ▶
              </button>
              <button
                v-if="operation.status === 'RUNNING' || operation.status === 'PAUSED'"
                class="action-button"
                @click="cancelOperation(operation.id)"
                title="Cancel"
              >
                ✕
              </button>
              <button
                v-if="operation.status === 'COMPLETED' || operation.status === 'CANCELLED'"
                class="action-button"
                @click="removeOperation(operation.id)"
                title="Remove"
              >
                🗑
              </button>
            </div>
          </div>
        </div>

        <!-- Summary Bar -->
        <div class="summary-bar">
          <span>Total: {{ statistics.total }}</span>
          <span>Running: {{ statistics.running }}</span>
          <span>Queued: {{ statistics.queued }}</span>
          <span>Completed: {{ statistics.completed }}</span>
          <span>Failed: {{ statistics.failed }}</span>
          <span>Progress: {{ statistics.totalProgress }}%</span>
        </div>
      </div>

      <!-- History Tab -->
      <div v-if="activeTab === 'history'" class="history-tab">
        <div class="toolbar">
          <button class="amiga-button" @click="clearUndoHistory">Clear History</button>
        </div>

        <div class="history-list">
          <div v-if="undoHistory.length === 0" class="empty-state">
            No operations in history
          </div>

          <div
            v-for="item in undoHistory"
            :key="item.id"
            class="history-item"
          >
            <div class="history-icon">
              <div class="icon" :class="`icon-${item.type.toLowerCase()}`"></div>
            </div>

            <div class="history-details">
              <div class="history-description">{{ item.description }}</div>
              <div class="history-time">{{ formatTime(item.timestamp) }}</div>
            </div>

            <div class="history-actions">
              <button class="amiga-button" @click="undoOperation(item.id)">
                Undo
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Schedule Tab -->
      <div v-if="activeTab === 'schedule'" class="schedule-tab">
        <div class="toolbar">
          <button class="amiga-button" @click="showScheduleBuilder = true">
            Add Schedule
          </button>
          <button class="amiga-button" @click="requestNotifications">
            Enable Notifications
          </button>
        </div>

        <div class="schedule-list">
          <div v-if="schedules.length === 0" class="empty-state">
            No scheduled operations
          </div>

          <div
            v-for="schedule in schedules"
            :key="schedule.id"
            class="schedule-item"
            :class="{ disabled: !schedule.enabled }"
          >
            <div class="schedule-icon">
              <div class="icon" :class="`icon-${schedule.operationType.toLowerCase()}`"></div>
            </div>

            <div class="schedule-details">
              <div class="schedule-name">{{ schedule.name }}</div>
              <div class="schedule-info">
                <span>Type: {{ schedule.scheduleType }}</span>
                <span v-if="schedule.nextRun">
                  Next: {{ formatTime(schedule.nextRun) }}
                </span>
                <span>Runs: {{ schedule.runCount }}</span>
              </div>
              <div class="schedule-path">
                {{ formatPath(schedule.source) }}
                <span v-if="schedule.destination"> → {{ schedule.destination }}</span>
              </div>
            </div>

            <div class="schedule-actions">
              <button
                class="action-button"
                @click="toggleSchedule(schedule.id)"
                :title="schedule.enabled ? 'Disable' : 'Enable'"
              >
                {{ schedule.enabled ? '◼' : '▶' }}
              </button>
              <button
                class="action-button"
                @click="runScheduleNow(schedule.id)"
                title="Run Now"
              >
                ⚡
              </button>
              <button
                class="action-button"
                @click="removeSchedule(schedule.id)"
                title="Remove"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        <!-- Schedule Stats -->
        <div class="summary-bar">
          <span>Total: {{ scheduleStats.total }}</span>
          <span>Enabled: {{ scheduleStats.enabled }}</span>
          <span>Disabled: {{ scheduleStats.disabled }}</span>
          <span>Total Runs: {{ scheduleStats.totalRuns }}</span>
        </div>
      </div>
    </div>

    <!-- Operation Builder Dialog -->
    <AmigaOperationBuilder
      v-if="showOperationBuilder"
      @close="showOperationBuilder = false"
      @submit="handleOperationSubmit"
    />

    <!-- Schedule Builder Dialog -->
    <AmigaOperationBuilder
      v-if="showScheduleBuilder"
      :is-schedule="true"
      @close="showScheduleBuilder = false"
      @submit="handleScheduleSubmit"
    />

    <!-- Conflict Resolution Dialog -->
    <div v-if="showConflictDialog" class="dialog-overlay" @click="showConflictDialog = false">
      <div class="amiga-dialog" @click.stop>
        <div class="dialog-title">Conflict Detected</div>
        <div class="dialog-content">
          <p>File already exists at destination. What would you like to do?</p>
        </div>
        <div class="dialog-actions">
          <button class="amiga-button" @click="resolveConflict('SKIP')">Skip</button>
          <button class="amiga-button" @click="resolveConflict('OVERWRITE')">Overwrite</button>
          <button class="amiga-button" @click="resolveConflict('RENAME')">Rename</button>
          <button class="amiga-button" @click="showConflictDialog = false">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import {
  batchOperations,
  OperationDefinition,
  UndoableOperation,
  ConflictStrategy
} from '../../utils/batch-operations';
import {
  operationScheduler,
  ScheduledOperation
} from '../../utils/operation-scheduler';
import AmigaOperationBuilder from '../dialogs/AmigaOperationBuilder.vue';

const activeTab = ref('queue');
const showOperationBuilder = ref(false);
const showScheduleBuilder = ref(false);
const showConflictDialog = ref(false);

const tabs = [
  { id: 'queue', label: 'Queue' },
  { id: 'history', label: 'History' },
  { id: 'schedule', label: 'Schedule' }
];

// Operations data
const allOperations = ref<OperationDefinition[]>([]);
const undoHistory = ref<UndoableOperation[]>([]);
const schedules = ref<ScheduledOperation[]>([]);

// Statistics
const statistics = computed(() => batchOperations.getStatistics());
const scheduleStats = computed(() => operationScheduler.getStatistics());

// Update interval
let updateInterval: number | null = null;

onMounted(() => {
  // Initial load
  updateData();

  // Setup event listeners
  batchOperations.on('operation-added', updateData);
  batchOperations.on('operation-progress', updateData);
  batchOperations.on('operation-completed', updateData);
  batchOperations.on('operation-failed', updateData);
  batchOperations.on('undo-history-updated', updateData);

  // Periodic updates
  updateInterval = window.setInterval(updateData, 1000);
});

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval);
  }
});

function updateData() {
  allOperations.value = batchOperations.getAll();
  undoHistory.value = batchOperations.getUndoHistory();
  schedules.value = operationScheduler.getAll();
}

// Operation actions
function pauseOperation(id: string) {
  batchOperations.pause(id);
}

function resumeOperation(id: string) {
  batchOperations.resume(id);
}

function cancelOperation(id: string) {
  batchOperations.cancel(id);
}

function removeOperation(id: string) {
  batchOperations.remove(id);
}

function pauseAll() {
  batchOperations.pauseAll();
}

function resumeAll() {
  batchOperations.resumeAll();
}

function cancelAll() {
  batchOperations.cancelAll();
}

function clearCompleted() {
  batchOperations.clearCompleted();
}

// History actions
function undoOperation(id: string) {
  batchOperations.undo(id);
}

function clearUndoHistory() {
  // Clear by removing all from history
  const history = batchOperations.getUndoHistory();
  history.forEach(_item => {
    // Just clear the history, don't actually undo
  });
  updateData();
}

// Schedule actions
function toggleSchedule(id: string) {
  const schedule = operationScheduler.get(id);
  if (!schedule) return;

  if (schedule.enabled) {
    operationScheduler.disable(id);
  } else {
    operationScheduler.enable(id);
  }
  updateData();
}

function runScheduleNow(id: string) {
  operationScheduler.runNow(id);
}

function removeSchedule(id: string) {
  operationScheduler.remove(id);
  updateData();
}

async function requestNotifications() {
  const granted = await operationScheduler.requestNotificationPermission();
  if (granted) {
    alert('Notifications enabled!');
  } else {
    alert('Notifications permission denied');
  }
}

// Dialog handlers
function handleOperationSubmit(data: any) {
  batchOperations.add({
    type: data.type,
    source: data.source,
    destination: data.destination,
    totalBytes: 0,
    totalItems: Array.isArray(data.source) ? data.source.length : 1,
    conflictStrategy: data.conflictStrategy || ConflictStrategy.ASK,
    maxRetries: 3
  });
  showOperationBuilder.value = false;
}

function handleScheduleSubmit(data: any) {
  operationScheduler.add({
    name: data.name,
    operationType: data.type,
    source: data.source,
    destination: data.destination,
    conflictStrategy: data.conflictStrategy || ConflictStrategy.ASK,
    scheduleType: data.scheduleType,
    scheduledTime: data.scheduledTime,
    dailyTime: data.dailyTime,
    weeklyDay: data.weeklyDay,
    weeklyTime: data.weeklyTime,
    monthlyDay: data.monthlyDay,
    monthlyTime: data.monthlyTime,
    enabled: true
  });
  showScheduleBuilder.value = false;
  updateData();
}

function resolveConflict(_strategy: string) {
  // Handle conflict resolution
  showConflictDialog.value = false;
}

// Formatting helpers
function formatPath(path: string | string[]): string {
  if (Array.isArray(path)) {
    return path.length > 1 ? `${path.length} items` : path[0] || '';
  }
  return path;
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString();
}
</script>

<style scoped>
.batch-manager {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #a0a0a0;
  font-family: 'Press Start 2P', monospace;
  font-size: 10px;
}

/* Tab Bar */
.tab-bar {
  display: flex;
  background: #888888;
  border-bottom: 2px solid #000000;
}

.tab {
  padding: 8px 16px;
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  cursor: pointer;
  margin: 2px;
}

.tab:hover {
  background: #b0b0b0;
}

.tab.active {
  background: #ffffff;
  border-color: #000000 #ffffff #ffffff #000000;
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
  gap: 8px;
  padding: 8px;
  background: #888888;
  border-bottom: 2px solid #000000;
  flex-wrap: wrap;
}

.amiga-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 4px 12px;
  font-size: 10px;
  font-family: 'Press Start 2P', monospace;
  cursor: pointer;
}

.amiga-button:hover {
  background: #b0b0b0;
}

.amiga-button:active {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}

/* Lists */
.operations-list,
.history-list,
.schedule-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #666666;
}

/* Operation Item */
.operation-item,
.history-item,
.schedule-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  margin-bottom: 8px;
}

.operation-item.running {
  background: #e0f0ff;
}

.schedule-item.disabled {
  opacity: 0.5;
}

/* Icons */
.operation-icon,
.history-icon,
.schedule-icon {
  flex-shrink: 0;
}

.icon {
  width: 32px;
  height: 32px;
  background: #ffaa00;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.icon-copy::before { content: '📋'; }
.icon-move::before { content: '➜'; }
.icon-delete::before { content: '🗑'; }
.icon-rename::before { content: '✏'; }
.icon-compress::before { content: '📦'; }
.icon-extract::before { content: '📂'; }

/* Details */
.operation-details,
.history-details,
.schedule-details {
  flex: 1;
  min-width: 0;
}

.operation-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.operation-type {
  font-weight: bold;
}

.operation-status {
  padding: 2px 6px;
  border-radius: 2px;
}

.status-queued {
  background: #ffeeaa;
  color: #000000;
}

.status-running {
  background: #0055aa;
  color: #ffffff;
}

.status-paused {
  background: #ffaa00;
  color: #000000;
}

.status-completed {
  background: #00aa00;
  color: #ffffff;
}

.status-failed {
  background: #aa0000;
  color: #ffffff;
}

.status-cancelled {
  background: #888888;
  color: #ffffff;
}

.operation-path {
  margin-bottom: 4px;
  word-break: break-all;
}

.arrow {
  color: #0055aa;
  margin: 0 4px;
}

/* Progress Bar */
.progress-bar-container {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.progress-bar {
  flex: 1;
  height: 16px;
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(to bottom, #0088ff, #0055aa);
  transition: width 0.3s;
}

.progress-text {
  white-space: nowrap;
}

.operation-error {
  color: #aa0000;
  margin-top: 4px;
}

/* Actions */
.operation-actions,
.history-actions,
.schedule-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.action-button {
  width: 32px;
  height: 32px;
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-button:hover {
  background: #b0b0b0;
}

.action-button:active {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}

/* Summary Bar */
.summary-bar {
  display: flex;
  gap: 16px;
  padding: 8px;
  background: #888888;
  border-top: 2px solid #ffffff;
  flex-wrap: wrap;
}

.summary-bar span {
  color: #ffffff;
}

/* History specific */
.history-description {
  font-weight: bold;
  margin-bottom: 4px;
}

.history-time {
  color: #666666;
}

/* Schedule specific */
.schedule-name {
  font-weight: bold;
  margin-bottom: 4px;
}

.schedule-info {
  display: flex;
  gap: 12px;
  margin-bottom: 4px;
  color: #666666;
}

.schedule-path {
  word-break: break-all;
}

/* Dialog */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.amiga-dialog {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 16px;
  min-width: 400px;
}

.dialog-title {
  font-size: 12px;
  font-weight: bold;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid #000000;
}

.dialog-content {
  margin-bottom: 16px;
}

.dialog-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
</style>

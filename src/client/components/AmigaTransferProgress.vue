<template>
  <div class="transfer-progress" :class="{ failed: transfer.status === 'failed' }">
    <div class="transfer-header">
      <div class="transfer-icon">
        {{ transfer.direction === 'upload' ? '⬆️' : '⬇️' }}
      </div>
      <div class="transfer-info">
        <div class="transfer-filename">{{ transfer.filename }}</div>
        <div class="transfer-path">{{ transfer.source }} → {{ transfer.destination }}</div>
      </div>
      <div class="transfer-actions">
        <button
          v-if="transfer.status === 'active'"
          class="amiga-button-small"
          @click="$emit('pause', transfer.id)"
          title="Pause"
        >
          ⏸
        </button>
        <button
          v-if="transfer.status === 'paused'"
          class="amiga-button-small"
          @click="$emit('resume', transfer.id)"
          title="Resume"
        >
          ▶
        </button>
        <button
          v-if="transfer.status === 'failed'"
          class="amiga-button-small"
          @click="$emit('retry', transfer.id)"
          title="Retry"
        >
          🔄
        </button>
        <button
          class="amiga-button-small"
          @click="$emit('cancel', transfer.id)"
          :disabled="transfer.status === 'completed'"
          title="Cancel"
        >
          ✕
        </button>
      </div>
    </div>

    <div class="transfer-progress-bar">
      <div class="progress-track">
        <div
          class="progress-fill"
          :style="{ width: transfer.progress + '%' }"
          :class="{
            active: transfer.status === 'active',
            paused: transfer.status === 'paused',
            completed: transfer.status === 'completed',
            failed: transfer.status === 'failed'
          }"
        ></div>
      </div>
      <div class="progress-text">{{ Math.round(transfer.progress) }}%</div>
    </div>

    <div class="transfer-stats">
      <div class="stat">
        <span class="stat-label">Size:</span>
        <span class="stat-value">{{ formatSize(transfer.size) }}</span>
      </div>
      <div class="stat">
        <span class="stat-label">Transferred:</span>
        <span class="stat-value">{{ formatSize(transfer.transferred) }}</span>
      </div>
      <div class="stat">
        <span class="stat-label">Speed:</span>
        <span class="stat-value">{{ formatSpeed(transfer.speed) }}</span>
      </div>
      <div class="stat">
        <span class="stat-label">Remaining:</span>
        <span class="stat-value">{{ formatTime(transfer.timeRemaining) }}</span>
      </div>
      <div class="stat">
        <span class="stat-label">Status:</span>
        <span class="stat-value status-badge" :class="transfer.status">{{ transfer.status }}</span>
      </div>
    </div>

    <div v-if="transfer.error" class="transfer-error">
      ⚠️ {{ transfer.error }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import { type TransferItem } from '../utils/network-browser';

defineProps<{
  transfer: TransferItem;
}>();

defineEmits<{
  pause: [transferId: string];
  resume: [transferId: string];
  cancel: [transferId: string];
  retry: [transferId: string];
}>();

const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

const formatSpeed = (bytesPerSecond: number): string => {
  if (bytesPerSecond === 0) return '0 B/s';
  return formatSize(bytesPerSecond) + '/s';
};

const formatTime = (seconds: number): string => {
  if (!isFinite(seconds) || seconds === 0) return '--:--';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}h ${m}m ${s}s`;
  } else if (m > 0) {
    return `${m}m ${s}s`;
  } else {
    return `${s}s`;
  }
};
</script>

<style scoped>
.transfer-progress {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 8px;
  margin-bottom: 8px;
  font-family: 'Press Start 2P', monospace;
}

.transfer-progress.failed {
  border-color: #ff0000;
}

.transfer-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.transfer-icon {
  font-size: 20px;
  width: 24px;
  text-align: center;
}

.transfer-info {
  flex: 1;
  min-width: 0;
}

.transfer-filename {
  font-size: 10px;
  font-weight: bold;
  color: #000000;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.transfer-path {
  font-size: 8px;
  color: #555555;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
}

.transfer-actions {
  display: flex;
  gap: 4px;
}

.amiga-button-small {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 2px 6px;
  font-size: 10px;
  cursor: pointer;
  color: #000000;
  font-family: 'Press Start 2P', monospace;
  min-width: 28px;
}

.amiga-button-small:hover:not(:disabled) {
  background: #b0b0b0;
}

.amiga-button-small:active:not(:disabled) {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}

.amiga-button-small:disabled {
  color: #808080;
  cursor: not-allowed;
}

.transfer-progress-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.progress-track {
  flex: 1;
  height: 16px;
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  position: relative;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  transition: width 0.3s ease;
  background: #0055aa;
}

.progress-fill.active {
  background: #00aa00;
}

.progress-fill.paused {
  background: #ffaa00;
}

.progress-fill.completed {
  background: #00aa00;
}

.progress-fill.failed {
  background: #ff0000;
}

.progress-text {
  font-size: 9px;
  color: #000000;
  min-width: 40px;
  text-align: right;
}

.transfer-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 8px;
}

.stat {
  display: flex;
  gap: 4px;
}

.stat-label {
  color: #555555;
}

.stat-value {
  color: #000000;
  font-weight: bold;
}

.status-badge {
  padding: 2px 4px;
  border: 1px solid;
  text-transform: uppercase;
}

.status-badge.pending {
  background: #cccccc;
  border-color: #999999;
  color: #333333;
}

.status-badge.active {
  background: #00ff00;
  border-color: #00aa00;
  color: #000000;
}

.status-badge.paused {
  background: #ffaa00;
  border-color: #ff8800;
  color: #000000;
}

.status-badge.completed {
  background: #00aa00;
  border-color: #008800;
  color: #ffffff;
}

.status-badge.failed,
.status-badge.cancelled {
  background: #ff0000;
  border-color: #cc0000;
  color: #ffffff;
}

.transfer-error {
  margin-top: 8px;
  padding: 4px 8px;
  background: #ffcccc;
  border: 1px solid #ff0000;
  color: #cc0000;
  font-size: 8px;
}
</style>

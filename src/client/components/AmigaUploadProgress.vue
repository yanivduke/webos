<template>
  <div v-if="visible" class="upload-progress-widget" :class="{ minimized }">
    <div class="widget-header" @mousedown="startDrag">
      <div class="widget-title">Upload Progress</div>
      <div class="widget-controls">
        <div class="widget-button" @click.stop="toggleMinimize" :title="minimized ? 'Maximize' : 'Minimize'">
          {{ minimized ? '▲' : '▼' }}
        </div>
        <div class="widget-button close" @click.stop="closeWidget" title="Close">
          ✕
        </div>
      </div>
    </div>

    <div v-if="!minimized" class="widget-content">
      <div v-if="activeUploads.length === 0 && queuedUploads.length === 0" class="no-uploads">
        No active uploads
      </div>

      <div v-else class="uploads-list">
        <!-- Active uploads -->
        <div
          v-for="item in activeUploads"
          :key="item.id"
          class="upload-item"
          :class="{ completed: item.status === 'completed' }"
        >
          <div class="upload-info">
            <div class="upload-name">{{ item.file.name }}</div>
            <div class="upload-details">
              <span class="upload-size">{{ formatSize(item.uploadedBytes) }} / {{ formatSize(item.totalBytes) }}</span>
              <span v-if="item.speed > 0" class="upload-speed">{{ formatSpeed(item.speed) }}</span>
              <span v-if="item.timeRemaining > 0" class="upload-time">{{ formatTime(item.timeRemaining) }} left</span>
            </div>
          </div>

          <div class="upload-progress-bar">
            <div class="progress-fill" :style="{ width: item.progress + '%' }"></div>
            <div class="progress-text">{{ item.progress }}%</div>
          </div>

          <div class="upload-actions">
            <button v-if="item.status === 'uploading'" class="action-button cancel" @click="cancelUpload(item.id)">
              Cancel
            </button>
            <button v-if="item.status === 'paused'" class="action-button resume" @click="resumeUpload(item.id)">
              Resume
            </button>
            <button v-if="item.status === 'completed'" class="action-button open" @click="openDestination(item.path)">
              Open
            </button>
          </div>

          <div v-if="item.status === 'completed'" class="upload-status success">
            ✓ Complete
          </div>
          <div v-if="item.status === 'failed'" class="upload-status error">
            ✕ {{ item.error || 'Failed' }}
          </div>
        </div>

        <!-- Queued uploads -->
        <div
          v-for="item in queuedUploads"
          :key="item.id"
          class="upload-item queued"
        >
          <div class="upload-info">
            <div class="upload-name">{{ item.file.name }}</div>
            <div class="upload-details">
              <span class="upload-size">{{ formatSize(item.totalBytes) }}</span>
              <span class="upload-status-text">Queued</span>
            </div>
          </div>

          <div class="upload-actions">
            <button class="action-button cancel" @click="cancelUpload(item.id)">
              Cancel
            </button>
          </div>
        </div>
      </div>

      <div v-if="activeUploads.length > 1 || queuedUploads.length > 0" class="widget-footer">
        <button class="amiga-button cancel-all" @click="cancelAll">
          Cancel All
        </button>
        <div class="overall-progress">
          {{ activeUploads.length + queuedUploads.length }} files remaining
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import dragDropManager, { type UploadItem, DragDropManager } from '../utils/drag-drop-manager';

const visible = ref(false);
const minimized = ref(false);
const activeUploads = ref<UploadItem[]>([]);
const queuedUploads = ref<UploadItem[]>([]);
const completedUploads = ref<UploadItem[]>([]);

// Widget position
const x = ref(window.innerWidth - 420);
const y = ref(window.innerHeight - 300);

// Dragging state
const isDragging = ref(false);
let dragStartX = 0;
let dragStartY = 0;
let dragOffsetX = 0;
let dragOffsetY = 0;

// Auto-hide timer
let autoHideTimer: number | null = null;

// Update uploads from manager
const updateUploads = () => {
  activeUploads.value = dragDropManager.getActiveUploads();
  queuedUploads.value = dragDropManager.getQueuedUploads();
  completedUploads.value = dragDropManager.getCompletedUploads();

  // Show widget when uploads start
  if (activeUploads.value.length > 0 || queuedUploads.value.length > 0) {
    visible.value = true;
    clearAutoHideTimer();
  }

  // Auto-hide when all completed
  if (activeUploads.value.length === 0 && queuedUploads.value.length === 0 && completedUploads.value.length > 0) {
    startAutoHideTimer();
  }
};

// Auto-hide timer functions
const startAutoHideTimer = () => {
  clearAutoHideTimer();
  autoHideTimer = window.setTimeout(() => {
    if (activeUploads.value.length === 0 && queuedUploads.value.length === 0) {
      visible.value = false;
      dragDropManager.clearCompleted();
    }
  }, 5000);
};

const clearAutoHideTimer = () => {
  if (autoHideTimer !== null) {
    clearTimeout(autoHideTimer);
    autoHideTimer = null;
  }
};

// Format helpers
const formatSize = (bytes: number): string => {
  return DragDropManager.formatSize(bytes);
};

const formatSpeed = (bytesPerSecond: number): string => {
  return DragDropManager.formatSpeed(bytesPerSecond);
};

const formatTime = (seconds: number): string => {
  return DragDropManager.formatTime(seconds);
};

// Actions
const cancelUpload = (itemId: string) => {
  dragDropManager.cancelUpload(itemId);
};

const resumeUpload = (itemId: string) => {
  dragDropManager.resumeUpload(itemId);
};

const cancelAll = () => {
  if (confirm('Cancel all uploads?')) {
    dragDropManager.cancelAll();
  }
};

const openDestination = (path: string) => {
  // Emit event to open the destination folder
  console.log('Opening destination:', path);
  // This could be handled by emitting to parent component
};

const toggleMinimize = () => {
  minimized.value = !minimized.value;
};

const closeWidget = () => {
  clearAutoHideTimer();

  // Only close if no active uploads
  if (activeUploads.value.length > 0 || queuedUploads.value.length > 0) {
    if (!confirm('Uploads are in progress. Close anyway? (Uploads will continue in background)')) {
      return;
    }
  }

  visible.value = false;
};

// Dragging
const startDrag = (e: MouseEvent) => {
  isDragging.value = true;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  dragOffsetX = x.value;
  dragOffsetY = y.value;

  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', stopDrag);
  e.preventDefault();
};

const onDrag = (e: MouseEvent) => {
  if (!isDragging.value) return;

  const dx = e.clientX - dragStartX;
  const dy = e.clientY - dragStartY;

  x.value = Math.max(0, Math.min(window.innerWidth - 400, dragOffsetX + dx));
  y.value = Math.max(0, Math.min(window.innerHeight - 100, dragOffsetY + dy));
};

const stopDrag = () => {
  isDragging.value = false;
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDrag);
};

// Lifecycle
onMounted(() => {
  // Subscribe to upload manager
  const unsubscribe = dragDropManager.subscribe(updateUploads);

  // Set callbacks
  dragDropManager.onComplete((item) => {
    console.log('Upload completed:', item.file.name);
    updateUploads();
  });

  dragDropManager.onError((item, error) => {
    console.error('Upload failed:', item.file.name, error);
    updateUploads();
  });

  dragDropManager.onProgress((_item) => {
    updateUploads();
  });

  // Initial update
  updateUploads();

  // Cleanup
  onUnmounted(() => {
    unsubscribe();
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
    clearAutoHideTimer();
  });
});

// Watch for position changes
watch([x, y], ([newX, newY]) => {
  const widget = document.querySelector('.upload-progress-widget') as HTMLElement;
  if (widget) {
    widget.style.left = `${newX}px`;
    widget.style.top = `${newY}px`;
  }
});
</script>

<style scoped>
.upload-progress-widget {
  position: fixed;
  bottom: 60px;
  right: 20px;
  width: 400px;
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  box-shadow: 4px 4px 8px rgba(0, 0, 0, 0.4);
  font-family: 'Press Start 2P', monospace;
  z-index: 100002;
  max-height: 500px;
  display: flex;
  flex-direction: column;
}

.upload-progress-widget.minimized {
  max-height: 40px;
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #0055aa;
  color: #ffffff;
  padding: 6px 10px;
  font-size: 10px;
  cursor: move;
  user-select: none;
  border-bottom: 2px solid #000000;
}

.widget-title {
  font-weight: bold;
}

.widget-controls {
  display: flex;
  gap: 4px;
}

.widget-button {
  width: 20px;
  height: 20px;
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 8px;
  transition: all 0.1s;
}

.widget-button:hover {
  background: #b0b0b0;
}

.widget-button:active {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}

.widget-button.close {
  color: #ff0000;
  font-weight: bold;
}

.widget-content {
  flex: 1;
  overflow-y: auto;
  background: #ffffff;
  max-height: 460px;
}

.no-uploads {
  padding: 20px;
  text-align: center;
  font-size: 9px;
  color: #666666;
}

.uploads-list {
  display: flex;
  flex-direction: column;
}

.upload-item {
  padding: 10px;
  border-bottom: 1px solid #cccccc;
  background: #ffffff;
  transition: background 0.1s;
}

.upload-item:hover {
  background: #f5f5f5;
}

.upload-item.queued {
  opacity: 0.7;
}

.upload-item.completed {
  background: #e8f5e9;
}

.upload-info {
  margin-bottom: 6px;
}

.upload-name {
  font-size: 9px;
  color: #000000;
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.upload-details {
  display: flex;
  gap: 8px;
  font-size: 7px;
  color: #666666;
  flex-wrap: wrap;
}

.upload-size,
.upload-speed,
.upload-time,
.upload-status-text {
  display: inline-block;
}

.upload-progress-bar {
  position: relative;
  height: 14px;
  background: #cccccc;
  border: 1px solid #000000;
  margin: 6px 0;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(to right, #0055aa, #0077dd);
  transition: width 0.3s ease;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 7px;
  color: #000000;
  font-weight: bold;
  text-shadow: 0 0 2px #ffffff;
}

.upload-actions {
  display: flex;
  gap: 4px;
  margin-top: 6px;
}

.action-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 3px 8px;
  font-size: 7px;
  cursor: pointer;
  font-family: 'Press Start 2P', monospace;
  color: #000000;
  transition: all 0.1s;
}

.action-button:hover {
  background: #b0b0b0;
}

.action-button:active {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}

.action-button.cancel {
  color: #ff0000;
}

.action-button.resume {
  color: #00aa00;
}

.action-button.open {
  color: #0055aa;
}

.upload-status {
  margin-top: 4px;
  font-size: 7px;
  font-weight: bold;
}

.upload-status.success {
  color: #00aa00;
}

.upload-status.error {
  color: #ff0000;
}

.widget-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  background: #e0e0e0;
  border-top: 1px solid #cccccc;
}

.cancel-all {
  font-size: 7px;
  padding: 4px 8px;
}

.overall-progress {
  font-size: 7px;
  color: #666666;
}

/* Scrollbar styling */
.widget-content::-webkit-scrollbar {
  width: 12px;
}

.widget-content::-webkit-scrollbar-track {
  background: #cccccc;
}

.widget-content::-webkit-scrollbar-thumb {
  background: #888888;
  border: 1px solid #000000;
}

.widget-content::-webkit-scrollbar-thumb:hover {
  background: #666666;
}
</style>

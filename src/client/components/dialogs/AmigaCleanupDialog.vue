<template>
  <div v-if="visible" class="cleanup-dialog-overlay" @click.self="handleCancel">
    <div class="cleanup-dialog">
      <!-- Title bar -->
      <div class="dialog-title-bar">
        <div class="title-text">Cleanup Confirmation</div>
        <div class="title-button" @click="handleCancel">✕</div>
      </div>

      <!-- Content -->
      <div class="dialog-content">
        <!-- Warning message -->
        <div class="warning-section">
          <div class="warning-icon">⚠</div>
          <div class="warning-text">
            <div class="warning-title">{{ title }}</div>
            <div class="warning-description">{{ description }}</div>
          </div>
        </div>

        <!-- Items to be affected -->
        <div v-if="items.length > 0" class="items-section">
          <div class="items-header">
            <span class="items-count">{{ items.length }} item(s) will be affected:</span>
            <span class="items-size">{{ formatBytes(totalSize) }} to be freed</span>
          </div>

          <div class="items-list">
            <div
              v-for="(item, index) in displayedItems"
              :key="index"
              class="item-entry"
            >
              <span class="item-icon">{{ getItemIcon(item) }}</span>
              <span class="item-path">{{ item }}</span>
            </div>
            <div v-if="items.length > maxDisplayItems" class="item-entry more-items">
              ... and {{ items.length - maxDisplayItems }} more items
            </div>
          </div>
        </div>

        <!-- Options -->
        <div class="options-section">
          <label class="option-checkbox">
            <input
              v-model="moveToTrash"
              type="checkbox"
              :disabled="!canMoveToTrash"
            />
            <span class="checkbox-label">Move to Trash (can be restored)</span>
          </label>

          <label class="option-checkbox">
            <input v-model="confirmed" type="checkbox" />
            <span class="checkbox-label checkbox-required">
              I understand this action {{ moveToTrash ? 'will move' : 'will permanently delete' }} these items
            </span>
          </label>
        </div>

        <!-- Progress bar (during cleanup) -->
        <div v-if="isProcessing" class="progress-section">
          <div class="progress-label">
            {{ progressMessage }}
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
          </div>
          <div class="progress-stats">
            {{ processedCount }} / {{ totalCount }} items processed
          </div>
        </div>

        <!-- Error messages -->
        <div v-if="errors.length > 0" class="errors-section">
          <div class="errors-header">⚠ Errors occurred:</div>
          <div class="errors-list">
            <div v-for="(error, index) in errors" :key="index" class="error-entry">
              {{ error }}
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="dialog-actions">
        <button
          class="amiga-button"
          :disabled="!confirmed || isProcessing"
          @click="handleConfirm"
        >
          {{ confirmLabel }}
        </button>
        <button
          class="amiga-button"
          :disabled="isProcessing"
          @click="handleCancel"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';

export interface CleanupDialogProps {
  visible: boolean;
  title?: string;
  description?: string;
  items?: string[];
  totalSize?: number;
  action?: 'delete' | 'move' | 'compress';
  canMoveToTrash?: boolean;
}

const props = withDefaults(defineProps<CleanupDialogProps>(), {
  title: 'Confirm Cleanup',
  description: 'The following items will be removed from your system.',
  items: () => [],
  totalSize: 0,
  action: 'delete',
  canMoveToTrash: true
});

const emit = defineEmits<{
  confirm: [moveToTrash: boolean];
  cancel: [];
}>();

const confirmed = ref(false);
const moveToTrash = ref(true);
const isProcessing = ref(false);
const progressMessage = ref('');
const progressPercent = ref(0);
const processedCount = ref(0);
const totalCount = ref(0);
const errors = ref<string[]>([]);

const maxDisplayItems = 10;

const displayedItems = computed(() => {
  return props.items.slice(0, maxDisplayItems);
});

const confirmLabel = computed(() => {
  if (isProcessing.value) return 'Processing...';
  if (moveToTrash.value && props.canMoveToTrash) return 'Move to Trash';
  if (props.action === 'compress') return 'Compress';
  return 'Delete Permanently';
});

function handleConfirm(): void {
  if (!confirmed.value || isProcessing.value) return;

  emit('confirm', moveToTrash.value && props.canMoveToTrash);
}

function handleCancel(): void {
  if (isProcessing.value) return;

  // Reset state
  confirmed.value = false;
  moveToTrash.value = true;
  errors.value = [];

  emit('cancel');
}

function getItemIcon(path: string): string {
  if (path.includes('.')) {
    const ext = path.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'txt':
      case 'doc':
        return '📄';
      case 'jpg':
      case 'png':
      case 'gif':
        return '🖼';
      case 'mp3':
      case 'wav':
        return '🎵';
      case 'mp4':
      case 'avi':
        return '🎬';
      case 'zip':
      case 'rar':
        return '📦';
      case 'tmp':
      case 'cache':
        return '🗑';
      default:
        return '📄';
    }
  }
  return '📁';
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// Expose methods for parent component
defineExpose({
  startProcessing: (message: string, total: number) => {
    isProcessing.value = true;
    progressMessage.value = message;
    totalCount.value = total;
    processedCount.value = 0;
    progressPercent.value = 0;
  },
  updateProgress: (processed: number, message?: string) => {
    processedCount.value = processed;
    progressPercent.value = (processed / totalCount.value) * 100;
    if (message) progressMessage.value = message;
  },
  finishProcessing: () => {
    isProcessing.value = false;
    progressPercent.value = 100;
  },
  addError: (error: string) => {
    errors.value.push(error);
  },
  clearErrors: () => {
    errors.value = [];
  }
});
</script>

<style scoped>
.cleanup-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  font-family: 'Press Start 2P', monospace;
}

.cleanup-dialog {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  box-shadow: 4px 4px 8px rgba(0, 0, 0, 0.5);
  min-width: 500px;
  max-width: 700px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.dialog-title-bar {
  background: #0055aa;
  color: #ffffff;
  padding: 6px 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #000000;
}

.title-text {
  font-size: 10px;
  font-weight: bold;
}

.title-button {
  cursor: pointer;
  font-size: 12px;
  padding: 0 4px;
  transition: all 0.1s;
}

.title-button:hover {
  background: rgba(255, 255, 255, 0.2);
}

.dialog-content {
  padding: 16px;
  overflow-y: auto;
  flex: 1;
}

.warning-section {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px;
  background: #ffaa00;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
}

.warning-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.warning-title {
  font-size: 10px;
  font-weight: bold;
  margin-bottom: 6px;
  color: #000000;
}

.warning-description {
  font-size: 8px;
  color: #333333;
  line-height: 1.5;
}

.items-section {
  margin-bottom: 16px;
}

.items-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 2px solid #666666;
}

.items-count {
  font-size: 8px;
  color: #000000;
  font-weight: bold;
}

.items-size {
  font-size: 8px;
  color: #0055aa;
  font-weight: bold;
}

.items-list {
  max-height: 200px;
  overflow-y: auto;
  background: #000000;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 8px;
}

.item-entry {
  display: flex;
  gap: 6px;
  align-items: center;
  font-size: 7px;
  color: #00ff00;
  padding: 2px 0;
  font-family: 'Courier New', monospace;
}

.item-icon {
  flex-shrink: 0;
}

.item-path {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.more-items {
  color: #ffaa00;
  font-style: italic;
}

.options-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
  padding: 12px;
  background: #888888;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
}

.option-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 8px;
  color: #000000;
}

.option-checkbox input[type='checkbox'] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.option-checkbox input[type='checkbox']:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.checkbox-label {
  line-height: 1.4;
}

.checkbox-required {
  font-weight: bold;
}

.progress-section {
  margin-bottom: 16px;
  padding: 12px;
  background: #000000;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
}

.progress-label {
  font-size: 8px;
  color: #ffaa00;
  margin-bottom: 8px;
}

.progress-bar {
  height: 20px;
  background: #333333;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  margin-bottom: 6px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #00ff00 0%, #00aa00 100%);
  transition: width 0.3s ease;
}

.progress-stats {
  font-size: 7px;
  color: #00ff00;
  text-align: right;
}

.errors-section {
  margin-bottom: 16px;
  padding: 12px;
  background: #cc0000;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
}

.errors-header {
  font-size: 9px;
  color: #ffffff;
  font-weight: bold;
  margin-bottom: 8px;
}

.errors-list {
  max-height: 100px;
  overflow-y: auto;
}

.error-entry {
  font-size: 7px;
  color: #ffcccc;
  padding: 2px 0;
  line-height: 1.4;
}

.dialog-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 12px 16px;
  background: #888888;
  border-top: 2px solid #000000;
}

.amiga-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 6px 16px;
  font-size: 9px;
  cursor: pointer;
  color: #000000;
  font-family: 'Press Start 2P', monospace;
  font-weight: bold;
  transition: all 0.1s;
}

.amiga-button:hover:not(:disabled) {
  background: #b0b0b0;
}

.amiga-button:active:not(:disabled) {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}

.amiga-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>

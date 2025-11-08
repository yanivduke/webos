<template>
  <div class="capture-preview-overlay" @click="handleOverlayClick">
    <div class="capture-preview-modal" @click.stop>
      <!-- Modal Header -->
      <div class="modal-header">
        <div class="modal-title">{{ capture?.type === 'screenshot' ? 'Screenshot' : 'Recording' }} Preview</div>
        <button class="close-button" @click="close">×</button>
      </div>

      <!-- Modal Body -->
      <div class="modal-body">
        <!-- Preview Area -->
        <div class="preview-container">
          <div class="preview-media">
            <img
              v-if="capture?.type === 'screenshot'"
              :src="capture.dataUrl"
              alt="Screenshot preview"
            />
            <video
              v-else-if="capture?.type === 'recording'"
              :src="capture.dataUrl"
              controls
              autoplay
            ></video>
          </div>
        </div>

        <!-- Info Panel -->
        <div class="info-panel">
          <div class="info-row">
            <span class="info-label">Size:</span>
            <span class="info-value">{{ capture?.width }} x {{ capture?.height }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Format:</span>
            <span class="info-value">{{ capture?.format.toUpperCase() }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">File Size:</span>
            <span class="info-value">{{ formatSize(capture?.size || 0) }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Captured:</span>
            <span class="info-value">{{ formatTimestamp(capture?.timestamp) }}</span>
          </div>
        </div>

        <!-- Filename Input -->
        <div class="filename-section">
          <label class="filename-label">Filename:</label>
          <input
            v-model="filename"
            type="text"
            class="filename-input"
            @keydown.enter="handleSave"
          />
          <span class="filename-extension">.{{ fileExtension }}</span>
        </div>

        <!-- Action Buttons -->
        <div class="action-bar">
          <button
            v-if="capture?.type === 'screenshot'"
            class="amiga-button"
            @click="handleCopy"
          >
            Copy to Clipboard
          </button>
          <button class="amiga-button primary" @click="handleSave">
            Save to Files
          </button>
          <button class="amiga-button" @click="handleDownload">
            Download
          </button>
          <button class="amiga-button danger" @click="handleDelete">
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import type { CaptureResult } from '../utils/screen-capture';

interface Props {
  capture: CaptureResult | null;
}

interface Emits {
  (e: 'close'): void;
  (e: 'save', capture: CaptureResult, filename: string): void;
  (e: 'copy', capture: CaptureResult): void;
  (e: 'delete', captureId: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// State
const filename = ref('');

// Computed
const fileExtension = computed(() => {
  if (!props.capture) return 'png';
  return props.capture.type === 'screenshot' ? props.capture.format : 'webm';
});

// Watch for capture changes to update filename
watch(() => props.capture, (newCapture) => {
  if (newCapture) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    filename.value = `${newCapture.type}_${timestamp}`;
  }
}, { immediate: true });

// Methods
const close = () => {
  emit('close');
};

const handleOverlayClick = () => {
  close();
};

const handleSave = () => {
  if (!props.capture || !filename.value) return;

  const fullFilename = `${filename.value}.${fileExtension.value}`;
  emit('save', props.capture, fullFilename);
};

const handleCopy = () => {
  if (!props.capture) return;
  emit('copy', props.capture);
};

const handleDelete = () => {
  if (!props.capture) return;

  if (confirm('Delete this capture?')) {
    emit('delete', props.capture.id);
  }
};

const handleDownload = () => {
  if (!props.capture) return;

  const link = document.createElement('a');
  link.href = props.capture.dataUrl;
  link.download = `${filename.value}.${fileExtension.value}`;
  link.click();
};

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const formatTimestamp = (timestamp?: Date): string => {
  if (!timestamp) return '';

  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};
</script>

<style scoped>
.capture-preview-overlay {
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
  padding: 20px;
}

.capture-preview-modal {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  box-shadow: 4px 4px 8px rgba(0, 0, 0, 0.5);
  max-width: 800px;
  max-height: 90vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  font-family: 'Press Start 2P', monospace;
}

/* Modal Header */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #0055aa;
  border-bottom: 2px solid #000000;
  color: #ffffff;
}

.modal-title {
  font-size: 10px;
  font-weight: bold;
}

.close-button {
  background: #ff0000;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  color: #ffffff;
  width: 24px;
  height: 24px;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  transition: all 0.05s;
}

.close-button:hover {
  background: #cc0000;
}

.close-button:active {
  border-color: #000000 #ffffff #ffffff #000000;
}

/* Modal Body */
.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Preview Container */
.preview-container {
  background: #000000;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 4px;
}

.preview-media {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  max-height: 400px;
}

.preview-media img,
.preview-media video {
  max-width: 100%;
  max-height: 400px;
  width: auto;
  height: auto;
  object-fit: contain;
}

/* Info Panel */
.info-panel {
  background: #ffffff;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 8px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  font-size: 8px;
  border-bottom: 1px solid #cccccc;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  color: #666666;
  font-weight: bold;
}

.info-value {
  color: #000000;
}

/* Filename Section */
.filename-section {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #ffffff;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 8px;
}

.filename-label {
  font-size: 8px;
  color: #000000;
  font-weight: bold;
  white-space: nowrap;
}

.filename-input {
  flex: 1;
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 4px 6px;
  font-size: 8px;
  font-family: 'Press Start 2P', monospace;
  color: #000000;
}

.filename-input:focus {
  outline: none;
  border-color: #0055aa #ffffff #ffffff #0055aa;
}

.filename-extension {
  font-size: 8px;
  color: #666666;
  white-space: nowrap;
}

/* Action Bar */
.action-bar {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  padding-top: 8px;
  border-top: 2px solid #888888;
}

.amiga-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 6px 10px;
  font-size: 8px;
  cursor: pointer;
  color: #000000;
  font-family: 'Press Start 2P', monospace;
  transition: all 0.05s;
  flex: 1;
  min-width: 100px;
}

.amiga-button.primary {
  background: #0055aa;
  color: #ffffff;
}

.amiga-button.danger {
  background: #ff0000;
  color: #ffffff;
}

.amiga-button:hover {
  filter: brightness(1.1);
}

.amiga-button:active {
  border-color: #000000 #ffffff #ffffff #000000;
}

/* Scrollbar */
.modal-body::-webkit-scrollbar {
  width: 12px;
}

.modal-body::-webkit-scrollbar-track {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
}

.modal-body::-webkit-scrollbar-thumb {
  background: #888888;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
}

.modal-body::-webkit-scrollbar-thumb:hover {
  background: #666666;
}

/* Responsive */
@media (max-width: 600px) {
  .capture-preview-modal {
    max-width: 100%;
    max-height: 100%;
  }

  .action-bar {
    flex-direction: column;
  }

  .amiga-button {
    width: 100%;
  }
}
</style>

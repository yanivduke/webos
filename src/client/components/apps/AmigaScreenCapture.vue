<template>
  <div class="amiga-screen-capture">
    <!-- Toolbar -->
    <div class="capture-toolbar">
      <div class="toolbar-title">Screen Capture</div>
      <div class="toolbar-status" :class="{ recording: isRecording }">
        {{ statusText }}
      </div>
    </div>

    <!-- Main Content -->
    <div class="capture-content">
      <!-- Screenshot Section -->
      <div class="capture-section">
        <div class="section-header">
          <div class="section-icon">📸</div>
          <div class="section-title">Screenshot</div>
        </div>

        <div class="section-body">
          <div class="control-group">
            <label class="control-label">Capture Mode</label>
            <div class="button-group">
              <button
                class="mode-button"
                :class="{ active: captureMode === 'full-desktop' }"
                @click="captureMode = 'full-desktop'"
              >
                Desktop
              </button>
              <button
                class="mode-button"
                :class="{ active: captureMode === 'active-window' }"
                @click="captureMode = 'active-window'"
              >
                Window
              </button>
              <button
                class="mode-button"
                :class="{ active: captureMode === 'area' }"
                @click="captureMode = 'area'"
              >
                Area
              </button>
            </div>
          </div>

          <div class="control-group">
            <label class="control-label">Format</label>
            <div class="button-group">
              <button
                class="mode-button"
                :class="{ active: captureFormat === 'png' }"
                @click="captureFormat = 'png'"
              >
                PNG
              </button>
              <button
                class="mode-button"
                :class="{ active: captureFormat === 'jpeg' }"
                @click="captureFormat = 'jpeg'"
              >
                JPG
              </button>
              <button
                class="mode-button"
                :class="{ active: captureFormat === 'webp' }"
                @click="captureFormat = 'webp'"
              >
                WebP
              </button>
            </div>
          </div>

          <div class="control-group">
            <label class="control-label">Countdown</label>
            <div class="button-group">
              <button
                class="mode-button small"
                :class="{ active: countdown === 0 }"
                @click="countdown = 0"
              >
                None
              </button>
              <button
                class="mode-button small"
                :class="{ active: countdown === 3 }"
                @click="countdown = 3"
              >
                3s
              </button>
              <button
                class="mode-button small"
                :class="{ active: countdown === 5 }"
                @click="countdown = 5"
              >
                5s
              </button>
              <button
                class="mode-button small"
                :class="{ active: countdown === 10 }"
                @click="countdown = 10"
              >
                10s
              </button>
            </div>
          </div>

          <div class="action-buttons">
            <button class="amiga-button primary" @click="takeScreenshot" :disabled="capturing">
              {{ capturing ? 'Capturing...' : 'Take Screenshot' }}
            </button>
          </div>

          <!-- Last Screenshot Preview -->
          <div v-if="lastScreenshot" class="preview-area">
            <div class="preview-label">Last Screenshot</div>
            <div class="preview-image" @click="previewCapture(lastScreenshot)">
              <img :src="lastScreenshot.dataUrl" alt="Last screenshot" />
            </div>
            <div class="preview-actions">
              <button class="amiga-button small" @click="copyToClipboard(lastScreenshot)">
                Copy
              </button>
              <button class="amiga-button small" @click="saveCapture(lastScreenshot)">
                Save
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Screen Recording Section -->
      <div class="capture-section">
        <div class="section-header">
          <div class="section-icon">🎥</div>
          <div class="section-title">Screen Recording</div>
        </div>

        <div class="section-body">
          <div class="control-group">
            <label class="control-label">Quality</label>
            <div class="button-group">
              <button
                class="mode-button"
                :class="{ active: recordingQuality === 'low' }"
                @click="recordingQuality = 'low'"
                :disabled="isRecording"
              >
                Low
              </button>
              <button
                class="mode-button"
                :class="{ active: recordingQuality === 'medium' }"
                @click="recordingQuality = 'medium'"
                :disabled="isRecording"
              >
                Medium
              </button>
              <button
                class="mode-button"
                :class="{ active: recordingQuality === 'high' }"
                @click="recordingQuality = 'high'"
                :disabled="isRecording"
              >
                High
              </button>
            </div>
          </div>

          <div class="control-group">
            <label class="control-label checkbox-label">
              <input
                type="checkbox"
                v-model="includeAudio"
                :disabled="isRecording"
              />
              Include Audio
            </label>
          </div>

          <div class="control-group">
            <label class="control-label">Max Duration: {{ maxDuration }}s</label>
            <input
              type="range"
              v-model.number="maxDuration"
              min="10"
              max="300"
              step="10"
              class="slider"
              :disabled="isRecording"
            />
          </div>

          <div class="action-buttons">
            <button
              v-if="!isRecording"
              class="amiga-button primary"
              @click="startRecording"
            >
              Start Recording
            </button>
            <button
              v-else
              class="amiga-button danger"
              @click="stopRecording"
            >
              Stop Recording ({{ recordingDuration }}s)
            </button>
          </div>

          <!-- Last Recording Preview -->
          <div v-if="lastRecording" class="preview-area">
            <div class="preview-label">Last Recording</div>
            <div class="preview-video" @click="previewCapture(lastRecording)">
              <video :src="lastRecording.dataUrl" controls></video>
            </div>
            <div class="preview-actions">
              <button class="amiga-button small" @click="saveCapture(lastRecording)">
                Save
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- History Section -->
      <div class="capture-section full-width">
        <div class="section-header">
          <div class="section-icon">📂</div>
          <div class="section-title">History ({{ captureHistory.length }})</div>
          <div class="section-actions">
            <button class="amiga-button tiny" @click="clearHistory">Clear All</button>
          </div>
        </div>

        <div class="history-grid">
          <div
            v-for="capture in captureHistory"
            :key="capture.id"
            class="history-item"
            @click="previewCapture(capture)"
          >
            <div class="history-thumbnail">
              <img v-if="capture.type === 'screenshot'" :src="capture.dataUrl" alt="Screenshot" />
              <video v-else :src="capture.dataUrl"></video>
              <div class="history-type">{{ capture.type === 'screenshot' ? '📸' : '🎥' }}</div>
            </div>
            <div class="history-info">
              <div class="history-time">{{ formatTime(capture.timestamp) }}</div>
              <div class="history-size">{{ formatSize(capture.size) }}</div>
            </div>
            <button
              class="history-delete"
              @click.stop="deleteCapture(capture.id)"
              title="Delete"
            >
              ×
            </button>
          </div>
          <div v-if="captureHistory.length === 0" class="empty-message">
            No captures yet. Take a screenshot or start recording!
          </div>
        </div>
      </div>
    </div>

    <!-- Preview Modal -->
    <AmigaCapturePreview
      v-if="previewVisible"
      :capture="selectedCapture"
      @close="closePreview"
      @save="handleSave"
      @copy="copyToClipboard"
      @delete="handleDelete"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { screenCapture, type CaptureResult, type CaptureMode, type CaptureFormat, type RecordingQuality } from '../../utils/screen-capture';
import AmigaCapturePreview from '../AmigaCapturePreview.vue';

// Screenshot settings
const captureMode = ref<CaptureMode>('full-desktop');
const captureFormat = ref<CaptureFormat>('png');
const countdown = ref(0);
const capturing = ref(false);
const lastScreenshot = ref<CaptureResult | null>(null);

// Recording settings
const recordingQuality = ref<RecordingQuality>('medium');
const includeAudio = ref(false);
const maxDuration = ref(60);
const recordingDuration = ref(0);
const lastRecording = ref<CaptureResult | null>(null);

// History
const captureHistory = ref<CaptureResult[]>([]);

// Preview
const selectedCapture = ref<CaptureResult | null>(null);
const previewVisible = ref(false);

// Recording timer
let recordingTimer: number | undefined;

// Computed
const isRecording = computed(() => screenCapture.isRecording());

const statusText = computed(() => {
  if (capturing.value) {
    return countdown.value > 0 ? `Countdown: ${countdown.value}s` : 'Capturing...';
  }
  if (isRecording.value) {
    return `Recording: ${recordingDuration.value}s`;
  }
  return 'Ready';
});

// Methods
const takeScreenshot = async () => {
  try {
    capturing.value = true;

    const result = await screenCapture.takeScreenshot({
      mode: captureMode.value,
      format: captureFormat.value,
      quality: captureFormat.value === 'png' ? undefined : 0.95,
      countdown: countdown.value
    });

    lastScreenshot.value = result;
    loadHistory();
  } catch (error) {
    console.error('Screenshot failed:', error);
    alert('Screenshot failed: ' + (error as Error).message);
  } finally {
    capturing.value = false;
  }
};

const startRecording = async () => {
  try {
    await screenCapture.startRecording({
      quality: recordingQuality.value,
      includeAudio: includeAudio.value,
      maxDuration: maxDuration.value
    });

    // Start recording timer
    recordingTimer = window.setInterval(() => {
      recordingDuration.value = screenCapture.getRecordingDuration();
    }, 100);

  } catch (error) {
    console.error('Recording failed:', error);
    alert('Recording failed: ' + (error as Error).message);
  }
};

const stopRecording = async () => {
  try {
    await screenCapture.stopRecording();

    // Stop recording timer
    if (recordingTimer) {
      clearInterval(recordingTimer);
      recordingTimer = undefined;
    }

    recordingDuration.value = 0;

    // Wait a bit for the recording to be processed
    setTimeout(() => {
      loadHistory();
      const recordings = captureHistory.value.filter(c => c.type === 'recording');
      if (recordings.length > 0) {
        lastRecording.value = recordings[0];
      }
    }, 500);

  } catch (error) {
    console.error('Stop recording failed:', error);
    alert('Stop recording failed: ' + (error as Error).message);
  }
};

const copyToClipboard = async (capture: CaptureResult) => {
  try {
    await screenCapture.copyToClipboard(capture);
    alert('Copied to clipboard!');
  } catch (error) {
    console.error('Copy failed:', error);
    alert('Failed to copy to clipboard');
  }
};

const saveCapture = async (capture: CaptureResult) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const extension = capture.type === 'screenshot' ? capture.format : 'webm';
  const filename = `${capture.type}_${timestamp}.${extension}`;

  try {
    await screenCapture.saveToFiles(capture, filename);
    alert(`Saved as ${filename} in dh0/Screenshots/`);
  } catch (error) {
    console.error('Save failed:', error);
    alert('Failed to save capture');
  }
};

const previewCapture = (capture: CaptureResult) => {
  selectedCapture.value = capture;
  previewVisible.value = true;
};

const closePreview = () => {
  selectedCapture.value = null;
  previewVisible.value = false;
};

const handleSave = async (capture: CaptureResult, filename: string) => {
  try {
    await screenCapture.saveToFiles(capture, filename);
    alert(`Saved as ${filename}`);
    closePreview();
  } catch (error) {
    console.error('Save failed:', error);
    alert('Failed to save capture');
  }
};

const handleDelete = (captureId: string) => {
  deleteCapture(captureId);
  closePreview();
};

const deleteCapture = (captureId: string) => {
  if (confirm('Delete this capture?')) {
    screenCapture.deleteCapture(captureId);
    loadHistory();

    // Clear last refs if deleted
    if (lastScreenshot.value?.id === captureId) {
      lastScreenshot.value = null;
    }
    if (lastRecording.value?.id === captureId) {
      lastRecording.value = null;
    }
  }
};

const clearHistory = () => {
  if (confirm('Clear all capture history?')) {
    screenCapture.clearHistory();
    loadHistory();
    lastScreenshot.value = null;
    lastRecording.value = null;
  }
};

const loadHistory = () => {
  captureHistory.value = screenCapture.getHistory();
};

const formatTime = (timestamp: Date): string => {
  const now = new Date();
  const diff = now.getTime() - timestamp.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
};

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
};

// Lifecycle
onMounted(() => {
  loadHistory();

  // Subscribe to capture events
  const unsubscribe = screenCapture.subscribe(() => {
    loadHistory();
  });

  onUnmounted(() => {
    unsubscribe();
    if (recordingTimer) {
      clearInterval(recordingTimer);
    }
  });
});
</script>

<style scoped>
.amiga-screen-capture {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #a0a0a0;
  font-family: 'Press Start 2P', monospace;
}

/* Toolbar */
.capture-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background: #ffffff;
  border-bottom: 2px solid #000000;
}

.toolbar-title {
  font-size: 10px;
  font-weight: bold;
  color: #000000;
}

.toolbar-status {
  font-size: 8px;
  color: #0055aa;
  padding: 2px 6px;
  background: #e0e0e0;
  border: 1px solid #999999;
}

.toolbar-status.recording {
  color: #ff0000;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0.5; }
}

/* Content */
.capture-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-content: flex-start;
}

/* Section */
.capture-section {
  background: #ffffff;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  flex: 1;
  min-width: 300px;
}

.capture-section.full-width {
  flex-basis: 100%;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: #0055aa;
  border-bottom: 2px solid #000000;
  color: #ffffff;
}

.section-icon {
  font-size: 14px;
}

.section-title {
  flex: 1;
  font-size: 9px;
  font-weight: bold;
}

.section-actions {
  display: flex;
  gap: 4px;
}

.section-body {
  padding: 8px;
}

/* Control Group */
.control-group {
  margin-bottom: 12px;
}

.control-label {
  display: block;
  font-size: 8px;
  color: #000000;
  margin-bottom: 4px;
  font-weight: bold;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 14px;
  height: 14px;
  cursor: pointer;
}

/* Button Group */
.button-group {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.mode-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 4px 8px;
  font-size: 8px;
  cursor: pointer;
  color: #000000;
  font-family: 'Press Start 2P', monospace;
  transition: all 0.05s;
  flex: 1;
  min-width: 60px;
}

.mode-button.small {
  min-width: 40px;
  padding: 3px 6px;
  font-size: 7px;
}

.mode-button.active {
  background: #0055aa;
  color: #ffffff;
  border-color: #000000 #ffffff #ffffff #000000;
}

.mode-button:hover:not(:disabled):not(.active) {
  background: #b0b0b0;
}

.mode-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Slider */
.slider {
  width: 100%;
  height: 20px;
  cursor: pointer;
}

/* Action Buttons */
.action-buttons {
  margin-top: 12px;
  display: flex;
  gap: 4px;
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

.amiga-button.primary {
  background: #0055aa;
  color: #ffffff;
}

.amiga-button.danger {
  background: #ff0000;
  color: #ffffff;
}

.amiga-button.small {
  padding: 4px 8px;
  font-size: 7px;
}

.amiga-button.tiny {
  padding: 2px 6px;
  font-size: 6px;
}

.amiga-button:hover:not(:disabled) {
  filter: brightness(1.1);
}

.amiga-button:active:not(:disabled) {
  border-color: #000000 #ffffff #ffffff #000000;
}

.amiga-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Preview Area */
.preview-area {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #cccccc;
}

.preview-label {
  font-size: 8px;
  color: #666666;
  margin-bottom: 6px;
}

.preview-image,
.preview-video {
  background: #000000;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 4px;
  cursor: pointer;
  margin-bottom: 6px;
}

.preview-image img,
.preview-video video {
  display: block;
  width: 100%;
  height: auto;
  max-height: 150px;
  object-fit: contain;
}

.preview-actions {
  display: flex;
  gap: 4px;
}

/* History Grid */
.history-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 8px;
  padding: 8px;
}

.history-item {
  position: relative;
  background: #ffffff;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  cursor: pointer;
  transition: all 0.05s;
}

.history-item:hover {
  border-color: #0055aa;
  box-shadow: 0 0 4px rgba(0, 85, 170, 0.5);
}

.history-thumbnail {
  position: relative;
  aspect-ratio: 16 / 9;
  background: #000000;
  overflow: hidden;
}

.history-thumbnail img,
.history-thumbnail video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.history-type {
  position: absolute;
  top: 4px;
  right: 4px;
  font-size: 16px;
  text-shadow: 0 0 4px #000000;
}

.history-info {
  padding: 4px;
  font-size: 6px;
  color: #666666;
  display: flex;
  justify-content: space-between;
}

.history-delete {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: #ff0000;
  color: #ffffff;
  border: 1px solid #000000;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.1s;
}

.history-item:hover .history-delete {
  opacity: 1;
}

.history-delete:hover {
  background: #cc0000;
}

.empty-message {
  grid-column: 1 / -1;
  padding: 40px 20px;
  text-align: center;
  color: #999999;
  font-size: 8px;
}

/* Scrollbar */
.capture-content::-webkit-scrollbar {
  width: 12px;
}

.capture-content::-webkit-scrollbar-track {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
}

.capture-content::-webkit-scrollbar-thumb {
  background: #888888;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
}

.capture-content::-webkit-scrollbar-thumb:hover {
  background: #666666;
}
</style>

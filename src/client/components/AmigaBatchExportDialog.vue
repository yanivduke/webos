<template>
  <div v-if="visible" class="batch-export-dialog-overlay" @click.self="close">
    <div class="batch-export-dialog">
      <div class="dialog-titlebar">
        <div class="dialog-title">Batch Export Files ({{ fileCount }} selected)</div>
        <div class="close-button" @click="close">×</div>
      </div>

      <div class="dialog-content">
        <div class="export-form">
          <div class="form-group">
            <label class="form-label">Export Format:</label>
            <div class="format-grid">
              <button
                v-for="format in formats"
                :key="format.value"
                class="format-button"
                :class="{ selected: selectedFormat === format.value }"
                @click="selectedFormat = format.value"
              >
                <div class="format-icon">{{ format.icon }}</div>
                <div class="format-label">{{ format.label }}</div>
              </button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">
              <input v-model="addPrefix" type="checkbox" class="amiga-checkbox" />
              Add prefix to filenames
            </label>
            <input
              v-if="addPrefix"
              v-model="prefix"
              type="text"
              class="amiga-input"
              placeholder="prefix_"
            />
          </div>

          <div class="file-list">
            <div class="list-header">Files to export:</div>
            <div class="list-items">
              <div v-for="file in files" :key="file.id" class="list-item">
                {{ file.name }}
              </div>
            </div>
          </div>

          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>

          <div v-if="isExporting" class="exporting-message">
            <div>Exporting {{ currentExportIndex + 1 }} of {{ fileCount }}...</div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="dialog-actions">
        <button class="amiga-button" @click="handleExport" :disabled="isExporting">
          Export All
        </button>
        <button class="amiga-button" @click="close" :disabled="isExporting">
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import ExportManager from '../utils/export-manager';

interface FileItem {
  id: string;
  name: string;
  path?: string;
}

interface Props {
  visible: boolean;
  files: FileItem[];
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  files: () => []
});

const emit = defineEmits<{
  close: [];
  exported: [count: number];
}>();

const formats = [
  { value: 'pdf', label: 'PDF', icon: '📄' },
  { value: 'xlsx', label: 'Excel', icon: '📊' },
  { value: 'docx', label: 'Word', icon: '📝' },
  { value: 'csv', label: 'CSV', icon: '📋' },
  { value: 'txt', label: 'Text', icon: '📃' }
];

const selectedFormat = ref('pdf');
const addPrefix = ref(false);
const prefix = ref('export_');
const errorMessage = ref('');
const isExporting = ref(false);
const currentExportIndex = ref(0);

const fileCount = computed(() => props.files.length);

const progressPercent = computed(() => {
  if (fileCount.value === 0) return 0;
  return Math.round((currentExportIndex.value / fileCount.value) * 100);
});

watch(() => props.visible, (newVal) => {
  if (newVal) {
    errorMessage.value = '';
    isExporting.value = false;
    currentExportIndex.value = 0;
  }
});

const close = () => {
  if (!isExporting.value) {
    emit('close');
  }
};

const getExportFileName = (originalName: string): string => {
  // Remove existing extension
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');

  // Add prefix if enabled
  const baseName = addPrefix.value ? `${prefix.value}${nameWithoutExt}` : nameWithoutExt;

  return `${baseName}.${selectedFormat.value}`;
};

const handleExport = async () => {
  if (fileCount.value === 0) {
    errorMessage.value = 'No files to export';
    return;
  }

  errorMessage.value = '';
  isExporting.value = true;
  currentExportIndex.value = 0;

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < props.files.length; i++) {
    const file = props.files[i];
    currentExportIndex.value = i;

    try {
      const fileName = getExportFileName(file.name);
      const options = {
        fileName,
        path: file.path
      };

      await ExportManager.exportTo(selectedFormat.value, options);
      successCount++;

      // Small delay between exports to prevent overwhelming the browser
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Failed to export ${file.name}:`, error);
      failCount++;
    }
  }

  currentExportIndex.value = props.files.length;
  isExporting.value = false;

  if (failCount > 0) {
    errorMessage.value = `Exported ${successCount} file(s). ${failCount} failed.`;
    setTimeout(() => {
      emit('close');
    }, 2000);
  } else {
    emit('exported', successCount);
    emit('close');
  }
};
</script>

<style scoped>
.batch-export-dialog-overlay {
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

.batch-export-dialog {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  box-shadow: 4px 4px 8px rgba(0, 0, 0, 0.5);
  min-width: 450px;
  max-width: 600px;
  font-family: 'Press Start 2P', monospace;
}

.dialog-titlebar {
  background: linear-gradient(180deg, #ffffff 0%, #c0c0c0 50%, #a0a0a0 100%);
  border-bottom: 2px solid #000000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  height: 24px;
}

.dialog-title {
  font-size: 10px;
  font-weight: bold;
  color: #000000;
}

.close-button {
  width: 18px;
  height: 18px;
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #ff6600;
  font-weight: bold;
  line-height: 1;
}

.close-button:hover {
  background: #b0b0b0;
}

.close-button:active {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}

.dialog-content {
  padding: 16px;
  background: #ffffff;
  border: 2px solid;
  border-color: #808080 #ffffff #ffffff #808080;
  margin: 4px;
  max-height: 500px;
  overflow-y: auto;
}

.export-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 9px;
  color: #000000;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 8px;
}

.amiga-checkbox {
  width: 14px;
  height: 14px;
  cursor: pointer;
}

.amiga-input {
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 6px 8px;
  font-family: 'Press Start 2P', monospace;
  font-size: 9px;
  color: #000000;
  outline: none;
}

.amiga-input:focus {
  background: #ffffcc;
}

.format-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.format-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 8px 4px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  transition: all 0.1s;
  font-family: 'Press Start 2P', monospace;
}

.format-button:hover {
  background: #b0b0b0;
}

.format-button:active {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}

.format-button.selected {
  background: #0055aa;
  border-color: #0055aa;
}

.format-button.selected .format-label {
  color: #ffffff;
}

.format-icon {
  font-size: 20px;
}

.format-label {
  font-size: 7px;
  color: #000000;
  text-align: center;
}

.file-list {
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  background: #ffffff;
}

.list-header {
  font-size: 9px;
  font-weight: bold;
  padding: 6px;
  background: #0055aa;
  color: #ffffff;
  border-bottom: 2px solid #000000;
}

.list-items {
  max-height: 150px;
  overflow-y: auto;
}

.list-item {
  font-size: 9px;
  padding: 4px 8px;
  border-bottom: 1px solid #cccccc;
}

.list-item:last-child {
  border-bottom: none;
}

.error-message {
  padding: 8px;
  background: #ff6600;
  color: #ffffff;
  font-size: 8px;
  border: 2px solid #000000;
}

.exporting-message {
  padding: 8px;
  background: #0055aa;
  color: #ffffff;
  font-size: 8px;
  border: 2px solid #000000;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-bar {
  width: 100%;
  height: 16px;
  background: #ffffff;
  border: 2px solid #000000;
  border-color: #000000 #ffffff #ffffff #000000;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #00cc55;
  transition: width 0.3s ease;
}

.dialog-actions {
  display: flex;
  gap: 8px;
  padding: 8px;
  justify-content: flex-end;
  background: #a0a0a0;
}

.amiga-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 6px 16px;
  font-size: 9px;
  font-family: 'Press Start 2P', monospace;
  color: #000000;
  cursor: pointer;
  transition: all 0.1s;
}

.amiga-button:hover {
  background: #b0b0b0;
}

.amiga-button:active {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}

.amiga-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>

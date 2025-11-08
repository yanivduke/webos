<template>
  <div v-if="visible" class="export-dialog-overlay" @click.self="close">
    <div class="export-dialog">
      <div class="dialog-titlebar">
        <div class="dialog-title">Export File</div>
        <div class="close-button" @click="close">×</div>
      </div>

      <div class="dialog-content">
        <div class="export-form">
          <div class="form-group">
            <label class="form-label">File Name:</label>
            <input
              v-model="localFileName"
              type="text"
              class="amiga-input"
              placeholder="Enter file name"
            />
          </div>

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

          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>

          <div v-if="isExporting" class="exporting-message">
            Exporting to {{ selectedFormat.toUpperCase() }}...
          </div>
        </div>
      </div>

      <div class="dialog-actions">
        <button class="amiga-button" @click="handleExport" :disabled="isExporting">
          Export
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

interface Props {
  visible: boolean;
  fileName?: string;
  content?: string;
  path?: string;
  elementId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  fileName: 'export',
  content: '',
  path: '',
  elementId: ''
});

const emit = defineEmits<{
  close: [];
  exported: [format: string];
}>();

const formats = [
  { value: 'pdf', label: 'PDF', icon: '📄' },
  { value: 'xlsx', label: 'Excel', icon: '📊' },
  { value: 'docx', label: 'Word', icon: '📝' },
  { value: 'csv', label: 'CSV', icon: '📋' },
  { value: 'txt', label: 'Text', icon: '📃' },
  { value: 'png', label: 'PNG', icon: '🖼️' },
  { value: 'jpg', label: 'JPEG', icon: '🖼️' }
];

const selectedFormat = ref('pdf');
const localFileName = ref(props.fileName);
const errorMessage = ref('');
const isExporting = ref(false);

watch(() => props.fileName, (newVal) => {
  localFileName.value = newVal;
});

watch(() => props.visible, (newVal) => {
  if (newVal) {
    errorMessage.value = '';
    isExporting.value = false;
  }
});

const close = () => {
  if (!isExporting.value) {
    emit('close');
  }
};

const getFileNameWithExtension = (): string => {
  const name = localFileName.value || 'export';
  const ext = selectedFormat.value;

  // Remove any existing extension
  const nameWithoutExt = name.replace(/\.[^/.]+$/, '');

  return `${nameWithoutExt}.${ext}`;
};

const handleExport = async () => {
  errorMessage.value = '';
  isExporting.value = true;

  try {
    const fileName = getFileNameWithExtension();
    const options = {
      fileName,
      content: props.content,
      path: props.path,
      elementId: props.elementId
    };

    await ExportManager.exportTo(selectedFormat.value, options);

    emit('exported', selectedFormat.value);
    emit('close');
  } catch (error) {
    console.error('Export failed:', error);
    errorMessage.value = error instanceof Error ? error.message : 'Export failed';
  } finally {
    isExporting.value = false;
  }
};
</script>

<style scoped>
.export-dialog-overlay {
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

.export-dialog {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  box-shadow: 4px 4px 8px rgba(0, 0, 0, 0.5);
  min-width: 400px;
  max-width: 500px;
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
  grid-template-columns: repeat(4, 1fr);
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
  text-align: center;
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

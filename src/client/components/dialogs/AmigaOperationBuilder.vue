<template>
  <div class="dialog-overlay" @click="close">
    <div class="operation-builder" @click.stop>
      <div class="builder-header">
        <span class="builder-title">{{ isSchedule ? 'Schedule Operation' : 'Create Operation' }}</span>
        <button class="close-button" @click="close">✕</button>
      </div>

      <div class="builder-content">
        <!-- Operation Name (for schedules) -->
        <div v-if="isSchedule" class="form-group">
          <label>Name:</label>
          <input
            v-model="formData.name"
            type="text"
            class="amiga-input"
            placeholder="My scheduled operation"
          />
        </div>

        <!-- Operation Type -->
        <div class="form-group">
          <label>Operation Type:</label>
          <select v-model="formData.type" class="amiga-select">
            <option value="COPY">Copy</option>
            <option value="MOVE">Move</option>
            <option value="DELETE">Delete</option>
            <option value="RENAME">Rename</option>
            <option value="COMPRESS">Compress</option>
            <option value="EXTRACT">Extract</option>
          </select>
        </div>

        <!-- Source -->
        <div class="form-group">
          <label>Source:</label>
          <div class="path-input-group">
            <input
              v-model="formData.sourcePath"
              type="text"
              class="amiga-input"
              placeholder="df0:file.txt or df0:folder/"
            />
            <button class="amiga-button" @click="browseSource">Browse</button>
          </div>
          <div v-if="sourceItems.length > 0" class="selected-items">
            <div v-for="(item, index) in sourceItems" :key="index" class="selected-item">
              {{ item }}
              <button class="remove-item" @click="removeSourceItem(index)">✕</button>
            </div>
          </div>
          <button
            v-if="formData.type !== 'DELETE'"
            class="amiga-button small"
            @click="addSourceItem"
          >
            Add More Files
          </button>
        </div>

        <!-- Destination (for copy, move, rename) -->
        <div
          v-if="formData.type === 'COPY' || formData.type === 'MOVE' || formData.type === 'RENAME'"
          class="form-group"
        >
          <label>Destination:</label>
          <div class="path-input-group">
            <input
              v-model="formData.destination"
              type="text"
              class="amiga-input"
              :placeholder="formData.type === 'RENAME' ? 'newname.txt' : 'dh0:folder/'"
            />
            <button
              v-if="formData.type !== 'RENAME'"
              class="amiga-button"
              @click="browseDestination"
            >
              Browse
            </button>
          </div>
        </div>

        <!-- Conflict Strategy -->
        <div
          v-if="formData.type !== 'DELETE'"
          class="form-group"
        >
          <label>If File Exists:</label>
          <select v-model="formData.conflictStrategy" class="amiga-select">
            <option value="ASK">Ask me</option>
            <option value="SKIP">Skip</option>
            <option value="OVERWRITE">Overwrite</option>
            <option value="RENAME">Auto-rename</option>
          </select>
        </div>

        <!-- Schedule Options (if this is a schedule) -->
        <div v-if="isSchedule" class="schedule-section">
          <div class="section-title">Schedule Options</div>

          <div class="form-group">
            <label>Schedule Type:</label>
            <select v-model="formData.scheduleType" class="amiga-select">
              <option value="ONCE">One time</option>
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
            </select>
          </div>

          <!-- One-time schedule -->
          <div v-if="formData.scheduleType === 'ONCE'" class="form-group">
            <label>Date & Time:</label>
            <input
              v-model="formData.scheduledDateTime"
              type="datetime-local"
              class="amiga-input"
            />
          </div>

          <!-- Daily schedule -->
          <div v-if="formData.scheduleType === 'DAILY'" class="form-group">
            <label>Time:</label>
            <input
              v-model="formData.dailyTime"
              type="time"
              class="amiga-input"
            />
          </div>

          <!-- Weekly schedule -->
          <div v-if="formData.scheduleType === 'WEEKLY'">
            <div class="form-group">
              <label>Day of Week:</label>
              <select v-model="formData.weeklyDay" class="amiga-select">
                <option :value="0">Sunday</option>
                <option :value="1">Monday</option>
                <option :value="2">Tuesday</option>
                <option :value="3">Wednesday</option>
                <option :value="4">Thursday</option>
                <option :value="5">Friday</option>
                <option :value="6">Saturday</option>
              </select>
            </div>
            <div class="form-group">
              <label>Time:</label>
              <input
                v-model="formData.weeklyTime"
                type="time"
                class="amiga-input"
              />
            </div>
          </div>

          <!-- Monthly schedule -->
          <div v-if="formData.scheduleType === 'MONTHLY'">
            <div class="form-group">
              <label>Day of Month:</label>
              <input
                v-model="formData.monthlyDay"
                type="number"
                min="1"
                max="31"
                class="amiga-input"
              />
            </div>
            <div class="form-group">
              <label>Time:</label>
              <input
                v-model="formData.monthlyTime"
                type="time"
                class="amiga-input"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="builder-footer">
        <button class="amiga-button" @click="submit">
          {{ isSchedule ? 'Add to Schedule' : 'Add to Queue' }}
        </button>
        <button class="amiga-button" @click="close">Cancel</button>
      </div>
    </div>

    <!-- File Browser Dialog -->
    <div v-if="showBrowser" class="file-browser-overlay" @click="closeBrowser">
      <div class="file-browser" @click.stop>
        <div class="browser-header">
          <span>Select {{ browserMode === 'source' ? 'Source' : 'Destination' }}</span>
          <button class="close-button" @click="closeBrowser">✕</button>
        </div>

        <div class="browser-content">
          <div class="disk-list">
            <div
              v-for="disk in availableDisks"
              :key="disk.id"
              class="disk-item"
              :class="{ selected: selectedDisk === disk.id }"
              @click="selectDisk(disk.id)"
            >
              <div class="disk-icon">💾</div>
              <div class="disk-name">{{ disk.name }}</div>
            </div>
          </div>

          <div v-if="selectedDisk" class="folder-path">
            <input
              v-model="currentPath"
              type="text"
              class="amiga-input"
              readonly
            />
          </div>
        </div>

        <div class="browser-footer">
          <button class="amiga-button" @click="confirmBrowserSelection">OK</button>
          <button class="amiga-button" @click="closeBrowser">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { OperationType, ConflictStrategy } from '../../utils/batch-operations';
import { ScheduleType } from '../../utils/operation-scheduler';

const props = defineProps<{
  isSchedule?: boolean;
}>();

const emit = defineEmits<{
  close: [];
  submit: [data: any];
}>();

const formData = reactive({
  name: '',
  type: 'COPY' as OperationType,
  sourcePath: '',
  destination: '',
  conflictStrategy: 'ASK' as ConflictStrategy,
  scheduleType: 'ONCE' as ScheduleType,
  scheduledDateTime: '',
  dailyTime: '00:00',
  weeklyDay: 1,
  weeklyTime: '00:00',
  monthlyDay: 1,
  monthlyTime: '00:00'
});

const sourceItems = ref<string[]>([]);
const showBrowser = ref(false);
const browserMode = ref<'source' | 'destination'>('source');
const selectedDisk = ref('');
const currentPath = ref('');

const availableDisks = [
  { id: 'df0', name: 'DF0: (Floppy)' },
  { id: 'dh0', name: 'DH0: (Hard Drive)' },
  { id: 'ram', name: 'RAM: (RAM Disk)' },
  { id: 'utils', name: 'Utils:' },
  { id: 'trash', name: 'Trash:' }
];

function close() {
  emit('close');
}

function addSourceItem() {
  if (formData.sourcePath.trim()) {
    sourceItems.value.push(formData.sourcePath.trim());
    formData.sourcePath = '';
  }
}

function removeSourceItem(index: number) {
  sourceItems.value.splice(index, 1);
}

function browseSource() {
  browserMode.value = 'source';
  showBrowser.value = true;
  selectedDisk.value = '';
  currentPath.value = '';
}

function browseDestination() {
  browserMode.value = 'destination';
  showBrowser.value = true;
  selectedDisk.value = '';
  currentPath.value = '';
}

function closeBrowser() {
  showBrowser.value = false;
}

function selectDisk(diskId: string) {
  selectedDisk.value = diskId;
  currentPath.value = diskId + ':';
}

function confirmBrowserSelection() {
  if (browserMode.value === 'source') {
    formData.sourcePath = currentPath.value;
  } else {
    formData.destination = currentPath.value;
  }
  closeBrowser();
}

function submit() {
  // Build source array
  const sources = [...sourceItems.value];
  if (formData.sourcePath.trim()) {
    sources.push(formData.sourcePath.trim());
  }

  if (sources.length === 0) {
    alert('Please specify at least one source file or folder');
    return;
  }

  // Validate destination for applicable operations
  if (
    (formData.type === 'COPY' || formData.type === 'MOVE' || formData.type === 'RENAME') &&
    !formData.destination.trim()
  ) {
    alert('Please specify a destination');
    return;
  }

  // Prepare data
  const data: any = {
    type: formData.type,
    source: sources.length === 1 ? sources[0] : sources,
    destination: formData.destination.trim() || undefined,
    conflictStrategy: formData.conflictStrategy
  };

  // Add schedule-specific data
  if (props.isSchedule) {
    if (!formData.name.trim()) {
      alert('Please enter a name for the scheduled operation');
      return;
    }

    data.name = formData.name.trim();
    data.scheduleType = formData.scheduleType;

    switch (formData.scheduleType) {
      case 'ONCE':
        if (!formData.scheduledDateTime) {
          alert('Please select a date and time');
          return;
        }
        data.scheduledTime = new Date(formData.scheduledDateTime).getTime();
        break;

      case 'DAILY':
        data.dailyTime = formData.dailyTime;
        break;

      case 'WEEKLY':
        data.weeklyDay = formData.weeklyDay;
        data.weeklyTime = formData.weeklyTime;
        break;

      case 'MONTHLY':
        data.monthlyDay = formData.monthlyDay;
        data.monthlyTime = formData.monthlyTime;
        break;
    }
  }

  emit('submit', data);
}
</script>

<style scoped>
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

.operation-builder {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  width: 600px;
  max-width: 90vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  font-family: 'Press Start 2P', monospace;
  font-size: 10px;
}

.builder-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background: #0055aa;
  color: #ffffff;
  border-bottom: 2px solid #000000;
}

.builder-title {
  font-size: 12px;
  font-weight: bold;
}

.close-button {
  width: 24px;
  height: 24px;
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-button:hover {
  background: #b0b0b0;
}

.close-button:active {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}

.builder-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.form-group {
  margin-bottom: 16px;
}

label {
  display: block;
  margin-bottom: 4px;
  font-weight: bold;
}

.amiga-input,
.amiga-select {
  width: 100%;
  padding: 6px;
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  font-family: 'Press Start 2P', monospace;
  font-size: 10px;
}

.amiga-input:focus,
.amiga-select:focus {
  outline: 2px solid #0055aa;
  outline-offset: -2px;
}

.path-input-group {
  display: flex;
  gap: 8px;
}

.path-input-group .amiga-input {
  flex: 1;
}

.amiga-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 6px 12px;
  font-family: 'Press Start 2P', monospace;
  font-size: 10px;
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
  font-size: 8px;
}

.selected-items {
  margin-top: 8px;
  padding: 8px;
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  max-height: 120px;
  overflow-y: auto;
}

.selected-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px;
  margin-bottom: 4px;
  background: #e0e0e0;
  word-break: break-all;
}

.remove-item {
  width: 20px;
  height: 20px;
  background: #aa0000;
  color: #ffffff;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  cursor: pointer;
  font-size: 10px;
  flex-shrink: 0;
  margin-left: 8px;
}

.remove-item:hover {
  background: #cc0000;
}

.schedule-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 2px solid #000000;
}

.section-title {
  font-size: 11px;
  font-weight: bold;
  margin-bottom: 12px;
  color: #0055aa;
}

.builder-footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding: 8px;
  background: #888888;
  border-top: 2px solid #ffffff;
}

/* File Browser */
.file-browser-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
}

.file-browser {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  width: 500px;
  max-width: 90vw;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
}

.browser-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background: #0055aa;
  color: #ffffff;
  border-bottom: 2px solid #000000;
}

.browser-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.disk-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}

.disk-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  cursor: pointer;
  text-align: center;
}

.disk-item:hover {
  background: #e0f0ff;
}

.disk-item.selected {
  background: #0055aa;
  color: #ffffff;
  border-color: #ffffff #000000 #000000 #ffffff;
}

.disk-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.disk-name {
  word-break: break-word;
}

.folder-path {
  margin-top: 16px;
}

.browser-footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding: 8px;
  background: #888888;
  border-top: 2px solid #ffffff;
}
</style>

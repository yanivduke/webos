<template>
  <div class="workspace-editor-overlay" @click.self="close">
    <div class="workspace-editor-dialog">
      <div class="dialog-titlebar">
        <div class="dialog-title">
          {{ workspace ? 'Edit Workspace' : 'New Workspace' }}
        </div>
        <div class="close-button" @click="close">×</div>
      </div>

      <div class="dialog-content">
        <!-- Name -->
        <div class="form-section">
          <label class="form-label">Workspace Name:</label>
          <input
            v-model="formData.name"
            type="text"
            class="amiga-input full-width"
            placeholder="Enter workspace name"
            maxlength="30"
          />
        </div>

        <!-- Icon Picker -->
        <div class="form-section">
          <label class="form-label">Icon:</label>
          <div class="icon-picker">
            <div
              v-for="icon in availableIcons"
              :key="icon"
              class="icon-option"
              :class="{ selected: formData.icon === icon }"
              @click="formData.icon = icon"
            >
              {{ icon }}
            </div>
          </div>
        </div>

        <!-- Color Picker -->
        <div class="form-section">
          <label class="form-label">Accent Color:</label>
          <div class="color-picker">
            <div
              v-for="color in availableColors"
              :key="color"
              class="color-option"
              :class="{ selected: formData.color === color }"
              :style="{ backgroundColor: color }"
              @click="formData.color = color"
            >
              <span v-if="formData.color === color" class="checkmark">✓</span>
            </div>
          </div>
        </div>

        <!-- Auto-Switch Settings -->
        <div class="form-section">
          <label class="form-label">
            <input type="checkbox" v-model="autoSwitchEnabled" />
            Enable Auto-Switch
          </label>
        </div>

        <div v-if="autoSwitchEnabled" class="form-section subsection">
          <div class="form-row">
            <div class="form-col">
              <label class="form-label small">Start Time:</label>
              <input
                v-model="formData.autoSwitch.startTime"
                type="time"
                class="amiga-input"
              />
            </div>
            <div class="form-col">
              <label class="form-label small">End Time:</label>
              <input
                v-model="formData.autoSwitch.endTime"
                type="time"
                class="amiga-input"
              />
            </div>
          </div>

          <div class="form-row">
            <label class="form-label small">Active Days:</label>
            <div class="days-selector">
              <label
                v-for="(day, index) in daysOfWeek"
                :key="index"
                class="day-checkbox"
              >
                <input
                  type="checkbox"
                  :value="index"
                  v-model="formData.autoSwitch.days"
                />
                {{ day }}
              </label>
            </div>
          </div>
        </div>

        <!-- Workspace Settings -->
        <div class="form-section">
          <label class="form-label">Settings:</label>
          <div class="settings-group">
            <label class="setting-checkbox">
              <input
                type="checkbox"
                v-model="formData.settings.showSystemInfo"
              />
              Show System Info Bar
            </label>
            <label class="setting-checkbox">
              <input
                type="checkbox"
                v-model="formData.settings.autoHideMenuBar"
              />
              Auto-Hide Menu Bar
            </label>
          </div>
        </div>
      </div>

      <div class="dialog-actions">
        <button class="amiga-button" @click="save" :disabled="!isValid">
          Save
        </button>
        <button class="amiga-button" @click="close">
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { WORKSPACE_ICONS, WORKSPACE_COLORS, type WorkspaceProfile } from '../../utils/workspace-switcher';

const props = defineProps<{
  workspace: WorkspaceProfile | null;
}>();

const emit = defineEmits<{
  (e: 'save', workspace: any): void;
  (e: 'close'): void;
}>();

const availableIcons = WORKSPACE_ICONS;
const availableColors = WORKSPACE_COLORS;

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const autoSwitchEnabled = ref(false);

const formData = ref({
  name: '',
  icon: '🖥️',
  color: '#0055aa',
  settings: {
    showSystemInfo: true,
    autoHideMenuBar: false,
    iconLayout: 'grid' as 'grid' | 'list'
  },
  autoSwitch: {
    enabled: false,
    startTime: '09:00',
    endTime: '17:00',
    days: [1, 2, 3, 4, 5] // Monday-Friday default
  }
});

const isValid = computed(() => {
  return formData.value.name.trim().length > 0;
});

function initializeForm() {
  if (props.workspace) {
    formData.value = {
      name: props.workspace.name,
      icon: props.workspace.icon,
      color: props.workspace.color,
      settings: {
        showSystemInfo: props.workspace.settings.showSystemInfo ?? true,
        autoHideMenuBar: props.workspace.settings.autoHideMenuBar ?? false,
        iconLayout: props.workspace.settings.iconLayout ?? 'grid'
      },
      autoSwitch: props.workspace.autoSwitch
        ? {
            enabled: props.workspace.autoSwitch.enabled,
            startTime: props.workspace.autoSwitch.startTime,
            endTime: props.workspace.autoSwitch.endTime,
            days: [...props.workspace.autoSwitch.days]
          }
        : {
            enabled: false,
            startTime: '09:00',
            endTime: '17:00',
            days: [1, 2, 3, 4, 5]
          }
    };

    autoSwitchEnabled.value = props.workspace.autoSwitch?.enabled || false;
  }
}

function save() {
  if (!isValid.value) return;

  const workspaceData = {
    name: formData.value.name.trim(),
    icon: formData.value.icon,
    color: formData.value.color,
    settings: formData.value.settings,
    autoSwitch: autoSwitchEnabled.value
      ? {
          ...formData.value.autoSwitch,
          enabled: true
        }
      : undefined
  };

  emit('save', workspaceData);
}

function close() {
  emit('close');
}

onMounted(() => {
  initializeForm();
});
</script>

<style scoped>
.workspace-editor-overlay {
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

.workspace-editor-dialog {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  width: 500px;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  font-family: 'Press Start 2P', monospace;
}

.dialog-titlebar {
  background: #0055aa;
  color: #ffffff;
  padding: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #000000;
}

.dialog-title {
  font-size: 9px;
}

.close-button {
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  padding: 0 4px;
  user-select: none;
}

.close-button:hover {
  background: #aa5555;
}

.dialog-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.form-section {
  margin-bottom: 16px;
}

.form-section.subsection {
  background: #888888;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 8px;
  margin-left: 16px;
}

.form-label {
  display: block;
  font-size: 8px;
  margin-bottom: 8px;
  color: #000000;
}

.form-label.small {
  font-size: 7px;
  margin-bottom: 4px;
}

.form-label input[type="checkbox"] {
  margin-right: 8px;
}

.amiga-input {
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 6px 8px;
  font-size: 8px;
  font-family: 'Press Start 2P', monospace;
}

.amiga-input.full-width {
  width: 100%;
  box-sizing: border-box;
}

.icon-picker {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 4px;
}

.icon-option {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  background: #a0a0a0;
  transition: all 0.1s;
}

.icon-option:hover {
  background: #b0b0b0;
}

.icon-option.selected {
  background: #0055aa;
  border-color: #ffaa00;
  transform: scale(1.1);
}

.color-picker {
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  gap: 4px;
}

.color-option {
  width: 40px;
  height: 40px;
  cursor: pointer;
  border: 3px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.1s;
}

.color-option:hover {
  transform: scale(1.1);
}

.color-option.selected {
  border-color: #ffaa00;
  transform: scale(1.2);
}

.checkmark {
  color: #ffffff;
  font-size: 20px;
  text-shadow: 0 0 2px #000000;
}

.form-row {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}

.form-col {
  flex: 1;
}

.days-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}

.day-checkbox {
  font-size: 7px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  cursor: pointer;
  user-select: none;
}

.day-checkbox input {
  margin: 0;
}

.day-checkbox:has(input:checked) {
  background: #0055aa;
  color: #ffffff;
}

.settings-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setting-checkbox {
  font-size: 7px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.setting-checkbox input {
  margin: 0;
}

.dialog-actions {
  display: flex;
  gap: 8px;
  padding: 16px;
  border-top: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  background: #888888;
}

.amiga-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 8px 16px;
  font-size: 8px;
  font-family: 'Press Start 2P', monospace;
  cursor: pointer;
  flex: 1;
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

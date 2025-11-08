<template>
  <div v-if="isOpen" class="settings-overlay" @click="handleOverlayClick">
    <div class="settings-dialog" @click.stop>
      <!-- Title Bar -->
      <div class="dialog-titlebar">
        <div class="dialog-title">Calendar Settings</div>
        <button class="close-btn" @click="close">×</button>
      </div>

      <!-- Tabs -->
      <div class="settings-tabs">
        <button
          class="tab-button"
          :class="{ active: activeTab === 'calendars' }"
          @click="activeTab = 'calendars'"
        >
          Calendars
        </button>
        <button
          class="tab-button"
          :class="{ active: activeTab === 'preferences' }"
          @click="activeTab = 'preferences'"
        >
          Preferences
        </button>
        <button
          class="tab-button"
          :class="{ active: activeTab === 'import-export' }"
          @click="activeTab = 'import-export'"
        >
          Import/Export
        </button>
      </div>

      <!-- Content -->
      <div class="dialog-content">
        <!-- Calendars Tab -->
        <div v-if="activeTab === 'calendars'" class="tab-content">
          <div class="calendars-header">
            <h3 class="section-title">Your Calendars</h3>
            <button class="amiga-button" @click="showNewCalendar">
              New Calendar
            </button>
          </div>

          <div class="calendars-list">
            <div
              v-for="calendar in calendars"
              :key="calendar.id"
              class="calendar-card"
            >
              <div class="calendar-info">
                <div
                  class="calendar-color-box"
                  :style="{ backgroundColor: calendar.color }"
                ></div>
                <div class="calendar-details">
                  <div class="calendar-name">{{ calendar.name }}</div>
                  <div class="calendar-meta">
                    {{ calendar.isDefault ? 'Default' : '' }}
                    {{ calendar.visible ? 'Visible' : 'Hidden' }}
                  </div>
                </div>
              </div>
              <div class="calendar-actions">
                <button
                  class="amiga-button small-btn"
                  @click="editCalendar(calendar)"
                >
                  Edit
                </button>
                <button
                  v-if="!calendar.isDefault"
                  class="amiga-button small-btn"
                  @click="setDefault(calendar.id)"
                >
                  Set Default
                </button>
                <button
                  v-if="calendars.length > 1"
                  class="amiga-button small-btn danger-btn"
                  @click="deleteCalendar(calendar.id)"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>

          <!-- Calendar Editor -->
          <div v-if="editingCalendar" class="calendar-editor">
            <h3 class="section-title">
              {{ editingCalendar.id ? 'Edit Calendar' : 'New Calendar' }}
            </h3>

            <div class="form-group">
              <label class="form-label">Name *</label>
              <input
                v-model="editingCalendar.name"
                type="text"
                class="amiga-input"
                placeholder="Calendar name"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Color</label>
              <div class="color-picker">
                <div
                  v-for="color in colorOptions"
                  :key="color"
                  class="color-option"
                  :class="{ selected: editingCalendar.color === color }"
                  :style="{ backgroundColor: color }"
                  @click="editingCalendar.color = color"
                ></div>
              </div>
            </div>

            <div class="form-group">
              <label class="form-checkbox">
                <input type="checkbox" v-model="editingCalendar.visible" />
                <span>Visible</span>
              </label>
            </div>

            <div class="editor-actions">
              <button class="amiga-button" @click="cancelEdit">Cancel</button>
              <button class="amiga-button primary-btn" @click="saveCalendar">
                Save
              </button>
            </div>
          </div>
        </div>

        <!-- Preferences Tab -->
        <div v-if="activeTab === 'preferences'" class="tab-content">
          <h3 class="section-title">General Settings</h3>

          <div class="form-group">
            <label class="form-label">First day of week</label>
            <select v-model.number="preferences.firstDayOfWeek" class="amiga-select">
              <option :value="0">Sunday</option>
              <option :value="1">Monday</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Time format</label>
            <select v-model="preferences.timeFormat" class="amiga-select">
              <option value="12h">12 hour (1:00 PM)</option>
              <option value="24h">24 hour (13:00)</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Default view</label>
            <select v-model="preferences.defaultView" class="amiga-select">
              <option value="month">Month</option>
              <option value="week">Week</option>
              <option value="day">Day</option>
              <option value="agenda">Agenda</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Working hours</label>
            <div class="working-hours">
              <select v-model.number="preferences.workingHoursStart" class="amiga-select">
                <option v-for="hour in 24" :key="hour-1" :value="hour-1">
                  {{ formatHour(hour - 1) }}
                </option>
              </select>
              <span>to</span>
              <select v-model.number="preferences.workingHoursEnd" class="amiga-select">
                <option v-for="hour in 24" :key="hour-1" :value="hour-1">
                  {{ formatHour(hour - 1) }}
                </option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-checkbox">
              <input type="checkbox" v-model="preferences.showWeekNumbers" />
              <span>Show week numbers</span>
            </label>
          </div>

          <h3 class="section-title">Reminder Settings</h3>

          <div class="form-group">
            <label class="form-checkbox">
              <input type="checkbox" v-model="reminderSettings.enabled" />
              <span>Enable reminders</span>
            </label>
          </div>

          <div class="form-group">
            <label class="form-checkbox">
              <input type="checkbox" v-model="reminderSettings.soundEnabled" />
              <span>Play sound for reminders</span>
            </label>
          </div>

          <div class="form-group">
            <label class="form-checkbox">
              <input type="checkbox" v-model="reminderSettings.showDesktopNotifications" />
              <span>Show desktop notifications</span>
            </label>
          </div>

          <div class="form-group">
            <label class="form-label">Default reminder time</label>
            <select v-model.number="reminderSettings.defaultReminderMinutes" class="amiga-select">
              <option :value="0">At time of event</option>
              <option :value="5">5 minutes before</option>
              <option :value="10">10 minutes before</option>
              <option :value="15">15 minutes before</option>
              <option :value="30">30 minutes before</option>
              <option :value="60">1 hour before</option>
              <option :value="1440">1 day before</option>
            </select>
          </div>

          <div class="notification-permission" v-if="notificationPermission !== 'granted'">
            <div class="warning-box">
              <div class="warning-text">
                {{ notificationPermissionMessage }}
              </div>
              <button
                v-if="notificationPermission === 'default'"
                class="amiga-button"
                @click="requestNotificationPermission"
              >
                Enable Notifications
              </button>
            </div>
          </div>
        </div>

        <!-- Import/Export Tab -->
        <div v-if="activeTab === 'import-export'" class="tab-content">
          <h3 class="section-title">Import Events</h3>

          <div class="import-section">
            <p class="section-description">
              Import events from an iCalendar (.ics) file
            </p>

            <div class="form-group">
              <label class="form-label">Import to calendar</label>
              <select v-model="importCalendarId" class="amiga-select">
                <option v-for="cal in calendars" :key="cal.id" :value="cal.id">
                  {{ cal.name }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <input
                type="file"
                ref="fileInput"
                accept=".ics"
                @change="handleFileSelect"
                style="display: none"
              />
              <button class="amiga-button" @click="selectFile">
                Choose File
              </button>
              <span v-if="selectedFile" class="file-name">
                {{ selectedFile.name }}
              </span>
            </div>

            <button
              class="amiga-button primary-btn"
              :disabled="!selectedFile"
              @click="importFile"
            >
              Import
            </button>

            <div v-if="importResult" class="import-result">
              {{ importResult }}
            </div>
          </div>

          <h3 class="section-title">Export Events</h3>

          <div class="export-section">
            <p class="section-description">
              Export events to an iCalendar (.ics) file
            </p>

            <div class="form-group">
              <label class="form-label">Export calendar</label>
              <select v-model="exportCalendarId" class="amiga-select">
                <option value="">All calendars</option>
                <option v-for="cal in calendars" :key="cal.id" :value="cal.id">
                  {{ cal.name }}
                </option>
              </select>
            </div>

            <button class="amiga-button primary-btn" @click="exportCalendar">
              Export
            </button>
          </div>

          <h3 class="section-title">Danger Zone</h3>

          <div class="danger-section">
            <p class="section-description">
              Clear all calendar data (cannot be undone)
            </p>
            <button class="amiga-button danger-btn" @click="clearAllData">
              Clear All Data
            </button>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="dialog-actions">
        <button class="amiga-button primary-btn" @click="save">
          Save & Close
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { calendarManager, type Calendar, type CalendarSettings } from '../../utils/calendar-manager';
import { eventRemindersManager, type ReminderSettings } from '../../utils/event-reminders';

// ============================================================================
// Props and Emits
// ============================================================================

interface Props {
  isOpen: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'update'): void;
}>();

// ============================================================================
// State
// ============================================================================

const activeTab = ref<'calendars' | 'preferences' | 'import-export'>('calendars');
const calendars = ref<Calendar[]>([]);
const editingCalendar = ref<Partial<Calendar> | null>(null);

const preferences = ref<CalendarSettings>({
  firstDayOfWeek: 0,
  timeFormat: '12h',
  defaultView: 'month',
  workingHoursStart: 8,
  workingHoursEnd: 18,
  showWeekNumbers: false
});

const reminderSettings = ref<ReminderSettings>({
  enabled: true,
  soundEnabled: true,
  showDesktopNotifications: true,
  defaultReminderMinutes: 15,
  snoozeOptions: [5, 10, 15, 30]
});

const colorOptions = [
  '#0055aa', // Amiga blue
  '#ffaa00', // Amiga orange
  '#00aa55', // Green
  '#aa0055', // Magenta
  '#aa5500', // Brown
  '#5500aa', // Purple
  '#00aaaa', // Cyan
  '#aa5555', // Red
];

// Import/Export
const fileInput = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);
const importCalendarId = ref('');
const exportCalendarId = ref('');
const importResult = ref('');

// Notifications
const notificationPermission = ref<'granted' | 'denied' | 'default' | 'unsupported'>('default');

// ============================================================================
// Computed
// ============================================================================

const notificationPermissionMessage = computed(() => {
  switch (notificationPermission.value) {
    case 'denied':
      return 'Desktop notifications are blocked. Please enable them in your browser settings.';
    case 'default':
      return 'Desktop notifications are not enabled. Click below to enable.';
    case 'unsupported':
      return 'Your browser does not support desktop notifications.';
    default:
      return '';
  }
});

// ============================================================================
// Methods
// ============================================================================

function loadData() {
  calendars.value = calendarManager.getAllCalendars();
  preferences.value = calendarManager.getSettings();
  reminderSettings.value = eventRemindersManager.getSettings();
  notificationPermission.value = eventRemindersManager.getNotificationPermission();

  if (calendars.value.length > 0) {
    const defaultCal = calendars.value.find(c => c.isDefault) || calendars.value[0];
    importCalendarId.value = defaultCal.id;
  }
}

function showNewCalendar() {
  editingCalendar.value = {
    name: '',
    color: '#0055aa',
    visible: true,
    isDefault: false
  };
}

function editCalendar(calendar: Calendar) {
  editingCalendar.value = { ...calendar };
}

function cancelEdit() {
  editingCalendar.value = null;
}

function saveCalendar() {
  if (!editingCalendar.value?.name.trim()) {
    alert('Calendar name is required');
    return;
  }

  if (editingCalendar.value.id) {
    // Update existing
    calendarManager.updateCalendar(editingCalendar.value.id, editingCalendar.value);
  } else {
    // Create new
    calendarManager.createCalendar({
      name: editingCalendar.value.name,
      color: editingCalendar.value.color || '#0055aa',
      visible: editingCalendar.value.visible !== false,
      isDefault: editingCalendar.value.isDefault || false
    });
  }

  editingCalendar.value = null;
  loadData();
}

function setDefault(calendarId: string) {
  calendarManager.setDefaultCalendar(calendarId);
  loadData();
}

function deleteCalendar(calendarId: string) {
  const calendar = calendars.value.find(c => c.id === calendarId);
  if (!calendar) return;

  if (confirm(`Delete calendar "${calendar.name}"? Events will be moved to the default calendar.`)) {
    calendarManager.deleteCalendar(calendarId);
    loadData();
  }
}

function formatHour(hour: number): string {
  if (preferences.value.timeFormat === '24h') {
    return `${hour.toString().padStart(2, '0')}:00`;
  } else {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  }
}

async function requestNotificationPermission() {
  const granted = await eventRemindersManager.requestNotificationPermission();
  notificationPermission.value = eventRemindersManager.getNotificationPermission();

  if (granted) {
    reminderSettings.value.showDesktopNotifications = true;
  }
}

// Import/Export methods
function selectFile() {
  fileInput.value?.click();
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement;
  selectedFile.value = target.files?.[0] || null;
  importResult.value = '';
}

async function importFile() {
  if (!selectedFile.value) return;

  try {
    const text = await selectedFile.value.text();
    const count = calendarManager.importICS(text, importCalendarId.value);
    importResult.value = `Successfully imported ${count} event(s)`;
    selectedFile.value = null;
    if (fileInput.value) fileInput.value.value = '';
  } catch (error) {
    importResult.value = `Error importing file: ${error}`;
  }
}

function exportCalendar() {
  const ics = calendarManager.exportICS(exportCalendarId.value || undefined);

  // Create download
  const blob = new Blob([ics], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;

  const calendarName = exportCalendarId.value
    ? calendars.value.find(c => c.id === exportCalendarId.value)?.name || 'calendar'
    : 'all-calendars';

  link.download = `${calendarName}.ics`;
  link.click();
  URL.revokeObjectURL(url);
}

function clearAllData() {
  if (confirm('Are you sure you want to clear ALL calendar data? This cannot be undone.')) {
    if (confirm('This will delete all events and calendars. Are you absolutely sure?')) {
      calendarManager.clearAllData();
      loadData();
      alert('All data has been cleared');
    }
  }
}

function save() {
  // Save preferences
  calendarManager.updateSettings(preferences.value);
  eventRemindersManager.updateSettings(reminderSettings.value);

  emit('update');
  close();
}

function close() {
  emit('close');
}

function handleOverlayClick() {
  close();
}

// ============================================================================
// Watchers
// ============================================================================

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    loadData();
    editingCalendar.value = null;
  }
});

// ============================================================================
// Lifecycle
// ============================================================================

onMounted(() => {
  if (props.isOpen) {
    loadData();
  }
});
</script>

<style scoped>
.settings-overlay {
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
  font-family: 'Press Start 2P', monospace;
}

.settings-dialog {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  width: 90%;
  max-width: 700px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
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
  font-size: 10px;
}

.close-btn {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  width: 24px;
  height: 24px;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  font-family: Arial, sans-serif;
}

.close-btn:active {
  border-color: #000000 #ffffff #ffffff #000000;
}

.settings-tabs {
  display: flex;
  background: #a0a0a0;
  border-bottom: 2px solid #000000;
}

.tab-button {
  flex: 1;
  background: #888888;
  border: none;
  border-right: 2px solid #000000;
  padding: 8px;
  font-size: 8px;
  font-family: 'Press Start 2P', monospace;
  cursor: pointer;
  color: #000000;
}

.tab-button:last-child {
  border-right: none;
}

.tab-button.active {
  background: #a0a0a0;
  border-bottom: 2px solid #a0a0a0;
}

.dialog-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  padding: 12px;
  border-top: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  background: #a0a0a0;
}

.amiga-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 6px 12px;
  font-size: 8px;
  font-family: 'Press Start 2P', monospace;
  cursor: pointer;
}

.amiga-button:active {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}

.amiga-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.primary-btn {
  background: #0055aa;
  color: #ffffff;
}

.danger-btn {
  background: #aa0000;
  color: #ffffff;
}

.small-btn {
  padding: 4px 8px;
  font-size: 7px;
}

.section-title {
  font-size: 10px;
  margin: 16px 0 12px 0;
  color: #0055aa;
}

.section-description {
  font-size: 7px;
  margin-bottom: 12px;
  color: #333333;
  line-height: 1.5;
}

/* Calendars Tab */
.calendars-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.calendars-list {
  margin-bottom: 16px;
}

.calendar-card {
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 12px;
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.calendar-info {
  display: flex;
  gap: 12px;
  align-items: center;
}

.calendar-color-box {
  width: 32px;
  height: 32px;
  border: 2px solid #000000;
}

.calendar-name {
  font-size: 9px;
  margin-bottom: 4px;
}

.calendar-meta {
  font-size: 6px;
  color: #666666;
}

.calendar-actions {
  display: flex;
  gap: 4px;
}

.calendar-editor {
  background: #cccccc;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 16px;
  margin-top: 16px;
}

.editor-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 12px;
}

/* Form Elements */
.form-group {
  margin-bottom: 12px;
}

.form-label {
  display: block;
  font-size: 8px;
  margin-bottom: 4px;
  color: #000000;
}

.amiga-input,
.amiga-select {
  width: 100%;
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 6px;
  font-size: 8px;
  font-family: 'Press Start 2P', monospace;
}

.form-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 8px;
  cursor: pointer;
}

.color-picker {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.color-option {
  width: 32px;
  height: 32px;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  cursor: pointer;
}

.color-option.selected {
  border-color: #000000 #ffffff #ffffff #000000;
  box-shadow: inset 0 0 0 2px #ffffff, inset 0 0 0 4px #000000;
}

/* Preferences Tab */
.working-hours {
  display: flex;
  align-items: center;
  gap: 8px;
}

.working-hours span {
  font-size: 8px;
}

.notification-permission {
  margin-top: 16px;
}

.warning-box {
  background: #ffeecc;
  border: 2px solid;
  border-color: #ffaa00 #000000 #000000 #ffaa00;
  padding: 12px;
}

.warning-text {
  font-size: 7px;
  margin-bottom: 8px;
  line-height: 1.5;
  color: #aa5500;
}

/* Import/Export Tab */
.import-section,
.export-section,
.danger-section {
  margin-bottom: 24px;
  padding: 16px;
  background: #cccccc;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
}

.file-name {
  font-size: 7px;
  margin-left: 8px;
}

.import-result {
  font-size: 8px;
  margin-top: 8px;
  padding: 8px;
  background: #ffffff;
  border: 2px solid #000000;
}

.danger-section {
  background: #ffcccc;
  border-color: #aa0000 #000000 #000000 #aa0000;
}
</style>

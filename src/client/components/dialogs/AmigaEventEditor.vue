<template>
  <div v-if="isOpen" class="event-editor-overlay" @click="handleOverlayClick">
    <div class="event-editor-dialog" @click.stop>
      <!-- Title Bar -->
      <div class="dialog-titlebar">
        <div class="dialog-title">{{ isEditing ? 'Edit Event' : 'New Event' }}</div>
        <button class="close-btn" @click="close">×</button>
      </div>

      <!-- Content -->
      <div class="dialog-content">
        <!-- Event Title -->
        <div class="form-group">
          <label class="form-label">Title *</label>
          <input
            v-model="formData.title"
            type="text"
            class="amiga-input"
            placeholder="Event title"
            ref="titleInput"
          />
          <div v-if="errors.title" class="error-message">{{ errors.title }}</div>
        </div>

        <!-- Description -->
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea
            v-model="formData.description"
            class="amiga-textarea"
            placeholder="Event description"
            rows="3"
          ></textarea>
        </div>

        <!-- All Day Toggle -->
        <div class="form-group">
          <label class="form-checkbox">
            <input type="checkbox" v-model="formData.allDay" />
            <span>All-day event</span>
          </label>
        </div>

        <!-- Date and Time -->
        <div class="form-row">
          <!-- Start Date/Time -->
          <div class="form-group flex-1">
            <label class="form-label">Start</label>
            <input
              v-model="formData.startDate"
              type="date"
              class="amiga-input"
            />
            <input
              v-if="!formData.allDay"
              v-model="formData.startTime"
              type="time"
              class="amiga-input"
              style="margin-top: 4px;"
            />
          </div>

          <!-- End Date/Time -->
          <div class="form-group flex-1">
            <label class="form-label">End</label>
            <input
              v-model="formData.endDate"
              type="date"
              class="amiga-input"
            />
            <input
              v-if="!formData.allDay"
              v-model="formData.endTime"
              type="time"
              class="amiga-input"
              style="margin-top: 4px;"
            />
          </div>
        </div>

        <div v-if="errors.dates" class="error-message">{{ errors.dates }}</div>

        <!-- Calendar Selection -->
        <div class="form-group">
          <label class="form-label">Calendar</label>
          <select v-model="formData.calendarId" class="amiga-select">
            <option v-for="cal in calendars" :key="cal.id" :value="cal.id">
              {{ cal.name }}
            </option>
          </select>
        </div>

        <!-- Color Picker -->
        <div class="form-group">
          <label class="form-label">Color</label>
          <div class="color-picker">
            <div
              v-for="color in colorOptions"
              :key="color"
              class="color-option"
              :class="{ selected: formData.color === color }"
              :style="{ backgroundColor: color }"
              @click="formData.color = color"
            ></div>
          </div>
        </div>

        <!-- Recurring Options -->
        <div class="form-section">
          <div class="section-header">Recurring</div>

          <div class="form-group">
            <label class="form-label">Frequency</label>
            <select v-model="recurringType" class="amiga-select">
              <option value="none">Does not repeat</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <template v-if="recurringType !== 'none'">
            <!-- Interval -->
            <div class="form-group">
              <label class="form-label">Repeat every</label>
              <div class="interval-input">
                <input
                  v-model.number="formData.recurring.interval"
                  type="number"
                  min="1"
                  class="amiga-input small-input"
                />
                <span class="interval-label">{{ intervalLabel }}</span>
              </div>
            </div>

            <!-- Days of Week (for weekly) -->
            <div v-if="recurringType === 'weekly'" class="form-group">
              <label class="form-label">Repeat on</label>
              <div class="days-selector">
                <label
                  v-for="(day, index) in dayNames"
                  :key="index"
                  class="day-checkbox"
                >
                  <input
                    type="checkbox"
                    :checked="formData.recurring.daysOfWeek.includes(index)"
                    @change="toggleDay(index)"
                  />
                  <span>{{ day }}</span>
                </label>
              </div>
            </div>

            <!-- End Condition -->
            <div class="form-group">
              <label class="form-label">Ends</label>
              <div class="recurring-end">
                <label class="form-radio">
                  <input
                    type="radio"
                    value="never"
                    v-model="recurringEnd"
                  />
                  <span>Never</span>
                </label>
                <label class="form-radio">
                  <input
                    type="radio"
                    value="date"
                    v-model="recurringEnd"
                  />
                  <span>On</span>
                  <input
                    v-if="recurringEnd === 'date'"
                    v-model="formData.recurring.endDate"
                    type="date"
                    class="amiga-input"
                    style="margin-left: 4px;"
                  />
                </label>
                <label class="form-radio">
                  <input
                    type="radio"
                    value="count"
                    v-model="recurringEnd"
                  />
                  <span>After</span>
                  <input
                    v-if="recurringEnd === 'count'"
                    v-model.number="formData.recurring.count"
                    type="number"
                    min="1"
                    class="amiga-input small-input"
                    style="margin-left: 4px;"
                  />
                  <span v-if="recurringEnd === 'count'" style="margin-left: 4px;">occurrences</span>
                </label>
              </div>
            </div>
          </template>
        </div>

        <!-- Reminders -->
        <div class="form-section">
          <div class="section-header">Reminders</div>

          <div class="reminders-list">
            <div
              v-for="(reminder, index) in formData.reminders"
              :key="index"
              class="reminder-item"
            >
              <select
                v-model.number="reminder.minutes"
                class="amiga-select"
              >
                <option :value="0">At time of event</option>
                <option :value="5">5 minutes before</option>
                <option :value="10">10 minutes before</option>
                <option :value="15">15 minutes before</option>
                <option :value="30">30 minutes before</option>
                <option :value="60">1 hour before</option>
                <option :value="120">2 hours before</option>
                <option :value="1440">1 day before</option>
              </select>
              <button
                class="amiga-button small-btn"
                @click="removeReminder(index)"
              >
                ×
              </button>
            </div>
          </div>

          <button class="amiga-button" @click="addReminder">
            Add Reminder
          </button>
        </div>

        <!-- Conflict Warning -->
        <div v-if="conflicts.length > 0" class="conflict-warning">
          <div class="warning-header">⚠ Conflicts detected</div>
          <div class="conflict-list">
            <div v-for="conflict in conflicts" :key="conflict.id" class="conflict-item">
              {{ conflict.title }} ({{ formatEventTime(conflict) }})
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="dialog-actions">
        <div class="actions-left">
          <button
            v-if="isEditing"
            class="amiga-button danger-btn"
            @click="deleteEvent"
          >
            Delete
          </button>
        </div>
        <div class="actions-right">
          <button class="amiga-button" @click="close">Cancel</button>
          <button class="amiga-button primary-btn" @click="save">
            {{ isEditing ? 'Save' : 'Create' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue';
import { calendarManager, type CalendarEvent, type Calendar, type EventReminder } from '../../utils/calendar-manager';

// ============================================================================
// Props and Emits
// ============================================================================

interface Props {
  isOpen: boolean;
  event?: CalendarEvent | null;
  initialDate?: Date;
}

const props = withDefaults(defineProps<Props>(), {
  event: null,
  initialDate: () => new Date()
});

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', event: CalendarEvent): void;
  (e: 'delete', eventId: string): void;
}>();

// ============================================================================
// State
// ============================================================================

const titleInput = ref<HTMLInputElement | null>(null);
const calendars = ref<Calendar[]>([]);

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

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const formData = ref({
  title: '',
  description: '',
  allDay: false,
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: '',
  calendarId: '',
  color: '#0055aa',
  recurring: {
    interval: 1,
    daysOfWeek: [] as number[],
    endDate: '',
    count: null as number | null
  },
  reminders: [] as Array<{ id: string; minutes: number; triggered: boolean }>
});

const recurringType = ref<'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'>('none');
const recurringEnd = ref<'never' | 'date' | 'count'>('never');

const errors = ref({
  title: '',
  dates: ''
});

const conflicts = ref<CalendarEvent[]>([]);

// ============================================================================
// Computed
// ============================================================================

const isEditing = computed(() => props.event !== null);

const intervalLabel = computed(() => {
  const labels: Record<string, string> = {
    daily: 'day(s)',
    weekly: 'week(s)',
    monthly: 'month(s)',
    yearly: 'year(s)'
  };
  return labels[recurringType.value] || '';
});

// ============================================================================
// Methods
// ============================================================================

function initialize() {
  calendars.value = calendarManager.getAllCalendars();

  if (props.event) {
    // Editing existing event
    const event = props.event;
    formData.value = {
      title: event.title,
      description: event.description,
      allDay: event.allDay,
      startDate: formatDateForInput(event.start),
      startTime: formatTimeForInput(event.start),
      endDate: formatDateForInput(event.end),
      endTime: formatTimeForInput(event.end),
      calendarId: event.calendarId,
      color: event.color,
      recurring: {
        interval: event.recurring?.interval || 1,
        daysOfWeek: event.recurring?.daysOfWeek || [],
        endDate: event.recurring?.endDate ? formatDateForInput(event.recurring.endDate) : '',
        count: event.recurring?.count || null
      },
      reminders: [...event.reminders]
    };

    if (event.recurring) {
      recurringType.value = event.recurring.type;
      if (event.recurring.endDate) {
        recurringEnd.value = 'date';
      } else if (event.recurring.count) {
        recurringEnd.value = 'count';
      } else {
        recurringEnd.value = 'never';
      }
    }
  } else {
    // New event
    const defaultCalendar = calendarManager.getDefaultCalendar();
    const start = props.initialDate || new Date();
    const end = new Date(start);
    end.setHours(end.getHours() + 1);

    formData.value = {
      title: '',
      description: '',
      allDay: false,
      startDate: formatDateForInput(start),
      startTime: formatTimeForInput(start),
      endDate: formatDateForInput(end),
      endTime: formatTimeForInput(end),
      calendarId: defaultCalendar?.id || '',
      color: defaultCalendar?.color || '#0055aa',
      recurring: {
        interval: 1,
        daysOfWeek: [],
        endDate: '',
        count: null
      },
      reminders: []
    };
    recurringType.value = 'none';
    recurringEnd.value = 'never';
  }

  // Focus title input
  nextTick(() => {
    titleInput.value?.focus();
  });
}

function validate(): boolean {
  errors.value = {
    title: '',
    dates: ''
  };

  let isValid = true;

  if (!formData.value.title.trim()) {
    errors.value.title = 'Title is required';
    isValid = false;
  }

  const start = parseDateTime(formData.value.startDate, formData.value.startTime, formData.value.allDay);
  const end = parseDateTime(formData.value.endDate, formData.value.endTime, formData.value.allDay);

  if (!start || !end) {
    errors.value.dates = 'Invalid date/time';
    isValid = false;
  } else if (start >= end) {
    errors.value.dates = 'End must be after start';
    isValid = false;
  }

  return isValid;
}

function checkConflicts() {
  const start = parseDateTime(formData.value.startDate, formData.value.startTime, formData.value.allDay);
  const end = parseDateTime(formData.value.endDate, formData.value.endTime, formData.value.allDay);

  if (!start || !end) {
    conflicts.value = [];
    return;
  }

  const tempEvent: CalendarEvent = {
    id: props.event?.id || 'temp',
    title: formData.value.title,
    description: formData.value.description,
    start,
    end,
    allDay: formData.value.allDay,
    recurring: null,
    color: formData.value.color,
    calendarId: formData.value.calendarId,
    reminders: [],
    created: new Date(),
    modified: new Date()
  };

  conflicts.value = calendarManager.detectConflicts(tempEvent);
}

function save() {
  if (!validate()) return;

  const start = parseDateTime(formData.value.startDate, formData.value.startTime, formData.value.allDay)!;
  const end = parseDateTime(formData.value.endDate, formData.value.endTime, formData.value.allDay)!;

  const eventData = {
    title: formData.value.title.trim(),
    description: formData.value.description.trim(),
    start,
    end,
    allDay: formData.value.allDay,
    recurring: recurringType.value !== 'none' ? {
      type: recurringType.value,
      interval: formData.value.recurring.interval,
      daysOfWeek: formData.value.recurring.daysOfWeek,
      dayOfMonth: recurringType.value === 'monthly' ? start.getDate() : null,
      monthOfYear: recurringType.value === 'yearly' ? start.getMonth() : null,
      endDate: recurringEnd.value === 'date' && formData.value.recurring.endDate
        ? new Date(formData.value.recurring.endDate)
        : null,
      count: recurringEnd.value === 'count' ? formData.value.recurring.count : null
    } : null,
    color: formData.value.color,
    calendarId: formData.value.calendarId,
    reminders: formData.value.reminders
  };

  let savedEvent: CalendarEvent;

  if (isEditing.value && props.event) {
    savedEvent = calendarManager.updateEvent(props.event.id, eventData)!;
  } else {
    savedEvent = calendarManager.createEvent(eventData);
  }

  emit('save', savedEvent);
  close();
}

function deleteEvent() {
  if (!props.event) return;

  if (confirm('Are you sure you want to delete this event?')) {
    calendarManager.deleteEvent(props.event.id);
    emit('delete', props.event.id);
    close();
  }
}

function close() {
  emit('close');
}

function handleOverlayClick() {
  close();
}

function addReminder() {
  formData.value.reminders.push({
    id: generateId(),
    minutes: 15,
    triggered: false
  });
}

function removeReminder(index: number) {
  formData.value.reminders.splice(index, 1);
}

function toggleDay(dayIndex: number) {
  const days = formData.value.recurring.daysOfWeek;
  const index = days.indexOf(dayIndex);

  if (index > -1) {
    days.splice(index, 1);
  } else {
    days.push(dayIndex);
  }
}

// ============================================================================
// Utility Methods
// ============================================================================

function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatTimeForInput(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function parseDateTime(dateStr: string, timeStr: string, allDay: boolean): Date | null {
  if (!dateStr) return null;

  try {
    const [year, month, day] = dateStr.split('-').map(Number);

    if (allDay) {
      return new Date(year, month - 1, day, 0, 0, 0);
    } else {
      if (!timeStr) return null;
      const [hours, minutes] = timeStr.split(':').map(Number);
      return new Date(year, month - 1, day, hours, minutes);
    }
  } catch (e) {
    return null;
  }
}

function formatEventTime(event: CalendarEvent): string {
  if (event.allDay) return 'All day';
  return `${calendarManager.formatTime(event.start)} - ${calendarManager.formatTime(event.end)}`;
}

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// Watchers
// ============================================================================

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    initialize();
  }
});

watch(() => formData.value.calendarId, (calendarId) => {
  const calendar = calendars.value.find(c => c.id === calendarId);
  if (calendar && !isEditing.value) {
    formData.value.color = calendar.color;
  }
});

watch([
  () => formData.value.startDate,
  () => formData.value.startTime,
  () => formData.value.endDate,
  () => formData.value.endTime,
  () => formData.value.allDay,
  () => formData.value.calendarId
], () => {
  checkConflicts();
});

// ============================================================================
// Lifecycle
// ============================================================================

onMounted(() => {
  if (props.isOpen) {
    initialize();
  }
});
</script>

<style scoped>
.event-editor-overlay {
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

.event-editor-dialog {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  width: 90%;
  max-width: 600px;
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

.dialog-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.dialog-actions {
  display: flex;
  justify-content: space-between;
  padding: 12px;
  border-top: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  background: #a0a0a0;
}

.actions-left,
.actions-right {
  display: flex;
  gap: 8px;
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
}

.form-group {
  margin-bottom: 12px;
}

.form-row {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.flex-1 {
  flex: 1;
}

.form-label {
  display: block;
  font-size: 8px;
  margin-bottom: 4px;
  color: #000000;
}

.amiga-input,
.amiga-textarea,
.amiga-select {
  width: 100%;
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 6px;
  font-size: 8px;
  font-family: 'Press Start 2P', monospace;
}

.amiga-textarea {
  resize: vertical;
  min-height: 60px;
}

.small-input {
  width: 80px;
}

.form-checkbox,
.form-radio {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 8px;
  cursor: pointer;
  margin-bottom: 8px;
}

.form-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
}

.section-header {
  font-size: 9px;
  font-weight: bold;
  margin-bottom: 12px;
  color: #0055aa;
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

.interval-input {
  display: flex;
  align-items: center;
  gap: 8px;
}

.interval-label {
  font-size: 8px;
}

.days-selector {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.day-checkbox {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 7px;
}

.recurring-end {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reminders-list {
  margin-bottom: 8px;
}

.reminder-item {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  align-items: center;
}

.error-message {
  font-size: 7px;
  color: #aa0000;
  margin-top: 4px;
}

.conflict-warning {
  margin-top: 16px;
  padding: 12px;
  background: #ffeecc;
  border: 2px solid;
  border-color: #ffaa00 #000000 #000000 #ffaa00;
}

.warning-header {
  font-size: 8px;
  color: #aa5500;
  margin-bottom: 8px;
  font-weight: bold;
}

.conflict-list {
  font-size: 7px;
}

.conflict-item {
  margin-bottom: 4px;
  padding: 4px;
  background: #ffffff;
}
</style>

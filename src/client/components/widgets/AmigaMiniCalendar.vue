<template>
  <div
    class="mini-calendar-widget"
    :style="{ left: position.x + 'px', top: position.y + 'px' }"
    @mousedown="handleMouseDown"
  >
    <!-- Title Bar -->
    <div class="widget-titlebar" @mousedown.stop="startDrag">
      <div class="widget-title">Calendar</div>
      <div class="titlebar-buttons">
        <button
          class="titlebar-btn"
          @click.stop="toggleAlwaysOnTop"
          :title="alwaysOnTop ? 'Always on top (enabled)' : 'Always on top (disabled)'"
        >
          {{ alwaysOnTop ? '📌' : '○' }}
        </button>
        <button class="titlebar-btn" @click.stop="$emit('close')" title="Close">×</button>
      </div>
    </div>

    <!-- Widget Content -->
    <div class="widget-content">
      <!-- Header with navigation -->
      <div class="calendar-header">
        <button class="nav-btn" @click="previousMonth">&lt;</button>
        <div class="month-label">{{ monthLabel }}</div>
        <button class="nav-btn" @click="nextMonth">&gt;</button>
      </div>

      <!-- Mini calendar grid -->
      <div class="calendar-grid">
        <div class="weekday" v-for="day in weekdayLabels" :key="day">{{ day }}</div>
        <div
          v-for="date in calendarDates"
          :key="date.key"
          class="calendar-date"
          :class="{
            'other-month': date.otherMonth,
            'today': date.isToday,
            'has-events': date.hasEvents,
            'selected': date.isSelected
          }"
          @click="handleDateClick(date.date)"
          :title="date.hasEvents ? `${date.eventCount} event(s)` : ''"
        >
          {{ date.day }}
          <div v-if="date.hasEvents" class="event-indicator" :data-count="date.eventCount"></div>
        </div>
      </div>

      <!-- Today's events -->
      <div class="todays-events">
        <div class="events-header">Today</div>
        <div v-if="todaysEvents.length === 0" class="no-events">No events</div>
        <div
          v-for="event in todaysEvents.slice(0, 3)"
          :key="event.id"
          class="event-item"
          :style="{ borderLeftColor: event.color }"
          @click="openEvent(event)"
        >
          <div class="event-time">{{ formatEventTime(event) }}</div>
          <div class="event-title">{{ event.title }}</div>
        </div>
        <div v-if="todaysEvents.length > 3" class="more-events">
          +{{ todaysEvents.length - 3 }} more
        </div>
      </div>

      <!-- Quick actions -->
      <div class="quick-actions">
        <button class="action-btn" @click="openCalendar" title="Open Calendar">
          📅
        </button>
        <button class="action-btn" @click="createEvent" title="Create Event">
          +
        </button>
        <button class="action-btn" @click="goToToday" title="Go to Today">
          ●
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { calendarManager, type CalendarEvent } from '../../utils/calendar-manager';

// ============================================================================
// Props and Emits
// ============================================================================

interface Props {
  initialX?: number;
  initialY?: number;
}

const props = withDefaults(defineProps<Props>(), {
  initialX: 20,
  initialY: 80
});

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'open-calendar', date?: Date): void;
  (e: 'create-event', date: Date): void;
  (e: 'open-event', event: CalendarEvent): void;
  (e: 'bring-to-front'): void;
}>();

// ============================================================================
// State
// ============================================================================

const position = ref({ x: props.initialX, y: props.initialY });
const currentDate = ref(new Date());
const alwaysOnTop = ref(false);

// Dragging
const isDragging = ref(false);
let dragStartX = 0;
let dragStartY = 0;
let dragStartPosX = 0;
let dragStartPosY = 0;

// Auto-refresh
let refreshInterval: number | null = null;

// ============================================================================
// Computed Properties
// ============================================================================

const monthLabel = computed(() => {
  const date = currentDate.value;
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
});

const weekdayLabels = computed(() => {
  const settings = calendarManager.getSettings();
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  if (settings.firstDayOfWeek === 1) {
    return [...days.slice(1), days[0]];
  }
  return days;
});

const calendarDates = computed(() => {
  const date = currentDate.value;
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const settings = calendarManager.getSettings();

  let startDate = new Date(firstDay);
  const firstDayOfWeek = (firstDay.getDay() - settings.firstDayOfWeek + 7) % 7;
  startDate.setDate(startDate.getDate() - firstDayOfWeek);

  const dates = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const visibleCalendars = calendarManager.getVisibleCalendars().map(c => c.id);

  for (let i = 0; i < 42; i++) {
    const currentDateVal = new Date(startDate);
    currentDateVal.setDate(startDate.getDate() + i);

    const dateKey = currentDateVal.toISOString().split('T')[0];
    const events = calendarManager.getEventsForDay(currentDateVal)
      .filter(e => visibleCalendars.includes(e.calendarId));

    dates.push({
      date: new Date(currentDateVal),
      day: currentDateVal.getDate(),
      otherMonth: currentDateVal.getMonth() !== month,
      isToday: currentDateVal.getTime() === today.getTime(),
      isSelected: false,
      hasEvents: events.length > 0,
      eventCount: events.length,
      key: dateKey
    });
  }

  return dates;
});

const todaysEvents = computed(() => {
  const today = new Date();
  const visibleCalendars = calendarManager.getVisibleCalendars().map(c => c.id);
  return calendarManager.getEventsForDay(today)
    .filter(e => visibleCalendars.includes(e.calendarId))
    .sort((a, b) => a.start.getTime() - b.start.getTime());
});

// ============================================================================
// Methods
// ============================================================================

function previousMonth() {
  const date = new Date(currentDate.value);
  date.setMonth(date.getMonth() - 1);
  currentDate.value = date;
}

function nextMonth() {
  const date = new Date(currentDate.value);
  date.setMonth(date.getMonth() + 1);
  currentDate.value = date;
}

function goToToday() {
  currentDate.value = new Date();
}

function handleDateClick(date: Date) {
  emit('open-calendar', date);
}

function openCalendar() {
  emit('open-calendar');
}

function createEvent() {
  emit('create-event', new Date());
}

function openEvent(event: CalendarEvent) {
  emit('open-event', event);
}

function toggleAlwaysOnTop() {
  alwaysOnTop.value = !alwaysOnTop.value;
}

function formatEventTime(event: CalendarEvent): string {
  if (event.allDay) return 'All day';
  return calendarManager.formatTime(event.start);
}

// ============================================================================
// Dragging
// ============================================================================

function handleMouseDown() {
  emit('bring-to-front');
}

function startDrag(e: MouseEvent) {
  isDragging.value = true;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  dragStartPosX = position.value.x;
  dragStartPosY = position.value.y;

  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', stopDrag);
  e.preventDefault();
}

function onDrag(e: MouseEvent) {
  if (!isDragging.value) return;

  const dx = e.clientX - dragStartX;
  const dy = e.clientY - dragStartY;

  position.value = {
    x: Math.max(0, Math.min(window.innerWidth - 250, dragStartPosX + dx)),
    y: Math.max(0, Math.min(window.innerHeight - 400, dragStartPosY + dy))
  };
}

function stopDrag() {
  isDragging.value = false;
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDrag);
}

// ============================================================================
// Auto-refresh
// ============================================================================

function startAutoRefresh() {
  // Refresh every minute to update "today" indicator
  refreshInterval = window.setInterval(() => {
    currentDate.value = new Date(currentDate.value);
  }, 60000);
}

function stopAutoRefresh() {
  if (refreshInterval !== null) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
}

// ============================================================================
// Lifecycle
// ============================================================================

onMounted(() => {
  startAutoRefresh();
});

onUnmounted(() => {
  stopAutoRefresh();
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDrag);
});
</script>

<style scoped>
.mini-calendar-widget {
  position: fixed;
  width: 250px;
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  font-family: 'Press Start 2P', monospace;
  z-index: 9000;
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.3);
}

.widget-titlebar {
  background: #0055aa;
  color: #ffffff;
  padding: 4px 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: move;
  user-select: none;
  border-bottom: 2px solid #000000;
}

.widget-title {
  font-size: 8px;
}

.titlebar-buttons {
  display: flex;
  gap: 4px;
}

.titlebar-btn {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  width: 20px;
  height: 20px;
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
  font-family: Arial, sans-serif;
  display: flex;
  align-items: center;
  justify-content: center;
}

.titlebar-btn:active {
  border-color: #000000 #ffffff #ffffff #000000;
}

.widget-content {
  padding: 8px;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.nav-btn {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  width: 24px;
  height: 24px;
  font-size: 8px;
  cursor: pointer;
  font-family: 'Press Start 2P', monospace;
}

.nav-btn:active {
  border-color: #000000 #ffffff #ffffff #000000;
}

.month-label {
  font-size: 8px;
  text-align: center;
  flex: 1;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: #000000;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  margin-bottom: 8px;
}

.weekday {
  background: #0055aa;
  color: #ffffff;
  text-align: center;
  padding: 4px 2px;
  font-size: 6px;
}

.calendar-date {
  background: #ffffff;
  text-align: center;
  padding: 4px 2px;
  font-size: 7px;
  cursor: pointer;
  position: relative;
  min-height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.calendar-date.other-month {
  color: #999999;
  background: #dddddd;
}

.calendar-date.today {
  background: #ffaa00;
  color: #000000;
  font-weight: bold;
}

.calendar-date:hover {
  background: #ccccff;
}

.calendar-date.today:hover {
  background: #ffcc44;
}

.calendar-date.has-events::after {
  content: '';
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 4px;
  background: #ff0000;
  border-radius: 50%;
}

.event-indicator {
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 4px;
  background: #ff0000;
  border-radius: 50%;
}

.todays-events {
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  background: #ffffff;
  margin-bottom: 8px;
}

.events-header {
  background: #0055aa;
  color: #ffffff;
  font-size: 7px;
  padding: 4px;
}

.no-events {
  padding: 8px;
  font-size: 6px;
  color: #666666;
  text-align: center;
}

.event-item {
  padding: 6px;
  border-left: 4px solid;
  border-bottom: 1px solid #eeeeee;
  cursor: pointer;
}

.event-item:hover {
  background: #f0f0f0;
}

.event-item:last-child {
  border-bottom: none;
}

.event-time {
  font-size: 6px;
  color: #666666;
  margin-bottom: 2px;
}

.event-title {
  font-size: 7px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.more-events {
  padding: 4px;
  font-size: 6px;
  color: #666666;
  text-align: center;
  background: #f9f9f9;
}

.quick-actions {
  display: flex;
  gap: 4px;
  justify-content: space-between;
}

.action-btn {
  flex: 1;
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 6px;
  font-size: 12px;
  cursor: pointer;
}

.action-btn:active {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}
</style>

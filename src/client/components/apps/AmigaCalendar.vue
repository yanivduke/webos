<template>
  <div class="amiga-calendar">
    <!-- Toolbar -->
    <div class="calendar-toolbar">
      <div class="toolbar-section">
        <button class="amiga-button" @click="goToToday">Today</button>
        <button class="amiga-button" @click="previousPeriod">&lt;</button>
        <button class="amiga-button" @click="nextPeriod">&gt;</button>
        <span class="current-period">{{ currentPeriodLabel }}</span>
      </div>

      <div class="toolbar-section">
        <select v-model="currentView" class="amiga-select">
          <option value="month">Month</option>
          <option value="week">Week</option>
          <option value="day">Day</option>
          <option value="agenda">Agenda</option>
        </select>
      </div>

      <div class="toolbar-section">
        <button class="amiga-button" @click="createEvent">New Event</button>
        <button class="amiga-button" @click="showSettings">Settings</button>
        <input
          type="text"
          v-model="searchQuery"
          placeholder="Search events..."
          class="amiga-input search-input"
          @input="handleSearch"
        />
      </div>
    </div>

    <!-- Main content area -->
    <div class="calendar-main">
      <!-- Sidebar with mini calendar and calendars list -->
      <div class="calendar-sidebar">
        <!-- Mini Calendar -->
        <div class="mini-calendar">
          <div class="mini-calendar-header">
            <button class="mini-nav-btn" @click="previousMonth">&lt;</button>
            <span class="mini-month-label">{{ miniMonthLabel }}</span>
            <button class="mini-nav-btn" @click="nextMonth">&gt;</button>
          </div>
          <div class="mini-calendar-grid">
            <div class="mini-weekday" v-for="day in weekdayLabels" :key="day">{{ day }}</div>
            <div
              v-for="date in miniCalendarDates"
              :key="date.key"
              class="mini-date"
              :class="{
                'other-month': date.otherMonth,
                'today': date.isToday,
                'selected': date.isSelected,
                'has-events': date.hasEvents
              }"
              @click="selectDate(date.date)"
            >
              {{ date.day }}
              <div v-if="date.hasEvents" class="event-indicator"></div>
            </div>
          </div>
        </div>

        <!-- Calendars List -->
        <div class="calendars-list">
          <div class="calendars-header">Calendars</div>
          <div
            v-for="calendar in calendars"
            :key="calendar.id"
            class="calendar-item"
            @click="toggleCalendar(calendar.id)"
          >
            <input
              type="checkbox"
              :checked="calendar.visible"
              @click.stop="toggleCalendar(calendar.id)"
            />
            <span class="calendar-color" :style="{ backgroundColor: calendar.color }"></span>
            <span class="calendar-name">{{ calendar.name }}</span>
          </div>
        </div>
      </div>

      <!-- View content -->
      <div class="calendar-view">
        <!-- Month View -->
        <div v-if="currentView === 'month'" class="month-view">
          <div class="month-grid">
            <div class="month-weekday" v-for="day in weekdayLabels" :key="day">{{ day }}</div>
            <div
              v-for="date in monthDates"
              :key="date.key"
              class="month-date"
              :class="{
                'other-month': date.otherMonth,
                'today': date.isToday,
                'selected': date.isSelected
              }"
              @click="selectDate(date.date)"
            >
              <div class="date-number">{{ date.day }}</div>
              <div class="date-events">
                <div
                  v-for="event in date.events.slice(0, 3)"
                  :key="event.id"
                  class="month-event"
                  :style="{ backgroundColor: event.color }"
                  @click.stop="openEvent(event)"
                >
                  {{ event.title }}
                </div>
                <div v-if="date.events.length > 3" class="more-events">
                  +{{ date.events.length - 3 }} more
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Week View -->
        <div v-if="currentView === 'week'" class="week-view">
          <!-- All-day events row -->
          <div class="week-allday-section">
            <div class="time-label">All Day</div>
            <div class="week-days">
              <div v-for="day in weekDays" :key="day.key" class="week-day-allday">
                <div
                  v-for="event in day.allDayEvents"
                  :key="event.id"
                  class="week-event allday-event"
                  :style="{ backgroundColor: event.color }"
                  @click="openEvent(event)"
                >
                  {{ event.title }}
                </div>
              </div>
            </div>
          </div>

          <!-- Time grid -->
          <div class="week-grid-container">
            <div class="week-time-column">
              <div v-for="hour in hours" :key="hour" class="hour-label">
                {{ formatHour(hour) }}
              </div>
            </div>
            <div class="week-days-grid">
              <div v-for="day in weekDays" :key="day.key" class="week-day-column">
                <div class="week-day-header" :class="{ 'today': day.isToday }">
                  <div class="day-name">{{ day.dayName }}</div>
                  <div class="day-number">{{ day.dayNumber }}</div>
                </div>
                <div class="week-hours">
                  <div
                    v-for="hour in hours"
                    :key="hour"
                    class="hour-slot"
                    @click="createEventAt(day.date, hour)"
                  ></div>
                  <div
                    v-for="event in day.timedEvents"
                    :key="event.id"
                    class="week-event timed-event"
                    :style="getEventStyle(event, day.date)"
                    @click="openEvent(event)"
                  >
                    <div class="event-time">{{ formatEventTime(event) }}</div>
                    <div class="event-title">{{ event.title }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Day View -->
        <div v-if="currentView === 'day'" class="day-view">
          <!-- All-day events -->
          <div v-if="dayAllDayEvents.length > 0" class="day-allday-section">
            <div class="allday-label">All Day</div>
            <div class="allday-events">
              <div
                v-for="event in dayAllDayEvents"
                :key="event.id"
                class="day-event allday-event"
                :style="{ backgroundColor: event.color }"
                @click="openEvent(event)"
              >
                {{ event.title }}
              </div>
            </div>
          </div>

          <!-- Time grid -->
          <div class="day-grid">
            <div class="day-time-column">
              <div v-for="hour in hours" :key="hour" class="hour-label">
                {{ formatHour(hour) }}
              </div>
            </div>
            <div class="day-events-column">
              <div
                v-for="hour in hours"
                :key="hour"
                class="hour-slot"
                @click="createEventAt(selectedDate, hour)"
              ></div>
              <div
                v-for="event in dayTimedEvents"
                :key="event.id"
                class="day-event timed-event"
                :style="getDayEventStyle(event)"
                @click="openEvent(event)"
              >
                <div class="event-time">{{ formatEventTime(event) }}</div>
                <div class="event-title">{{ event.title }}</div>
                <div v-if="event.description" class="event-description">
                  {{ event.description }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Agenda View -->
        <div v-if="currentView === 'agenda'" class="agenda-view">
          <div v-if="agendaEvents.length === 0" class="no-events">
            No upcoming events
          </div>
          <div v-for="group in agendaGroups" :key="group.date" class="agenda-group">
            <div class="agenda-date-header">{{ group.dateLabel }}</div>
            <div
              v-for="event in group.events"
              :key="event.id"
              class="agenda-event"
              @click="openEvent(event)"
            >
              <div class="agenda-event-time">
                <div v-if="event.allDay" class="time-label">All Day</div>
                <div v-else class="time-label">{{ formatEventTime(event) }}</div>
              </div>
              <div class="agenda-event-details">
                <div
                  class="agenda-event-title"
                  :style="{ borderLeftColor: event.color }"
                >
                  {{ event.title }}
                </div>
                <div v-if="event.description" class="agenda-event-description">
                  {{ event.description }}
                </div>
                <div class="agenda-event-calendar">
                  {{ getCalendarName(event.calendarId) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Event Editor Dialog (will be created separately) -->
    <!-- <AmigaEventEditor ... /> -->

    <!-- Calendar Settings Dialog (will be created separately) -->
    <!-- <AmigaCalendarSettings ... /> -->
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { calendarManager, type CalendarEvent, type Calendar } from '../../utils/calendar-manager';
import { eventRemindersManager } from '../../utils/event-reminders';

// ============================================================================
// State
// ============================================================================

const currentView = ref<'month' | 'week' | 'day' | 'agenda'>('month');
const selectedDate = ref(new Date());
const miniCalendarDate = ref(new Date());
const searchQuery = ref('');
const calendars = ref<Calendar[]>([]);
const showEventEditor = ref(false);
const showSettingsDialog = ref(false);
const editingEvent = ref<CalendarEvent | null>(null);

// ============================================================================
// Computed Properties - Period Labels
// ============================================================================

const currentPeriodLabel = computed(() => {
  const date = selectedDate.value;
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  switch (currentView.value) {
    case 'month':
      return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    case 'week':
      const weekStart = calendarManager.getWeekStart(date);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      if (weekStart.getMonth() === weekEnd.getMonth()) {
        return `${monthNames[weekStart.getMonth()]} ${weekStart.getDate()}-${weekEnd.getDate()}, ${weekStart.getFullYear()}`;
      } else {
        return `${monthNames[weekStart.getMonth()]} ${weekStart.getDate()} - ${monthNames[weekEnd.getMonth()]} ${weekEnd.getDate()}, ${weekStart.getFullYear()}`;
      }
    case 'day':
      return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    case 'agenda':
      return 'Upcoming Events';
    default:
      return '';
  }
});

const miniMonthLabel = computed(() => {
  const date = miniCalendarDate.value;
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
});

const weekdayLabels = computed(() => {
  const settings = calendarManager.getSettings();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  if (settings.firstDayOfWeek === 1) {
    return [...days.slice(1), days[0]];
  }
  return days;
});

// ============================================================================
// Computed Properties - Mini Calendar
// ============================================================================

const miniCalendarDates = computed(() => {
  const date = miniCalendarDate.value;
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

  for (let i = 0; i < 42; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);

    const dateKey = currentDate.toISOString().split('T')[0];
    const events = calendarManager.getEventsForDay(currentDate);
    const visibleCalendars = calendars.value.filter(c => c.visible).map(c => c.id);
    const hasEvents = events.some(e => visibleCalendars.includes(e.calendarId));

    dates.push({
      date: new Date(currentDate),
      day: currentDate.getDate(),
      otherMonth: currentDate.getMonth() !== month,
      isToday: currentDate.getTime() === today.getTime(),
      isSelected: currentDate.getTime() === selectedDate.value.getTime(),
      hasEvents,
      key: dateKey
    });
  }

  return dates;
});

// ============================================================================
// Computed Properties - Month View
// ============================================================================

const monthDates = computed(() => {
  const date = selectedDate.value;
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const settings = calendarManager.getSettings();

  let startDate = new Date(firstDay);
  const firstDayOfWeek = (firstDay.getDay() - settings.firstDayOfWeek + 7) % 7;
  startDate.setDate(startDate.getDate() - firstDayOfWeek);

  const dates = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const visibleCalendars = calendars.value.filter(c => c.visible).map(c => c.id);

  for (let i = 0; i < 42; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);

    const dateKey = currentDate.toISOString().split('T')[0];
    const events = calendarManager.getEventsForDay(currentDate)
      .filter(e => visibleCalendars.includes(e.calendarId));

    dates.push({
      date: new Date(currentDate),
      day: currentDate.getDate(),
      otherMonth: currentDate.getMonth() !== month,
      isToday: currentDate.getTime() === today.getTime(),
      isSelected: currentDate.getTime() === selectedDate.value.getTime(),
      events,
      key: dateKey
    });
  }

  return dates;
});

// ============================================================================
// Computed Properties - Week View
// ============================================================================

const weekDays = computed(() => {
  const weekStart = calendarManager.getWeekStart(selectedDate.value);
  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const visibleCalendars = calendars.value.filter(c => c.visible).map(c => c.id);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);

    const events = calendarManager.getEventsForDay(date)
      .filter(e => visibleCalendars.includes(e.calendarId));

    days.push({
      date: new Date(date),
      dayName: dayNames[date.getDay()],
      dayNumber: date.getDate(),
      isToday: date.getTime() === today.getTime(),
      allDayEvents: events.filter(e => e.allDay),
      timedEvents: events.filter(e => !e.allDay),
      key: date.toISOString().split('T')[0]
    });
  }

  return days;
});

const hours = computed(() => {
  return Array.from({ length: 24 }, (_, i) => i);
});

// ============================================================================
// Computed Properties - Day View
// ============================================================================

const dayAllDayEvents = computed(() => {
  const visibleCalendars = calendars.value.filter(c => c.visible).map(c => c.id);
  return calendarManager.getEventsForDay(selectedDate.value)
    .filter(e => e.allDay && visibleCalendars.includes(e.calendarId));
});

const dayTimedEvents = computed(() => {
  const visibleCalendars = calendars.value.filter(c => c.visible).map(c => c.id);
  return calendarManager.getEventsForDay(selectedDate.value)
    .filter(e => !e.allDay && visibleCalendars.includes(e.calendarId));
});

// ============================================================================
// Computed Properties - Agenda View
// ============================================================================

const agendaEvents = computed(() => {
  const visibleCalendars = calendars.value.filter(c => c.visible).map(c => c.id);
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 30); // Next 30 days

  return calendarManager.getEvents(startDate, endDate, visibleCalendars)
    .filter(e => e.start >= startDate);
});

const agendaGroups = computed(() => {
  const groups = new Map<string, CalendarEvent[]>();

  for (const event of agendaEvents.value) {
    const dateKey = event.start.toISOString().split('T')[0];
    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey)!.push(event);
  }

  const result = [];
  for (const [dateKey, events] of groups.entries()) {
    const date = new Date(dateKey);
    result.push({
      date: dateKey,
      dateLabel: formatAgendaDate(date),
      events
    });
  }

  return result;
});

// ============================================================================
// Navigation Methods
// ============================================================================

function goToToday() {
  selectedDate.value = new Date();
  miniCalendarDate.value = new Date();
}

function previousPeriod() {
  const date = new Date(selectedDate.value);
  switch (currentView.value) {
    case 'month':
      date.setMonth(date.getMonth() - 1);
      break;
    case 'week':
      date.setDate(date.getDate() - 7);
      break;
    case 'day':
      date.setDate(date.getDate() - 1);
      break;
  }
  selectedDate.value = date;
}

function nextPeriod() {
  const date = new Date(selectedDate.value);
  switch (currentView.value) {
    case 'month':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'week':
      date.setDate(date.getDate() + 7);
      break;
    case 'day':
      date.setDate(date.getDate() + 1);
      break;
  }
  selectedDate.value = date;
}

function previousMonth() {
  const date = new Date(miniCalendarDate.value);
  date.setMonth(date.getMonth() - 1);
  miniCalendarDate.value = date;
}

function nextMonth() {
  const date = new Date(miniCalendarDate.value);
  date.setMonth(date.getMonth() + 1);
  miniCalendarDate.value = date;
}

function selectDate(date: Date) {
  selectedDate.value = new Date(date);
  if (currentView.value === 'month' || currentView.value === 'agenda') {
    currentView.value = 'day';
  }
}

// ============================================================================
// Event Methods
// ============================================================================

function createEvent() {
  editingEvent.value = null;
  showEventEditor.value = true;
  // TODO: Emit event to open editor dialog
  console.log('Create new event');
}

function createEventAt(date: Date, hour: number) {
  const start = new Date(date);
  start.setHours(hour, 0, 0, 0);
  const end = new Date(start);
  end.setHours(hour + 1, 0, 0, 0);

  // TODO: Open editor with pre-filled start/end times
  console.log('Create event at', start);
}

function openEvent(event: CalendarEvent) {
  editingEvent.value = event;
  showEventEditor.value = true;
  // TODO: Emit event to open editor dialog
  console.log('Open event', event);
}

function showSettings() {
  showSettingsDialog.value = true;
  // TODO: Emit event to open settings dialog
  console.log('Open settings');
}

function handleSearch() {
  // TODO: Implement search functionality
  console.log('Search:', searchQuery.value);
}

// ============================================================================
// Calendar Methods
// ============================================================================

function toggleCalendar(calendarId: string) {
  const calendar = calendars.value.find(c => c.id === calendarId);
  if (calendar) {
    calendarManager.updateCalendar(calendarId, { visible: !calendar.visible });
    loadCalendars();
  }
}

function getCalendarName(calendarId: string): string {
  const calendar = calendars.value.find(c => c.id === calendarId);
  return calendar?.name || 'Unknown';
}

function loadCalendars() {
  calendars.value = calendarManager.getAllCalendars();
}

// ============================================================================
// Formatting Methods
// ============================================================================

function formatHour(hour: number): string {
  const settings = calendarManager.getSettings();
  if (settings.timeFormat === '24h') {
    return `${hour.toString().padStart(2, '0')}:00`;
  } else {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  }
}

function formatEventTime(event: CalendarEvent): string {
  if (event.allDay) return 'All Day';
  return `${calendarManager.formatTime(event.start)} - ${calendarManager.formatTime(event.end)}`;
}

function formatAgendaDate(date: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);

  if (checkDate.getTime() === today.getTime()) return 'Today';
  if (checkDate.getTime() === tomorrow.getTime()) return 'Tomorrow';

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  return `${dayNames[date.getDay()]}, ${monthNames[date.getMonth()]} ${date.getDate()}`;
}

// ============================================================================
// Styling Methods
// ============================================================================

function getEventStyle(event: CalendarEvent, dayDate: Date) {
  const start = new Date(event.start);
  const end = new Date(event.end);

  // Calculate position and height
  const startHour = start.getHours() + start.getMinutes() / 60;
  const endHour = end.getHours() + end.getMinutes() / 60;
  const duration = endHour - startHour;

  const top = (startHour * 60) + 'px'; // 60px per hour
  const height = (duration * 60) + 'px';

  return {
    top,
    height,
    backgroundColor: event.color,
    left: '2px',
    right: '2px'
  };
}

function getDayEventStyle(event: CalendarEvent) {
  const start = new Date(event.start);
  const end = new Date(event.end);

  const startHour = start.getHours() + start.getMinutes() / 60;
  const endHour = end.getHours() + end.getMinutes() / 60;
  const duration = endHour - startHour;

  const top = (startHour * 60) + 'px';
  const height = (duration * 60) + 'px';

  return {
    top,
    height,
    backgroundColor: event.color
  };
}

// ============================================================================
// Lifecycle
// ============================================================================

onMounted(() => {
  loadCalendars();
  eventRemindersManager.start();
});

onUnmounted(() => {
  eventRemindersManager.stop();
});
</script>

<style scoped>
.amiga-calendar {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #a0a0a0;
  font-family: 'Press Start 2P', monospace;
}

/* ============================================================================
   Toolbar
   ============================================================================ */

.calendar-toolbar {
  display: flex;
  justify-content: space-between;
  padding: 8px;
  background: #a0a0a0;
  border-bottom: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  gap: 8px;
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 4px;
}

.current-period {
  font-size: 10px;
  padding: 4px 8px;
  white-space: nowrap;
}

.amiga-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 4px 8px;
  font-size: 8px;
  font-family: 'Press Start 2P', monospace;
  cursor: pointer;
  white-space: nowrap;
}

.amiga-button:active {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}

.amiga-select {
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 4px;
  font-size: 8px;
  font-family: 'Press Start 2P', monospace;
}

.amiga-input {
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 4px;
  font-size: 8px;
  font-family: 'Press Start 2P', monospace;
}

.search-input {
  width: 150px;
}

/* ============================================================================
   Main Layout
   ============================================================================ */

.calendar-main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.calendar-sidebar {
  width: 200px;
  background: #a0a0a0;
  border-right: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 8px;
  overflow-y: auto;
}

.calendar-view {
  flex: 1;
  overflow: auto;
  background: #a0a0a0;
  padding: 8px;
}

/* ============================================================================
   Mini Calendar
   ============================================================================ */

.mini-calendar {
  margin-bottom: 16px;
}

.mini-calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.mini-nav-btn {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 2px 6px;
  font-size: 8px;
  cursor: pointer;
  font-family: 'Press Start 2P', monospace;
}

.mini-nav-btn:active {
  border-color: #000000 #ffffff #ffffff #000000;
}

.mini-month-label {
  font-size: 8px;
}

.mini-calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: #000000;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
}

.mini-weekday {
  background: #0055aa;
  color: #ffffff;
  text-align: center;
  padding: 2px;
  font-size: 6px;
}

.mini-date {
  background: #ffffff;
  text-align: center;
  padding: 2px;
  font-size: 6px;
  cursor: pointer;
  position: relative;
}

.mini-date.other-month {
  color: #888888;
}

.mini-date.today {
  background: #ffaa00;
  font-weight: bold;
}

.mini-date.selected {
  background: #0055aa;
  color: #ffffff;
}

.mini-date:hover {
  background: #cccccc;
}

.mini-date.selected:hover {
  background: #0066cc;
}

.event-indicator {
  width: 4px;
  height: 4px;
  background: #ff0000;
  border-radius: 50%;
  position: absolute;
  bottom: 1px;
  right: 1px;
}

/* ============================================================================
   Calendars List
   ============================================================================ */

.calendars-list {
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  background: #ffffff;
  padding: 4px;
}

.calendars-header {
  font-size: 8px;
  padding: 4px;
  background: #0055aa;
  color: #ffffff;
  margin: -4px -4px 4px -4px;
}

.calendar-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  font-size: 7px;
  cursor: pointer;
}

.calendar-item:hover {
  background: #cccccc;
}

.calendar-color {
  width: 12px;
  height: 12px;
  border: 1px solid #000000;
}

.calendar-name {
  flex: 1;
}

/* ============================================================================
   Month View
   ============================================================================ */

.month-view {
  height: 100%;
}

.month-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-template-rows: auto repeat(6, 1fr);
  gap: 2px;
  height: 100%;
  background: #000000;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
}

.month-weekday {
  background: #0055aa;
  color: #ffffff;
  text-align: center;
  padding: 8px 4px;
  font-size: 8px;
}

.month-date {
  background: #ffffff;
  padding: 4px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.month-date.other-month {
  background: #cccccc;
}

.month-date.today {
  background: #ffeecc;
}

.month-date.selected {
  background: #ccddff;
}

.date-number {
  font-size: 8px;
  margin-bottom: 4px;
}

.date-events {
  flex: 1;
  overflow: hidden;
}

.month-event {
  font-size: 6px;
  padding: 2px 4px;
  margin-bottom: 2px;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  border: 1px solid rgba(0, 0, 0, 0.2);
}

.more-events {
  font-size: 6px;
  color: #666666;
  padding: 2px;
}

/* ============================================================================
   Week View
   ============================================================================ */

.week-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.week-allday-section {
  display: flex;
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  margin-bottom: 8px;
}

.time-label {
  width: 60px;
  padding: 4px;
  font-size: 7px;
  text-align: right;
  background: #a0a0a0;
  border-right: 1px solid #000000;
}

.week-days {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: #000000;
}

.week-day-allday {
  background: #ffffff;
  padding: 4px;
  min-height: 30px;
}

.week-grid-container {
  flex: 1;
  display: flex;
  overflow: auto;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  background: #ffffff;
}

.week-time-column {
  width: 60px;
  border-right: 1px solid #000000;
  background: #a0a0a0;
}

.hour-label {
  height: 60px;
  padding: 4px;
  font-size: 7px;
  text-align: right;
  border-bottom: 1px solid #cccccc;
}

.week-days-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: #000000;
}

.week-day-column {
  background: #ffffff;
  position: relative;
}

.week-day-header {
  padding: 4px;
  text-align: center;
  border-bottom: 2px solid #000000;
  background: #a0a0a0;
}

.week-day-header.today {
  background: #ffaa00;
}

.day-name {
  font-size: 7px;
}

.day-number {
  font-size: 8px;
  margin-top: 2px;
}

.week-hours {
  position: relative;
  height: 1440px; /* 24 hours * 60px */
}

.hour-slot {
  height: 60px;
  border-bottom: 1px solid #cccccc;
  cursor: pointer;
}

.hour-slot:hover {
  background: #f0f0f0;
}

.week-event {
  position: absolute;
  color: #ffffff;
  font-size: 7px;
  padding: 2px 4px;
  overflow: hidden;
  cursor: pointer;
  border: 1px solid rgba(0, 0, 0, 0.2);
}

.week-event.timed-event {
  left: 2px;
  right: 2px;
}

.allday-event {
  position: relative;
  margin-bottom: 2px;
}

.event-time {
  font-size: 6px;
  margin-bottom: 2px;
}

.event-title {
  font-size: 7px;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ============================================================================
   Day View
   ============================================================================ */

.day-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.day-allday-section {
  display: flex;
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  margin-bottom: 8px;
  padding: 4px;
}

.allday-label {
  width: 60px;
  font-size: 7px;
  padding: 4px;
}

.allday-events {
  flex: 1;
}

.day-grid {
  flex: 1;
  display: flex;
  overflow: auto;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  background: #ffffff;
}

.day-time-column {
  width: 60px;
  border-right: 1px solid #000000;
  background: #a0a0a0;
}

.day-events-column {
  flex: 1;
  position: relative;
  background: #ffffff;
  height: 1440px; /* 24 hours * 60px */
}

.day-event {
  position: absolute;
  left: 4px;
  right: 4px;
  color: #ffffff;
  font-size: 7px;
  padding: 4px;
  overflow: hidden;
  cursor: pointer;
  border: 1px solid rgba(0, 0, 0, 0.2);
}

.event-description {
  font-size: 6px;
  margin-top: 2px;
  opacity: 0.9;
}

/* ============================================================================
   Agenda View
   ============================================================================ */

.agenda-view {
  padding: 8px;
}

.no-events {
  text-align: center;
  padding: 40px;
  font-size: 10px;
  color: #666666;
}

.agenda-group {
  margin-bottom: 16px;
}

.agenda-date-header {
  font-size: 10px;
  padding: 8px;
  background: #0055aa;
  color: #ffffff;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  margin-bottom: 4px;
}

.agenda-event {
  display: flex;
  gap: 8px;
  padding: 8px;
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  margin-bottom: 4px;
  cursor: pointer;
}

.agenda-event:hover {
  background: #f0f0f0;
}

.agenda-event-time {
  width: 100px;
}

.time-label {
  font-size: 8px;
}

.agenda-event-details {
  flex: 1;
}

.agenda-event-title {
  font-size: 9px;
  margin-bottom: 4px;
  padding-left: 8px;
  border-left: 4px solid;
}

.agenda-event-description {
  font-size: 7px;
  color: #666666;
  margin-bottom: 4px;
}

.agenda-event-calendar {
  font-size: 6px;
  color: #888888;
}
</style>

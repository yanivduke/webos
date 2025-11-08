/**
 * Calendar Manager for WebOS
 * Handles calendar and event management with Amiga-style aesthetics
 */

// ============================================================================
// Interfaces and Types
// ============================================================================

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  start: Date;
  end: Date;
  allDay: boolean;
  recurring: RecurringPattern | null;
  color: string;
  calendarId: string;
  reminders: EventReminder[];
  created: Date;
  modified: Date;
}

export interface RecurringPattern {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number; // Every X days/weeks/months/years
  endDate: Date | null; // Null for never-ending
  count: number | null; // Number of occurrences (null for no limit)
  daysOfWeek: number[]; // 0-6, Sunday-Saturday (for weekly)
  dayOfMonth: number | null; // 1-31 (for monthly)
  monthOfYear: number | null; // 0-11 (for yearly)
}

export interface EventReminder {
  id: string;
  minutes: number; // Minutes before event
  triggered: boolean;
}

export interface Calendar {
  id: string;
  name: string;
  color: string;
  visible: boolean;
  isDefault: boolean;
  created: Date;
}

export interface CalendarSettings {
  firstDayOfWeek: 0 | 1; // 0 = Sunday, 1 = Monday
  timeFormat: '12h' | '24h';
  defaultView: 'month' | 'week' | 'day' | 'agenda';
  workingHoursStart: number; // 0-23
  workingHoursEnd: number; // 0-23
  showWeekNumbers: boolean;
}

// ============================================================================
// Calendar Manager Class
// ============================================================================

class CalendarManager {
  private events: Map<string, CalendarEvent> = new Map();
  private calendars: Map<string, Calendar> = new Map();
  private settings: CalendarSettings;
  private storageKey = 'webos_calendar_data';
  private settingsKey = 'webos_calendar_settings';

  constructor() {
    // Default settings
    this.settings = {
      firstDayOfWeek: 0,
      timeFormat: '12h',
      defaultView: 'month',
      workingHoursStart: 8,
      workingHoursEnd: 18,
      showWeekNumbers: false
    };

    this.loadFromStorage();
    this.ensureDefaultCalendar();
  }

  // ============================================================================
  // Event Management
  // ============================================================================

  createEvent(event: Omit<CalendarEvent, 'id' | 'created' | 'modified'>): CalendarEvent {
    const id = this.generateId();
    const now = new Date();

    const newEvent: CalendarEvent = {
      ...event,
      id,
      created: now,
      modified: now,
      start: new Date(event.start),
      end: new Date(event.end)
    };

    this.events.set(id, newEvent);
    this.saveToStorage();
    return newEvent;
  }

  updateEvent(id: string, updates: Partial<CalendarEvent>): CalendarEvent | null {
    const event = this.events.get(id);
    if (!event) return null;

    const updatedEvent: CalendarEvent = {
      ...event,
      ...updates,
      id: event.id, // Preserve ID
      created: event.created, // Preserve creation date
      modified: new Date()
    };

    this.events.set(id, updatedEvent);
    this.saveToStorage();
    return updatedEvent;
  }

  deleteEvent(id: string): boolean {
    const deleted = this.events.delete(id);
    if (deleted) {
      this.saveToStorage();
    }
    return deleted;
  }

  getEvent(id: string): CalendarEvent | null {
    return this.events.get(id) || null;
  }

  getAllEvents(): CalendarEvent[] {
    return Array.from(this.events.values());
  }

  getEvents(startDate: Date, endDate: Date, calendarIds?: string[]): CalendarEvent[] {
    const events: CalendarEvent[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (const event of this.events.values()) {
      // Filter by calendar if specified
      if (calendarIds && !calendarIds.includes(event.calendarId)) {
        continue;
      }

      // Check if event is recurring
      if (event.recurring) {
        const occurrences = this.expandRecurringEvent(event, start, end);
        events.push(...occurrences);
      } else {
        // Simple event - check if it overlaps the date range
        if (this.eventsOverlap(event.start, event.end, start, end)) {
          events.push(event);
        }
      }
    }

    return events.sort((a, b) => a.start.getTime() - b.start.getTime());
  }

  getEventsForDay(date: Date): CalendarEvent[] {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);

    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    return this.getEvents(start, end);
  }

  getEventsForWeek(date: Date): CalendarEvent[] {
    const start = this.getWeekStart(date);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    return this.getEvents(start, end);
  }

  getEventsForMonth(date: Date): CalendarEvent[] {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

    return this.getEvents(start, end);
  }

  searchEvents(query: string): CalendarEvent[] {
    const lowerQuery = query.toLowerCase();
    const allEvents = this.getAllEvents();

    return allEvents.filter(event =>
      event.title.toLowerCase().includes(lowerQuery) ||
      event.description.toLowerCase().includes(lowerQuery)
    );
  }

  // ============================================================================
  // Recurring Event Expansion
  // ============================================================================

  private expandRecurringEvent(event: CalendarEvent, rangeStart: Date, rangeEnd: Date): CalendarEvent[] {
    if (!event.recurring) return [];

    const occurrences: CalendarEvent[] = [];
    const pattern = event.recurring;
    let currentDate = new Date(event.start);
    let occurrenceCount = 0;

    // Limit to prevent infinite loops
    const maxOccurrences = 500;

    while (occurrenceCount < maxOccurrences) {
      // Check if we've reached the end date or count limit
      if (pattern.endDate && currentDate > pattern.endDate) break;
      if (pattern.count && occurrenceCount >= pattern.count) break;
      if (currentDate > rangeEnd) break;

      // Check if this occurrence falls within our range
      if (currentDate >= rangeStart || occurrenceCount === 0) {
        const duration = event.end.getTime() - event.start.getTime();
        const occurrenceEnd = new Date(currentDate.getTime() + duration);

        // For weekly recurring, check if this day is included
        if (pattern.type === 'weekly') {
          const dayOfWeek = currentDate.getDay();
          if (pattern.daysOfWeek.length > 0 && !pattern.daysOfWeek.includes(dayOfWeek)) {
            currentDate = this.getNextDate(currentDate, pattern);
            continue;
          }
        }

        occurrences.push({
          ...event,
          id: `${event.id}_${currentDate.getTime()}`,
          start: new Date(currentDate),
          end: occurrenceEnd
        });

        occurrenceCount++;
      }

      // Get next occurrence date
      currentDate = this.getNextDate(currentDate, pattern);
    }

    return occurrences;
  }

  private getNextDate(currentDate: Date, pattern: RecurringPattern): Date {
    const next = new Date(currentDate);

    switch (pattern.type) {
      case 'daily':
        next.setDate(next.getDate() + pattern.interval);
        break;

      case 'weekly':
        if (pattern.daysOfWeek.length > 0) {
          // Find next day in daysOfWeek
          let daysAdded = 1;
          while (daysAdded <= 7) {
            next.setDate(next.getDate() + 1);
            if (pattern.daysOfWeek.includes(next.getDay())) {
              break;
            }
            daysAdded++;
          }
        } else {
          next.setDate(next.getDate() + (7 * pattern.interval));
        }
        break;

      case 'monthly':
        next.setMonth(next.getMonth() + pattern.interval);
        // Handle day overflow (e.g., Jan 31 -> Feb 31 becomes Feb 28/29)
        if (pattern.dayOfMonth) {
          next.setDate(Math.min(pattern.dayOfMonth, this.getDaysInMonth(next)));
        }
        break;

      case 'yearly':
        next.setFullYear(next.getFullYear() + pattern.interval);
        break;
    }

    return next;
  }

  // ============================================================================
  // Calendar Management
  // ============================================================================

  createCalendar(calendar: Omit<Calendar, 'id' | 'created'>): Calendar {
    const id = this.generateId();

    const newCalendar: Calendar = {
      ...calendar,
      id,
      created: new Date()
    };

    this.calendars.set(id, newCalendar);
    this.saveToStorage();
    return newCalendar;
  }

  updateCalendar(id: string, updates: Partial<Calendar>): Calendar | null {
    const calendar = this.calendars.get(id);
    if (!calendar) return null;

    const updatedCalendar: Calendar = {
      ...calendar,
      ...updates,
      id: calendar.id, // Preserve ID
      created: calendar.created // Preserve creation date
    };

    this.calendars.set(id, updatedCalendar);
    this.saveToStorage();
    return updatedCalendar;
  }

  deleteCalendar(id: string): boolean {
    // Don't allow deleting the last calendar
    if (this.calendars.size <= 1) return false;

    const calendar = this.calendars.get(id);
    if (!calendar) return false;

    // Move events to default calendar
    const defaultCalendar = this.getDefaultCalendar();
    if (defaultCalendar && defaultCalendar.id !== id) {
      for (const event of this.events.values()) {
        if (event.calendarId === id) {
          event.calendarId = defaultCalendar.id;
        }
      }
    }

    const deleted = this.calendars.delete(id);
    if (deleted) {
      this.saveToStorage();
    }
    return deleted;
  }

  getCalendar(id: string): Calendar | null {
    return this.calendars.get(id) || null;
  }

  getAllCalendars(): Calendar[] {
    return Array.from(this.calendars.values());
  }

  getVisibleCalendars(): Calendar[] {
    return Array.from(this.calendars.values()).filter(cal => cal.visible);
  }

  getDefaultCalendar(): Calendar | null {
    const defaultCal = Array.from(this.calendars.values()).find(cal => cal.isDefault);
    return defaultCal || Array.from(this.calendars.values())[0] || null;
  }

  setDefaultCalendar(id: string): boolean {
    const calendar = this.calendars.get(id);
    if (!calendar) return false;

    // Unset all other defaults
    for (const cal of this.calendars.values()) {
      cal.isDefault = false;
    }

    calendar.isDefault = true;
    this.saveToStorage();
    return true;
  }

  // ============================================================================
  // Reminder Management
  // ============================================================================

  addReminder(eventId: string, minutes: number): EventReminder | null {
    const event = this.events.get(eventId);
    if (!event) return null;

    const reminder: EventReminder = {
      id: this.generateId(),
      minutes,
      triggered: false
    };

    event.reminders.push(reminder);
    this.saveToStorage();
    return reminder;
  }

  removeReminder(eventId: string, reminderId: string): boolean {
    const event = this.events.get(eventId);
    if (!event) return false;

    const index = event.reminders.findIndex(r => r.id === reminderId);
    if (index === -1) return false;

    event.reminders.splice(index, 1);
    this.saveToStorage();
    return true;
  }

  markReminderTriggered(eventId: string, reminderId: string): boolean {
    const event = this.events.get(eventId);
    if (!event) return false;

    const reminder = event.reminders.find(r => r.id === reminderId);
    if (!reminder) return false;

    reminder.triggered = true;
    this.saveToStorage();
    return true;
  }

  getPendingReminders(): Array<{ event: CalendarEvent; reminder: EventReminder }> {
    const now = new Date();
    const pending: Array<{ event: CalendarEvent; reminder: EventReminder }> = [];

    for (const event of this.events.values()) {
      for (const reminder of event.reminders) {
        if (reminder.triggered) continue;

        const reminderTime = new Date(event.start.getTime() - (reminder.minutes * 60 * 1000));
        if (reminderTime <= now) {
          pending.push({ event, reminder });
        }
      }
    }

    return pending;
  }

  // ============================================================================
  // ICS Import/Export
  // ============================================================================

  exportICS(calendarId?: string): string {
    const events = calendarId
      ? Array.from(this.events.values()).filter(e => e.calendarId === calendarId)
      : Array.from(this.events.values());

    let ics = 'BEGIN:VCALENDAR\r\n';
    ics += 'VERSION:2.0\r\n';
    ics += 'PRODID:-//WebOS//Calendar//EN\r\n';
    ics += 'CALSCALE:GREGORIAN\r\n';

    for (const event of events) {
      ics += 'BEGIN:VEVENT\r\n';
      ics += `UID:${event.id}\r\n`;
      ics += `DTSTAMP:${this.formatICSDate(event.created)}\r\n`;
      ics += `DTSTART:${this.formatICSDate(event.start)}\r\n`;
      ics += `DTEND:${this.formatICSDate(event.end)}\r\n`;
      ics += `SUMMARY:${this.escapeICS(event.title)}\r\n`;

      if (event.description) {
        ics += `DESCRIPTION:${this.escapeICS(event.description)}\r\n`;
      }

      if (event.recurring) {
        ics += this.formatRecurrenceRule(event.recurring);
      }

      for (const reminder of event.reminders) {
        ics += 'BEGIN:VALARM\r\n';
        ics += 'ACTION:DISPLAY\r\n';
        ics += `TRIGGER:-PT${reminder.minutes}M\r\n`;
        ics += 'END:VALARM\r\n';
      }

      ics += 'END:VEVENT\r\n';
    }

    ics += 'END:VCALENDAR\r\n';
    return ics;
  }

  importICS(icsString: string, calendarId: string): number {
    let importedCount = 0;
    const lines = icsString.split(/\r?\n/);
    let currentEvent: Partial<CalendarEvent> | null = null;
    let currentAlarm: Partial<EventReminder> | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line === 'BEGIN:VEVENT') {
        currentEvent = {
          calendarId,
          allDay: false,
          recurring: null,
          reminders: [],
          color: this.getCalendar(calendarId)?.color || '#0055aa'
        };
      } else if (line === 'END:VEVENT' && currentEvent) {
        if (currentEvent.title && currentEvent.start && currentEvent.end) {
          this.createEvent(currentEvent as Omit<CalendarEvent, 'id' | 'created' | 'modified'>);
          importedCount++;
        }
        currentEvent = null;
      } else if (line === 'BEGIN:VALARM') {
        currentAlarm = {};
      } else if (line === 'END:VALARM' && currentAlarm && currentEvent) {
        if (currentAlarm.minutes !== undefined) {
          currentEvent.reminders?.push({
            id: this.generateId(),
            minutes: currentAlarm.minutes,
            triggered: false
          });
        }
        currentAlarm = null;
      } else if (currentEvent) {
        const [key, ...valueParts] = line.split(':');
        const value = valueParts.join(':');

        if (key === 'SUMMARY') {
          currentEvent.title = this.unescapeICS(value);
        } else if (key === 'DESCRIPTION') {
          currentEvent.description = this.unescapeICS(value);
        } else if (key.startsWith('DTSTART')) {
          currentEvent.start = this.parseICSDate(value);
          if (key.includes('VALUE=DATE')) {
            currentEvent.allDay = true;
          }
        } else if (key.startsWith('DTEND')) {
          currentEvent.end = this.parseICSDate(value);
        } else if (key === 'RRULE') {
          currentEvent.recurring = this.parseRecurrenceRule(value);
        }
      } else if (currentAlarm && line.startsWith('TRIGGER:')) {
        const trigger = line.substring(8);
        const minutes = this.parseICSAlarmTrigger(trigger);
        if (minutes !== null) {
          currentAlarm.minutes = minutes;
        }
      }
    }

    return importedCount;
  }

  // ============================================================================
  // Settings Management
  // ============================================================================

  getSettings(): CalendarSettings {
    return { ...this.settings };
  }

  updateSettings(updates: Partial<CalendarSettings>): CalendarSettings {
    this.settings = { ...this.settings, ...updates };
    localStorage.setItem(this.settingsKey, JSON.stringify(this.settings));
    return this.settings;
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  detectConflicts(event: CalendarEvent): CalendarEvent[] {
    const conflicts: CalendarEvent[] = [];

    for (const existing of this.events.values()) {
      if (existing.id === event.id) continue;
      if (existing.calendarId !== event.calendarId) continue;

      if (this.eventsOverlap(event.start, event.end, existing.start, existing.end)) {
        conflicts.push(existing);
      }
    }

    return conflicts;
  }

  private eventsOverlap(start1: Date, end1: Date, start2: Date, end2: Date): boolean {
    return start1 < end2 && end1 > start2;
  }

  getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = (day < this.settings.firstDayOfWeek ? 7 : 0) + day - this.settings.firstDayOfWeek;
    d.setDate(d.getDate() - diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  getDaysInMonth(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }

  formatTime(date: Date): string {
    if (this.settings.timeFormat === '24h') {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    } else {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
  }

  // ============================================================================
  // ICS Helper Methods
  // ============================================================================

  private formatICSDate(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  }

  private parseICSDate(dateString: string): Date {
    // Format: YYYYMMDDTHHMMSS or YYYYMMDD
    const year = parseInt(dateString.substring(0, 4));
    const month = parseInt(dateString.substring(4, 6)) - 1;
    const day = parseInt(dateString.substring(6, 8));

    if (dateString.includes('T')) {
      const hour = parseInt(dateString.substring(9, 11));
      const minute = parseInt(dateString.substring(11, 13));
      const second = parseInt(dateString.substring(13, 15));
      return new Date(year, month, day, hour, minute, second);
    } else {
      return new Date(year, month, day);
    }
  }

  private formatRecurrenceRule(pattern: RecurringPattern): string {
    let rule = 'RRULE:FREQ=';

    switch (pattern.type) {
      case 'daily': rule += 'DAILY'; break;
      case 'weekly': rule += 'WEEKLY'; break;
      case 'monthly': rule += 'MONTHLY'; break;
      case 'yearly': rule += 'YEARLY'; break;
    }

    if (pattern.interval > 1) {
      rule += `;INTERVAL=${pattern.interval}`;
    }

    if (pattern.count) {
      rule += `;COUNT=${pattern.count}`;
    } else if (pattern.endDate) {
      rule += `;UNTIL=${this.formatICSDate(pattern.endDate)}`;
    }

    if (pattern.daysOfWeek.length > 0) {
      const days = pattern.daysOfWeek.map(d => ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'][d]).join(',');
      rule += `;BYDAY=${days}`;
    }

    return rule + '\r\n';
  }

  private parseRecurrenceRule(rrule: string): RecurringPattern | null {
    const parts = rrule.split(';');
    const pattern: Partial<RecurringPattern> = {
      interval: 1,
      endDate: null,
      count: null,
      daysOfWeek: [],
      dayOfMonth: null,
      monthOfYear: null
    };

    for (const part of parts) {
      const [key, value] = part.split('=');

      if (key === 'FREQ') {
        const freq = value.toLowerCase();
        if (freq === 'daily' || freq === 'weekly' || freq === 'monthly' || freq === 'yearly') {
          pattern.type = freq;
        }
      } else if (key === 'INTERVAL') {
        pattern.interval = parseInt(value);
      } else if (key === 'COUNT') {
        pattern.count = parseInt(value);
      } else if (key === 'UNTIL') {
        pattern.endDate = this.parseICSDate(value);
      } else if (key === 'BYDAY') {
        const dayMap: { [key: string]: number } = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };
        pattern.daysOfWeek = value.split(',').map(d => dayMap[d]).filter(d => d !== undefined);
      }
    }

    return pattern.type ? pattern as RecurringPattern : null;
  }

  private parseICSAlarmTrigger(trigger: string): number | null {
    // Format: -PT15M (15 minutes before)
    const match = trigger.match(/-PT(\d+)([MH])/);
    if (!match) return null;

    const value = parseInt(match[1]);
    const unit = match[2];

    if (unit === 'M') return value;
    if (unit === 'H') return value * 60;
    return null;
  }

  private escapeICS(text: string): string {
    return text.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n');
  }

  private unescapeICS(text: string): string {
    return text.replace(/\\n/g, '\n').replace(/\\;/g, ';').replace(/\\,/g, ',').replace(/\\\\/g, '\\');
  }

  // ============================================================================
  // Storage Methods
  // ============================================================================

  private saveToStorage(): void {
    const data = {
      events: Array.from(this.events.entries()).map(([id, event]) => ({
        ...event,
        start: event.start.toISOString(),
        end: event.end.toISOString(),
        created: event.created.toISOString(),
        modified: event.modified.toISOString(),
        recurring: event.recurring ? {
          ...event.recurring,
          endDate: event.recurring.endDate?.toISOString() || null
        } : null
      })),
      calendars: Array.from(this.calendars.entries()).map(([id, cal]) => ({
        ...cal,
        created: cal.created.toISOString()
      }))
    };

    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  private loadFromStorage(): void {
    const stored = localStorage.getItem(this.storageKey);
    const settingsStored = localStorage.getItem(this.settingsKey);

    if (settingsStored) {
      try {
        this.settings = JSON.parse(settingsStored);
      } catch (e) {
        console.error('Failed to load calendar settings:', e);
      }
    }

    if (!stored) return;

    try {
      const data = JSON.parse(stored);

      // Load calendars
      if (data.calendars) {
        for (const cal of data.calendars) {
          this.calendars.set(cal.id, {
            ...cal,
            created: new Date(cal.created)
          });
        }
      }

      // Load events
      if (data.events) {
        for (const event of data.events) {
          this.events.set(event.id, {
            ...event,
            start: new Date(event.start),
            end: new Date(event.end),
            created: new Date(event.created),
            modified: new Date(event.modified),
            recurring: event.recurring ? {
              ...event.recurring,
              endDate: event.recurring.endDate ? new Date(event.recurring.endDate) : null
            } : null
          });
        }
      }
    } catch (e) {
      console.error('Failed to load calendar data:', e);
    }
  }

  private ensureDefaultCalendar(): void {
    if (this.calendars.size === 0) {
      this.createCalendar({
        name: 'Personal',
        color: '#0055aa',
        visible: true,
        isDefault: true
      });
    }
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ============================================================================
  // Clear All Data (for testing/reset)
  // ============================================================================

  clearAllData(): void {
    this.events.clear();
    this.calendars.clear();
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.settingsKey);
    this.ensureDefaultCalendar();
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const calendarManager = new CalendarManager();
export default calendarManager;

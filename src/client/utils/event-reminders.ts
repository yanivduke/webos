/**
 * Event Reminders System for WebOS Calendar
 * Handles browser notifications and reminder alerts
 */

import { calendarManager, type CalendarEvent, type EventReminder } from './calendar-manager';

// ============================================================================
// Interfaces
// ============================================================================

export interface ReminderNotification {
  id: string;
  event: CalendarEvent;
  reminder: EventReminder;
  triggeredAt: Date;
  snoozedUntil: Date | null;
}

export interface ReminderSettings {
  enabled: boolean;
  soundEnabled: boolean;
  showDesktopNotifications: boolean;
  defaultReminderMinutes: number;
  snoozeOptions: number[]; // Minutes
}

// ============================================================================
// Event Reminders Manager
// ============================================================================

class EventRemindersManager {
  private checkInterval: number | null = null;
  private activeNotifications: Map<string, ReminderNotification> = new Map();
  private notificationCallbacks: Set<(notification: ReminderNotification) => void> = new Set();
  private settings: ReminderSettings;
  private settingsKey = 'webos_reminder_settings';
  private audioContext: AudioContext | null = null;

  constructor() {
    this.settings = {
      enabled: true,
      soundEnabled: true,
      showDesktopNotifications: true,
      defaultReminderMinutes: 15,
      snoozeOptions: [5, 10, 15, 30]
    };

    this.loadSettings();
    this.requestNotificationPermission();
  }

  // ============================================================================
  // Initialization and Control
  // ============================================================================

  start(): void {
    if (this.checkInterval) return;

    // Check for reminders every minute
    this.checkInterval = window.setInterval(() => {
      this.checkReminders();
    }, 60000); // 60 seconds

    // Also check immediately
    this.checkReminders();
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  // ============================================================================
  // Reminder Checking
  // ============================================================================

  private checkReminders(): void {
    if (!this.settings.enabled) return;

    const now = new Date();
    const pending = calendarManager.getPendingReminders();

    for (const { event, reminder } of pending) {
      // Check if this reminder is snoozed
      const notificationId = `${event.id}_${reminder.id}`;
      const existing = this.activeNotifications.get(notificationId);

      if (existing?.snoozedUntil && existing.snoozedUntil > now) {
        continue; // Still snoozed
      }

      // Create notification
      const notification: ReminderNotification = {
        id: notificationId,
        event,
        reminder,
        triggeredAt: now,
        snoozedUntil: null
      };

      this.activeNotifications.set(notificationId, notification);
      this.showNotification(notification);

      // Mark as triggered in calendar manager
      calendarManager.markReminderTriggered(event.id, reminder.id);

      // Notify listeners
      this.notifyListeners(notification);
    }
  }

  // ============================================================================
  // Notification Display
  // ============================================================================

  private showNotification(notification: ReminderNotification): void {
    const { event } = notification;

    // Show browser notification
    if (this.settings.showDesktopNotifications && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        const title = event.title;
        const body = this.formatNotificationBody(event);

        const browserNotification = new Notification(title, {
          body,
          icon: '/favicon.ico',
          tag: notification.id,
          requireInteraction: true
        });

        browserNotification.onclick = () => {
          this.handleNotificationClick(notification);
          browserNotification.close();
        };

        // Auto-close after 30 seconds
        setTimeout(() => {
          browserNotification.close();
        }, 30000);
      }
    }

    // Play sound
    if (this.settings.soundEnabled) {
      this.playNotificationSound();
    }
  }

  private formatNotificationBody(event: CalendarEvent): string {
    const startTime = calendarManager.formatTime(event.start);
    const lines: string[] = [];

    if (event.allDay) {
      lines.push('All day event');
    } else {
      lines.push(`Starting at ${startTime}`);
    }

    if (event.description) {
      const description = event.description.substring(0, 100);
      lines.push(description);
    }

    return lines.join('\n');
  }

  private handleNotificationClick(notification: ReminderNotification): void {
    // Remove from active notifications
    this.activeNotifications.delete(notification.id);

    // Emit event for calendar app to handle (e.g., open event details)
    window.dispatchEvent(new CustomEvent('calendar:show-event', {
      detail: { eventId: notification.event.id }
    }));
  }

  // ============================================================================
  // Sound Management
  // ============================================================================

  private playNotificationSound(): void {
    try {
      // Create a simple beep sound using Web Audio API
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const ctx = this.audioContext;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Amiga-style beep - two tones
      oscillator.frequency.value = 880; // A5
      oscillator.type = 'square';

      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.1);

      // Second beep
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();

        osc2.connect(gain2);
        gain2.connect(ctx.destination);

        osc2.frequency.value = 1046; // C6
        osc2.type = 'square';

        gain2.gain.setValueAtTime(0.3, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

        osc2.start(ctx.currentTime);
        osc2.stop(ctx.currentTime + 0.1);
      }, 150);
    } catch (error) {
      console.error('Failed to play notification sound:', error);
    }
  }

  // ============================================================================
  // Snooze Management
  // ============================================================================

  snooze(notificationId: string, minutes: number): boolean {
    const notification = this.activeNotifications.get(notificationId);
    if (!notification) return false;

    const snoozeUntil = new Date();
    snoozeUntil.setMinutes(snoozeUntil.getMinutes() + minutes);

    notification.snoozedUntil = snoozeUntil;

    // Un-trigger the reminder so it can fire again
    const event = calendarManager.getEvent(notification.event.id);
    if (event) {
      const reminder = event.reminders.find(r => r.id === notification.reminder.id);
      if (reminder) {
        reminder.triggered = false;
      }
    }

    return true;
  }

  dismiss(notificationId: string): boolean {
    return this.activeNotifications.delete(notificationId);
  }

  dismissAll(): void {
    this.activeNotifications.clear();
  }

  // ============================================================================
  // Active Notifications
  // ============================================================================

  getActiveNotifications(): ReminderNotification[] {
    return Array.from(this.activeNotifications.values())
      .filter(n => !n.snoozedUntil || n.snoozedUntil <= new Date())
      .sort((a, b) => a.triggeredAt.getTime() - b.triggeredAt.getTime());
  }

  getNotification(id: string): ReminderNotification | null {
    return this.activeNotifications.get(id) || null;
  }

  // ============================================================================
  // Notification Callbacks
  // ============================================================================

  onNotification(callback: (notification: ReminderNotification) => void): () => void {
    this.notificationCallbacks.add(callback);

    // Return unsubscribe function
    return () => {
      this.notificationCallbacks.delete(callback);
    };
  }

  private notifyListeners(notification: ReminderNotification): void {
    for (const callback of this.notificationCallbacks) {
      try {
        callback(notification);
      } catch (error) {
        console.error('Error in reminder notification callback:', error);
      }
    }
  }

  // ============================================================================
  // Browser Notification Permissions
  // ============================================================================

  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  getNotificationPermission(): 'granted' | 'denied' | 'default' | 'unsupported' {
    if (!('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission as 'granted' | 'denied' | 'default';
  }

  // ============================================================================
  // Settings Management
  // ============================================================================

  getSettings(): ReminderSettings {
    return { ...this.settings };
  }

  updateSettings(updates: Partial<ReminderSettings>): ReminderSettings {
    this.settings = { ...this.settings, ...updates };
    this.saveSettings();

    // Restart if enabled state changed
    if ('enabled' in updates) {
      if (updates.enabled) {
        this.start();
      } else {
        this.stop();
      }
    }

    return this.settings;
  }

  private saveSettings(): void {
    localStorage.setItem(this.settingsKey, JSON.stringify(this.settings));
  }

  private loadSettings(): void {
    const stored = localStorage.getItem(this.settingsKey);
    if (!stored) return;

    try {
      this.settings = { ...this.settings, ...JSON.parse(stored) };
    } catch (error) {
      console.error('Failed to load reminder settings:', error);
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  formatTimeUntil(date: Date): string {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 0) return 'Now';
    if (diffMins === 0) return 'Now';
    if (diffMins < 60) return `in ${diffMins} min`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) {
      const mins = diffMins % 60;
      return mins > 0 ? `in ${diffHours}h ${mins}m` : `in ${diffHours}h`;
    }

    const diffDays = Math.floor(diffHours / 24);
    return `in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
  }

  getUpcomingReminders(hours: number = 24): Array<{ event: CalendarEvent; reminder: EventReminder; timeUntil: string }> {
    const now = new Date();
    const endTime = new Date(now.getTime() + (hours * 60 * 60 * 1000));
    const events = calendarManager.getEvents(now, endTime);
    const upcoming: Array<{ event: CalendarEvent; reminder: EventReminder; timeUntil: string }> = [];

    for (const event of events) {
      for (const reminder of event.reminders) {
        if (reminder.triggered) continue;

        const reminderTime = new Date(event.start.getTime() - (reminder.minutes * 60 * 1000));
        if (reminderTime >= now && reminderTime <= endTime) {
          upcoming.push({
            event,
            reminder,
            timeUntil: this.formatTimeUntil(reminderTime)
          });
        }
      }
    }

    return upcoming.sort((a, b) => {
      const timeA = new Date(a.event.start.getTime() - (a.reminder.minutes * 60 * 1000));
      const timeB = new Date(b.event.start.getTime() - (b.reminder.minutes * 60 * 1000));
      return timeA.getTime() - timeB.getTime();
    });
  }

  // ============================================================================
  // Testing Methods
  // ============================================================================

  triggerTestNotification(): void {
    const testEvent: CalendarEvent = {
      id: 'test',
      title: 'Test Event',
      description: 'This is a test notification',
      start: new Date(),
      end: new Date(),
      allDay: false,
      recurring: null,
      color: '#0055aa',
      calendarId: 'test',
      reminders: [],
      created: new Date(),
      modified: new Date()
    };

    const testReminder: EventReminder = {
      id: 'test',
      minutes: 0,
      triggered: false
    };

    const notification: ReminderNotification = {
      id: 'test_notification',
      event: testEvent,
      reminder: testReminder,
      triggeredAt: new Date(),
      snoozedUntil: null
    };

    this.showNotification(notification);
    this.notifyListeners(notification);
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const eventRemindersManager = new EventRemindersManager();
export default eventRemindersManager;

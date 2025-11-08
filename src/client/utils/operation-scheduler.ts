/**
 * Operation Scheduler
 * Handles scheduled and recurring batch operations
 */

import { batchOperations, OperationType, ConflictStrategy } from './batch-operations';

export enum ScheduleType {
  ONCE = 'ONCE',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  CUSTOM = 'CUSTOM'
}

export interface ScheduledOperation {
  id: string;
  name: string;
  operationType: OperationType;
  source: string | string[];
  destination?: string;
  conflictStrategy: ConflictStrategy;
  scheduleType: ScheduleType;
  scheduledTime?: number; // timestamp for ONCE
  cronExpression?: string; // for CUSTOM
  dailyTime?: string; // HH:mm for DAILY
  weeklyDay?: number; // 0-6 for WEEKLY
  weeklyTime?: string; // HH:mm for WEEKLY
  monthlyDay?: number; // 1-31 for MONTHLY
  monthlyTime?: string; // HH:mm for MONTHLY
  enabled: boolean;
  lastRun?: number;
  nextRun?: number;
  runCount: number;
  createdAt: number;
}

class OperationScheduler {
  private schedules: Map<string, ScheduledOperation> = new Map();
  private checkInterval: number | null = null;
  private readonly STORAGE_KEY = 'webos_scheduled_operations';
  private readonly CHECK_INTERVAL_MS = 30000; // Check every 30 seconds

  constructor() {
    this.loadFromStorage();
    this.startScheduler();
  }

  /**
   * Add a scheduled operation
   */
  add(schedule: Omit<ScheduledOperation, 'id' | 'createdAt' | 'runCount' | 'nextRun'>): string {
    const id = this.generateId();
    const fullSchedule: ScheduledOperation = {
      ...schedule,
      id,
      createdAt: Date.now(),
      runCount: 0,
      nextRun: this.calculateNextRun(schedule)
    };

    this.schedules.set(id, fullSchedule);
    this.saveToStorage();

    return id;
  }

  /**
   * Update a scheduled operation
   */
  update(id: string, updates: Partial<ScheduledOperation>): boolean {
    const schedule = this.schedules.get(id);
    if (!schedule) return false;

    const updated = { ...schedule, ...updates };
    updated.nextRun = this.calculateNextRun(updated);

    this.schedules.set(id, updated);
    this.saveToStorage();

    return true;
  }

  /**
   * Remove a scheduled operation
   */
  remove(id: string): boolean {
    const deleted = this.schedules.delete(id);
    if (deleted) {
      this.saveToStorage();
    }
    return deleted;
  }

  /**
   * Get a scheduled operation
   */
  get(id: string): ScheduledOperation | undefined {
    return this.schedules.get(id);
  }

  /**
   * Get all scheduled operations
   */
  getAll(): ScheduledOperation[] {
    return Array.from(this.schedules.values());
  }

  /**
   * Get enabled schedules
   */
  getEnabled(): ScheduledOperation[] {
    return this.getAll().filter(s => s.enabled);
  }

  /**
   * Enable a schedule
   */
  enable(id: string): boolean {
    return this.update(id, { enabled: true });
  }

  /**
   * Disable a schedule
   */
  disable(id: string): boolean {
    return this.update(id, { enabled: false });
  }

  /**
   * Run a scheduled operation immediately
   */
  runNow(id: string): boolean {
    const schedule = this.schedules.get(id);
    if (!schedule) return false;

    this.executeSchedule(schedule);
    return true;
  }

  /**
   * Calculate next run time based on schedule
   */
  private calculateNextRun(schedule: Partial<ScheduledOperation> & { scheduleType: ScheduleType }): number {
    const now = Date.now();

    switch (schedule.scheduleType) {
      case ScheduleType.ONCE:
        return schedule.scheduledTime || now;

      case ScheduleType.DAILY:
        return this.getNextDailyRun(schedule.dailyTime || '00:00');

      case ScheduleType.WEEKLY:
        return this.getNextWeeklyRun(
          schedule.weeklyDay || 0,
          schedule.weeklyTime || '00:00'
        );

      case ScheduleType.MONTHLY:
        return this.getNextMonthlyRun(
          schedule.monthlyDay || 1,
          schedule.monthlyTime || '00:00'
        );

      case ScheduleType.CUSTOM:
        // Simple cron-like parsing would go here
        // For now, return next day
        return now + 24 * 60 * 60 * 1000;

      default:
        return now;
    }
  }

  /**
   * Get next daily run time
   */
  private getNextDailyRun(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    const now = new Date();
    const next = new Date(now);

    next.setHours(hours, minutes, 0, 0);

    // If time has passed today, schedule for tomorrow
    if (next.getTime() <= now.getTime()) {
      next.setDate(next.getDate() + 1);
    }

    return next.getTime();
  }

  /**
   * Get next weekly run time
   */
  private getNextWeeklyRun(dayOfWeek: number, time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    const now = new Date();
    const next = new Date(now);

    next.setHours(hours, minutes, 0, 0);

    // Calculate days until target day
    const currentDay = now.getDay();
    let daysUntil = dayOfWeek - currentDay;

    if (daysUntil < 0) {
      daysUntil += 7;
    } else if (daysUntil === 0 && next.getTime() <= now.getTime()) {
      daysUntil = 7;
    }

    next.setDate(next.getDate() + daysUntil);

    return next.getTime();
  }

  /**
   * Get next monthly run time
   */
  private getNextMonthlyRun(dayOfMonth: number, time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    const now = new Date();
    const next = new Date(now);

    next.setDate(dayOfMonth);
    next.setHours(hours, minutes, 0, 0);

    // If date has passed this month, go to next month
    if (next.getTime() <= now.getTime()) {
      next.setMonth(next.getMonth() + 1);
    }

    // Handle case where day doesn't exist in month (e.g., Feb 31)
    if (next.getDate() !== dayOfMonth) {
      next.setDate(0); // Last day of previous month
    }

    return next.getTime();
  }

  /**
   * Start the scheduler
   */
  private startScheduler(): void {
    if (this.checkInterval) return;

    this.checkInterval = window.setInterval(() => {
      this.checkSchedules();
    }, this.CHECK_INTERVAL_MS);

    // Check immediately
    this.checkSchedules();
  }

  /**
   * Stop the scheduler
   */
  stopScheduler(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Check if any schedules need to run
   */
  private checkSchedules(): void {
    const now = Date.now();

    for (const schedule of this.schedules.values()) {
      if (!schedule.enabled) continue;
      if (!schedule.nextRun) continue;
      if (schedule.nextRun > now) continue;

      // Time to run this schedule
      this.executeSchedule(schedule);

      // Calculate next run time
      if (schedule.scheduleType === ScheduleType.ONCE) {
        // Disable one-time schedules after execution
        schedule.enabled = false;
      }

      schedule.lastRun = now;
      schedule.runCount++;
      schedule.nextRun = this.calculateNextRun(schedule);

      this.saveToStorage();
    }
  }

  /**
   * Execute a scheduled operation
   */
  private executeSchedule(schedule: ScheduledOperation): void {
    const sources = Array.isArray(schedule.source) ? schedule.source : [schedule.source];

    batchOperations.add({
      type: schedule.operationType,
      source: schedule.source,
      destination: schedule.destination,
      totalBytes: 0,
      totalItems: sources.length,
      conflictStrategy: schedule.conflictStrategy,
      maxRetries: 3
    });

    // Show notification
    this.showNotification(
      `Scheduled: ${schedule.name}`,
      `Started ${schedule.operationType.toLowerCase()} operation`
    );
  }

  /**
   * Show browser notification
   */
  private showNotification(title: string, body: string): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' });
    }
  }

  /**
   * Request notification permission
   */
  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
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

  /**
   * Save schedules to localStorage
   */
  private saveToStorage(): void {
    try {
      const data = Array.from(this.schedules.values());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save schedules:', error);
    }
  }

  /**
   * Load schedules from localStorage
   */
  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) return;

      const schedules: ScheduledOperation[] = JSON.parse(data);
      for (const schedule of schedules) {
        // Recalculate next run time
        schedule.nextRun = this.calculateNextRun(schedule);
        this.schedules.set(schedule.id, schedule);
      }
    } catch (error) {
      console.error('Failed to load schedules:', error);
    }
  }

  /**
   * Clear all schedules
   */
  clearAll(): void {
    this.schedules.clear();
    this.saveToStorage();
  }

  /**
   * Export schedules as JSON
   */
  export(): string {
    return JSON.stringify(Array.from(this.schedules.values()), null, 2);
  }

  /**
   * Import schedules from JSON
   */
  import(json: string): boolean {
    try {
      const schedules: ScheduledOperation[] = JSON.parse(json);
      for (const schedule of schedules) {
        schedule.nextRun = this.calculateNextRun(schedule);
        this.schedules.set(schedule.id, schedule);
      }
      this.saveToStorage();
      return true;
    } catch (error) {
      console.error('Failed to import schedules:', error);
      return false;
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `sched_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get statistics
   */
  getStatistics() {
    const all = this.getAll();
    const enabled = this.getEnabled();

    return {
      total: all.length,
      enabled: enabled.length,
      disabled: all.length - enabled.length,
      totalRuns: all.reduce((sum, s) => sum + s.runCount, 0)
    };
  }
}

// Singleton instance
export const operationScheduler = new OperationScheduler();

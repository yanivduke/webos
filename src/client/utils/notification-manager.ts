/**
 * Amiga-style Notification Manager
 * Handles toast notifications and notification history with authentic Amiga styling
 */

import soundManager from './sound-manager';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  duration: number;
  read: boolean;
  persistent?: boolean; // If true, won't auto-dismiss
}

interface NotificationConfig {
  enabled: boolean;
  soundEnabled: boolean;
  maxVisible: number;
  defaultDuration: number;
}

type NotificationListener = (notifications: Notification[]) => void;
type HistoryListener = (history: Notification[]) => void;

class NotificationManager {
  private config: NotificationConfig = {
    enabled: true,
    soundEnabled: true,
    maxVisible: 5,
    defaultDuration: 5000
  };

  private activeNotifications: Notification[] = [];
  private notificationHistory: Notification[] = [];
  private notificationQueue: Notification[] = [];
  private listeners: Set<NotificationListener> = new Set();
  private historyListeners: Set<HistoryListener> = new Set();
  private processingQueue = false;

  constructor() {
    this.loadHistory();
    this.loadConfig();
  }

  /**
   * Show a notification
   */
  show(
    type: NotificationType,
    title: string,
    message: string,
    duration?: number,
    persistent = false
  ): string {
    if (!this.config.enabled) return '';

    const notification: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      message,
      timestamp: Date.now(),
      duration: duration || this.config.defaultDuration,
      read: false,
      persistent
    };

    // Add to history
    this.addToHistory(notification);

    // Add to queue
    this.notificationQueue.push(notification);

    // Process queue
    this.processQueue();

    // Play sound
    if (this.config.soundEnabled) {
      this.playNotificationSound(type);
    }

    return notification.id;
  }

  /**
   * Show info notification
   */
  info(title: string, message: string, duration?: number): string {
    return this.show('info', title, message, duration);
  }

  /**
   * Show success notification
   */
  success(title: string, message: string, duration?: number): string {
    return this.show('success', title, message, duration);
  }

  /**
   * Show warning notification
   */
  warning(title: string, message: string, duration?: number): string {
    return this.show('warning', title, message, duration);
  }

  /**
   * Show error notification
   */
  error(title: string, message: string, duration?: number): string {
    return this.show('error', title, message, duration);
  }

  /**
   * Dismiss a notification by ID
   */
  dismiss(id: string) {
    const index = this.activeNotifications.findIndex(n => n.id === id);
    if (index !== -1) {
      this.activeNotifications.splice(index, 1);
      this.notifyListeners();

      // Process queue if there are pending notifications
      if (this.notificationQueue.length > 0) {
        this.processQueue();
      }
    }
  }

  /**
   * Dismiss all active notifications
   */
  dismissAll() {
    this.activeNotifications = [];
    this.notifyListeners();
  }

  /**
   * Process notification queue
   */
  private processQueue() {
    if (this.processingQueue) return;
    this.processingQueue = true;

    const processNext = () => {
      // Check if we can show more notifications
      if (
        this.activeNotifications.length < this.config.maxVisible &&
        this.notificationQueue.length > 0
      ) {
        const notification = this.notificationQueue.shift()!;
        this.activeNotifications.push(notification);
        this.notifyListeners();

        // Auto-dismiss after duration
        if (!notification.persistent) {
          setTimeout(() => {
            this.dismiss(notification.id);
          }, notification.duration);
        }

        // Process next after a small delay
        setTimeout(processNext, 100);
      } else {
        this.processingQueue = false;
      }
    };

    processNext();
  }

  /**
   * Add notification to history
   */
  private addToHistory(notification: Notification) {
    this.notificationHistory.unshift(notification);

    // Keep only last 100 notifications
    if (this.notificationHistory.length > 100) {
      this.notificationHistory = this.notificationHistory.slice(0, 100);
    }

    this.saveHistory();
    this.notifyHistoryListeners();
  }

  /**
   * Get notification history
   */
  getHistory(): Notification[] {
    return [...this.notificationHistory];
  }

  /**
   * Get active notifications
   */
  getActive(): Notification[] {
    return [...this.activeNotifications];
  }

  /**
   * Get unread count
   */
  getUnreadCount(): number {
    return this.notificationHistory.filter(n => !n.read).length;
  }

  /**
   * Mark notification as read
   */
  markAsRead(id: string) {
    const notification = this.notificationHistory.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      this.saveHistory();
      this.notifyHistoryListeners();
    }
  }

  /**
   * Mark all as read
   */
  markAllAsRead() {
    this.notificationHistory.forEach(n => n.read = true);
    this.saveHistory();
    this.notifyHistoryListeners();
  }

  /**
   * Clear history
   */
  clearHistory() {
    this.notificationHistory = [];
    this.saveHistory();
    this.notifyHistoryListeners();
  }

  /**
   * Subscribe to active notifications changes
   */
  subscribe(listener: NotificationListener): () => void {
    this.listeners.add(listener);
    // Immediately notify with current state
    listener(this.getActive());

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Subscribe to history changes
   */
  subscribeToHistory(listener: HistoryListener): () => void {
    this.historyListeners.add(listener);
    // Immediately notify with current state
    listener(this.getHistory());

    // Return unsubscribe function
    return () => {
      this.historyListeners.delete(listener);
    };
  }

  /**
   * Notify all listeners
   */
  private notifyListeners() {
    const notifications = this.getActive();
    this.listeners.forEach(listener => listener(notifications));
  }

  /**
   * Notify all history listeners
   */
  private notifyHistoryListeners() {
    const history = this.getHistory();
    this.historyListeners.forEach(listener => listener(history));
  }

  /**
   * Play appropriate sound for notification type
   */
  private playNotificationSound(type: NotificationType) {
    switch (type) {
      case 'error':
        soundManager.play('error');
        break;
      case 'warning':
        soundManager.play('error'); // Use error sound for warnings too
        break;
      case 'success':
        soundManager.play('insert');
        break;
      case 'info':
        soundManager.play('menu');
        break;
    }
  }

  /**
   * Enable/disable notifications
   */
  setEnabled(enabled: boolean) {
    this.config.enabled = enabled;
    this.saveConfig();
  }

  /**
   * Enable/disable notification sounds
   */
  setSoundEnabled(enabled: boolean) {
    this.config.soundEnabled = enabled;
    this.saveConfig();
  }

  /**
   * Set maximum visible notifications
   */
  setMaxVisible(max: number) {
    this.config.maxVisible = Math.max(1, Math.min(10, max));
    this.saveConfig();
  }

  /**
   * Set default duration
   */
  setDefaultDuration(duration: number) {
    this.config.defaultDuration = Math.max(1000, Math.min(30000, duration));
    this.saveConfig();
  }

  /**
   * Get current config
   */
  getConfig(): NotificationConfig {
    return { ...this.config };
  }

  /**
   * Load config from localStorage
   */
  private loadConfig() {
    try {
      const saved = localStorage.getItem('webos-notification-config');
      if (saved) {
        this.config = { ...this.config, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.warn('Failed to load notification config', error);
    }
  }

  /**
   * Save config to localStorage
   */
  private saveConfig() {
    try {
      localStorage.setItem('webos-notification-config', JSON.stringify(this.config));
    } catch (error) {
      console.warn('Failed to save notification config', error);
    }
  }

  /**
   * Load notification history from localStorage
   */
  private loadHistory() {
    try {
      const saved = localStorage.getItem('webos-notification-history');
      if (saved) {
        this.notificationHistory = JSON.parse(saved);
      }
    } catch (error) {
      console.warn('Failed to load notification history', error);
    }
  }

  /**
   * Save notification history to localStorage
   */
  private saveHistory() {
    try {
      localStorage.setItem('webos-notification-history', JSON.stringify(this.notificationHistory));
    } catch (error) {
      console.warn('Failed to save notification history', error);
    }
  }
}

// Singleton instance
const notificationManager = new NotificationManager();

export default notificationManager;

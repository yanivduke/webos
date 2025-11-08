/**
 * System Logger & Debug Utility
 * Comprehensive logging system for WebOS with filtering, export, and persistence
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARNING = 2,
  ERROR = 3,
  CRITICAL = 4
}

export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
  stackTrace?: string;
}

export interface LogFilter {
  levels?: LogLevel[];
  categories?: string[];
  searchText?: string;
  startTime?: number;
  endTime?: number;
}

export interface LogStats {
  total: number;
  byLevel: Record<LogLevel, number>;
  byCategory: Record<string, number>;
  firstLog?: number;
  lastLog?: number;
}

class SystemLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private subscribers: Array<(log: LogEntry) => void> = [];
  private importantLogsKey = 'webos_important_logs';
  private minPersistLevel = LogLevel.WARNING;

  constructor() {
    // Load important logs from localStorage
    this.loadImportantLogs();

    // Setup global error handler
    this.setupGlobalErrorHandler();

    // Setup performance tracking
    this.setupPerformanceTracking();
  }

  /**
   * Setup global error handler
   */
  private setupGlobalErrorHandler() {
    // Catch unhandled errors
    window.addEventListener('error', (event) => {
      this.error('Global Error', event.message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.stack
      });
    });

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled Promise Rejection', event.reason?.toString() || 'Unknown error', {
        reason: event.reason,
        stack: event.reason?.stack
      });
    });

    // Catch console errors (optional - wrap console methods)
    this.interceptConsole();
  }

  /**
   * Intercept console methods to capture logs
   */
  private interceptConsole() {
    const originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      debug: console.debug,
      info: console.info
    };

    console.log = (...args: any[]) => {
      originalConsole.log.apply(console, args);
      this.debug('Console', args.map(a => String(a)).join(' '));
    };

    console.warn = (...args: any[]) => {
      originalConsole.warn.apply(console, args);
      this.warn('Console', args.map(a => String(a)).join(' '));
    };

    console.error = (...args: any[]) => {
      originalConsole.error.apply(console, args);
      this.error('Console', args.map(a => String(a)).join(' '));
    };

    console.debug = (...args: any[]) => {
      originalConsole.debug.apply(console, args);
      this.debug('Console', args.map(a => String(a)).join(' '));
    };

    console.info = (...args: any[]) => {
      originalConsole.info.apply(console, args);
      this.info('Console', args.map(a => String(a)).join(' '));
    };
  }

  /**
   * Setup performance tracking
   */
  private setupPerformanceTracking() {
    // Track navigation timing
    if (window.performance && window.performance.timing) {
      window.addEventListener('load', () => {
        const timing = performance.timing;
        const loadTime = timing.loadEventEnd - timing.navigationStart;
        this.info('Performance', `Page load time: ${loadTime}ms`, {
          domReady: timing.domContentLoadedEventEnd - timing.navigationStart,
          resourcesLoaded: timing.loadEventEnd - timing.navigationStart
        });
      });
    }

    // Track long tasks (if supported)
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              this.warn('Performance', `Long task detected: ${entry.duration.toFixed(0)}ms`, {
                name: entry.name,
                duration: entry.duration,
                startTime: entry.startTime
              });
            }
          }
        });
        observer.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        // Long task API not supported
      }
    }
  }

  /**
   * Add a log entry
   */
  private addLog(level: LogLevel, category: string, message: string, data?: any, stackTrace?: string) {
    const entry: LogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      level,
      category,
      message,
      data,
      stackTrace
    };

    // Add to circular buffer
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Persist important logs
    if (level >= this.minPersistLevel) {
      this.persistImportantLog(entry);
    }

    // Notify subscribers
    this.notifySubscribers(entry);

    return entry;
  }

  /**
   * Log at DEBUG level
   */
  public debug(category: string, message: string, data?: any) {
    return this.addLog(LogLevel.DEBUG, category, message, data);
  }

  /**
   * Log at INFO level
   */
  public info(category: string, message: string, data?: any) {
    return this.addLog(LogLevel.INFO, category, message, data);
  }

  /**
   * Log at WARNING level
   */
  public warn(category: string, message: string, data?: any) {
    const stack = new Error().stack;
    return this.addLog(LogLevel.WARNING, category, message, data, stack);
  }

  /**
   * Log at ERROR level
   */
  public error(category: string, message: string, data?: any) {
    const stack = new Error().stack;
    return this.addLog(LogLevel.ERROR, category, message, data, stack);
  }

  /**
   * Log at CRITICAL level
   */
  public critical(category: string, message: string, data?: any) {
    const stack = new Error().stack;
    return this.addLog(LogLevel.CRITICAL, category, message, data, stack);
  }

  /**
   * Generic log method with level parameter
   */
  public log(level: LogLevel, category: string, message: string, data?: any) {
    const stack = level >= LogLevel.WARNING ? new Error().stack : undefined;
    return this.addLog(level, category, message, data, stack);
  }

  /**
   * Get all logs
   */
  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Get filtered logs
   */
  public getFilteredLogs(filter: LogFilter): LogEntry[] {
    let filtered = [...this.logs];

    // Filter by level
    if (filter.levels && filter.levels.length > 0) {
      filtered = filtered.filter(log => filter.levels!.includes(log.level));
    }

    // Filter by category
    if (filter.categories && filter.categories.length > 0) {
      filtered = filtered.filter(log => filter.categories!.includes(log.category));
    }

    // Filter by search text
    if (filter.searchText && filter.searchText.trim()) {
      const searchLower = filter.searchText.toLowerCase();
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(searchLower) ||
        log.category.toLowerCase().includes(searchLower) ||
        (log.data && JSON.stringify(log.data).toLowerCase().includes(searchLower))
      );
    }

    // Filter by time range
    if (filter.startTime) {
      filtered = filtered.filter(log => log.timestamp >= filter.startTime!);
    }
    if (filter.endTime) {
      filtered = filtered.filter(log => log.timestamp <= filter.endTime!);
    }

    return filtered;
  }

  /**
   * Get all unique categories
   */
  public getCategories(): string[] {
    const categories = new Set<string>();
    this.logs.forEach(log => categories.add(log.category));
    return Array.from(categories).sort();
  }

  /**
   * Get log statistics
   */
  public getStats(): LogStats {
    const stats: LogStats = {
      total: this.logs.length,
      byLevel: {
        [LogLevel.DEBUG]: 0,
        [LogLevel.INFO]: 0,
        [LogLevel.WARNING]: 0,
        [LogLevel.ERROR]: 0,
        [LogLevel.CRITICAL]: 0
      },
      byCategory: {}
    };

    this.logs.forEach(log => {
      stats.byLevel[log.level]++;
      stats.byCategory[log.category] = (stats.byCategory[log.category] || 0) + 1;

      if (!stats.firstLog || log.timestamp < stats.firstLog) {
        stats.firstLog = log.timestamp;
      }
      if (!stats.lastLog || log.timestamp > stats.lastLog) {
        stats.lastLog = log.timestamp;
      }
    });

    return stats;
  }

  /**
   * Clear all logs
   */
  public clearLogs() {
    this.logs = [];
    this.clearPersistedLogs();
  }

  /**
   * Clear logs by filter
   */
  public clearLogsByFilter(filter: LogFilter) {
    const toRemove = this.getFilteredLogs(filter);
    const removeIds = new Set(toRemove.map(log => log.id));
    this.logs = this.logs.filter(log => !removeIds.has(log.id));
  }

  /**
   * Export logs to JSON
   */
  public exportToJson(filter?: LogFilter): string {
    const logs = filter ? this.getFilteredLogs(filter) : this.logs;
    const data = {
      exported: new Date().toISOString(),
      count: logs.length,
      stats: this.getStats(),
      logs: logs.map(log => ({
        ...log,
        timestamp: new Date(log.timestamp).toISOString(),
        levelName: LogLevel[log.level]
      }))
    };
    return JSON.stringify(data, null, 2);
  }

  /**
   * Export logs to CSV
   */
  public exportToCsv(filter?: LogFilter): string {
    const logs = filter ? this.getFilteredLogs(filter) : this.logs;
    const headers = 'Timestamp,Level,Category,Message,Data\n';
    const rows = logs.map(log => {
      const timestamp = new Date(log.timestamp).toISOString();
      const level = LogLevel[log.level];
      const category = this.escapeCsv(log.category);
      const message = this.escapeCsv(log.message);
      const data = log.data ? this.escapeCsv(JSON.stringify(log.data)) : '';
      return `${timestamp},${level},${category},${message},${data}`;
    }).join('\n');
    return headers + rows;
  }

  /**
   * Export logs to plain text
   */
  public exportToText(filter?: LogFilter): string {
    const logs = filter ? this.getFilteredLogs(filter) : this.logs;
    let text = `WebOS System Logs\n`;
    text += `Exported: ${new Date().toISOString()}\n`;
    text += `Total Logs: ${logs.length}\n`;
    text += `${'='.repeat(80)}\n\n`;

    logs.forEach(log => {
      const timestamp = new Date(log.timestamp).toISOString();
      const level = LogLevel[log.level].padEnd(8);
      text += `[${timestamp}] ${level} [${log.category}]\n`;
      text += `  ${log.message}\n`;
      if (log.data) {
        text += `  Data: ${JSON.stringify(log.data, null, 2)}\n`;
      }
      if (log.stackTrace) {
        text += `  Stack: ${log.stackTrace}\n`;
      }
      text += `\n`;
    });

    return text;
  }

  /**
   * Helper to escape CSV values
   */
  private escapeCsv(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  /**
   * Persist important logs to localStorage
   */
  private persistImportantLog(entry: LogEntry) {
    try {
      const stored = localStorage.getItem(this.importantLogsKey);
      let importantLogs: LogEntry[] = stored ? JSON.parse(stored) : [];

      importantLogs.push(entry);

      // Keep only last 100 important logs
      if (importantLogs.length > 100) {
        importantLogs = importantLogs.slice(-100);
      }

      localStorage.setItem(this.importantLogsKey, JSON.stringify(importantLogs));
    } catch (e) {
      // localStorage full or unavailable
    }
  }

  /**
   * Load important logs from localStorage
   */
  private loadImportantLogs() {
    try {
      const stored = localStorage.getItem(this.importantLogsKey);
      if (stored) {
        const importantLogs: LogEntry[] = JSON.parse(stored);
        // Add to current logs (they'll be at the beginning)
        this.logs.unshift(...importantLogs);
      }
    } catch (e) {
      // Failed to load
    }
  }

  /**
   * Clear persisted logs
   */
  private clearPersistedLogs() {
    try {
      localStorage.removeItem(this.importantLogsKey);
    } catch (e) {
      // Failed to clear
    }
  }

  /**
   * Subscribe to new log entries
   */
  public subscribe(callback: (log: LogEntry) => void) {
    this.subscribers.push(callback);
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  /**
   * Notify all subscribers
   */
  private notifySubscribers(log: LogEntry) {
    this.subscribers.forEach(callback => {
      try {
        callback(log);
      } catch (e) {
        // Don't let subscriber errors break logging
      }
    });
  }

  /**
   * Get log level name
   */
  public getLevelName(level: LogLevel): string {
    return LogLevel[level];
  }

  /**
   * Get log level color
   */
  public getLevelColor(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG: return '#888888';
      case LogLevel.INFO: return '#0055aa';
      case LogLevel.WARNING: return '#ffaa00';
      case LogLevel.ERROR: return '#ff0000';
      case LogLevel.CRITICAL: return '#ff0000';
      default: return '#000000';
    }
  }

  /**
   * Set max logs to keep in memory
   */
  public setMaxLogs(max: number) {
    this.maxLogs = max;
    while (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  /**
   * Get max logs setting
   */
  public getMaxLogs(): number {
    return this.maxLogs;
  }
}

// Export singleton instance
export const systemLogger = new SystemLogger();

/**
 * Performance Monitor Utility
 * Collects and tracks browser performance metrics for WebOS System Monitor
 */

export interface PerformanceMetrics {
  timestamp: number;
  cpu: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  network: {
    uploadSpeed: number;
    downloadSpeed: number;
    activeConnections: number;
  };
  storage: {
    used: number;
    total: number;
    percentage: number;
  };
  fps: number;
}

export interface ProcessInfo {
  id: string;
  name: string;
  type: string;
  memory: number;
  cpu: number;
  startTime: number;
  status: 'running' | 'sleeping' | 'waiting';
}

class PerformanceMonitor {
  private history: PerformanceMetrics[] = [];
  private maxHistorySize = 60; // 60 seconds at 1 second intervals
  private apiCallCount = 0;
  private apiResponseTimes: number[] = [];
  private lastNetworkBytes = 0;
  private lastNetworkTime = 0;
  private processes: Map<string, ProcessInfo> = new Map();
  private fpsFrameCount = 0;
  private fpsLastTime = performance.now();
  private currentFps = 60;

  constructor() {
    // Start FPS tracking
    this.trackFps();
  }

  /**
   * Collect current performance metrics
   */
  public collectMetrics(): PerformanceMetrics {
    const timestamp = Date.now();
    const memory = this.getMemoryUsage();
    const storage = this.getStorageUsage();
    const network = this.getNetworkMetrics();
    const cpu = this.getCpuUsage();

    const metrics: PerformanceMetrics = {
      timestamp,
      cpu,
      memory,
      network,
      storage,
      fps: this.currentFps,
    };

    // Add to history
    this.history.push(metrics);
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }

    return metrics;
  }

  /**
   * Get memory usage information
   */
  private getMemoryUsage() {
    // Use performance.memory if available (Chrome/Edge)
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const used = memory.usedJSHeapSize;
      const total = memory.jsHeapSizeLimit;
      return {
        used,
        total,
        percentage: (used / total) * 100,
      };
    }

    // Fallback estimation
    const estimatedUsed = Math.random() * 50000000 + 10000000; // 10-60 MB
    const estimatedTotal = 100000000; // 100 MB
    return {
      used: estimatedUsed,
      total: estimatedTotal,
      percentage: (estimatedUsed / estimatedTotal) * 100,
    };
  }

  /**
   * Get storage usage (localStorage)
   */
  private getStorageUsage() {
    try {
      let used = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage[key].length + key.length;
        }
      }

      // Most browsers limit localStorage to 5-10MB
      const total = 5 * 1024 * 1024; // 5 MB
      used = used * 2; // Approximate bytes (char = 2 bytes in UTF-16)

      return {
        used,
        total,
        percentage: (used / total) * 100,
      };
    } catch (e) {
      return {
        used: 0,
        total: 5 * 1024 * 1024,
        percentage: 0,
      };
    }
  }

  /**
   * Get network metrics
   */
  private getNetworkMetrics() {
    const now = performance.now();

    // Use Navigation Timing API for network data
    let uploadSpeed = 0;
    let downloadSpeed = 0;
    let activeConnections = 0;

    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        downloadSpeed = connection.downlink || 0; // Mbps
        activeConnections = 1;
      }
    }

    // Simulate some network activity
    if (this.lastNetworkTime > 0) {
      const timeDiff = (now - this.lastNetworkTime) / 1000; // seconds
      const apiActivity = this.apiCallCount * 0.1; // KB per API call
      downloadSpeed = (apiActivity / timeDiff) * 8; // Convert to kbps
      uploadSpeed = downloadSpeed * 0.1; // Upload usually lower
    }

    this.lastNetworkTime = now;
    this.lastNetworkBytes += this.apiCallCount * 100;

    return {
      uploadSpeed,
      downloadSpeed,
      activeConnections,
    };
  }

  /**
   * Estimate CPU usage
   */
  private getCpuUsage(): number {
    // Simulate CPU usage based on various factors
    const baseUsage = 5; // Base system usage
    const processUsage = this.processes.size * 2; // Each process adds 2%
    const randomVariation = Math.random() * 10; // Random activity

    return Math.min(100, baseUsage + processUsage + randomVariation);
  }

  /**
   * Track FPS
   */
  private trackFps() {
    const measureFps = () => {
      this.fpsFrameCount++;
      const now = performance.now();
      const elapsed = now - this.fpsLastTime;

      if (elapsed >= 1000) {
        this.currentFps = Math.round((this.fpsFrameCount * 1000) / elapsed);
        this.fpsFrameCount = 0;
        this.fpsLastTime = now;
      }

      requestAnimationFrame(measureFps);
    };

    requestAnimationFrame(measureFps);
  }

  /**
   * Get performance history
   */
  public getHistory(): PerformanceMetrics[] {
    return [...this.history];
  }

  /**
   * Track API call
   */
  public trackApiCall(responseTime: number) {
    this.apiCallCount++;
    this.apiResponseTimes.push(responseTime);
    if (this.apiResponseTimes.length > 100) {
      this.apiResponseTimes.shift();
    }
  }

  /**
   * Get average API response time
   */
  public getAverageApiResponseTime(): number {
    if (this.apiResponseTimes.length === 0) return 0;
    const sum = this.apiResponseTimes.reduce((a, b) => a + b, 0);
    return sum / this.apiResponseTimes.length;
  }

  /**
   * Get API call count
   */
  public getApiCallCount(): number {
    return this.apiCallCount;
  }

  /**
   * Register a process (window/app)
   */
  public registerProcess(process: ProcessInfo) {
    this.processes.set(process.id, process);
  }

  /**
   * Unregister a process
   */
  public unregisterProcess(id: string) {
    this.processes.delete(id);
  }

  /**
   * Update process info
   */
  public updateProcess(id: string, updates: Partial<ProcessInfo>) {
    const process = this.processes.get(id);
    if (process) {
      this.processes.set(id, { ...process, ...updates });
    }
  }

  /**
   * Get all processes
   */
  public getProcesses(): ProcessInfo[] {
    return Array.from(this.processes.values());
  }

  /**
   * Get system information
   */
  public getSystemInfo() {
    const nav = navigator as any;
    return {
      browser: this.getBrowserInfo(),
      os: nav.platform || 'Unknown',
      cores: nav.hardwareConcurrency || 4,
      language: nav.language,
      online: nav.onLine,
      cookiesEnabled: nav.cookieEnabled,
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth,
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    };
  }

  /**
   * Get browser information
   */
  private getBrowserInfo(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  /**
   * Export data to JSON
   */
  public exportToJson(): string {
    const data = {
      timestamp: new Date().toISOString(),
      history: this.history,
      processes: Array.from(this.processes.values()),
      systemInfo: this.getSystemInfo(),
      stats: {
        apiCalls: this.apiCallCount,
        avgResponseTime: this.getAverageApiResponseTime(),
      },
    };
    return JSON.stringify(data, null, 2);
  }

  /**
   * Export data to CSV
   */
  public exportToCsv(): string {
    const headers = 'Timestamp,CPU %,Memory Used,Memory Total,Memory %,Network Down,Network Up,Storage %,FPS\n';
    const rows = this.history.map(m =>
      `${new Date(m.timestamp).toISOString()},${m.cpu.toFixed(2)},${m.memory.used},${m.memory.total},${m.memory.percentage.toFixed(2)},${m.network.downloadSpeed.toFixed(2)},${m.network.uploadSpeed.toFixed(2)},${m.storage.percentage.toFixed(2)},${m.fps}`
    ).join('\n');
    return headers + rows;
  }

  /**
   * Clear history
   */
  public clearHistory() {
    this.history = [];
  }

  /**
   * Reset statistics
   */
  public resetStats() {
    this.apiCallCount = 0;
    this.apiResponseTimes = [];
    this.clearHistory();
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Resource Monitor - System resource tracking and monitoring
 * Provides real-time monitoring of CPU, memory, storage, network, and processes
 */

export interface CPUInfo {
  usage: number; // Percentage 0-100
  cores: number;
  speed: number; // MHz
  model: string;
  loadAverage?: number[]; // 1, 5, 15 minute averages
}

export interface MemoryInfo {
  used: number; // Bytes
  total: number; // Bytes
  available: number; // Bytes
  percentage: number; // 0-100
  swap?: {
    used: number;
    total: number;
    percentage: number;
  };
}

export interface DiskInfo {
  id: string;
  name: string;
  used: number; // Bytes
  total: number; // Bytes
  free: number; // Bytes
  percentage: number; // 0-100
  type: 'floppy' | 'hard' | 'ram' | 'network';
}

export interface NetworkInfo {
  uploadSpeed: number; // Bytes per second
  downloadSpeed: number; // Bytes per second
  totalUploaded: number; // Bytes
  totalDownloaded: number; // Bytes
  connections: number;
}

export interface ProcessInfo {
  pid: number;
  name: string;
  cpu: number; // Percentage
  memory: number; // Bytes
  memoryPercent: number; // Percentage
  status: 'running' | 'sleeping' | 'stopped' | 'zombie';
  startTime: number; // Timestamp
  user?: string;
  command?: string;
}

export interface SystemResources {
  timestamp: number;
  cpu: CPUInfo;
  memory: MemoryInfo;
  disks: DiskInfo[];
  network: NetworkInfo;
  processes: ProcessInfo[];
}

export interface ResourceAlert {
  id: string;
  type: 'cpu' | 'memory' | 'disk' | 'network';
  severity: 'warning' | 'critical';
  message: string;
  value: number;
  threshold: number;
  timestamp: number;
}

export interface ResourceHistoryPoint {
  timestamp: number;
  cpu: number;
  memory: number;
  disk: number;
  network: {
    upload: number;
    download: number;
  };
}

interface MonitorConfig {
  interval: number; // Milliseconds between updates
  historyDuration: number; // Minutes to keep history
  alertThresholds: {
    cpu: number; // Percentage
    memory: number; // Percentage
    disk: number; // Percentage
  };
}

class ResourceMonitor {
  private config: MonitorConfig = {
    interval: 1000, // 1 second
    historyDuration: 60, // 60 minutes
    alertThresholds: {
      cpu: 90,
      memory: 95,
      disk: 90
    }
  };

  private intervalId: number | null = null;
  private history: ResourceHistoryPoint[] = [];
  private alerts: ResourceAlert[] = [];
  private subscribers: Array<(resources: SystemResources) => void> = [];
  private alertSubscribers: Array<(alert: ResourceAlert) => void> = [];
  private isRunning = false;

  private readonly STORAGE_KEY = 'webos_resource_history';
  private readonly MAX_HISTORY_POINTS = 3600; // 1 hour at 1 second intervals
  private readonly MAX_ALERTS = 100;

  constructor() {
    this.loadHistory();
  }

  /**
   * Start monitoring system resources
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.update();
    this.intervalId = window.setInterval(() => this.update(), this.config.interval);
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.saveHistory();
  }

  /**
   * Set monitoring interval
   */
  setInterval(milliseconds: number): void {
    this.config.interval = Math.max(100, milliseconds); // Min 100ms
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }

  /**
   * Get current system resources
   */
  async getCurrentResources(): Promise<SystemResources> {
    try {
      const response = await fetch('/api/monitor/resources');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return this.normalizeResources(data);
    } catch (error) {
      console.error('Failed to fetch resources:', error);
      return this.getMockResources();
    }
  }

  /**
   * Get resource history for specified duration
   */
  getResourceHistory(minutes: number = 60): ResourceHistoryPoint[] {
    const cutoff = Date.now() - minutes * 60 * 1000;
    return this.history.filter(point => point.timestamp >= cutoff);
  }

  /**
   * Get all resource history
   */
  getAllHistory(): ResourceHistoryPoint[] {
    return [...this.history];
  }

  /**
   * Get process list
   */
  async getProcessList(): Promise<ProcessInfo[]> {
    try {
      const response = await fetch('/api/monitor/processes');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.processes || [];
    } catch (error) {
      console.error('Failed to fetch process list:', error);
      return this.getMockProcesses();
    }
  }

  /**
   * Get process details by PID
   */
  async getProcessDetails(pid: number): Promise<ProcessInfo | null> {
    try {
      const response = await fetch(`/api/monitor/process/${pid}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch process details:', error);
      return null;
    }
  }

  /**
   * Kill a process by PID
   */
  async killProcess(pid: number): Promise<boolean> {
    try {
      const response = await fetch(`/api/monitor/process/${pid}/kill`, {
        method: 'POST'
      });
      return response.ok;
    } catch (error) {
      console.error('Failed to kill process:', error);
      return false;
    }
  }

  /**
   * Get disk usage for specific disk
   */
  async getDiskUsage(diskId: string): Promise<DiskInfo | null> {
    try {
      const response = await fetch(`/api/monitor/disk/${diskId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch disk usage:', error);
      return null;
    }
  }

  /**
   * Get storage breakdown by file type
   */
  async getStorageBreakdown(diskId?: string): Promise<Record<string, number>> {
    try {
      const url = diskId
        ? `/api/monitor/disk/${diskId}/breakdown`
        : '/api/monitor/storage/breakdown';
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.breakdown || {};
    } catch (error) {
      console.error('Failed to fetch storage breakdown:', error);
      return {
        'Documents': 1024 * 1024 * 50,
        'Images': 1024 * 1024 * 120,
        'Videos': 1024 * 1024 * 250,
        'Audio': 1024 * 1024 * 80,
        'Archives': 1024 * 1024 * 40,
        'Code': 1024 * 1024 * 30,
        'Other': 1024 * 1024 * 20
      };
    }
  }

  /**
   * Get active alerts
   */
  getAlerts(): ResourceAlert[] {
    return [...this.alerts];
  }

  /**
   * Clear specific alert
   */
  clearAlert(alertId: string): void {
    this.alerts = this.alerts.filter(alert => alert.id !== alertId);
  }

  /**
   * Clear all alerts
   */
  clearAllAlerts(): void {
    this.alerts = [];
  }

  /**
   * Subscribe to resource updates
   */
  subscribe(callback: (resources: SystemResources) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  /**
   * Subscribe to alerts
   */
  subscribeToAlerts(callback: (alert: ResourceAlert) => void): () => void {
    this.alertSubscribers.push(callback);
    return () => {
      this.alertSubscribers = this.alertSubscribers.filter(cb => cb !== callback);
    };
  }

  /**
   * Set alert thresholds
   */
  setAlertThresholds(thresholds: Partial<MonitorConfig['alertThresholds']>): void {
    this.config.alertThresholds = {
      ...this.config.alertThresholds,
      ...thresholds
    };
  }

  /**
   * Get current configuration
   */
  getConfig(): MonitorConfig {
    return { ...this.config };
  }

  /**
   * Export history as CSV
   */
  exportHistoryCSV(): string {
    const headers = ['Timestamp', 'CPU %', 'Memory %', 'Disk %', 'Upload KB/s', 'Download KB/s'];
    const rows = this.history.map(point => [
      new Date(point.timestamp).toISOString(),
      point.cpu.toFixed(2),
      point.memory.toFixed(2),
      point.disk.toFixed(2),
      (point.network.upload / 1024).toFixed(2),
      (point.network.download / 1024).toFixed(2)
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  /**
   * Export history as JSON
   */
  exportHistoryJSON(): string {
    return JSON.stringify(this.history, null, 2);
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.history = [];
    this.saveHistory();
  }

  // Private methods

  private async update(): Promise<void> {
    const resources = await this.getCurrentResources();

    // Add to history
    this.addToHistory(resources);

    // Check for alerts
    this.checkAlerts(resources);

    // Notify subscribers
    this.notifySubscribers(resources);
  }

  private addToHistory(resources: SystemResources): void {
    const point: ResourceHistoryPoint = {
      timestamp: resources.timestamp,
      cpu: resources.cpu.usage,
      memory: resources.memory.percentage,
      disk: this.getAverageDiskUsage(resources.disks),
      network: {
        upload: resources.network.uploadSpeed,
        download: resources.network.downloadSpeed
      }
    };

    this.history.push(point);

    // Limit history size
    if (this.history.length > this.MAX_HISTORY_POINTS) {
      this.history = this.history.slice(-this.MAX_HISTORY_POINTS);
    }

    // Periodically save to localStorage (every 60 points = ~1 minute)
    if (this.history.length % 60 === 0) {
      this.saveHistory();
    }
  }

  private checkAlerts(resources: SystemResources): void {
    // CPU alert
    if (resources.cpu.usage >= this.config.alertThresholds.cpu) {
      this.createAlert('cpu', resources.cpu.usage, this.config.alertThresholds.cpu,
        `High CPU usage: ${resources.cpu.usage.toFixed(1)}%`);
    }

    // Memory alert
    if (resources.memory.percentage >= this.config.alertThresholds.memory) {
      this.createAlert('memory', resources.memory.percentage, this.config.alertThresholds.memory,
        `High memory usage: ${resources.memory.percentage.toFixed(1)}%`);
    }

    // Disk alerts
    resources.disks.forEach(disk => {
      if (disk.percentage >= this.config.alertThresholds.disk) {
        this.createAlert('disk', disk.percentage, this.config.alertThresholds.disk,
          `High disk usage on ${disk.name}: ${disk.percentage.toFixed(1)}%`);
      }
    });
  }

  private createAlert(
    type: ResourceAlert['type'],
    value: number,
    threshold: number,
    message: string
  ): void {
    const severity: ResourceAlert['severity'] =
      value >= threshold + 5 ? 'critical' : 'warning';

    const alert: ResourceAlert = {
      id: `${type}-${Date.now()}`,
      type,
      severity,
      message,
      value,
      threshold,
      timestamp: Date.now()
    };

    // Avoid duplicate alerts (same type within last 60 seconds)
    const recentSimilar = this.alerts.find(
      a => a.type === type && Date.now() - a.timestamp < 60000
    );

    if (!recentSimilar) {
      this.alerts.push(alert);

      // Limit alerts
      if (this.alerts.length > this.MAX_ALERTS) {
        this.alerts = this.alerts.slice(-this.MAX_ALERTS);
      }

      // Notify alert subscribers
      this.alertSubscribers.forEach(callback => {
        try {
          callback(alert);
        } catch (error) {
          console.error('Alert subscriber error:', error);
        }
      });
    }
  }

  private notifySubscribers(resources: SystemResources): void {
    this.subscribers.forEach(callback => {
      try {
        callback(resources);
      } catch (error) {
        console.error('Subscriber error:', error);
      }
    });
  }

  private getAverageDiskUsage(disks: DiskInfo[]): number {
    if (disks.length === 0) return 0;
    const total = disks.reduce((sum, disk) => sum + disk.percentage, 0);
    return total / disks.length;
  }

  private normalizeResources(data: any): SystemResources {
    return {
      timestamp: data.timestamp || Date.now(),
      cpu: data.cpu || { usage: 0, cores: 1, speed: 0, model: 'Unknown' },
      memory: data.memory || { used: 0, total: 0, available: 0, percentage: 0 },
      disks: data.disks || [],
      network: data.network || {
        uploadSpeed: 0,
        downloadSpeed: 0,
        totalUploaded: 0,
        totalDownloaded: 0,
        connections: 0
      },
      processes: data.processes || []
    };
  }

  private getMockResources(): SystemResources {
    const cpuUsage = 20 + Math.random() * 40; // 20-60%
    const memUsed = 200 * 1024 * 1024 + Math.random() * 100 * 1024 * 1024; // 200-300MB
    const memTotal = 512 * 1024 * 1024; // 512MB

    return {
      timestamp: Date.now(),
      cpu: {
        usage: cpuUsage,
        cores: 4,
        speed: 2400,
        model: 'Motorola 68040',
        loadAverage: [cpuUsage / 100, cpuUsage / 100, cpuUsage / 100]
      },
      memory: {
        used: memUsed,
        total: memTotal,
        available: memTotal - memUsed,
        percentage: (memUsed / memTotal) * 100
      },
      disks: [
        {
          id: 'df0',
          name: 'Workbench3.1',
          used: 700 * 1024,
          total: 880 * 1024,
          free: 180 * 1024,
          percentage: 79.5,
          type: 'floppy'
        },
        {
          id: 'dh0',
          name: 'System',
          used: 450 * 1024 * 1024,
          total: 1024 * 1024 * 1024,
          free: 574 * 1024 * 1024,
          percentage: 43.9,
          type: 'hard'
        }
      ],
      network: {
        uploadSpeed: Math.random() * 1024 * 100, // 0-100KB/s
        downloadSpeed: Math.random() * 1024 * 500, // 0-500KB/s
        totalUploaded: 1024 * 1024 * 50,
        totalDownloaded: 1024 * 1024 * 200,
        connections: Math.floor(Math.random() * 10)
      },
      processes: this.getMockProcesses()
    };
  }

  private getMockProcesses(): ProcessInfo[] {
    return [
      {
        pid: 1,
        name: 'Workbench',
        cpu: 2.5,
        memory: 50 * 1024 * 1024,
        memoryPercent: 9.7,
        status: 'running',
        startTime: Date.now() - 3600000,
        user: 'system',
        command: 'workbench'
      },
      {
        pid: 42,
        name: 'AmigaShell',
        cpu: 0.5,
        memory: 10 * 1024 * 1024,
        memoryPercent: 1.9,
        status: 'sleeping',
        startTime: Date.now() - 1800000,
        user: 'user',
        command: 'shell'
      },
      {
        pid: 128,
        name: 'DiskValidator',
        cpu: 1.2,
        memory: 5 * 1024 * 1024,
        memoryPercent: 0.9,
        status: 'running',
        startTime: Date.now() - 7200000,
        user: 'system',
        command: 'validator'
      }
    ];
  }

  private saveHistory(): void {
    try {
      // Save last hour of history to localStorage
      const recentHistory = this.getResourceHistory(60);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(recentHistory));
    } catch (error) {
      console.error('Failed to save history:', error);
    }
  }

  private loadHistory(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.history = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
      this.history = [];
    }
  }
}

// Export singleton instance
export const resourceMonitor = new ResourceMonitor();
export default resourceMonitor;

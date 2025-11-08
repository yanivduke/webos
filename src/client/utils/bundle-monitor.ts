/**
 * Bundle Monitor Utility
 *
 * Monitors and logs bundle loading performance in development mode.
 * Provides insights into chunk sizes, load times, and caching.
 */

interface ChunkLoadMetrics {
  name: string;
  size: number;
  loadTime: number;
  cached: boolean;
  timestamp: number;
}

class BundleMonitor {
  private metrics: ChunkLoadMetrics[] = [];
  private observer: PerformanceObserver | null = null;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = import.meta.env.DEV;
  }

  /**
   * Initialize bundle monitoring
   */
  initialize(): void {
    if (!this.isDevelopment) {
      return; // Only monitor in development
    }

    console.log(
      '%c🚀 WebOS Bundle Monitor Active',
      'background: #0055aa; color: white; padding: 4px 8px; font-weight: bold;'
    );

    this.setupPerformanceObserver();
    this.logInitialMetrics();
  }

  /**
   * Set up PerformanceObserver to track resource loading
   */
  private setupPerformanceObserver(): void {
    if (!window.PerformanceObserver) {
      console.warn('PerformanceObserver not supported');
      return;
    }

    try {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            this.handleResourceEntry(entry as PerformanceResourceTiming);
          }
        }
      });

      this.observer.observe({ entryTypes: ['resource'] });
    } catch (error) {
      console.warn('Failed to set up PerformanceObserver:', error);
    }
  }

  /**
   * Handle resource entry from PerformanceObserver
   */
  private handleResourceEntry(entry: PerformanceResourceTiming): void {
    const name = entry.name;

    // Only track JS chunks
    if (!name.includes('/assets/') || !name.endsWith('.js')) {
      return;
    }

    const metric: ChunkLoadMetrics = {
      name: this.extractChunkName(name),
      size: entry.transferSize || 0,
      loadTime: entry.duration,
      cached: entry.transferSize === 0,
      timestamp: Date.now()
    };

    this.metrics.push(metric);
    this.logChunkLoad(metric);
  }

  /**
   * Extract chunk name from URL
   */
  private extractChunkName(url: string): string {
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    return filename.split('-')[0] || filename;
  }

  /**
   * Log chunk load event
   */
  private logChunkLoad(metric: ChunkLoadMetrics): void {
    const sizeKB = (metric.size / 1024).toFixed(2);
    const loadTimeMs = metric.loadTime.toFixed(2);
    const cacheStatus = metric.cached ? '(cached)' : '';

    console.log(
      `%c📦 Chunk Loaded: ${metric.name} ${cacheStatus}`,
      'color: #0055aa; font-weight: bold;',
      `\n  Size: ${sizeKB} KB`,
      `\n  Load Time: ${loadTimeMs} ms`
    );
  }

  /**
   * Log initial metrics (page load)
   */
  private logInitialMetrics(): void {
    if (!window.performance || !window.performance.timing) {
      return;
    }

    setTimeout(() => {
      const timing = window.performance.timing;
      const loadTime = timing.loadEventEnd - timing.navigationStart;
      const domReady = timing.domContentLoadedEventEnd - timing.navigationStart;

      console.log(
        '%c📊 Initial Load Metrics',
        'background: #0055aa; color: white; padding: 4px 8px; font-weight: bold;'
      );
      console.table({
        'Page Load': `${loadTime} ms`,
        'DOM Ready': `${domReady} ms`,
        'DNS Lookup': `${timing.domainLookupEnd - timing.domainLookupStart} ms`,
        'TCP Connection': `${timing.connectEnd - timing.connectStart} ms`,
      });

      // Log performance entries
      this.logResourceSummary();
    }, 2000);
  }

  /**
   * Log summary of loaded resources
   */
  private logResourceSummary(): void {
    if (!window.performance || !window.performance.getEntriesByType) {
      return;
    }

    const resources = window.performance.getEntriesByType('resource') as PerformanceResourceTiming[];

    let totalJS = 0;
    let totalCSS = 0;
    let jsCount = 0;
    let cssCount = 0;

    resources.forEach((resource) => {
      if (resource.name.endsWith('.js')) {
        totalJS += resource.transferSize || 0;
        jsCount++;
      } else if (resource.name.endsWith('.css')) {
        totalCSS += resource.transferSize || 0;
        cssCount++;
      }
    });

    console.log(
      '%c📈 Resource Summary',
      'background: #0055aa; color: white; padding: 4px 8px; font-weight: bold;'
    );
    console.table({
      'JavaScript': `${(totalJS / 1024).toFixed(2)} KB (${jsCount} files)`,
      'CSS': `${(totalCSS / 1024).toFixed(2)} KB (${cssCount} files)`,
      'Total': `${((totalJS + totalCSS) / 1024).toFixed(2)} KB`,
    });
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): ChunkLoadMetrics[] {
    return [...this.metrics];
  }

  /**
   * Get metrics summary
   */
  getSummary(): {
    totalChunks: number;
    totalSize: number;
    averageLoadTime: number;
    cachedChunks: number;
  } {
    const totalChunks = this.metrics.length;
    const totalSize = this.metrics.reduce((sum, m) => sum + m.size, 0);
    const averageLoadTime = totalChunks > 0
      ? this.metrics.reduce((sum, m) => sum + m.loadTime, 0) / totalChunks
      : 0;
    const cachedChunks = this.metrics.filter(m => m.cached).length;

    return {
      totalChunks,
      totalSize,
      averageLoadTime,
      cachedChunks,
    };
  }

  /**
   * Log current summary
   */
  logSummary(): void {
    const summary = this.getSummary();

    console.log(
      '%c📊 Bundle Monitor Summary',
      'background: #0055aa; color: white; padding: 4px 8px; font-weight: bold;'
    );
    console.table({
      'Total Chunks': summary.totalChunks,
      'Total Size': `${(summary.totalSize / 1024).toFixed(2)} KB`,
      'Average Load Time': `${summary.averageLoadTime.toFixed(2)} ms`,
      'Cached Chunks': summary.cachedChunks,
      'Cache Hit Rate': `${((summary.cachedChunks / summary.totalChunks) * 100).toFixed(1)}%`,
    });
  }

  /**
   * Clean up observer
   */
  destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

// Export singleton instance
export const bundleMonitor = new BundleMonitor();

// Global access for debugging
if (import.meta.env.DEV) {
  (window as any).__bundleMonitor = bundleMonitor;
}

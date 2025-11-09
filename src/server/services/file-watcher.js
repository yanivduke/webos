const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const EventEmitter = require('events');

/**
 * File Watcher Service
 * Watches file system for changes and emits events
 */
class FileWatcher extends EventEmitter {
  constructor(basePath) {
    super();
    this.basePath = basePath;
    this.watchers = new Map();
    this.watchedPaths = new Set();
  }

  /**
   * Watch a directory for changes
   */
  watchDirectory(dirPath) {
    const fullPath = path.join(this.basePath, dirPath);

    if (this.watchedPaths.has(fullPath)) {
      return; // Already watching
    }

    try {
      // Check if directory exists before trying to watch
      if (!fsSync.existsSync(fullPath)) {
        console.warn(`Directory does not exist, skipping watch: ${fullPath}`);
        return;
      }

      const watcher = fsSync.watch(fullPath, { recursive: true }, (eventType, filename) => {
        if (!filename) return;

        const filePath = path.join(dirPath, filename);

        this.emit('change', {
          type: eventType,
          path: filePath,
          directory: dirPath,
          timestamp: new Date().toISOString()
        });

        console.log(`File ${eventType}: ${filePath}`);
      });

      this.watchers.set(fullPath, watcher);
      this.watchedPaths.add(fullPath);

      console.log(`Watching directory: ${fullPath}`);
    } catch (error) {
      console.error(`Failed to watch directory ${fullPath}:`, error);
    }
  }

  /**
   * Stop watching a directory
   */
  unwatchDirectory(dirPath) {
    const fullPath = path.join(this.basePath, dirPath);
    const watcher = this.watchers.get(fullPath);

    if (watcher) {
      watcher.close();
      this.watchers.delete(fullPath);
      this.watchedPaths.delete(fullPath);
      console.log(`Stopped watching directory: ${fullPath}`);
    }
  }

  /**
   * Stop watching all directories
   */
  unwatchAll() {
    for (const [path, watcher] of this.watchers.entries()) {
      watcher.close();
      console.log(`Stopped watching: ${path}`);
    }
    this.watchers.clear();
    this.watchedPaths.clear();
  }

  /**
   * Get list of watched paths
   */
  getWatchedPaths() {
    return Array.from(this.watchedPaths);
  }

  /**
   * Check if a path is being watched
   */
  isWatching(dirPath) {
    const fullPath = path.join(this.basePath, dirPath);
    return this.watchedPaths.has(fullPath);
  }
}

module.exports = FileWatcher;

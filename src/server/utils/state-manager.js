const fs = require('fs').promises;
const path = require('path');

// State storage directory
const STATE_DIR = path.join(__dirname, '../storage/state');

/**
 * State Manager - Handles persistent JSON storage for app states
 */
class StateManager {
  constructor() {
    this.cache = new Map();
    this.initializeStorage();
  }

  /**
   * Initialize storage directory
   */
  async initializeStorage() {
    try {
      await fs.mkdir(STATE_DIR, { recursive: true });
      console.log('State storage initialized:', STATE_DIR);
    } catch (error) {
      console.error('Failed to initialize state storage:', error.message);
    }
  }

  /**
   * Get state file path
   */
  getStatePath(key) {
    return path.join(STATE_DIR, `${key}.json`);
  }

  /**
   * Load state from JSON file
   */
  async load(key, defaultValue = null) {
    // Check cache first
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    try {
      const filePath = this.getStatePath(key);
      const data = await fs.readFile(filePath, 'utf-8');
      const parsed = JSON.parse(data);

      // Update cache
      this.cache.set(key, parsed);

      return parsed;
    } catch (error) {
      // File doesn't exist or invalid JSON - return default
      if (error.code === 'ENOENT') {
        return defaultValue;
      }
      console.error(`Error loading state ${key}:`, error.message);
      return defaultValue;
    }
  }

  /**
   * Save state to JSON file
   */
  async save(key, value) {
    try {
      const filePath = this.getStatePath(key);
      const jsonData = JSON.stringify(value, null, 2);

      await fs.writeFile(filePath, jsonData, 'utf-8');

      // Update cache
      this.cache.set(key, value);

      return true;
    } catch (error) {
      console.error(`Error saving state ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Delete state file
   */
  async delete(key) {
    try {
      const filePath = this.getStatePath(key);
      await fs.unlink(filePath);

      // Remove from cache
      this.cache.delete(key);

      return true;
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error(`Error deleting state ${key}:`, error.message);
      }
      return false;
    }
  }

  /**
   * Check if state exists
   */
  async exists(key) {
    try {
      const filePath = this.getStatePath(key);
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * List all state keys
   */
  async listKeys() {
    try {
      const files = await fs.readdir(STATE_DIR);
      return files
        .filter(f => f.endsWith('.json'))
        .map(f => f.replace('.json', ''));
    } catch (error) {
      console.error('Error listing state keys:', error.message);
      return [];
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  getCacheSize() {
    return this.cache.size;
  }
}

// Singleton instance
const stateManager = new StateManager();

module.exports = stateManager;

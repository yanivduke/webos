const Store = require('electron-store');
const os = require('os');
const path = require('path');

/**
 * Manages application configuration
 */
class ConfigManager {
  constructor() {
    this.store = new Store({
      name: 'webos-sync-config',
      defaults: {
        serverUrl: 'http://localhost:3001',
        username: null,
        authToken: null,
        syncFolder: path.join(os.homedir(), 'WebOS'),
        syncEnabled: false,
        syncInterval: 30000, // 30 seconds
        conflictResolution: 'ask', // 'local', 'remote', 'ask'
        notifications: true,
        autoStart: false,
        lastSync: null
      }
    });
  }

  /**
   * Get configuration
   * @returns {Object}
   */
  getConfig() {
    return this.store.store;
  }

  /**
   * Set configuration
   * @param {Object} config - Configuration object
   */
  setConfig(config) {
    Object.keys(config).forEach(key => {
      this.store.set(key, config[key]);
    });
  }

  /**
   * Get a specific config value
   * @param {string} key
   * @returns {*}
   */
  get(key) {
    return this.store.get(key);
  }

  /**
   * Set a specific config value
   * @param {string} key
   * @param {*} value
   */
  set(key, value) {
    this.store.set(key, value);
  }

  /**
   * Clear authentication data
   */
  clearAuth() {
    this.store.delete('authToken');
    this.store.delete('username');
    this.store.set('syncEnabled', false);
  }

  /**
   * Reset to defaults
   */
  reset() {
    this.store.clear();
  }
}

module.exports = ConfigManager;

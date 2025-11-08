const axios = require('axios');

/**
 * Manages authentication with WebOS server
 */
class AuthManager {
  constructor(configManager) {
    this.configManager = configManager;
    this.token = null;
    this.serverUrl = null;
  }

  /**
   * Login to WebOS server
   * @param {string} serverUrl - Server URL
   * @param {string} username - Username
   * @param {string} password - Password
   * @returns {Promise<string>} - Auth token
   */
  async login(serverUrl, username, password) {
    try {
      // Normalize server URL
      this.serverUrl = serverUrl.replace(/\/$/, '');

      const response = await axios.post(`${this.serverUrl}/api/auth/login`, {
        username,
        password
      }, {
        timeout: 10000
      });

      if (response.data && response.data.session && response.data.session.token) {
        this.token = response.data.session.token;
        return this.token;
      }

      throw new Error('Invalid response from server');
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.error || 'Login failed');
      } else if (error.request) {
        throw new Error('Cannot connect to server. Please check the server URL.');
      } else {
        throw new Error(error.message);
      }
    }
  }

  /**
   * Logout from WebOS server
   */
  async logout() {
    try {
      const config = this.configManager.getConfig();

      if (config.authToken && config.serverUrl) {
        await axios.post(
          `${config.serverUrl}/api/auth/logout`,
          {},
          {
            headers: {
              'Authorization': `Bearer ${config.authToken}`
            },
            timeout: 5000
          }
        );
      }
    } catch (error) {
      console.error('Logout error:', error.message);
      // Don't throw - logout should always succeed locally
    } finally {
      this.token = null;
      this.serverUrl = null;
    }
  }

  /**
   * Validate current token
   * @returns {Promise<boolean>}
   */
  async validateToken() {
    try {
      const config = this.configManager.getConfig();

      if (!config.authToken || !config.serverUrl) {
        return false;
      }

      const response = await axios.get(`${config.serverUrl}/api/auth/session`, {
        headers: {
          'Authorization': `Bearer ${config.authToken}`
        },
        timeout: 5000
      });

      return response.status === 200 && response.data.session;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get authorization headers
   * @returns {Object}
   */
  getAuthHeaders() {
    const config = this.configManager.getConfig();

    if (!config.authToken) {
      throw new Error('Not authenticated');
    }

    return {
      'Authorization': `Bearer ${config.authToken}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Get current token
   * @returns {string|null}
   */
  getToken() {
    return this.configManager.getConfig().authToken;
  }

  /**
   * Check if authenticated
   * @returns {boolean}
   */
  isAuthenticated() {
    return !!this.configManager.getConfig().authToken;
  }
}

module.exports = AuthManager;

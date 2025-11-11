const fs = require('fs').promises;
const path = require('path');
const { sanitizeName, sanitizePath } = require('../utils/path-utils');

/**
 * App Installer Service
 * Handles app installation, validation, and management
 */
class AppInstaller {
  constructor() {
    this.STORAGE_BASE = path.join(__dirname, '../storage/workbench');
    this.APPS_DIR = 'dh0/UserApps';
    this.TEMPLATES_DIR = path.join(__dirname, '../storage/templates');

    // In-memory storage for app-specific data
    this.appStorage = {};

    // In-memory permissions storage
    this.appPermissions = {};
  }

  /**
   * Validate app manifest structure
   */
  validateManifest(manifest) {
    const errors = [];

    // Required fields
    if (!manifest.id || typeof manifest.id !== 'string') {
      errors.push('Manifest must have a valid "id" field');
    } else {
      // Validate ID format (alphanumeric, dashes, underscores only)
      if (!/^[a-zA-Z0-9_-]+$/.test(manifest.id)) {
        errors.push('App ID can only contain letters, numbers, dashes, and underscores');
      }
    }

    if (!manifest.name || typeof manifest.name !== 'string') {
      errors.push('Manifest must have a valid "name" field');
    }

    if (!manifest.version || typeof manifest.version !== 'string') {
      errors.push('Manifest must have a valid "version" field');
    }

    if (!manifest.author || typeof manifest.author !== 'string') {
      errors.push('Manifest must have a valid "author" field');
    }

    // Optional but recommended fields
    if (manifest.description && typeof manifest.description !== 'string') {
      errors.push('Description must be a string');
    }

    if (manifest.icon && typeof manifest.icon !== 'string') {
      errors.push('Icon must be a string');
    }

    // Validate permissions if provided
    if (manifest.permissions) {
      if (!Array.isArray(manifest.permissions)) {
        errors.push('Permissions must be an array');
      } else {
        const validPermissions = ['file-read', 'file-write', 'file-delete', 'network', 'storage', 'system'];
        const invalidPerms = manifest.permissions.filter(p => !validPermissions.includes(p));
        if (invalidPerms.length > 0) {
          errors.push(`Invalid permissions: ${invalidPerms.join(', ')}`);
        }
      }
    }

    // Validate entry point
    if (manifest.entry && typeof manifest.entry !== 'string') {
      errors.push('Entry point must be a string');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Install an app to storage
   */
  async installApp(manifest, code) {
    // Validate manifest
    const validation = this.validateManifest(manifest);
    if (!validation.valid) {
      throw new Error(`Invalid manifest: ${validation.errors.join(', ')}`);
    }

    const safeId = sanitizeName(manifest.id);
    if (!safeId) {
      throw new Error('Invalid app ID');
    }

    // Create app directory path
    const appDir = path.join(this.STORAGE_BASE, this.APPS_DIR, safeId);

    // Check if app already exists
    try {
      await fs.access(appDir);
      throw new Error(`App with ID "${safeId}" already exists. Use update instead.`);
    } catch (err) {
      if (err.code !== 'ENOENT') {
        throw err;
      }
      // App doesn't exist, proceed with installation
    }

    // Create app directory
    await fs.mkdir(appDir, { recursive: true });

    // Write manifest
    const manifestPath = path.join(appDir, 'manifest.json');
    await fs.writeFile(
      manifestPath,
      JSON.stringify(manifest, null, 2),
      'utf-8'
    );

    // Write app code
    const codePath = path.join(appDir, manifest.entry || 'index.js');
    await fs.writeFile(codePath, code, 'utf-8');

    // Initialize app storage
    this.appStorage[safeId] = {};

    // Initialize app permissions
    this.appPermissions[safeId] = {
      granted: manifest.permissions || [],
      requested: manifest.permissions || [],
      denied: []
    };

    return {
      id: safeId,
      name: manifest.name,
      version: manifest.version,
      installedAt: new Date().toISOString(),
      path: `${this.APPS_DIR}/${safeId}`
    };
  }

  /**
   * Uninstall an app from storage
   */
  async uninstallApp(appId) {
    const safeId = sanitizeName(appId);
    if (!safeId) {
      throw new Error('Invalid app ID');
    }

    const appDir = path.join(this.STORAGE_BASE, this.APPS_DIR, safeId);

    // Check if app exists
    try {
      await fs.access(appDir);
    } catch {
      throw new Error(`App with ID "${safeId}" not found`);
    }

    // Move to trash instead of permanent delete
    const trashDir = path.join(this.STORAGE_BASE, 'trash');
    await fs.mkdir(trashDir, { recursive: true });

    const trashPath = path.join(trashDir, `${safeId}_${Date.now()}`);
    await fs.rename(appDir, trashPath);

    // Clean up in-memory storage
    delete this.appStorage[safeId];
    delete this.appPermissions[safeId];

    return {
      id: safeId,
      uninstalledAt: new Date().toISOString()
    };
  }

  /**
   * Get list of installed apps
   */
  async getInstalledApps() {
    const appsDir = path.join(this.STORAGE_BASE, this.APPS_DIR);

    // Ensure directory exists
    try {
      await fs.mkdir(appsDir, { recursive: true });
    } catch (err) {
      // Directory might already exist
    }

    let entries;
    try {
      entries = await fs.readdir(appsDir, { withFileTypes: true });
    } catch {
      return [];
    }

    const apps = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const manifestPath = path.join(appsDir, entry.name, 'manifest.json');

      try {
        const manifestContent = await fs.readFile(manifestPath, 'utf-8');
        const manifest = JSON.parse(manifestContent);

        const stats = await fs.stat(path.join(appsDir, entry.name));

        apps.push({
          id: entry.name,
          name: manifest.name,
          version: manifest.version,
          author: manifest.author,
          description: manifest.description,
          icon: manifest.icon,
          permissions: manifest.permissions || [],
          installedAt: stats.birthtime,
          path: `${this.APPS_DIR}/${entry.name}`
        });
      } catch (err) {
        console.error(`Error reading manifest for app ${entry.name}:`, err);
      }
    }

    return apps;
  }

  /**
   * Get specific app details
   */
  async getApp(appId) {
    const safeId = sanitizeName(appId);
    if (!safeId) {
      throw new Error('Invalid app ID');
    }

    const appDir = path.join(this.STORAGE_BASE, this.APPS_DIR, safeId);
    const manifestPath = path.join(appDir, 'manifest.json');

    try {
      const manifestContent = await fs.readFile(manifestPath, 'utf-8');
      const manifest = JSON.parse(manifestContent);

      const stats = await fs.stat(appDir);

      // Read app code
      const codePath = path.join(appDir, manifest.entry || 'index.js');
      let code = '';
      try {
        code = await fs.readFile(codePath, 'utf-8');
      } catch {
        // Code file might not exist
      }

      return {
        id: safeId,
        name: manifest.name,
        version: manifest.version,
        author: manifest.author,
        description: manifest.description,
        icon: manifest.icon,
        permissions: manifest.permissions || [],
        entry: manifest.entry || 'index.js',
        installedAt: stats.birthtime,
        updatedAt: stats.mtime,
        path: `${this.APPS_DIR}/${safeId}`,
        manifest,
        code
      };
    } catch {
      throw new Error(`App with ID "${safeId}" not found`);
    }
  }

  /**
   * Update an existing app
   */
  async updateApp(appId, manifest, code) {
    const safeId = sanitizeName(appId);
    if (!safeId) {
      throw new Error('Invalid app ID');
    }

    // Validate manifest
    const validation = this.validateManifest(manifest);
    if (!validation.valid) {
      throw new Error(`Invalid manifest: ${validation.errors.join(', ')}`);
    }

    const appDir = path.join(this.STORAGE_BASE, this.APPS_DIR, safeId);

    // Check if app exists
    try {
      await fs.access(appDir);
    } catch {
      throw new Error(`App with ID "${safeId}" not found. Use install instead.`);
    }

    // Update manifest
    const manifestPath = path.join(appDir, 'manifest.json');
    await fs.writeFile(
      manifestPath,
      JSON.stringify(manifest, null, 2),
      'utf-8'
    );

    // Update app code if provided
    if (code) {
      const codePath = path.join(appDir, manifest.entry || 'index.js');
      await fs.writeFile(codePath, code, 'utf-8');
    }

    // Update permissions
    this.appPermissions[safeId] = {
      granted: manifest.permissions || [],
      requested: manifest.permissions || [],
      denied: []
    };

    return {
      id: safeId,
      name: manifest.name,
      version: manifest.version,
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Get built-in app templates
   */
  async getAppTemplates() {
    const templates = [];
    const templatesDir = this.TEMPLATES_DIR;

    try {
      await fs.mkdir(templatesDir, { recursive: true });
      const entries = await fs.readdir(templatesDir);

      for (const entry of entries) {
        if (!entry.endsWith('.json')) continue;

        const templatePath = path.join(templatesDir, entry);
        try {
          const content = await fs.readFile(templatePath, 'utf-8');
          const template = JSON.parse(content);

          templates.push({
            id: path.basename(entry, '.json'),
            name: template.name,
            description: template.description,
            icon: template.icon,
            category: template.category || 'general',
            template
          });
        } catch (err) {
          console.error(`Error reading template ${entry}:`, err);
        }
      }
    } catch {
      // Templates directory doesn't exist yet
    }

    return templates;
  }

  /**
   * Get specific template
   */
  async getTemplate(templateId) {
    const safeId = sanitizeName(templateId);
    if (!safeId) {
      throw new Error('Invalid template ID');
    }

    const templatePath = path.join(this.TEMPLATES_DIR, `${safeId}.json`);

    try {
      const content = await fs.readFile(templatePath, 'utf-8');
      const template = JSON.parse(content);

      return {
        id: safeId,
        name: template.name,
        description: template.description,
        icon: template.icon,
        category: template.category || 'general',
        template
      };
    } catch {
      throw new Error(`Template with ID "${safeId}" not found`);
    }
  }

  /**
   * Get app-specific storage
   */
  getAppStorage(appId) {
    const safeId = sanitizeName(appId);
    if (!safeId) {
      throw new Error('Invalid app ID');
    }

    if (!this.appStorage[safeId]) {
      this.appStorage[safeId] = {};
    }

    return this.appStorage[safeId];
  }

  /**
   * Set app storage key-value
   */
  setAppStorage(appId, key, value) {
    const safeId = sanitizeName(appId);
    if (!safeId) {
      throw new Error('Invalid app ID');
    }

    if (!this.appStorage[safeId]) {
      this.appStorage[safeId] = {};
    }

    this.appStorage[safeId][key] = value;

    return {
      key,
      value,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Delete app storage key
   */
  deleteAppStorageKey(appId, key) {
    const safeId = sanitizeName(appId);
    if (!safeId) {
      throw new Error('Invalid app ID');
    }

    if (this.appStorage[safeId] && this.appStorage[safeId][key]) {
      delete this.appStorage[safeId][key];
      return { deleted: true };
    }

    return { deleted: false };
  }

  /**
   * Get app permissions
   */
  getAppPermissions(appId) {
    const safeId = sanitizeName(appId);
    if (!safeId) {
      throw new Error('Invalid app ID');
    }

    if (!this.appPermissions[safeId]) {
      this.appPermissions[safeId] = {
        granted: [],
        requested: [],
        denied: []
      };
    }

    return this.appPermissions[safeId];
  }

  /**
   * Update app permissions
   */
  updateAppPermissions(appId, permissions) {
    const safeId = sanitizeName(appId);
    if (!safeId) {
      throw new Error('Invalid app ID');
    }

    const validPermissions = ['file-read', 'file-write', 'file-delete', 'network', 'storage', 'system'];

    // Validate permissions
    if (permissions.granted && !Array.isArray(permissions.granted)) {
      throw new Error('granted must be an array');
    }
    if (permissions.denied && !Array.isArray(permissions.denied)) {
      throw new Error('denied must be an array');
    }

    // Check for invalid permissions
    const allPerms = [...(permissions.granted || []), ...(permissions.denied || [])];
    const invalidPerms = allPerms.filter(p => !validPermissions.includes(p));
    if (invalidPerms.length > 0) {
      throw new Error(`Invalid permissions: ${invalidPerms.join(', ')}`);
    }

    this.appPermissions[safeId] = {
      granted: permissions.granted || [],
      requested: permissions.requested || [],
      denied: permissions.denied || []
    };

    return this.appPermissions[safeId];
  }
}

// Create singleton instance
const appInstaller = new AppInstaller();

module.exports = appInstaller;

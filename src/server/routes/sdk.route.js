const express = require('express');
const router = express.Router();
const appInstaller = require('../services/app-installer');

/**
 * SDK Routes
 * Provides REST API for app management, storage, and permissions
 */

// GET /api/sdk/apps - List all installed apps
router.get('/apps', async (req, res) => {
  try {
    const apps = await appInstaller.getInstalledApps();

    res.json({
      count: apps.length,
      apps
    });
  } catch (error) {
    console.error('Error listing apps:', error);
    res.status(500).json({
      error: 'Failed to list apps',
      message: error.message
    });
  }
});

// POST /api/sdk/apps - Install a new app
router.post('/apps', async (req, res) => {
  try {
    const { manifest, code } = req.body;

    if (!manifest) {
      return res.status(400).json({
        error: 'Manifest is required'
      });
    }

    if (!code) {
      return res.status(400).json({
        error: 'App code is required'
      });
    }

    const result = await appInstaller.installApp(manifest, code);

    res.status(201).json({
      message: 'App installed successfully',
      app: result
    });
  } catch (error) {
    console.error('Error installing app:', error);

    if (error.message.includes('already exists')) {
      return res.status(409).json({
        error: 'App already exists',
        message: error.message
      });
    }

    if (error.message.includes('Invalid manifest')) {
      return res.status(400).json({
        error: 'Invalid manifest',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Failed to install app',
      message: error.message
    });
  }
});

// GET /api/sdk/apps/:id - Get app details
router.get('/apps/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: 'App ID is required'
      });
    }

    const app = await appInstaller.getApp(id);

    res.json(app);
  } catch (error) {
    console.error('Error getting app:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'App not found',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Failed to get app',
      message: error.message
    });
  }
});

// PUT /api/sdk/apps/:id - Update an app
router.put('/apps/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { manifest, code } = req.body;

    if (!id) {
      return res.status(400).json({
        error: 'App ID is required'
      });
    }

    if (!manifest) {
      return res.status(400).json({
        error: 'Manifest is required'
      });
    }

    const result = await appInstaller.updateApp(id, manifest, code);

    res.json({
      message: 'App updated successfully',
      app: result
    });
  } catch (error) {
    console.error('Error updating app:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'App not found',
        message: error.message
      });
    }

    if (error.message.includes('Invalid manifest')) {
      return res.status(400).json({
        error: 'Invalid manifest',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Failed to update app',
      message: error.message
    });
  }
});

// DELETE /api/sdk/apps/:id - Uninstall an app
router.delete('/apps/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: 'App ID is required'
      });
    }

    const result = await appInstaller.uninstallApp(id);

    res.json({
      message: 'App uninstalled successfully',
      app: result
    });
  } catch (error) {
    console.error('Error uninstalling app:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'App not found',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Failed to uninstall app',
      message: error.message
    });
  }
});

// GET /api/sdk/templates - List app templates
router.get('/templates', async (req, res) => {
  try {
    const templates = await appInstaller.getAppTemplates();

    res.json({
      count: templates.length,
      templates
    });
  } catch (error) {
    console.error('Error listing templates:', error);
    res.status(500).json({
      error: 'Failed to list templates',
      message: error.message
    });
  }
});

// GET /api/sdk/templates/:id - Get specific template
router.get('/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: 'Template ID is required'
      });
    }

    const template = await appInstaller.getTemplate(id);

    res.json(template);
  } catch (error) {
    console.error('Error getting template:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Template not found',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Failed to get template',
      message: error.message
    });
  }
});

// GET /api/sdk/storage/:appId - Get app-specific storage
router.get('/storage/:appId', async (req, res) => {
  try {
    const { appId } = req.params;

    if (!appId) {
      return res.status(400).json({
        error: 'App ID is required'
      });
    }

    const storage = appInstaller.getAppStorage(appId);

    res.json({
      appId,
      storage
    });
  } catch (error) {
    console.error('Error getting app storage:', error);
    res.status(500).json({
      error: 'Failed to get app storage',
      message: error.message
    });
  }
});

// POST /api/sdk/storage/:appId - Set app storage key-value
router.post('/storage/:appId', async (req, res) => {
  try {
    const { appId } = req.params;
    const { key, value } = req.body;

    if (!appId) {
      return res.status(400).json({
        error: 'App ID is required'
      });
    }

    if (!key) {
      return res.status(400).json({
        error: 'Storage key is required'
      });
    }

    if (value === undefined) {
      return res.status(400).json({
        error: 'Storage value is required'
      });
    }

    const result = appInstaller.setAppStorage(appId, key, value);

    res.json({
      message: 'Storage updated successfully',
      appId,
      result
    });
  } catch (error) {
    console.error('Error setting app storage:', error);
    res.status(500).json({
      error: 'Failed to set app storage',
      message: error.message
    });
  }
});

// DELETE /api/sdk/storage/:appId/:key - Delete storage key
router.delete('/storage/:appId/:key', async (req, res) => {
  try {
    const { appId, key } = req.params;

    if (!appId) {
      return res.status(400).json({
        error: 'App ID is required'
      });
    }

    if (!key) {
      return res.status(400).json({
        error: 'Storage key is required'
      });
    }

    const result = appInstaller.deleteAppStorageKey(appId, key);

    if (result.deleted) {
      res.json({
        message: 'Storage key deleted successfully',
        appId,
        key
      });
    } else {
      res.status(404).json({
        error: 'Storage key not found',
        appId,
        key
      });
    }
  } catch (error) {
    console.error('Error deleting app storage key:', error);
    res.status(500).json({
      error: 'Failed to delete app storage key',
      message: error.message
    });
  }
});

// GET /api/sdk/permissions/:appId - Get app permissions
router.get('/permissions/:appId', async (req, res) => {
  try {
    const { appId } = req.params;

    if (!appId) {
      return res.status(400).json({
        error: 'App ID is required'
      });
    }

    const permissions = appInstaller.getAppPermissions(appId);

    res.json({
      appId,
      permissions
    });
  } catch (error) {
    console.error('Error getting app permissions:', error);
    res.status(500).json({
      error: 'Failed to get app permissions',
      message: error.message
    });
  }
});

// PUT /api/sdk/permissions/:appId - Update app permissions
router.put('/permissions/:appId', async (req, res) => {
  try {
    const { appId } = req.params;
    const { permissions } = req.body;

    if (!appId) {
      return res.status(400).json({
        error: 'App ID is required'
      });
    }

    if (!permissions) {
      return res.status(400).json({
        error: 'Permissions object is required'
      });
    }

    const result = appInstaller.updateAppPermissions(appId, permissions);

    res.json({
      message: 'Permissions updated successfully',
      appId,
      permissions: result
    });
  } catch (error) {
    console.error('Error updating app permissions:', error);

    if (error.message.includes('Invalid permissions')) {
      return res.status(400).json({
        error: 'Invalid permissions',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Failed to update app permissions',
      message: error.message
    });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const stateManager = require('../utils/state-manager');

/**
 * App State Routes - Handle persistent application data
 */

// GET /api/app-state/:appId - Get application state
router.get('/:appId', async (req, res) => {
  try {
    const { appId } = req.params;

    const state = await stateManager.load(`app_${appId}`);

    if (state === null) {
      return res.status(404).json({
        error: 'State not found',
        appId: appId,
        message: 'No saved state exists for this application'
      });
    }

    res.json({
      appId: appId,
      state: state,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to load state',
      message: error.message
    });
  }
});

// POST /api/app-state/:appId - Save application state
router.post('/:appId', async (req, res) => {
  try {
    const { appId } = req.params;
    const { state } = req.body;

    if (!state) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'State data is required'
      });
    }

    const success = await stateManager.save(`app_${appId}`, {
      ...state,
      savedAt: new Date().toISOString()
    });

    if (success) {
      res.json({
        success: true,
        appId: appId,
        message: 'State saved successfully'
      });
    } else {
      res.status(500).json({
        error: 'Failed to save state',
        appId: appId
      });
    }
  } catch (error) {
    res.status(500).json({
      error: 'Failed to save state',
      message: error.message
    });
  }
});

// DELETE /api/app-state/:appId - Delete application state
router.delete('/:appId', async (req, res) => {
  try {
    const { appId } = req.params;

    const success = await stateManager.delete(`app_${appId}`);

    res.json({
      success: success,
      appId: appId,
      message: success ? 'State deleted successfully' : 'State not found'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to delete state',
      message: error.message
    });
  }
});

// GET /api/app-state - List all application states
router.get('/', async (req, res) => {
  try {
    const keys = await stateManager.listKeys();
    const appStates = keys.filter(k => k.startsWith('app_'));

    const states = [];
    for (const key of appStates) {
      const appId = key.replace('app_', '');
      const state = await stateManager.load(key);
      states.push({
        appId: appId,
        savedAt: state?.savedAt || null,
        hasData: !!state
      });
    }

    res.json({
      count: states.length,
      states: states
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to list states',
      message: error.message
    });
  }
});

module.exports = router;

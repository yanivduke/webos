const express = require('express');
const router = express.Router();
const { randomUUID } = require('crypto');
const stateManager = require('../utils/state-manager');

const APP_KEY_PREFIX = 'app_';
const MAX_HISTORY = 200;
const MAX_DRAFTS = 20;
const MAX_CANVASES = 20;

const MODULE_ID_FIELD = 'filePath';

const APP_DEFAULTS = {
  notepad: {
    drafts: [],
    recentFiles: [],
    preferences: {
      defaultDisk: 'dh0',
      fontSize: 12,
      wordWrap: true
    },
    savedAt: null
  },
  paint: {
    canvases: [],
    savedAt: null
  },
  calculator: {
    memory: 0,
    history: [],
    savedAt: null
  },
  shell: {
    history: [],
    lastPath: 'dh0',
    lastExecutedAt: null,
    savedAt: null
  },
  clock: {
    is24Hour: true,
    alarms: [],
    savedAt: null
  },
  awml: {
    modules: [],
    savedAt: null
  }
};

const cloneDefault = (appId) => JSON.parse(JSON.stringify(APP_DEFAULTS[appId]));

const ensureSupportedApp = (appId, res) => {
  if (!Object.prototype.hasOwnProperty.call(APP_DEFAULTS, appId)) {
    res.status(404).json({
      error: 'Unsupported application',
      appId: appId
    });
    return false;
  }
  return true;
};

const getAppKey = (appId) => `${APP_KEY_PREFIX}${appId}`;

const loadState = async (appId) => {
  const fallback = cloneDefault(appId);
  return stateManager.load(getAppKey(appId), fallback);
};

const saveState = async (appId, state) => {
  const payload = {
    ...cloneDefault(appId),
    ...state,
    savedAt: new Date().toISOString()
  };

  await stateManager.save(getAppKey(appId), payload);
  return payload;
};

// -- Utility helpers -------------------------------------------------------

const upsertRecord = (items, record, idField = 'id', limit) => {
  const index = items.findIndex((item) => item[idField] === record[idField]);
  if (index >= 0) {
    items[index] = { ...items[index], ...record };
  } else {
    items.push(record);
    if (limit && items.length > limit) {
      items.splice(0, items.length - limit);
    }
  }
  return items;
};

// -- Routes ----------------------------------------------------------------

router.get('/', async (req, res) => {
  try {
    const keys = await stateManager.listKeys();
    const storedKeys = new Set(keys);

    const states = await Promise.all(
      Object.keys(APP_DEFAULTS).map(async (appId) => {
        const key = getAppKey(appId);
        const hasData = storedKeys.has(key);
        const state = await stateManager.load(key, cloneDefault(appId));
        return {
          appId,
          savedAt: state?.savedAt || null,
          hasData: hasData && !!state
        };
      })
    );

    res.json({
      count: states.length,
      states
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to list states',
      message: error.message
    });
  }
});

// Notepad specific endpoints ------------------------------------------------

router.get('/notepad/drafts', async (req, res) => {
  try {
    const state = await loadState('notepad');
    res.json({ drafts: state.drafts || [] });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to load drafts',
      message: error.message
    });
  }
});

router.post('/notepad/drafts', async (req, res) => {
  try {
    const { id, title, content, path: filePath } = req.body;

    const state = await loadState('notepad');
    const now = new Date().toISOString();
    const draftId = id || randomUUID();

    const draftRecord = {
      id: draftId,
      title: title || 'Untitled',
      content: content || '',
      path: filePath || null,
      updatedAt: now
    };

    state.drafts = upsertRecord(state.drafts || [], draftRecord, 'id', MAX_DRAFTS);

    const saved = await saveState('notepad', state);

    res.json({
      success: true,
      draft: draftRecord,
      savedAt: saved.savedAt
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to save draft',
      message: error.message
    });
  }
});

router.delete('/notepad/drafts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const state = await loadState('notepad');

    const before = state.drafts?.length || 0;
    state.drafts = (state.drafts || []).filter((draft) => draft.id !== id);
    const after = state.drafts.length;

    const saved = await saveState('notepad', state);

    res.json({
      success: before !== after,
      deleted: before !== after,
      savedAt: saved.savedAt
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to delete draft',
      message: error.message
    });
  }
});

router.post('/notepad/preferences', async (req, res) => {
  try {
    const { preferences } = req.body;

    if (!preferences || typeof preferences !== 'object') {
      return res.status(400).json({
        error: 'Invalid preferences payload'
      });
    }

    const state = await loadState('notepad');
    state.preferences = {
      ...state.preferences,
      ...preferences
    };

    const saved = await saveState('notepad', state);

    res.json({
      success: true,
      preferences: saved.preferences,
      savedAt: saved.savedAt
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update preferences',
      message: error.message
    });
  }
});

router.post('/notepad/recent', async (req, res) => {
  try {
    const { path: filePath, name } = req.body;

    if (!filePath || !name) {
      return res.status(400).json({
        error: 'File path and name are required'
      });
    }

    const state = await loadState('notepad');
    const now = new Date().toISOString();

    const recentEntry = {
      id: randomUUID(),
      path: filePath,
      name,
      addedAt: now
    };

    const existing = (state.recentFiles || []).filter((item) => item.path !== filePath);
    state.recentFiles = [recentEntry, ...existing].slice(0, 15);

    const saved = await saveState('notepad', state);

    res.json({
      success: true,
      recentFiles: saved.recentFiles,
      savedAt: saved.savedAt
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update recent files',
      message: error.message
    });
  }
});

// Paint specific endpoints --------------------------------------------------

router.get('/paint/canvases', async (req, res) => {
  try {
    const state = await loadState('paint');
    res.json({ canvases: state.canvases || [] });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to load canvases',
      message: error.message
    });
  }
});

router.post('/paint/canvases', async (req, res) => {
  try {
    const { id, name, dataUrl, width, height } = req.body;

    if (!dataUrl) {
      return res.status(400).json({
        error: 'dataUrl is required to save a canvas'
      });
    }

    const state = await loadState('paint');
    const now = new Date().toISOString();
    const canvasId = id || randomUUID();

    const canvasRecord = {
      id: canvasId,
      name: name || 'Untitled',
      dataUrl,
      width: width || 640,
      height: height || 400,
      updatedAt: now
    };

    state.canvases = upsertRecord(state.canvases || [], canvasRecord, 'id', MAX_CANVASES);

    const saved = await saveState('paint', state);

    res.json({
      success: true,
      canvas: canvasRecord,
      savedAt: saved.savedAt
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to save canvas',
      message: error.message
    });
  }
});

router.delete('/paint/canvases/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const state = await loadState('paint');

    const before = state.canvases?.length || 0;
    state.canvases = (state.canvases || []).filter((canvas) => canvas.id !== id);
    const after = state.canvases.length;

    const saved = await saveState('paint', state);

    res.json({
      success: before !== after,
      deleted: before !== after,
      savedAt: saved.savedAt
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to delete canvas',
      message: error.message
    });
  }
});

// Calculator specific endpoints --------------------------------------------

router.get('/calculator/history', async (req, res) => {
  try {
    const state = await loadState('calculator');
    res.json({
      history: state.history || [],
      memory: state.memory || 0
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to load history',
      message: error.message
    });
  }
});

router.post('/calculator/history', async (req, res) => {
  try {
    const { expression, result } = req.body;

    if (!expression) {
      return res.status(400).json({
        error: 'Expression is required'
      });
    }

    const state = await loadState('calculator');
    const now = new Date().toISOString();

    const historyEntry = {
      id: randomUUID(),
      expression,
      result: result ?? null,
      executedAt: now
    };

    state.history = upsertRecord(state.history || [], historyEntry, 'id', MAX_HISTORY);

    const saved = await saveState('calculator', state);

    res.json({
      success: true,
      entry: historyEntry,
      savedAt: saved.savedAt
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to append history entry',
      message: error.message
    });
  }
});

router.delete('/calculator/history', async (req, res) => {
  try {
    const state = await loadState('calculator');
    state.history = [];
    const saved = await saveState('calculator', state);
    res.json({ success: true, savedAt: saved.savedAt });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to clear history',
      message: error.message
    });
  }
});

router.post('/calculator/memory', async (req, res) => {
  try {
    const { value } = req.body;

    if (typeof value !== 'number') {
      return res.status(400).json({
        error: 'Memory value must be a number'
      });
    }

    const state = await loadState('calculator');
    state.memory = value;

    const saved = await saveState('calculator', state);

    res.json({
      success: true,
      memory: saved.memory,
      savedAt: saved.savedAt
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update memory',
      message: error.message
    });
  }
});

router.delete('/calculator/memory', async (req, res) => {
  try {
    const state = await loadState('calculator');
    state.memory = 0;
    const saved = await saveState('calculator', state);
    res.json({ success: true, savedAt: saved.savedAt });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to reset memory',
      message: error.message
    });
  }
});

// Clock specific endpoints --------------------------------------------------

router.post('/clock/preferences', async (req, res) => {
  try {
    const { is24Hour } = req.body;

    if (typeof is24Hour !== 'boolean') {
      return res.status(400).json({
        error: 'is24Hour must be a boolean'
      });
    }

    const state = await loadState('clock');
    state.is24Hour = is24Hour;

    const saved = await saveState('clock', state);

    res.json({
      success: true,
      preferences: { is24Hour: saved.is24Hour },
      savedAt: saved.savedAt
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update clock preferences',
      message: error.message
    });
  }
});

router.post('/clock/alarms', async (req, res) => {
  try {
    const { id, label, time, enabled = true } = req.body;

    if (!time) {
      return res.status(400).json({
        error: 'Alarm time is required'
      });
    }

    const state = await loadState('clock');
    const now = new Date().toISOString();
    const alarmId = id || randomUUID();

    const alarmRecord = {
      id: alarmId,
      label: label || 'Alarm',
      time,
      enabled: Boolean(enabled),
      updatedAt: now
    };

    state.alarms = upsertRecord(state.alarms || [], alarmRecord, 'id');

    const saved = await saveState('clock', state);

    res.json({
      success: true,
      alarm: alarmRecord,
      savedAt: saved.savedAt
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to save alarm',
      message: error.message
    });
  }
});

router.delete('/clock/alarms/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const state = await loadState('clock');

    const before = state.alarms?.length || 0;
    state.alarms = (state.alarms || []).filter((alarm) => alarm.id !== id);
    const after = state.alarms.length;

    const saved = await saveState('clock', state);

    res.json({
      success: before !== after,
      deleted: before !== after,
      savedAt: saved.savedAt
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to delete alarm',
      message: error.message
    });
  }
});

// AWML module endpoints -----------------------------------------------------

router.get('/awml/modules', async (req, res) => {
  try {
    const { path: filePath } = req.query;
    const state = await loadState('awml');
    const modules = state.modules || [];

    if (filePath) {
      const module = modules.find((item) => item.filePath === filePath);
      if (!module) {
        return res.status(404).json({
          error: 'Module config not found',
          filePath
        });
      }
      return res.json({ module });
    }

    res.json({ modules });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to load AWML modules',
      message: error.message
    });
  }
});

router.post('/awml/modules', async (req, res) => {
  try {
    const { filePath, config = {}, metadata = {}, modulePath, entry } = req.body || {};

    if (!filePath) {
      return res.status(400).json({
        error: 'filePath is required'
      });
    }

    const state = await loadState('awml');
    const now = new Date().toISOString();

    const record = {
      id: filePath,
      filePath,
      modulePath: modulePath || null,
      entry: entry || null,
      metadata: metadata || {},
      config: config || {},
      updatedAt: now,
      createdAt: state.modules?.find((item) => item.filePath === filePath)?.createdAt || now
    };

    state.modules = upsertRecord(state.modules || [], record, MODULE_ID_FIELD);

    const saved = await saveState('awml', state);

    res.json({
      success: true,
      module: record,
      savedAt: saved.savedAt
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to save AWML module',
      message: error.message
    });
  }
});

// Shell specific endpoints --------------------------------------------------

router.get('/shell/history', async (req, res) => {
  try {
    const state = await loadState('shell');
    res.json({
      history: state.history || [],
      lastPath: state.lastPath || 'dh0',
      lastExecutedAt: state.lastExecutedAt || null
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to load shell history',
      message: error.message
    });
  }
});

router.delete('/shell/history', async (req, res) => {
  try {
    const state = await loadState('shell');
    state.history = [];
    const saved = await saveState('shell', state);
    res.json({
      success: true,
      savedAt: saved.savedAt,
      lastPath: saved.lastPath
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to clear shell history',
      message: error.message
    });
  }
});

router.post('/shell/path', async (req, res) => {
  try {
    const { lastPath } = req.body;
    if (typeof lastPath !== 'string') {
      return res.status(400).json({
        error: 'lastPath must be a string'
      });
    }

    const state = await loadState('shell');
    state.lastPath = lastPath;
    const saved = await saveState('shell', state);
    res.json({
      success: true,
      lastPath: saved.lastPath,
      savedAt: saved.savedAt
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update shell path',
      message: error.message
    });
  }
});

// Generic state handlers ----------------------------------------------------

router.get('/:appId', async (req, res) => {
  try {
    const { appId } = req.params;
    if (!ensureSupportedApp(appId, res)) return;

    const state = await loadState(appId);

    res.json({
      appId,
      state,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to load state',
      message: error.message
    });
  }
});

router.post('/:appId', async (req, res) => {
  try {
    const { appId } = req.params;
    if (!ensureSupportedApp(appId, res)) return;

    const { state } = req.body;

    if (!state || typeof state !== 'object') {
      return res.status(400).json({
        error: 'State payload is required'
      });
    }

    const saved = await saveState(appId, state);

    res.json({
      success: true,
      appId,
      state: saved
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to save state',
      message: error.message
    });
  }
});

router.delete('/:appId', async (req, res) => {
  try {
    const { appId } = req.params;
    if (!ensureSupportedApp(appId, res)) return;

    const success = await stateManager.delete(getAppKey(appId));

    res.json({
      success,
      appId,
      message: success ? 'State deleted successfully' : 'State not found'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to delete state',
      message: error.message
    });
  }
});

module.exports = router;

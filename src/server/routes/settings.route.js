const express = require('express');
const router = express.Router();

// Mock settings data
let settings = {
  display: {
    screenMode: 'Workbench',
    resolution: '640x256',
    colors: 16,
    scanlines: true,
    backdrop: 'pattern'
  },
  sound: {
    enabled: true,
    volume: 80,
    diskSounds: true,
    clickSounds: true
  },
  workbench: {
    font: 'Topaz',
    fontSize: 8,
    showHiddenFiles: false,
    snapIcons: true,
    iconSize: 'medium'
  },
  system: {
    dateFormat: 'DD-MMM-YY',
    timeFormat: '24h',
    startupSound: true,
    confirmDelete: true
  }
};

// GET /api/settings - Get all settings
router.get('/', (req, res) => {
  res.json(settings);
});

// GET /api/settings/:category - Get settings for a specific category
router.get('/:category', (req, res) => {
  const { category } = req.params;

  if (!settings[category]) {
    return res.status(404).json({
      error: 'Category not found',
      category: category,
      availableCategories: Object.keys(settings)
    });
  }

  res.json({
    category: category,
    settings: settings[category]
  });
});

// PUT /api/settings/:category - Update settings for a specific category
router.put('/:category', (req, res) => {
  const { category } = req.params;
  const updates = req.body;

  if (!settings[category]) {
    return res.status(404).json({
      error: 'Category not found',
      category: category
    });
  }

  settings[category] = {
    ...settings[category],
    ...updates
  };

  res.json({
    message: 'Settings updated successfully',
    category: category,
    settings: settings[category]
  });
});

// POST /api/settings/reset - Reset all settings to defaults
router.post('/reset', (req, res) => {
  settings = {
    display: {
      screenMode: 'Workbench',
      resolution: '640x256',
      colors: 16,
      scanlines: true,
      backdrop: 'pattern'
    },
    sound: {
      enabled: true,
      volume: 80,
      diskSounds: true,
      clickSounds: true
    },
    workbench: {
      font: 'Topaz',
      fontSize: 8,
      showHiddenFiles: false,
      snapIcons: true,
      iconSize: 'medium'
    },
    system: {
      dateFormat: 'DD-MMM-YY',
      timeFormat: '24h',
      startupSound: true,
      confirmDelete: true
    }
  };

  res.json({
    message: 'Settings reset to defaults',
    settings: settings
  });
});

// POST /api/settings/reorder - Reorder settings items
// Used for drag-and-drop reordering of settings UI
router.post('/reorder', (req, res) => {
  const { context, items } = req.body;

  if (!context || !items || !Array.isArray(items)) {
    return res.status(400).json({
      error: 'Invalid request',
      message: 'context and items array are required'
    });
  }

  // Store the custom order in workbench settings
  if (!settings.workbench.customOrder) {
    settings.workbench.customOrder = {};
  }

  settings.workbench.customOrder[context] = items;

  res.json({
    message: 'Settings reordered successfully',
    context: context,
    order: items
  });
});

// POST /api/settings/desktop/icons - Save desktop icon positions
router.post('/desktop/icons', (req, res) => {
  const { icons } = req.body;

  if (!icons || !Array.isArray(icons)) {
    return res.status(400).json({
      error: 'Invalid request',
      message: 'icons array is required'
    });
  }

  // Store desktop icon positions in workbench settings
  settings.workbench.desktopIcons = icons;

  res.json({
    message: 'Desktop icon positions saved successfully',
    icons: icons
  });
});

// GET /api/settings/desktop/icons - Get desktop icon positions
router.get('/desktop/icons', (req, res) => {
  const icons = settings.workbench.desktopIcons || [];

  res.json({
    icons: icons
  });
});

module.exports = router;

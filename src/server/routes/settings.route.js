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
  },
  widgets: {
    clock: {
      enabled: true,
      showDate: true,
      showSeconds: true
    },
    weather: {
      enabled: false,
      location: 'New York',
      units: 'metric'
    },
    news: {
      enabled: false,
      category: 'technology',
      maxItems: 5
    }
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
    },
    widgets: {
      clock: {
        enabled: true,
        showDate: true,
        showSeconds: true
      },
      weather: {
        enabled: false,
        location: 'New York',
        units: 'metric'
      },
      news: {
        enabled: false,
        category: 'technology',
        maxItems: 5
      }
    }
  };

  res.json({
    message: 'Settings reset to defaults',
    settings: settings
  });
});

module.exports = router;

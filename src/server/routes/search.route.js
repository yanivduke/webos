const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { sanitizePath, resolveStoragePath } = require('../utils/path-utils');

// Storage base path
const STORAGE_BASE = path.join(__dirname, '../storage/workbench');

// Define searchable applications and widgets
const APPLICATIONS = [
  { name: 'NotePad', type: 'app', path: 'dh0/System/Applications/NotePad.awml', category: 'Application' },
  { name: 'Calculator', type: 'app', path: 'dh0/System/Applications/Calculator.awml', category: 'Application' },
  { name: 'Shell', type: 'app', path: 'dh0/System/Applications/Shell.awml', category: 'Application' },
  { name: 'Clock', type: 'app', path: 'dh0/System/Applications/Clock.awml', category: 'Application' },
  { name: 'Paint', type: 'app', path: 'dh0/System/Applications/Paint.awml', category: 'Application' },
  { name: 'MultiView', type: 'app', path: '', category: 'Application' },
  { name: 'AWML Runner', type: 'app', path: '', category: 'Application' },
  { name: 'AWML Wizard', type: 'app', path: '', category: 'Application' },
  { name: 'Preferences', type: 'app', path: '', category: 'Application' }
];

const WIDGETS = [
  { name: 'Theme Selector', type: 'widget', category: 'Widget' },
  { name: 'Keyboard Shortcuts', type: 'widget', category: 'Widget' },
  { name: 'Clock', type: 'widget', category: 'Widget' },
  { name: 'System Monitor', type: 'widget', category: 'Widget' },
  { name: 'Disk Usage', type: 'widget', category: 'Widget' },
  { name: 'Network Status', type: 'widget', category: 'Widget' }
];

const MENU_ACTIONS = [
  { name: 'About', type: 'action', category: 'Action', menu: 'Workbench' },
  { name: 'Execute Command', type: 'action', category: 'Action', menu: 'Workbench' },
  { name: 'New Drawer', type: 'action', category: 'Action', menu: 'Window' },
  { name: 'Close Window', type: 'action', category: 'Action', menu: 'Window' },
  { name: 'Clean Up', type: 'action', category: 'Action', menu: 'Window' },
  { name: 'Information', type: 'action', category: 'Action', menu: 'Icons' },
  { name: 'Copy', type: 'action', category: 'Action', menu: 'Icons' },
  { name: 'Rename', type: 'action', category: 'Action', menu: 'Icons' },
  { name: 'Delete', type: 'action', category: 'Action', menu: 'Icons' }
];

// Calculate Levenshtein distance for fuzzy matching
const levenshteinDistance = (str1, str2) => {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(0));

  for (let i = 0; i <= len1; i++) matrix[0][i] = i;
  for (let j = 0; j <= len2; j++) matrix[j][0] = j;

  for (let j = 1; j <= len2; j++) {
    for (let i = 1; i <= len1; i++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + cost
      );
    }
  }

  return matrix[len2][len1];
};

// Score a match (lower is better)
const scoreMatch = (query, text) => {
  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();

  // Exact match
  if (textLower === queryLower) return 0;

  // Starts with query (high priority)
  if (textLower.startsWith(queryLower)) return 1;

  // Contains query (medium priority)
  if (textLower.includes(queryLower)) return 2;

  // Fuzzy match with Levenshtein distance
  const distance = levenshteinDistance(queryLower, textLower);

  // Only consider fuzzy matches within reasonable distance
  const maxDistance = Math.floor(queryLower.length / 2);
  if (distance <= maxDistance) {
    return 10 + distance; // Lower priority than direct matches
  }

  return 1000; // No match
};

// Recursively search directory for files and folders
const searchDirectory = async (basePath, relativePath = '', query = '', results = []) => {
  try {
    const fullPath = path.join(basePath, relativePath);
    const entries = await fs.readdir(fullPath, { withFileTypes: true });

    for (const entry of entries) {
      const entryRelativePath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
      const score = scoreMatch(query, entry.name);

      // Only include if it's a reasonable match
      if (score < 1000) {
        const entryFullPath = path.join(fullPath, entry.name);
        const stats = await fs.stat(entryFullPath);

        results.push({
          name: entry.name,
          type: entry.isDirectory() ? 'folder' : 'file',
          path: entryRelativePath,
          size: entry.isDirectory() ? null : formatFileSize(stats.size),
          category: entry.isDirectory() ? 'Folder' : 'File',
          score: score,
          modified: stats.mtime
        });
      }

      // Recursively search subdirectories
      if (entry.isDirectory()) {
        await searchDirectory(basePath, entryRelativePath, query, results);
      }
    }
  } catch (error) {
    // Silently skip directories we can't read
    console.error(`Error reading directory ${relativePath}:`, error.message);
  }

  return results;
};

// Format file size
const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes}`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}K`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}M`;
};

// GET /api/search - Global search across files, apps, widgets, etc.
router.get('/', async (req, res) => {
  try {
    const { q: query } = req.query;

    if (!query || query.trim() === '') {
      return res.json({ results: [] });
    }

    const searchQuery = String(query).trim();
    const allResults = [];

    // Search files and folders in storage
    const fileResults = await searchDirectory(STORAGE_BASE, '', searchQuery);
    allResults.push(...fileResults);

    // Search applications
    APPLICATIONS.forEach(app => {
      const score = scoreMatch(searchQuery, app.name);
      if (score < 1000) {
        allResults.push({
          name: app.name,
          type: 'app',
          path: app.path,
          category: 'Application',
          score: score
        });
      }
    });

    // Search widgets
    WIDGETS.forEach(widget => {
      const score = scoreMatch(searchQuery, widget.name);
      if (score < 1000) {
        allResults.push({
          name: widget.name,
          type: 'widget',
          category: 'Widget',
          score: score
        });
      }
    });

    // Search menu actions
    MENU_ACTIONS.forEach(action => {
      const score = scoreMatch(searchQuery, action.name);
      if (score < 1000) {
        allResults.push({
          name: action.name,
          type: 'action',
          category: 'Action',
          menu: action.menu,
          score: score
        });
      }
    });

    // Sort by score (lower is better)
    allResults.sort((a, b) => a.score - b.score);

    // Return top 20 results
    const topResults = allResults.slice(0, 20);

    res.json({
      query: searchQuery,
      count: topResults.length,
      results: topResults
    });
  } catch (error) {
    console.error('Error performing search:', error);
    res.status(500).json({
      error: 'Failed to perform search',
      message: error.message
    });
  }
});

module.exports = router;

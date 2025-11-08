/**
 * Theme Management Routes
 * API endpoints for retrieving and managing UI themes
 */

const express = require('express');
const router = express.Router();
const { getAllThemes, getThemeById, getThemeMetadata } = require('../themes');

/**
 * GET /api/themes
 * Get metadata for all available themes
 */
router.get('/', (req, res) => {
  try {
    const metadata = getThemeMetadata();
    res.json({
      success: true,
      themes: metadata,
      count: metadata.length,
    });
  } catch (error) {
    console.error('Error fetching theme metadata:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve themes',
    });
  }
});

/**
 * GET /api/themes/:themeId
 * Get full theme configuration by ID
 */
router.get('/:themeId', (req, res) => {
  try {
    const { themeId } = req.params;
    const theme = getThemeById(themeId);

    if (!theme) {
      return res.status(404).json({
        success: false,
        error: `Theme '${themeId}' not found`,
      });
    }

    res.json({
      success: true,
      theme: theme,
    });
  } catch (error) {
    console.error('Error fetching theme:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve theme',
    });
  }
});

/**
 * GET /api/themes/all/full
 * Get full configuration for all themes (for admin/debugging)
 */
router.get('/all/full', (req, res) => {
  try {
    const allThemes = getAllThemes();
    res.json({
      success: true,
      themes: allThemes,
      count: allThemes.length,
    });
  } catch (error) {
    console.error('Error fetching all themes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve themes',
    });
  }
});

module.exports = router;

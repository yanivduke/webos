/**
 * Theme Registry
 * Central export point for all available themes
 */

const amigaTheme = require('./amiga.theme');
const commodore64Theme = require('./commodore64.theme');
const atariTOSTheme = require('./atari-tos.theme');
const appleIIcTheme = require('./apple-iic.theme');
const appleLisaTheme = require('./apple-lisa.theme');
const classicMacTheme = require('./classic-mac.theme');

const themes = {
  amiga: amigaTheme,
  commodore64: commodore64Theme,
  'atari-tos': atariTOSTheme,
  'apple-iic': appleIIcTheme,
  'apple-lisa': appleLisaTheme,
  'classic-mac': classicMacTheme,
};

// Get all available themes as an array
function getAllThemes() {
  return Object.values(themes);
}

// Get a specific theme by ID
function getThemeById(themeId) {
  return themes[themeId] || null;
}

// Get theme metadata (without full theme data)
function getThemeMetadata() {
  return Object.values(themes).map(theme => ({
    id: theme.id,
    name: theme.name,
    description: theme.description,
  }));
}

module.exports = {
  themes,
  getAllThemes,
  getThemeById,
  getThemeMetadata,
};

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;

// Downloads directory (where built sync agents are stored)
const DOWNLOADS_DIR = path.join(__dirname, '../../sync-agent/dist');

/**
 * GET /api/downloads/sync-agent/:filename - Download sync agent
 */
router.get('/sync-agent/:filename', async (req, res) => {
  try {
    const { filename } = req.params;

    // Validate filename to prevent path traversal
    const allowedFiles = [
      'WebOS-Sync-Agent-Setup.exe',
      'WebOS-Sync-Agent.dmg',
      'WebOS-Sync-Agent.AppImage',
      'webos-sync-agent_1.0.0_amd64.deb',
      'webos-sync-agent-1.0.0.x86_64.rpm'
    ];

    if (!allowedFiles.includes(filename)) {
      return res.status(400).json({
        error: 'Invalid file requested'
      });
    }

    const filePath = path.join(DOWNLOADS_DIR, filename);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({
        error: 'File not found',
        message: 'The sync agent has not been built yet. Please build it first using: cd sync-agent && npm run build:all'
      });
    }

    // Get file stats
    const stats = await fs.stat(filePath);

    // Set appropriate headers
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', stats.size);

    // Stream the file
    const fileStream = require('fs').createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      console.error('Error streaming file:', error);
      res.status(500).json({
        error: 'Failed to download file',
        message: error.message
      });
    });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({
      error: 'Download failed',
      message: error.message
    });
  }
});

/**
 * GET /api/downloads/sync-agent - List available downloads
 */
router.get('/sync-agent', async (req, res) => {
  try {
    const availableDownloads = [];

    const files = [
      { filename: 'WebOS-Sync-Agent-Setup.exe', platform: 'Windows', type: 'Installer' },
      { filename: 'WebOS-Sync-Agent.dmg', platform: 'macOS', type: 'DMG Image' },
      { filename: 'WebOS-Sync-Agent.AppImage', platform: 'Linux', type: 'AppImage' },
      { filename: 'webos-sync-agent_1.0.0_amd64.deb', platform: 'Linux (Debian/Ubuntu)', type: 'DEB Package' },
      { filename: 'webos-sync-agent-1.0.0.x86_64.rpm', platform: 'Linux (Fedora/RHEL)', type: 'RPM Package' }
    ];

    // Check which files exist
    for (const file of files) {
      const filePath = path.join(DOWNLOADS_DIR, file.filename);
      try {
        const stats = await fs.stat(filePath);
        availableDownloads.push({
          ...file,
          size: formatFileSize(stats.size),
          downloadUrl: `/api/downloads/sync-agent/${file.filename}`,
          available: true
        });
      } catch {
        availableDownloads.push({
          ...file,
          size: null,
          downloadUrl: null,
          available: false
        });
      }
    }

    res.json({
      downloads: availableDownloads,
      message: availableDownloads.filter(d => d.available).length === 0
        ? 'No sync agents built yet. Build them with: cd sync-agent && npm run build:all'
        : `${availableDownloads.filter(d => d.available).length} downloads available`
    });
  } catch (error) {
    console.error('List downloads error:', error);
    res.status(500).json({
      error: 'Failed to list downloads',
      message: error.message
    });
  }
});

/**
 * Format file size
 */
function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

module.exports = router;

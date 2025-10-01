const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { sanitizePath, sanitizeName, resolveStoragePath } = require('../utils/path-utils');

// Storage base path
const STORAGE_BASE = path.join(__dirname, '../storage/workbench');

const MIME_TYPES = {
  '.awml': 'application/xml',
  '.xml': 'application/xml',
  '.wasm': 'application/wasm'
};

const getFullPath = (diskPath, fileName = '') => {
  return resolveStoragePath(STORAGE_BASE, diskPath, fileName);
};

const getParentPath = (diskPath = '') => {
  const sanitized = sanitizePath(diskPath);
  if (!sanitized) return null;
  const segments = sanitized.split('/');
  if (segments.length <= 1) return null;
  segments.pop();
  return segments.join('/') || null;
};

// Utility function to get file stats
const getFileStats = async (filePath) => {
  try {
    const stats = await fs.stat(filePath);
    return {
      size: stats.isDirectory() ? null : formatFileSize(stats.size),
      created: stats.birthtime,
      modified: stats.mtime,
      isDirectory: stats.isDirectory()
    };
  } catch (error) {
    return null;
  }
};

// Format file size
const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes}`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}K`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}M`;
};

// GET /api/files/list - List files in a directory
router.get('/list', async (req, res) => {
  try {
    const { path: diskPath = 'df0' } = req.query;
    const safeDiskPath = sanitizePath(diskPath);
    const fullPath = getFullPath(safeDiskPath);

    // Check if directory exists
    try {
      await fs.access(fullPath);
    } catch {
      return res.status(404).json({
        error: 'Directory not found',
        path: diskPath
      });
    }

    // Read directory contents
    const entries = await fs.readdir(fullPath, { withFileTypes: true });

    const items = await Promise.all(
      entries.map(async (entry) => {
        const itemPath = path.join(fullPath, entry.name);
        const childPath = safeDiskPath ? `${safeDiskPath}/${entry.name}` : entry.name;
        const stats = await getFileStats(itemPath);

        return {
          id: `${entry.isDirectory() ? 'd' : 'f'}_${entry.name}`,
          name: entry.name,
          type: entry.isDirectory() ? 'folder' : 'file',
          size: stats ? stats.size : null,
          created: stats ? stats.created : null,
          modified: stats ? stats.modified : null,
          path: childPath,
          isDirectory: entry.isDirectory()
        };
      })
    );

    res.json({
      path: safeDiskPath,
      parentPath: getParentPath(safeDiskPath),
      name: safeDiskPath.split('/').pop(),
      items: items
    });
  } catch (error) {
    console.error('Error listing directory:', error);
    res.status(500).json({
      error: 'Failed to list directory',
      message: error.message
    });
  }
});

// POST /api/files/create - Create a new file or folder
router.post('/create', async (req, res) => {
  try {
    const { path: diskPath = 'df0', name, type = 'file', content = '' } = req.body;

    if (!name) {
      return res.status(400).json({
        error: 'Name is required'
      });
    }

    const safeName = sanitizeName(name);
    if (!safeName) {
      return res.status(400).json({
        error: 'Invalid name provided'
      });
    }

    const fullPath = getFullPath(diskPath, safeName);

    // Check if already exists
    try {
      await fs.access(fullPath);
      return res.status(409).json({
        error: 'File or folder already exists',
        name: safeName
      });
    } catch {
      // Doesn't exist, proceed with creation
    }

    if (type === 'folder') {
      await fs.mkdir(fullPath, { recursive: true });
    } else {
      await fs.writeFile(fullPath, content, 'utf-8');
    }

    const stats = await getFileStats(fullPath);

    res.status(201).json({
      message: `${type} created successfully`,
      item: {
        id: `${type === 'folder' ? 'd' : 'f'}_${safeName}`,
        name: safeName,
        type: type,
        size: stats ? stats.size : null,
        created: stats ? stats.created : null,
        modified: stats ? stats.modified : null
      }
    });
  } catch (error) {
    console.error('Error creating file/folder:', error);
    res.status(500).json({
      error: 'Failed to create file or folder',
      message: error.message
    });
  }
});

// POST /api/files/read - Read file contents
router.post('/read', async (req, res) => {
  try {
    const { path: diskPath } = req.body;

    if (!diskPath) {
      return res.status(400).json({
        error: 'Path is required'
      });
    }

    const fullPath = getFullPath(diskPath);

    // Check if file exists
    try {
      await fs.access(fullPath);
    } catch {
      return res.status(404).json({
        error: 'File not found',
        path: diskPath
      });
    }

    const stats = await fs.stat(fullPath);

    if (stats.isDirectory()) {
      return res.status(400).json({
        error: 'Cannot read directory as file'
      });
    }

    const content = await fs.readFile(fullPath, 'utf-8');
    const fileStats = await getFileStats(fullPath);

    res.json({
      path: diskPath,
      name: path.basename(fullPath),
      content: content,
      size: fileStats ? fileStats.size : null,
      modified: fileStats ? fileStats.modified : null
    });
  } catch (error) {
    console.error('Error reading file:', error);
    res.status(500).json({
      error: 'Failed to read file',
      message: error.message
    });
  }
});

// POST /api/files/write - Write/update file contents
router.post('/write', async (req, res) => {
  try {
    const { path: diskPath, content = '' } = req.body;

    if (!diskPath) {
      return res.status(400).json({
        error: 'Path is required'
      });
    }

    const fullPath = getFullPath(diskPath);

    // Ensure parent directory exists
    const dirPath = path.dirname(fullPath);
    await fs.mkdir(dirPath, { recursive: true });

    await fs.writeFile(fullPath, content, 'utf-8');
    const stats = await getFileStats(fullPath);

    res.json({
      message: 'File written successfully',
      path: diskPath,
      name: path.basename(fullPath),
      size: stats ? stats.size : null,
      modified: stats ? stats.modified : null
    });
  } catch (error) {
    console.error('Error writing file:', error);
    res.status(500).json({
      error: 'Failed to write file',
      message: error.message
    });
  }
});

// DELETE /api/files/delete - Delete a file or folder
router.delete('/delete', async (req, res) => {
  try {
    const { path: diskPath } = req.query;

    if (!diskPath) {
      return res.status(400).json({
        error: 'Path is required'
      });
    }

    const fullPath = getFullPath(diskPath);

    // Check if exists
    try {
      await fs.access(fullPath);
    } catch {
      return res.status(404).json({
        error: 'File or folder not found',
        path: diskPath
      });
    }

    const stats = await fs.stat(fullPath);
    const fileName = path.basename(fullPath);

    // Move to trash instead of permanent delete
    const trashPath = path.join(STORAGE_BASE, 'trash', `${fileName}_${Date.now()}`);

    if (stats.isDirectory()) {
      await fs.rename(fullPath, trashPath);
    } else {
      await fs.rename(fullPath, trashPath);
    }

    res.json({
      message: 'Item moved to trash',
      name: fileName
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({
      error: 'Failed to delete file or folder',
      message: error.message
    });
  }
});

// POST /api/files/rename - Rename a file or folder
router.post('/rename', async (req, res) => {
  try {
    const { path: diskPath, newName } = req.body;

    if (!diskPath || !newName) {
      return res.status(400).json({
        error: 'Path and new name are required'
      });
    }

    const safeNewName = sanitizeName(newName);
    if (!safeNewName) {
      return res.status(400).json({
        error: 'Invalid new name provided'
      });
    }

    const oldPath = getFullPath(diskPath);
    const newPath = path.join(path.dirname(oldPath), safeNewName);

    // Check if old path exists
    try {
      await fs.access(oldPath);
    } catch {
      return res.status(404).json({
        error: 'File or folder not found',
        path: diskPath
      });
    }

    // Check if new name already exists
    try {
      await fs.access(newPath);
      return res.status(409).json({
        error: 'A file or folder with that name already exists',
        name: safeNewName
      });
    } catch {
      // Doesn't exist, proceed with rename
    }

    await fs.rename(oldPath, newPath);
    const stats = await getFileStats(newPath);

    res.json({
      message: 'Item renamed successfully',
      name: safeNewName,
      size: stats ? stats.size : null,
      modified: stats ? stats.modified : null
    });
  } catch (error) {
    console.error('Error renaming file:', error);
    res.status(500).json({
      error: 'Failed to rename file or folder',
      message: error.message
    });
  }
});

// GET /api/files/raw - Fetch raw file data (binary)
router.get('/raw', async (req, res) => {
  try {
    const { path: diskPath } = req.query;

    if (!diskPath) {
      return res.status(400).json({
        error: 'Path is required'
      });
    }

    const safePath = sanitizePath(String(diskPath));
    const fullPath = getFullPath(safePath);

    try {
      await fs.access(fullPath);
    } catch {
      return res.status(404).json({
        error: 'File not found',
        path: diskPath
      });
    }

    const ext = path.extname(fullPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.sendFile(fullPath);
  } catch (error) {
    console.error('Error streaming file:', error);
    res.status(500).json({
      error: 'Failed to read file',
      message: error.message
    });
  }
});

// POST /api/files/copy - Copy a file or folder
router.post('/copy', async (req, res) => {
  try {
    const { sourcePath, destinationPath, newName } = req.body;

    if (!sourcePath || !destinationPath) {
      return res.status(400).json({
        error: 'Source path and destination path are required'
      });
    }

    const safeSourcePath = sanitizePath(sourcePath);
    const safeDestinationPath = sanitizePath(destinationPath);
    const safeName = newName ? sanitizeName(newName) : path.basename(safeSourcePath);

    if (!safeSourcePath || !safeDestinationPath || !safeName) {
      return res.status(400).json({
        error: 'Invalid paths provided'
      });
    }

    const sourceFullPath = getFullPath(safeSourcePath);
    const destinationFullPath = getFullPath(safeDestinationPath, safeName);

    // Check if source exists
    try {
      await fs.access(sourceFullPath);
    } catch {
      return res.status(404).json({
        error: 'Source file or folder not found',
        path: sourcePath
      });
    }

    // Check if destination already exists
    try {
      await fs.access(destinationFullPath);
      return res.status(409).json({
        error: 'A file or folder with that name already exists at destination',
        name: safeName
      });
    } catch {
      // Doesn't exist, proceed with copy
    }

    // Check if source is a directory
    const sourceStats = await fs.stat(sourceFullPath);
    
    if (sourceStats.isDirectory()) {
      // Copy directory recursively
      await copyDirectory(sourceFullPath, destinationFullPath);
    } else {
      // Copy file
      await fs.copyFile(sourceFullPath, destinationFullPath);
    }

    const newStats = await getFileStats(destinationFullPath);

    res.json({
      message: `${sourceStats.isDirectory() ? 'Folder' : 'File'} copied successfully`,
      item: {
        id: `${sourceStats.isDirectory() ? 'd' : 'f'}_${safeName}`,
        name: safeName,
        type: sourceStats.isDirectory() ? 'folder' : 'file',
        size: newStats ? newStats.size : null,
        created: newStats ? newStats.created : null,
        modified: newStats ? newStats.modified : null
      }
    });
  } catch (error) {
    console.error('Error copying file/folder:', error);
    res.status(500).json({
      error: 'Failed to copy file or folder',
      message: error.message
    });
  }
});

// Helper function to copy directory recursively
const copyDirectory = async (src, dest) => {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
};

module.exports = router;

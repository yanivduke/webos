const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// Storage base path
const STORAGE_BASE = path.join(__dirname, '../storage/workbench');

// Utility function to get full path
const getFullPath = (diskPath, fileName = '') => {
  const sanitized = diskPath.replace(/\.\./g, '').replace(/^\/+/, '');
  return path.join(STORAGE_BASE, sanitized, fileName);
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
    const fullPath = getFullPath(diskPath);

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
        const stats = await getFileStats(itemPath);

        return {
          id: `${entry.isDirectory() ? 'd' : 'f'}_${entry.name}`,
          name: entry.name,
          type: entry.isDirectory() ? 'folder' : 'file',
          size: stats ? stats.size : null,
          created: stats ? stats.created : null,
          modified: stats ? stats.modified : null
        };
      })
    );

    res.json({
      path: diskPath,
      name: diskPath.split('/').pop(),
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

    const fullPath = getFullPath(diskPath, name);

    // Check if already exists
    try {
      await fs.access(fullPath);
      return res.status(409).json({
        error: 'File or folder already exists',
        name: name
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
        id: `${type === 'folder' ? 'd' : 'f'}_${name}`,
        name: name,
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

    // For reading files, diskPath should include the filename
    const fullPath = path.join(STORAGE_BASE, diskPath.replace(/\.\./g, '').replace(/^\/+/, ''));

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

    const fullPath = path.join(STORAGE_BASE, diskPath.replace(/\.\./g, '').replace(/^\/+/, ''));

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

    const fullPath = path.join(STORAGE_BASE, diskPath.replace(/\.\./g, '').replace(/^\/+/, ''));

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

    const oldPath = path.join(STORAGE_BASE, diskPath.replace(/\.\./g, '').replace(/^\/+/, ''));
    const newPath = path.join(path.dirname(oldPath), newName);

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
        name: newName
      });
    } catch {
      // Doesn't exist, proceed with rename
    }

    await fs.rename(oldPath, newPath);
    const stats = await getFileStats(newPath);

    res.json({
      message: 'Item renamed successfully',
      name: newName,
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

module.exports = router;

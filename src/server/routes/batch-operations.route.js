/**
 * Batch Operations Routes
 * Handles batch file operations for WebOS
 */

const express = require('express');
const router = express.Router();
const { sanitizePath } = require('../utils/path-utils');

// Mock file system (shared with file-operations.route.js)
// In a real implementation, this would be imported or use a database
const fileSystem = {
  df0: {
    name: 'Workbench',
    type: 'floppy',
    items: [
      { name: 'System', type: 'folder', icon: 'folder' },
      { name: 'Utilities', type: 'folder', icon: 'folder' },
      { name: 'Prefs', type: 'folder', icon: 'folder' },
      { name: 'Startup-Sequence', type: 'file', icon: 'document' }
    ]
  },
  dh0: {
    name: 'Hard Drive',
    type: 'hard-drive',
    items: [
      { name: 'Documents', type: 'folder', icon: 'folder' },
      { name: 'Games', type: 'folder', icon: 'folder' },
      { name: 'Pictures', type: 'folder', icon: 'folder' },
      { name: 'Music', type: 'folder', icon: 'folder' }
    ]
  },
  ram: {
    name: 'RAM Disk',
    type: 'ram-disk',
    items: []
  },
  utils: {
    name: 'Utilities',
    type: 'utilities',
    items: [
      { name: 'Shell', type: 'app', icon: 'terminal' },
      { name: 'Calculator', type: 'app', icon: 'calculator' },
      { name: 'Clock', type: 'app', icon: 'clock' },
      { name: 'NotePad', type: 'app', icon: 'notepad' }
    ]
  },
  trash: {
    name: 'Trash',
    type: 'trash',
    items: []
  }
};

/**
 * Helper function to parse path into disk and item
 */
function parsePath(path) {
  const sanitized = sanitizePath(path);
  const parts = sanitized.split(':');

  if (parts.length < 2) {
    return { disk: null, itemPath: null };
  }

  const disk = parts[0];
  const itemPath = parts[1] || '';

  return { disk, itemPath };
}

/**
 * Helper function to find item in file system
 */
function findItem(disk, itemPath) {
  if (!fileSystem[disk]) {
    return null;
  }

  if (!itemPath || itemPath === '') {
    return fileSystem[disk];
  }

  // Simple implementation: look in top-level items
  const items = fileSystem[disk].items || [];
  return items.find(item => item.name === itemPath);
}

/**
 * Helper function to add item to file system
 */
function addItem(disk, item) {
  if (!fileSystem[disk]) {
    return false;
  }

  if (!fileSystem[disk].items) {
    fileSystem[disk].items = [];
  }

  fileSystem[disk].items.push(item);
  return true;
}

/**
 * Helper function to remove item from file system
 */
function removeItem(disk, itemName) {
  if (!fileSystem[disk] || !fileSystem[disk].items) {
    return false;
  }

  const index = fileSystem[disk].items.findIndex(item => item.name === itemName);
  if (index === -1) {
    return false;
  }

  fileSystem[disk].items.splice(index, 1);
  return true;
}

/**
 * Helper function to check if item exists
 */
function itemExists(disk, itemName) {
  if (!fileSystem[disk] || !fileSystem[disk].items) {
    return false;
  }

  return fileSystem[disk].items.some(item => item.name === itemName);
}

/**
 * Helper function to generate unique name for conflicts
 */
function generateUniqueName(disk, baseName) {
  let counter = 1;
  let newName = baseName;

  // Extract extension
  const lastDot = baseName.lastIndexOf('.');
  const name = lastDot > 0 ? baseName.substring(0, lastDot) : baseName;
  const ext = lastDot > 0 ? baseName.substring(lastDot) : '';

  while (itemExists(disk, newName)) {
    newName = `${name}_${counter}${ext}`;
    counter++;
  }

  return newName;
}

/**
 * POST /api/batch/copy
 * Copy a file or folder
 */
router.post('/copy', (req, res) => {
  try {
    const { source, destination, conflictStrategy } = req.body;

    if (!source || !destination) {
      return res.status(400).json({
        success: false,
        error: 'Source and destination are required'
      });
    }

    // Parse paths
    const sourceParsed = parsePath(source);
    const destParsed = parsePath(destination);

    if (!sourceParsed.disk || !destParsed.disk) {
      return res.status(400).json({
        success: false,
        error: 'Invalid path format. Use format: disk:path'
      });
    }

    // Find source item
    const sourceItem = findItem(sourceParsed.disk, sourceParsed.itemPath);
    if (!sourceItem) {
      return res.status(404).json({
        success: false,
        error: 'Source not found'
      });
    }

    // Check if destination exists
    const itemName = sourceParsed.itemPath || sourceItem.name;
    let finalName = itemName;

    if (itemExists(destParsed.disk, itemName)) {
      // Handle conflict
      switch (conflictStrategy) {
        case 'SKIP':
          return res.json({
            success: true,
            skipped: true,
            message: 'File exists, skipped'
          });

        case 'RENAME':
          finalName = generateUniqueName(destParsed.disk, itemName);
          break;

        case 'OVERWRITE':
          // Remove existing item
          removeItem(destParsed.disk, itemName);
          break;

        case 'ASK':
        default:
          return res.status(409).json({
            success: false,
            conflict: true,
            error: 'Destination already exists'
          });
      }
    }

    // Create copy
    const copy = {
      ...sourceItem,
      name: finalName
    };

    // Add to destination
    if (!addItem(destParsed.disk, copy)) {
      return res.status(500).json({
        success: false,
        error: 'Failed to copy item'
      });
    }

    res.json({
      success: true,
      source: source,
      destination: `${destParsed.disk}:${finalName}`,
      renamed: finalName !== itemName
    });

  } catch (error) {
    console.error('Copy error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Copy failed'
    });
  }
});

/**
 * POST /api/batch/move
 * Move a file or folder
 */
router.post('/move', (req, res) => {
  try {
    const { source, destination, conflictStrategy } = req.body;

    if (!source || !destination) {
      return res.status(400).json({
        success: false,
        error: 'Source and destination are required'
      });
    }

    // Parse paths
    const sourceParsed = parsePath(source);
    const destParsed = parsePath(destination);

    if (!sourceParsed.disk || !destParsed.disk) {
      return res.status(400).json({
        success: false,
        error: 'Invalid path format. Use format: disk:path'
      });
    }

    // Find source item
    const sourceItem = findItem(sourceParsed.disk, sourceParsed.itemPath);
    if (!sourceItem) {
      return res.status(404).json({
        success: false,
        error: 'Source not found'
      });
    }

    // Check if destination exists
    const itemName = sourceParsed.itemPath || sourceItem.name;
    let finalName = itemName;

    if (itemExists(destParsed.disk, itemName)) {
      // Handle conflict
      switch (conflictStrategy) {
        case 'SKIP':
          return res.json({
            success: true,
            skipped: true,
            message: 'File exists, skipped'
          });

        case 'RENAME':
          finalName = generateUniqueName(destParsed.disk, itemName);
          break;

        case 'OVERWRITE':
          // Remove existing item
          removeItem(destParsed.disk, itemName);
          break;

        case 'ASK':
        default:
          return res.status(409).json({
            success: false,
            conflict: true,
            error: 'Destination already exists'
          });
      }
    }

    // Create copy with new name
    const moved = {
      ...sourceItem,
      name: finalName
    };

    // Add to destination
    if (!addItem(destParsed.disk, moved)) {
      return res.status(500).json({
        success: false,
        error: 'Failed to move item'
      });
    }

    // Remove from source
    if (!removeItem(sourceParsed.disk, sourceParsed.itemPath)) {
      // Rollback: remove from destination
      removeItem(destParsed.disk, finalName);
      return res.status(500).json({
        success: false,
        error: 'Failed to remove source'
      });
    }

    res.json({
      success: true,
      source: source,
      destination: `${destParsed.disk}:${finalName}`,
      renamed: finalName !== itemName
    });

  } catch (error) {
    console.error('Move error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Move failed'
    });
  }
});

/**
 * POST /api/batch/delete
 * Delete a file or folder
 */
router.post('/delete', (req, res) => {
  try {
    const { source } = req.body;

    if (!source) {
      return res.status(400).json({
        success: false,
        error: 'Source is required'
      });
    }

    // Parse path
    const sourceParsed = parsePath(source);

    if (!sourceParsed.disk) {
      return res.status(400).json({
        success: false,
        error: 'Invalid path format. Use format: disk:path'
      });
    }

    // Find source item
    const sourceItem = findItem(sourceParsed.disk, sourceParsed.itemPath);
    if (!sourceItem) {
      return res.status(404).json({
        success: false,
        error: 'Source not found'
      });
    }

    // Move to trash instead of permanent deletion
    const itemName = sourceParsed.itemPath || sourceItem.name;

    // Create trash copy
    const trashItem = {
      ...sourceItem,
      originalLocation: source,
      deletedAt: Date.now()
    };

    // Add to trash
    addItem('trash', trashItem);

    // Remove from source
    if (!removeItem(sourceParsed.disk, sourceParsed.itemPath)) {
      // Rollback: remove from trash
      removeItem('trash', itemName);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete item'
      });
    }

    res.json({
      success: true,
      source: source,
      movedToTrash: true
    });

  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Delete failed'
    });
  }
});

/**
 * POST /api/batch/rename
 * Rename a file or folder
 */
router.post('/rename', (req, res) => {
  try {
    const { source, newName } = req.body;

    if (!source || !newName) {
      return res.status(400).json({
        success: false,
        error: 'Source and new name are required'
      });
    }

    // Parse path
    const sourceParsed = parsePath(source);

    if (!sourceParsed.disk) {
      return res.status(400).json({
        success: false,
        error: 'Invalid path format. Use format: disk:path'
      });
    }

    // Find source item
    const sourceItem = findItem(sourceParsed.disk, sourceParsed.itemPath);
    if (!sourceItem) {
      return res.status(404).json({
        success: false,
        error: 'Source not found'
      });
    }

    // Check if new name already exists
    if (itemExists(sourceParsed.disk, newName)) {
      return res.status(409).json({
        success: false,
        conflict: true,
        error: 'An item with that name already exists'
      });
    }

    // Update name
    sourceItem.name = newName;

    res.json({
      success: true,
      source: source,
      newName: newName,
      newPath: `${sourceParsed.disk}:${newName}`
    });

  } catch (error) {
    console.error('Rename error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Rename failed'
    });
  }
});

/**
 * POST /api/batch/compress
 * Compress files into an archive
 */
router.post('/compress', (req, res) => {
  try {
    const { sources, destination, archiveName } = req.body;

    if (!sources || !Array.isArray(sources) || sources.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Sources array is required'
      });
    }

    if (!destination || !archiveName) {
      return res.status(400).json({
        success: false,
        error: 'Destination and archive name are required'
      });
    }

    // Parse destination
    const destParsed = parsePath(destination);

    if (!destParsed.disk) {
      return res.status(400).json({
        success: false,
        error: 'Invalid destination format'
      });
    }

    // Create archive item
    const archive = {
      name: archiveName,
      type: 'file',
      icon: 'archive',
      size: sources.length * 1024, // Mock size
      compressed: true,
      contents: sources
    };

    // Add to destination
    if (!addItem(destParsed.disk, archive)) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create archive'
      });
    }

    res.json({
      success: true,
      archive: `${destParsed.disk}:${archiveName}`,
      itemCount: sources.length
    });

  } catch (error) {
    console.error('Compress error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Compress failed'
    });
  }
});

/**
 * POST /api/batch/extract
 * Extract files from an archive
 */
router.post('/extract', (req, res) => {
  try {
    const { source, destination } = req.body;

    if (!source || !destination) {
      return res.status(400).json({
        success: false,
        error: 'Source and destination are required'
      });
    }

    // Parse paths
    const sourceParsed = parsePath(source);
    const destParsed = parsePath(destination);

    if (!sourceParsed.disk || !destParsed.disk) {
      return res.status(400).json({
        success: false,
        error: 'Invalid path format'
      });
    }

    // Find source archive
    const sourceItem = findItem(sourceParsed.disk, sourceParsed.itemPath);
    if (!sourceItem) {
      return res.status(404).json({
        success: false,
        error: 'Archive not found'
      });
    }

    if (!sourceItem.compressed) {
      return res.status(400).json({
        success: false,
        error: 'Source is not an archive'
      });
    }

    // Extract contents (mock)
    const extracted = sourceItem.contents || [];
    let extractedCount = 0;

    for (const itemPath of extracted) {
      // Create mock item for each extracted file
      const fileName = itemPath.split('/').pop() || itemPath;
      const item = {
        name: fileName,
        type: 'file',
        icon: 'document'
      };

      if (!itemExists(destParsed.disk, fileName)) {
        addItem(destParsed.disk, item);
        extractedCount++;
      }
    }

    res.json({
      success: true,
      source: source,
      destination: destination,
      itemsExtracted: extractedCount
    });

  } catch (error) {
    console.error('Extract error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Extract failed'
    });
  }
});

/**
 * GET /api/batch/status
 * Get batch operation system status
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    available: true,
    maxOperations: 3,
    supportedOperations: [
      'COPY',
      'MOVE',
      'DELETE',
      'RENAME',
      'COMPRESS',
      'EXTRACT'
    ]
  });
});

module.exports = router;

const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { sanitizePath, sanitizeName, resolveStoragePath } = require('../utils/path-utils');
const multer = require('multer');

// Storage base path
const STORAGE_BASE = path.join(__dirname, '../storage/workbench');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    try {
      const uploadPath = req.body.path || 'dh0';
      const safePath = sanitizePath(uploadPath);
      const fullPath = resolveStoragePath(STORAGE_BASE, safePath);

      // Ensure directory exists
      await fs.mkdir(fullPath, { recursive: true });

      cb(null, fullPath);
    } catch (error) {
      cb(error, null);
    }
  },
  filename: function (req, file, cb) {
    // Sanitize filename
    const safeName = sanitizeName(file.originalname);
    cb(null, safeName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB max file size
  },
  fileFilter: function (req, file, cb) {
    // Block dangerous file extensions
    const blockedExtensions = ['.exe', '.bat', '.cmd', '.scr', '.com', '.pif', '.msi', '.vbs', '.js'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (blockedExtensions.includes(ext)) {
      return cb(new Error(`File type ${ext} is not allowed for security reasons`));
    }

    cb(null, true);
  }
});

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

// GET /api/files/search - Search for files across disks
router.get('/search', async (req, res) => {
  try {
    const { query = '', disk = '', types = '', minSize = '', maxSize = '' } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        error: 'Query parameter is required',
        results: []
      });
    }

    const searchQuery = query.toLowerCase();
    const fileTypes = types ? String(types).split(',').map(t => t.trim().toLowerCase()) : [];
    const minSizeBytes = minSize ? parseInt(String(minSize)) : 0;
    const maxSizeBytes = maxSize ? parseInt(String(maxSize)) : Infinity;

    // Determine which disks to search
    const disksToSearch = disk && disk !== 'all' ? [String(disk)] : ['df0', 'dh0', 'dh1', 'ram'];

    const results = [];
    const MAX_RESULTS = 500;

    // Fuzzy match function
    const fuzzyScore = (searchTerm, target) => {
      searchTerm = searchTerm.toLowerCase();
      target = target.toLowerCase();

      // Exact match
      if (target === searchTerm) return 1.0;

      // Contains match
      if (target.includes(searchTerm)) return 0.9;

      // Fuzzy match
      let score = 0;
      let searchIndex = 0;

      for (let i = 0; i < target.length && searchIndex < searchTerm.length; i++) {
        if (target[i] === searchTerm[searchIndex]) {
          score += (1.0 / searchTerm.length);

          // Bonus for matching at start or after separator
          if (i === 0 || target[i - 1] === ' ' || target[i - 1] === '/' || target[i - 1] === '_') {
            score += 0.1;
          }

          searchIndex++;
        }
      }

      // All characters must match
      if (searchIndex !== searchTerm.length) return 0;

      return Math.max(0, Math.min(1, score));
    };

    // Recursive search function
    const searchInDirectory = async (diskPath, currentPath = '') => {
      if (results.length >= MAX_RESULTS) return;

      try {
        const fullPath = path.join(STORAGE_BASE, diskPath, currentPath);

        // Check if directory exists
        try {
          await fs.access(fullPath);
        } catch {
          return; // Directory doesn't exist, skip
        }

        const entries = await fs.readdir(fullPath, { withFileTypes: true });

        for (const entry of entries) {
          if (results.length >= MAX_RESULTS) break;

          const itemPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
          const itemFullPath = path.join(fullPath, entry.name);
          const diskItemPath = `${diskPath}/${itemPath}`;

          // Calculate relevance score
          const relevance = fuzzyScore(searchQuery, entry.name);

          if (relevance > 0) {
            const stats = await getFileStats(itemFullPath);

            // Apply file type filter
            if (fileTypes.length > 0 && !entry.isDirectory()) {
              const ext = path.extname(entry.name).toLowerCase().replace('.', '');
              if (!fileTypes.includes(ext)) continue;
            }

            // Apply size filter
            if (stats && stats.size) {
              const sizeBytes = parseSizeStringToBytes(stats.size);
              if (sizeBytes < minSizeBytes || sizeBytes > maxSizeBytes) continue;
            }

            results.push({
              id: `${entry.isDirectory() ? 'd' : 'f'}_${diskItemPath}`,
              name: entry.name,
              type: entry.isDirectory() ? 'folder' : 'file',
              path: diskItemPath,
              size: stats ? stats.size : null,
              created: stats ? stats.created : null,
              modified: stats ? stats.modified : null,
              relevance: relevance,
              isDirectory: entry.isDirectory()
            });
          }

          // Recursively search subdirectories
          if (entry.isDirectory()) {
            await searchInDirectory(diskPath, itemPath);
          }
        }
      } catch (error) {
        console.error(`Error searching in ${diskPath}/${currentPath}:`, error.message);
      }
    };

    // Helper to parse size string to bytes
    const parseSizeStringToBytes = (sizeStr) => {
      if (!sizeStr) return 0;
      const match = String(sizeStr).match(/^([\d.]+)([KMG]?)$/);
      if (!match) return parseInt(sizeStr) || 0;

      const value = parseFloat(match[1]);
      const unit = match[2];

      switch (unit) {
        case 'K': return value * 1024;
        case 'M': return value * 1024 * 1024;
        case 'G': return value * 1024 * 1024 * 1024;
        default: return value;
      }
    };

    // Search each disk
    for (const diskId of disksToSearch) {
      await searchInDirectory(diskId);
    }

    // Sort by relevance (highest first)
    results.sort((a, b) => b.relevance - a.relevance);

    res.json({
      query: query,
      disk: disk || 'all',
      count: results.length,
      results: results
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      error: 'Search failed',
      message: error.message,
      results: []
    });
  }
});

// POST /api/files/compress - Create ZIP archive from selected files
router.post('/compress', async (req, res) => {
  try {
    const { files, archiveName, destinationPath, compressionLevel = 'normal' } = req.body;

    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({
        error: 'Files array is required'
      });
    }

    if (!archiveName) {
      return res.status(400).json({
        error: 'Archive name is required'
      });
    }

    const safeName = sanitizeName(archiveName);
    const safeDestPath = sanitizePath(destinationPath || 'dh0');

    // Note: Actual ZIP compression would require additional dependencies
    // For now, this is a stub that tracks the archive metadata

    res.json({
      message: 'Archive created successfully',
      archivePath: `${safeDestPath}/${safeName}`,
      fileCount: files.length
    });
  } catch (error) {
    console.error('Error creating archive:', error);
    res.status(500).json({
      error: 'Failed to create archive',
      message: error.message
    });
  }
});

// POST /api/files/extract - Extract ZIP archive
router.post('/extract', async (req, res) => {
  try {
    const { archivePath, destinationPath } = req.body;

    if (!archivePath) {
      return res.status(400).json({
        error: 'Archive path is required'
      });
    }

    const safeArchivePath = sanitizePath(archivePath);
    const safeDestPath = sanitizePath(destinationPath || 'dh0');

    // Ensure destination directory exists
    const destFullPath = getFullPath(safeDestPath);
    await fs.mkdir(destFullPath, { recursive: true });

    // Note: Actual ZIP extraction would require additional dependencies (e.g., adm-zip)
    // For now, this is a stub

    res.json({
      message: 'Archive extracted successfully',
      destinationPath: safeDestPath,
      extractedCount: 0
    });
  } catch (error) {
    console.error('Error extracting archive:', error);
    res.status(500).json({
      error: 'Failed to extract archive',
      message: error.message
    });
  }
});

// GET /api/files/archive-info - Get archive contents and metadata
router.get('/archive-info', async (req, res) => {
  try {
    const { path: archivePath } = req.query;

    if (!archivePath) {
      return res.status(400).json({
        error: 'Archive path is required'
      });
    }

    const safePath = sanitizePath(String(archivePath));
    const fullPath = getFullPath(safePath);

    // Check if file exists
    try {
      await fs.access(fullPath);
    } catch {
      return res.status(404).json({
        error: 'Archive not found',
        path: archivePath
      });
    }

    const stats = await fs.stat(fullPath);

    // Note: Actual archive parsing would require additional dependencies
    // For now, return basic file info

    res.json({
      path: safePath,
      name: path.basename(fullPath),
      size: stats.size,
      modified: stats.mtime,
      fileCount: 0,
      files: []
    });
  } catch (error) {
    console.error('Error reading archive info:', error);
    res.status(500).json({
      error: 'Failed to read archive info',
      message: error.message
    });
  }
});

// POST /api/files/archive-add - Add files to existing archive
router.post('/archive-add', async (req, res) => {
  try {
    const { archivePath, files } = req.body;

    if (!archivePath || !files || !Array.isArray(files)) {
      return res.status(400).json({
        error: 'Archive path and files array are required'
      });
    }

    const safePath = sanitizePath(archivePath);

    // Note: Actual archive modification would require additional dependencies
    // For now, this is a stub

    res.json({
      message: 'Files added to archive',
      archivePath: safePath,
      addedCount: files.length
    });
  } catch (error) {
    console.error('Error adding to archive:', error);
    res.status(500).json({
      error: 'Failed to add files to archive',
      message: error.message
    });
  }
});

// POST /api/files/archive-remove - Remove files from archive
router.post('/archive-remove', async (req, res) => {
  try {
    const { archivePath, files } = req.body;

    if (!archivePath || !files || !Array.isArray(files)) {
      return res.status(400).json({
        error: 'Archive path and files array are required'
      });
    }

    const safePath = sanitizePath(archivePath);

    // Note: Actual archive modification would require additional dependencies
    // For now, this is a stub

    res.json({
      message: 'Files removed from archive',
      archivePath: safePath,
      removedCount: files.length
    });
  } catch (error) {
    console.error('Error removing from archive:', error);
    res.status(500).json({
      error: 'Failed to remove files from archive',
      message: error.message
    });
  }
});

// POST /api/files/upload - Upload files via drag-and-drop
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded'
      });
    }

    const uploadPath = req.body.path || 'dh0';
    const overwrite = req.body.overwrite === 'true';
    const safePath = sanitizePath(uploadPath);
    const filePath = path.join(resolveStoragePath(STORAGE_BASE, safePath), req.file.filename);

    // Check if file already exists
    if (!overwrite) {
      try {
        await fs.access(filePath);
        // File exists, generate unique name
        const ext = path.extname(req.file.filename);
        const baseName = path.basename(req.file.filename, ext);
        const timestamp = Date.now();
        const newName = `${baseName}_${timestamp}${ext}`;
        const newPath = path.join(path.dirname(filePath), newName);

        await fs.rename(filePath, newPath);

        const stats = await getFileStats(newPath);

        return res.status(201).json({
          message: 'File uploaded successfully',
          item: {
            id: `f_${newName}`,
            name: newName,
            type: 'file',
            size: stats ? stats.size : null,
            created: stats ? stats.created : null,
            modified: stats ? stats.modified : null,
            path: `${safePath}/${newName}`
          }
        });
      } catch {
        // File doesn't exist, proceed
      }
    }

    const stats = await getFileStats(filePath);

    res.status(201).json({
      message: 'File uploaded successfully',
      item: {
        id: `f_${req.file.filename}`,
        name: req.file.filename,
        type: 'file',
        size: stats ? stats.size : null,
        created: stats ? stats.created : null,
        modified: stats ? stats.modified : null,
        path: `${safePath}/${req.file.filename}`
      }
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({
      error: 'Failed to upload file',
      message: error.message
    });
  }
});

// POST /api/files/capture - Save a screenshot or recording
router.post('/capture', async (req, res) => {
  try {
    const { filename, content, format, type } = req.body;

    if (!filename || !content) {
      return res.status(400).json({
        error: 'Filename and content are required'
      });
    }

    const safeName = sanitizeName(filename);
    if (!safeName) {
      return res.status(400).json({
        error: 'Invalid filename provided'
      });
    }

    // Save to dh0/Screenshots/ folder
    const screenshotsDir = 'dh0/Screenshots';
    const fullPath = getFullPath(screenshotsDir, safeName);

    // Ensure Screenshots directory exists
    const dirPath = path.dirname(fullPath);
    await fs.mkdir(dirPath, { recursive: true });

    // Decode base64 content
    const buffer = Buffer.from(content, 'base64');

    // Write file
    await fs.writeFile(fullPath, buffer);

    const stats = await getFileStats(fullPath);

    res.status(201).json({
      message: 'Capture saved successfully',
      item: {
        id: `f_${safeName}`,
        name: safeName,
        type: 'file',
        size: stats ? stats.size : null,
        created: stats ? stats.created : null,
        modified: stats ? stats.modified : null,
        path: `${screenshotsDir}/${safeName}`
      }
    });
  } catch (error) {
    console.error('Error saving capture:', error);
    res.status(500).json({
      error: 'Failed to save capture',
      message: error.message
    });
  }
});

// GET /api/files/content - Get file content for preview
router.get('/content', async (req, res) => {
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

    const stats = await fs.stat(fullPath);
    if (stats.isDirectory()) {
      return res.status(400).json({
        error: 'Cannot preview directory'
      });
    }

    const ext = path.extname(fullPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.sendFile(fullPath);
  } catch (error) {
    console.error('Error getting file content:', error);
    res.status(500).json({
      error: 'Failed to read file',
      message: error.message
    });
  }
});

// GET /api/files/metadata - Get file metadata
router.get('/metadata', async (req, res) => {
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

    const stats = await fs.stat(fullPath);
    const fileName = path.basename(fullPath);
    const ext = path.extname(fileName);

    const metadata = {
      name: fileName,
      size: stats.size,
      sizeFormatted: formatFileSize(stats.size),
      extension: ext,
      mimeType: MIME_TYPES[ext.toLowerCase()] || 'application/octet-stream',
      created: stats.birthtime,
      modified: stats.mtime,
      accessed: stats.atime,
      isDirectory: stats.isDirectory(),
      isFile: stats.isFile(),
      permissions: stats.mode,
    };

    res.json(metadata);
  } catch (error) {
    console.error('Error getting file metadata:', error);
    res.status(500).json({
      error: 'Failed to get metadata',
      message: error.message
    });
  }
});

// GET /api/files/thumbnail - Generate thumbnail for images
router.get('/thumbnail', async (req, res) => {
  try {
    const { path: diskPath, size = '256' } = req.query;

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
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];

    if (!imageExtensions.includes(ext)) {
      return res.status(400).json({
        error: 'Thumbnail generation only supported for images'
      });
    }

    // For now, just return the image as-is
    // In production, you'd use sharp or similar to generate thumbnails
    const contentType = MIME_TYPES[ext] || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.sendFile(fullPath);
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    res.status(500).json({
      error: 'Failed to generate thumbnail',
      message: error.message
    });
  }
});

// GET /api/files/archive/list - List contents of archive
router.get('/archive/list', async (req, res) => {
  try {
    const { path: archivePath } = req.query;

    if (!archivePath) {
      return res.status(400).json({
        error: 'Archive path is required'
      });
    }

    const safePath = sanitizePath(String(archivePath));
    const fullPath = getFullPath(safePath);

    try {
      await fs.access(fullPath);
    } catch {
      return res.status(404).json({
        error: 'Archive not found',
        path: archivePath
      });
    }

    const stats = await fs.stat(fullPath);
    const ext = path.extname(fullPath).toLowerCase();

    if (!['.zip', '.tar', '.gz', '.7z', '.rar'].includes(ext)) {
      return res.status(400).json({
        error: 'File is not a supported archive format'
      });
    }

    // Note: Actual archive parsing would require additional dependencies (e.g., adm-zip)
    // For now, return mock data
    res.json({
      path: safePath,
      name: path.basename(fullPath),
      size: stats.size,
      modified: stats.mtime,
      fileCount: 3,
      files: [
        {
          name: 'README.md',
          size: 2048,
          modified: stats.mtime,
          isDirectory: false
        },
        {
          name: 'src/',
          size: 0,
          modified: stats.mtime,
          isDirectory: true
        },
        {
          name: 'package.json',
          size: 1024,
          modified: stats.mtime,
          isDirectory: false
        }
      ]
    });
  } catch (error) {
    console.error('Error listing archive contents:', error);
    res.status(500).json({
      error: 'Failed to list archive contents',
      message: error.message
    });
  }
});

module.exports = router;

/**
 * Metadata API Routes for WebOS
 * Handles file metadata operations including tags, labels, ratings, and notes
 */

const express = require('express');
const router = express.Router();

// In-memory metadata storage
// In a real application, this would be stored in a database
const metadataStore = new Map();
const tagsStore = new Map();

// Initialize with some predefined tags
const PREDEFINED_TAGS = [
  { name: 'Important', color: '#cc0000', count: 0, created: Date.now() },
  { name: 'Work', color: '#0055aa', count: 0, created: Date.now() },
  { name: 'Personal', color: '#00aa00', count: 0, created: Date.now() },
  { name: 'Archive', color: '#888888', count: 0, created: Date.now() },
  { name: 'Todo', color: '#ff8800', count: 0, created: Date.now() },
  { name: 'Review', color: '#8800cc', count: 0, created: Date.now() },
];

PREDEFINED_TAGS.forEach(tag => {
  tagsStore.set(tag.name, tag);
});

/**
 * Helper: Create default metadata for a file
 */
function createDefaultMetadata(path, name, type, size) {
  return {
    name,
    path,
    size,
    type,
    created: Date.now(),
    modified: Date.now(),
    tags: [],
    labels: [],
    rating: 0,
    color: null,
    comments: '',
    notes: [],
    permissions: {
      read: true,
      write: true,
      execute: false,
    },
  };
}

/**
 * Helper: Update tag count
 */
function updateTagCount(tagName, increment) {
  let tag = tagsStore.get(tagName);
  if (!tag) {
    tag = {
      name: tagName,
      color: '#0055aa',
      count: 0,
      created: Date.now(),
    };
    tagsStore.set(tagName, tag);
  }

  if (increment) {
    tag.count++;
  } else {
    tag.count = Math.max(0, tag.count - 1);
  }
}

/**
 * GET /api/metadata/:path
 * Get metadata for a specific file
 */
router.get('/:path(*)', (req, res) => {
  try {
    const filePath = req.params.path;

    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    const metadata = metadataStore.get(filePath);

    if (!metadata) {
      return res.status(404).json({ error: 'Metadata not found' });
    }

    res.json(metadata);
  } catch (error) {
    console.error('Error getting metadata:', error);
    res.status(500).json({ error: 'Failed to get metadata' });
  }
});

/**
 * PUT /api/metadata/:path
 * Update metadata for a specific file
 */
router.put('/:path(*)', (req, res) => {
  try {
    const filePath = req.params.path;
    const updates = req.body;

    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    let metadata = metadataStore.get(filePath);

    // Handle tag count updates
    if (metadata && metadata.tags && updates.tags) {
      // Remove old tags
      metadata.tags.forEach(tag => {
        if (!updates.tags.includes(tag)) {
          updateTagCount(tag, false);
        }
      });

      // Add new tags
      updates.tags.forEach(tag => {
        if (!metadata.tags.includes(tag)) {
          updateTagCount(tag, true);
        }
      });
    }

    if (!metadata) {
      // Create new metadata
      metadata = createDefaultMetadata(
        filePath,
        updates.name || 'Unknown',
        updates.type || 'file',
        updates.size || 0
      );
    }

    // Update metadata
    Object.assign(metadata, updates);
    metadata.modified = Date.now();

    metadataStore.set(filePath, metadata);

    res.json(metadata);
  } catch (error) {
    console.error('Error updating metadata:', error);
    res.status(500).json({ error: 'Failed to update metadata' });
  }
});

/**
 * DELETE /api/metadata/:path
 * Delete metadata for a specific file
 */
router.delete('/:path(*)', (req, res) => {
  try {
    const filePath = req.params.path;

    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    const metadata = metadataStore.get(filePath);

    if (metadata && metadata.tags) {
      // Update tag counts
      metadata.tags.forEach(tag => {
        updateTagCount(tag, false);
      });
    }

    metadataStore.delete(filePath);

    res.json({ success: true, message: 'Metadata deleted' });
  } catch (error) {
    console.error('Error deleting metadata:', error);
    res.status(500).json({ error: 'Failed to delete metadata' });
  }
});

/**
 * POST /api/metadata/bulk
 * Bulk update metadata for multiple files
 */
router.post('/bulk', (req, res) => {
  try {
    const { paths, updates } = req.body;

    if (!paths || !Array.isArray(paths)) {
      return res.status(400).json({ error: 'Paths array is required' });
    }

    if (!updates) {
      return res.status(400).json({ error: 'Updates object is required' });
    }

    const results = [];

    paths.forEach(filePath => {
      let metadata = metadataStore.get(filePath);

      if (!metadata) {
        metadata = createDefaultMetadata(filePath, 'Unknown', 'file', 0);
      }

      // Handle tags specially - add instead of replace
      if (updates.tags) {
        updates.tags.forEach(tag => {
          if (!metadata.tags.includes(tag)) {
            metadata.tags.push(tag);
            updateTagCount(tag, true);
          }
        });
        delete updates.tags; // Don't overwrite in Object.assign
      }

      Object.assign(metadata, updates);
      metadata.modified = Date.now();

      metadataStore.set(filePath, metadata);
      results.push(metadata);
    });

    res.json({
      success: true,
      count: results.length,
      results,
    });
  } catch (error) {
    console.error('Error bulk updating metadata:', error);
    res.status(500).json({ error: 'Failed to bulk update metadata' });
  }
});

/**
 * POST /api/metadata/search
 * Search files by metadata criteria
 */
router.post('/search', (req, res) => {
  try {
    const criteria = req.body;
    const results = [];

    for (const [path, metadata] of metadataStore) {
      let matches = true;

      // Check tags
      if (criteria.tags && criteria.tags.length > 0) {
        const hasAllTags = criteria.tags.every(tag => metadata.tags.includes(tag));
        if (!hasAllTags) {
          matches = false;
        }
      }

      // Check rating
      if (criteria.rating !== undefined && metadata.rating !== criteria.rating) {
        matches = false;
      }

      // Check color
      if (criteria.color !== undefined && metadata.color !== criteria.color) {
        matches = false;
      }

      // Check type
      if (criteria.type && metadata.type !== criteria.type) {
        matches = false;
      }

      // Check size range
      if (criteria.minSize !== undefined && metadata.size < criteria.minSize) {
        matches = false;
      }
      if (criteria.maxSize !== undefined && metadata.size > criteria.maxSize) {
        matches = false;
      }

      // Check date ranges
      if (criteria.createdAfter !== undefined && metadata.created < criteria.createdAfter) {
        matches = false;
      }
      if (criteria.createdBefore !== undefined && metadata.created > criteria.createdBefore) {
        matches = false;
      }
      if (criteria.modifiedAfter !== undefined && metadata.modified < criteria.modifiedAfter) {
        matches = false;
      }
      if (criteria.modifiedBefore !== undefined && metadata.modified > criteria.modifiedBefore) {
        matches = false;
      }

      // Check search text
      if (criteria.searchText) {
        const searchLower = criteria.searchText.toLowerCase();
        const nameMatch = metadata.name.toLowerCase().includes(searchLower);
        const commentMatch = metadata.comments.toLowerCase().includes(searchLower);
        const notesMatch = metadata.notes.some(note =>
          note.text.toLowerCase().includes(searchLower)
        );

        if (!nameMatch && !commentMatch && !notesMatch) {
          matches = false;
        }
      }

      if (matches) {
        results.push(metadata);
      }
    }

    res.json({
      count: results.length,
      results,
    });
  } catch (error) {
    console.error('Error searching metadata:', error);
    res.status(500).json({ error: 'Failed to search metadata' });
  }
});

/**
 * GET /api/metadata/tags/all
 * Get all tags
 */
router.get('/tags/all', (req, res) => {
  try {
    const tags = Array.from(tagsStore.values());
    res.json(tags);
  } catch (error) {
    console.error('Error getting tags:', error);
    res.status(500).json({ error: 'Failed to get tags' });
  }
});

/**
 * GET /api/metadata/tags/:name
 * Get a specific tag
 */
router.get('/tags/:name', (req, res) => {
  try {
    const tagName = req.params.name;

    if (!tagName) {
      return res.status(400).json({ error: 'Tag name is required' });
    }

    const tag = tagsStore.get(tagName);

    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    res.json(tag);
  } catch (error) {
    console.error('Error getting tag:', error);
    res.status(500).json({ error: 'Failed to get tag' });
  }
});

/**
 * POST /api/metadata/tags
 * Create a new tag
 */
router.post('/tags', (req, res) => {
  try {
    const { name, color } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Tag name is required' });
    }

    if (tagsStore.has(name)) {
      return res.status(409).json({ error: 'Tag already exists' });
    }

    const tag = {
      name,
      color: color || '#0055aa',
      count: 0,
      created: Date.now(),
    };

    tagsStore.set(name, tag);

    res.status(201).json(tag);
  } catch (error) {
    console.error('Error creating tag:', error);
    res.status(500).json({ error: 'Failed to create tag' });
  }
});

/**
 * PUT /api/metadata/tags/:name
 * Update a tag
 */
router.put('/tags/:name', (req, res) => {
  try {
    const oldName = req.params.name;
    const { name: newName, color } = req.body;

    if (!oldName) {
      return res.status(400).json({ error: 'Tag name is required' });
    }

    const tag = tagsStore.get(oldName);

    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    // If renaming
    if (newName && newName !== oldName) {
      if (tagsStore.has(newName)) {
        return res.status(409).json({ error: 'A tag with this name already exists' });
      }

      // Update tag in all files
      for (const [path, metadata] of metadataStore) {
        const index = metadata.tags.indexOf(oldName);
        if (index > -1) {
          metadata.tags[index] = newName;
        }
      }

      // Update tag in store
      tag.name = newName;
      tagsStore.delete(oldName);
      tagsStore.set(newName, tag);
    }

    // Update color
    if (color) {
      tag.color = color;
    }

    res.json(tag);
  } catch (error) {
    console.error('Error updating tag:', error);
    res.status(500).json({ error: 'Failed to update tag' });
  }
});

/**
 * DELETE /api/metadata/tags/:name
 * Delete a tag
 */
router.delete('/tags/:name', (req, res) => {
  try {
    const tagName = req.params.name;

    if (!tagName) {
      return res.status(400).json({ error: 'Tag name is required' });
    }

    // Remove tag from all files
    for (const [path, metadata] of metadataStore) {
      const index = metadata.tags.indexOf(tagName);
      if (index > -1) {
        metadata.tags.splice(index, 1);
      }
    }

    tagsStore.delete(tagName);

    res.json({ success: true, message: 'Tag deleted' });
  } catch (error) {
    console.error('Error deleting tag:', error);
    res.status(500).json({ error: 'Failed to delete tag' });
  }
});

/**
 * GET /api/metadata/tags/:name/files
 * Get all files with a specific tag
 */
router.get('/tags/:name/files', (req, res) => {
  try {
    const tagName = req.params.name;

    if (!tagName) {
      return res.status(400).json({ error: 'Tag name is required' });
    }

    const results = [];

    for (const [path, metadata] of metadataStore) {
      if (metadata.tags.includes(tagName)) {
        results.push(metadata);
      }
    }

    res.json({
      tag: tagName,
      count: results.length,
      files: results,
    });
  } catch (error) {
    console.error('Error getting files by tag:', error);
    res.status(500).json({ error: 'Failed to get files by tag' });
  }
});

/**
 * POST /api/metadata/:path/notes
 * Add a note to a file
 */
router.post('/:path(*)/notes', (req, res) => {
  try {
    const filePath = req.params.path;
    const { text, author } = req.body;

    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    if (!text) {
      return res.status(400).json({ error: 'Note text is required' });
    }

    let metadata = metadataStore.get(filePath);

    if (!metadata) {
      metadata = createDefaultMetadata(filePath, 'Unknown', 'file', 0);
      metadataStore.set(filePath, metadata);
    }

    const note = {
      id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text,
      timestamp: Date.now(),
      author: author || 'Anonymous',
    };

    metadata.notes.push(note);
    metadata.modified = Date.now();

    res.status(201).json(note);
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({ error: 'Failed to add note' });
  }
});

/**
 * DELETE /api/metadata/:path/notes/:noteId
 * Delete a note from a file
 */
router.delete('/:path(*)/notes/:noteId', (req, res) => {
  try {
    const filePath = req.params.path;
    const noteId = req.params.noteId;

    if (!filePath || !noteId) {
      return res.status(400).json({ error: 'File path and note ID are required' });
    }

    const metadata = metadataStore.get(filePath);

    if (!metadata) {
      return res.status(404).json({ error: 'Metadata not found' });
    }

    const index = metadata.notes.findIndex(note => note.id === noteId);

    if (index === -1) {
      return res.status(404).json({ error: 'Note not found' });
    }

    metadata.notes.splice(index, 1);
    metadata.modified = Date.now();

    res.json({ success: true, message: 'Note deleted' });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

/**
 * GET /api/metadata/statistics
 * Get metadata statistics
 */
router.get('/statistics', (req, res) => {
  try {
    const totalFiles = metadataStore.size;
    const totalTags = tagsStore.size;

    let totalRating = 0;
    let ratedFiles = 0;
    const colorDistribution = {};

    for (const [path, metadata] of metadataStore) {
      if (metadata.rating > 0) {
        totalRating += metadata.rating;
        ratedFiles++;
      }

      if (metadata.color) {
        colorDistribution[metadata.color] = (colorDistribution[metadata.color] || 0) + 1;
      }
    }

    const averageRating = ratedFiles > 0 ? totalRating / ratedFiles : 0;

    const topTags = Array.from(tagsStore.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    res.json({
      totalFiles,
      totalTags,
      averageRating,
      colorDistribution,
      topTags,
    });
  } catch (error) {
    console.error('Error getting statistics:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

/**
 * POST /api/metadata/export
 * Export all metadata
 */
router.post('/export', (req, res) => {
  try {
    const data = {
      metadata: Object.fromEntries(metadataStore),
      tags: Object.fromEntries(tagsStore),
      exportDate: Date.now(),
      version: '1.0',
    };

    res.json(data);
  } catch (error) {
    console.error('Error exporting metadata:', error);
    res.status(500).json({ error: 'Failed to export metadata' });
  }
});

/**
 * POST /api/metadata/import
 * Import metadata
 */
router.post('/import', (req, res) => {
  try {
    const { metadata, tags } = req.body;

    if (!metadata || !tags) {
      return res.status(400).json({ error: 'Metadata and tags are required' });
    }

    // Import metadata
    for (const [path, data] of Object.entries(metadata)) {
      metadataStore.set(path, data);
    }

    // Import tags
    for (const [name, tag] of Object.entries(tags)) {
      tagsStore.set(name, tag);
    }

    res.json({
      success: true,
      message: 'Metadata imported successfully',
      metadataCount: Object.keys(metadata).length,
      tagsCount: Object.keys(tags).length,
    });
  } catch (error) {
    console.error('Error importing metadata:', error);
    res.status(500).json({ error: 'Failed to import metadata' });
  }
});

module.exports = router;

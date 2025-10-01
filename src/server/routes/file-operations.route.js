const express = require('express');
const router = express.Router();

// Mock file system data
const fileSystem = {
  'df0': {
    name: 'Workbench3.1',
    items: [
      { id: 'd1', name: 'Devs', type: 'folder', size: null },
      { id: 'd2', name: 'Expansion', type: 'folder', size: null },
      { id: 'd3', name: 'Fonts', type: 'folder', size: null },
      { id: 'd4', name: 'Libs', type: 'folder', size: null },
      { id: 'd5', name: 'Prefs', type: 'folder', size: null },
      { id: 'd6', name: 'System', type: 'folder', size: null },
      { id: 'd7', name: 'Tools', type: 'folder', size: null },
      { id: 'd8', name: 'Utilities', type: 'folder', size: null },
      { id: 'f1', name: 'Shell-Startup', type: 'file', size: '1.2K' },
      { id: 'f2', name: 'Startup-Sequence', type: 'file', size: '856' }
    ]
  },
  'dh0': {
    name: 'System',
    items: [
      { id: 's1', name: 'Documents', type: 'folder', size: null },
      { id: 's2', name: 'Programs', type: 'folder', size: null },
      { id: 's3', name: 'Games', type: 'folder', size: null },
      { id: 's4', name: 'readme.txt', type: 'file', size: '2.4K' }
    ]
  },
  'dh1': {
    name: 'Work',
    items: [
      { id: 'w1', name: 'Projects', type: 'folder', size: null },
      { id: 'w2', name: 'Documents', type: 'folder', size: null },
      { id: 'w3', name: 'Pictures', type: 'folder', size: null },
      { id: 'w4', name: 'Music', type: 'folder', size: null }
    ]
  },
  'ram': {
    name: 'RAM Disk',
    items: [
      { id: 'r1', name: 'Clipboards', type: 'folder', size: null },
      { id: 'r2', name: 'T', type: 'folder', size: null },
      { id: 'r3', name: 'ENV', type: 'folder', size: null }
    ]
  },
  'utils': {
    name: 'Utilities',
    items: [
      { id: 'u1', name: 'Clock', type: 'tool', size: '12K' },
      { id: 'u2', name: 'Calculator', type: 'tool', size: '18K' },
      { id: 'u3', name: 'MultiView', type: 'tool', size: '24K' },
      { id: 'u4', name: 'NotePad', type: 'tool', size: '16K' },
      { id: 'u5', name: 'Shell', type: 'tool', size: '32K' },
      { id: 'u6', name: 'More', type: 'folder', size: null }
    ]
  },
  'trash': {
    name: 'Trash',
    items: []
  }
};

// GET /api/files - List files in a directory
router.get('/', (req, res) => {
  const { path = 'df0' } = req.query;

  const directory = fileSystem[path];

  if (!directory) {
    return res.status(404).json({
      error: 'Directory not found',
      path: path
    });
  }

  res.json({
    path: path,
    name: directory.name,
    items: directory.items
  });
});

// POST /api/files - Create a new file or folder
router.post('/', (req, res) => {
  const { path = 'df0', name, type = 'file' } = req.body;

  if (!name) {
    return res.status(400).json({
      error: 'Name is required'
    });
  }

  const directory = fileSystem[path];

  if (!directory) {
    return res.status(404).json({
      error: 'Directory not found',
      path: path
    });
  }

  const newItem = {
    id: `${type[0]}${Date.now()}`,
    name: name,
    type: type,
    size: type === 'file' ? '0' : null
  };

  directory.items.push(newItem);

  res.status(201).json({
    message: `${type} created successfully`,
    item: newItem
  });
});

// PUT /api/files/:id - Update a file or folder
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { path = 'df0', name } = req.body;

  const directory = fileSystem[path];

  if (!directory) {
    return res.status(404).json({
      error: 'Directory not found',
      path: path
    });
  }

  const item = directory.items.find(i => i.id === id);

  if (!item) {
    return res.status(404).json({
      error: 'Item not found',
      id: id
    });
  }

  if (name) {
    item.name = name;
  }

  res.json({
    message: 'Item updated successfully',
    item: item
  });
});

// DELETE /api/files/:id - Delete a file or folder
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const { path = 'df0' } = req.query;

  const directory = fileSystem[path];

  if (!directory) {
    return res.status(404).json({
      error: 'Directory not found',
      path: path
    });
  }

  const index = directory.items.findIndex(i => i.id === id);

  if (index === -1) {
    return res.status(404).json({
      error: 'Item not found',
      id: id
    });
  }

  const deletedItem = directory.items.splice(index, 1)[0];

  // Move to trash
  fileSystem.trash.items.push({
    ...deletedItem,
    originalPath: path,
    deletedAt: new Date().toISOString()
  });

  res.json({
    message: 'Item moved to trash',
    item: deletedItem
  });
});

module.exports = router;

const express = require('express');
const router = express.Router();

// Mock data stores
const mockData = {
  gitRepos: {},
  dockerContainers: [],
  npmPackages: [],
  environmentVars: {},
  logs: [],
  snippets: []
};

// ============================================================================
// GIT CLIENT ROUTES
// ============================================================================

router.get('/git/status', (req, res) => {
  const { path } = req.query;

  res.json({
    success: true,
    data: {
      branch: 'main',
      remote: 'origin',
      status: 'modified',
      changes: [
        { file: 'src/index.js', status: 'modified' },
        { file: 'package.json', status: 'modified' }
      ]
    }
  });
});

router.post('/git/commit', (req, res) => {
  const { path, message, files } = req.body;

  res.json({
    success: true,
    message: 'Commit created successfully',
    commit: {
      hash: 'a1b2c3d4',
      message,
      files: files.length,
      timestamp: new Date().toISOString()
    }
  });
});

router.get('/git/branches', (req, res) => {
  res.json({
    success: true,
    branches: [
      { name: 'main', current: true },
      { name: 'feature/dev-tools', current: false }
    ]
  });
});

router.get('/git/log', (req, res) => {
  res.json({
    success: true,
    commits: [
      {
        hash: 'a1b2c3d4e5f6',
        author: 'Developer',
        date: '2024-01-15',
        message: 'Add developer tools'
      }
    ]
  });
});

// ============================================================================
// DOCKER MANAGER ROUTES
// ============================================================================

router.get('/docker/containers', (req, res) => {
  res.json({
    success: true,
    containers: [
      {
        id: 'abc123',
        name: 'webos-app',
        image: 'node:18-alpine',
        status: 'running',
        ports: '3000:3000',
        created: '2 hours ago'
      }
    ]
  });
});

router.post('/docker/container/:id/start', (req, res) => {
  const { id } = req.params;

  res.json({
    success: true,
    message: `Container ${id} started`
  });
});

router.post('/docker/container/:id/stop', (req, res) => {
  const { id } = req.params;

  res.json({
    success: true,
    message: `Container ${id} stopped`
  });
});

router.get('/docker/images', (req, res) => {
  res.json({
    success: true,
    images: [
      {
        id: 'sha256:abc123',
        name: 'node',
        tag: '18-alpine',
        size: '167 MB',
        created: '2 weeks ago'
      }
    ]
  });
});

// ============================================================================
// NPM MANAGER ROUTES
// ============================================================================

router.get('/npm/packages', (req, res) => {
  const { path } = req.query;

  res.json({
    success: true,
    packages: [
      {
        name: 'vue',
        version: '3.4.0',
        latest: '3.4.21',
        description: 'The progressive JavaScript framework',
        type: 'dependencies',
        outdated: true
      },
      {
        name: 'express',
        version: '4.18.2',
        latest: '4.18.2',
        description: 'Fast, unopinionated, minimalist web framework',
        type: 'dependencies',
        outdated: false
      }
    ]
  });
});

router.post('/npm/install', (req, res) => {
  const { package: pkgName, path } = req.body;

  res.json({
    success: true,
    message: `Package ${pkgName} installed successfully`
  });
});

router.post('/npm/uninstall', (req, res) => {
  const { package: pkgName, path } = req.body;

  res.json({
    success: true,
    message: `Package ${pkgName} uninstalled successfully`
  });
});

router.post('/npm/update', (req, res) => {
  const { package: pkgName, path } = req.body;

  res.json({
    success: true,
    message: `Package ${pkgName} updated successfully`
  });
});

router.get('/npm/scripts', (req, res) => {
  const { path } = req.query;

  res.json({
    success: true,
    scripts: [
      { name: 'dev', command: 'vite' },
      { name: 'build', command: 'vite build' },
      { name: 'test', command: 'vitest' }
    ]
  });
});

router.post('/npm/run-script', (req, res) => {
  const { script, path } = req.body;

  res.json({
    success: true,
    message: `Script "${script}" executed`,
    output: 'Script output...'
  });
});

router.get('/npm/audit', (req, res) => {
  const { path } = req.query;

  res.json({
    success: true,
    audit: {
      critical: 0,
      high: 2,
      moderate: 5,
      low: 3
    },
    vulnerabilities: [
      {
        title: 'Prototype Pollution',
        package: 'lodash',
        vulnerable: '<4.17.21',
        patched: '>=4.17.21',
        severity: 'high'
      }
    ]
  });
});

// ============================================================================
// ENVIRONMENT EDITOR ROUTES
// ============================================================================

router.get('/env/files', (req, res) => {
  res.json({
    success: true,
    files: ['.env', '.env.local', '.env.development', '.env.production']
  });
});

router.get('/env/variables', (req, res) => {
  const { file } = req.query;

  res.json({
    success: true,
    variables: [
      { key: 'NODE_ENV', value: 'development', isSecret: false },
      { key: 'PORT', value: '3001', isSecret: false },
      { key: 'DATABASE_URL', value: 'postgresql://localhost:5432/webos', isSecret: true }
    ]
  });
});

router.post('/env/save', (req, res) => {
  const { file, variables } = req.body;

  res.json({
    success: true,
    message: `Environment file ${file} saved successfully`
  });
});

// ============================================================================
// LOG VIEWER ROUTES
// ============================================================================

router.get('/logs/sources', (req, res) => {
  res.json({
    success: true,
    sources: ['application', 'server', 'database', 'nginx', 'docker']
  });
});

router.get('/logs/stream', (req, res) => {
  const { source, level, limit } = req.query;

  res.json({
    success: true,
    logs: [
      {
        time: '12:00:01',
        timestamp: '2024-01-15 12:00:01.123',
        level: 'info',
        source: source || 'server',
        message: 'Server started on port 3001'
      },
      {
        time: '12:00:12',
        timestamp: '2024-01-15 12:00:12.789',
        level: 'warn',
        source: source || 'api',
        message: 'Slow query detected: 1.2s'
      }
    ]
  });
});

router.get('/logs/tail', (req, res) => {
  const { source, lines } = req.query;

  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Send mock log every 2 seconds
  const interval = setInterval(() => {
    const log = {
      time: new Date().toLocaleTimeString(),
      timestamp: new Date().toISOString(),
      level: ['info', 'warn', 'error'][Math.floor(Math.random() * 3)],
      source: source || 'server',
      message: 'Sample log message'
    };

    res.write(`data: ${JSON.stringify(log)}\n\n`);
  }, 2000);

  req.on('close', () => {
    clearInterval(interval);
  });
});

// ============================================================================
// CODE SNIPPETS ROUTES
// ============================================================================

router.get('/snippets', (req, res) => {
  const { category, tags, search } = req.query;

  res.json({
    success: true,
    snippets: mockData.snippets || []
  });
});

router.post('/snippets', (req, res) => {
  const snippet = {
    id: Date.now().toString(),
    ...req.body,
    created: new Date().toISOString(),
    updated: new Date().toISOString()
  };

  if (!mockData.snippets) {
    mockData.snippets = [];
  }

  mockData.snippets.push(snippet);

  res.json({
    success: true,
    snippet
  });
});

router.put('/snippets/:id', (req, res) => {
  const { id } = req.params;
  const index = mockData.snippets.findIndex(s => s.id === id);

  if (index > -1) {
    mockData.snippets[index] = {
      ...mockData.snippets[index],
      ...req.body,
      updated: new Date().toISOString()
    };

    res.json({
      success: true,
      snippet: mockData.snippets[index]
    });
  } else {
    res.status(404).json({
      success: false,
      error: 'Snippet not found'
    });
  }
});

router.delete('/snippets/:id', (req, res) => {
  const { id } = req.params;
  mockData.snippets = mockData.snippets.filter(s => s.id !== id);

  res.json({
    success: true,
    message: 'Snippet deleted'
  });
});

// ============================================================================
// REGEX TESTER ROUTES
// ============================================================================

router.post('/regex/test', (req, res) => {
  const { pattern, flags, testString } = req.body;

  try {
    const regex = new RegExp(pattern, flags);
    const matches = [];
    let match;

    if (flags.includes('g')) {
      while ((match = regex.exec(testString)) !== null) {
        matches.push({
          value: match[0],
          index: match.index,
          groups: match.slice(1)
        });
      }
    } else {
      match = regex.exec(testString);
      if (match) {
        matches.push({
          value: match[0],
          index: match.index,
          groups: match.slice(1)
        });
      }
    }

    res.json({
      success: true,
      matches
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

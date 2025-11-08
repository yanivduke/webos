/**
 * Vercel Serverless Function Handler for WebOS Server
 *
 * This wraps the Express application to work with Vercel's serverless platform.
 *
 * IMPORTANT LIMITATIONS:
 * - File system writes are NOT persistent (ephemeral storage)
 * - WebSocket connections are not supported
 * - Functions have a 10-second timeout (configurable up to 60s on Pro plan)
 *
 * For production with persistent storage, consider:
 * - Vercel KV (Redis) for app state
 * - Vercel Postgres for structured data
 * - Vercel Blob for file storage
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

// Import routes
const systemStatusRoutes = require('../src/server/routes/system-status.route');
const fileOperationsRoutes = require('../src/server/routes/file-operations.route');
const settingsRoutes = require('../src/server/routes/settings.route');
const appStateRoutes = require('../src/server/routes/app-state.route');
const shellRoutes = require('../src/server/routes/shell.route');
const authRoutes = require('../src/server/routes/auth.route');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api/system', systemStatusRoutes);
app.use('/api/files', fileOperationsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/app-state', appStateRoutes);
app.use('/api/shell', shellRoutes);
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    message: 'WebOS Server is running on Vercel',
    version: '2.0.0',
    platform: 'vercel-serverless',
    limitations: [
      'File writes are not persistent',
      'WebSocket not supported',
      'Use Vercel KV/Postgres for persistence'
    ]
  });
});

// Root endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'WebOS Server',
    version: '2.0.0',
    description: 'Backend API for Amiga Workbench-style WebOS',
    platform: 'Vercel Serverless',
    endpoints: {
      health: '/api/health',
      system: '/api/system',
      files: '/api/files',
      settings: '/api/settings',
      appState: '/api/app-state',
      shell: '/api/shell'
    },
    features: [
      'Real file system with persistence',
      'Application state management',
      'Shell command execution',
      'System settings persistence',
      '5 working applications'
    ],
    note: 'Running on Vercel serverless functions - file writes are ephemeral'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
    availableEndpoints: [
      '/api/health',
      '/api/system/status',
      '/api/files/list',
      '/api/settings',
      '/api/app-state',
      '/api/shell/execute'
    ]
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// Export for Vercel serverless
module.exports = app;

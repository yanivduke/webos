const express = require('express');
const cors = require('cors');
const path = require('path');

// Import routes
const systemStatusRoutes = require('./routes/system-status.route');
const fileOperationsRoutes = require('./routes/file-operations.route');
const settingsRoutes = require('./routes/settings.route');
const appStateRoutes = require('./routes/app-state.route');
const shellRoutes = require('./routes/shell.route');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for Paint app
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    message: 'WebOS Server is running',
    version: '2.0.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'WebOS Server',
    version: '2.0.0',
    description: 'Backend API for Amiga Workbench-style WebOS',
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
    ]
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
    availableEndpoints: [
      '/api/health',
      '/api/system',
      '/api/files',
      '/api/settings',
      '/api/app-state',
      '/api/shell'
    ]
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('  🖥️  WebOS Server v2.0.0 - Amiga Workbench Style');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  Server running on: http://localhost:${PORT}`);
  console.log(`  Health check: http://localhost:${PORT}/api/health`);
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('  ');
  console.log('  📁 File Operations: /api/files');
  console.log('  💾 App State: /api/app-state');
  console.log('  💻 Shell Commands: /api/shell');
  console.log('  ⚙️  Settings: /api/settings');
  console.log('  📊 System Info: /api/system');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

module.exports = app;

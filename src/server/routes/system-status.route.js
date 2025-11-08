const express = require('express');
const router = express.Router();

// GET /api/system/status - Retrieve system status information
router.get('/status', (req, res) => {
  const status = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      chipMem: '512K',
      fastMem: '512K',
      total: process.memoryUsage().heapTotal,
      used: process.memoryUsage().heapUsed,
      free: process.memoryUsage().heapTotal - process.memoryUsage().heapUsed
    },
    cpu: {
      model: 'Motorola 68040 (Simulated)',
      speed: '25 MHz',
      usage: Math.random() * 100
    },
    disks: [
      { id: 'df0', name: 'Workbench3.1', type: 'floppy', capacity: '880K', used: '720K', free: '160K' },
      { id: 'dh0', name: 'System', type: 'hard', capacity: '40MB', used: '28MB', free: '12MB' },
      { id: 'dh1', name: 'Work', type: 'hard', capacity: '100MB', used: '45MB', free: '55MB' },
      { id: 'ram', name: 'RAM Disk', type: 'ram', capacity: '2MB', used: '512K', free: '1.5MB' }
    ],
    screen: {
      width: 640,
      height: 256,
      colors: 16,
      mode: 'Workbench'
    }
  };

  res.json(status);
});

// GET /api/system/info - Get system information
router.get('/info', (req, res) => {
  res.json({
    os: 'Workbench 3.1',
    version: '40.42',
    kickstart: '40.68',
    workbench: '40.42',
    platform: 'Amiga 4000',
    architecture: '68040'
  });
});

// GET /api/system/performance - Get performance metrics
router.get('/performance', (req, res) => {
  const memUsage = process.memoryUsage();

  // Calculate disk usage percentages
  const calculateUsage = (used, capacity) => {
    const usedNum = parseFloat(used);
    const capNum = parseFloat(capacity);
    return ((usedNum / capNum) * 100).toFixed(1);
  };

  const disks = [
    {
      id: 'df0',
      name: 'Workbench3.1',
      type: 'floppy',
      capacity: '880K',
      used: '720K',
      free: '160K',
      usedPercent: 81.8
    },
    {
      id: 'dh0',
      name: 'System',
      type: 'hard',
      capacity: '40MB',
      used: '28MB',
      free: '12MB',
      usedPercent: 70.0
    },
    {
      id: 'dh1',
      name: 'Work',
      type: 'hard',
      capacity: '100MB',
      used: '45MB',
      free: '55MB',
      usedPercent: 45.0
    },
    {
      id: 'ram',
      name: 'RAM Disk',
      type: 'ram',
      capacity: '2MB',
      used: '512K',
      free: '1.5MB',
      usedPercent: 25.0
    }
  ];

  res.json({
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      rss: memUsage.rss,
      external: memUsage.external,
      percentage: ((memUsage.heapUsed / memUsage.heapTotal) * 100).toFixed(2)
    },
    cpu: {
      usage: Math.random() * 30 + 10, // Simulated CPU usage 10-40%
      loadAvg: process.platform === 'linux' ? require('os').loadavg() : [0, 0, 0]
    },
    disks: disks,
    activeConnections: 1, // Simulated
    apiStats: {
      totalRequests: Math.floor(Math.random() * 1000) + 100,
      avgResponseTime: Math.random() * 50 + 10
    }
  });
});

// GET /api/system/processes - Get active processes/sessions
router.get('/processes', (req, res) => {
  // In a real implementation, this would track actual sessions
  // For now, return simulated process data
  const processes = [
    {
      id: 'system-1',
      name: 'Workbench',
      type: 'system',
      memory: 2048000,
      cpu: 2.5,
      startTime: Date.now() - 3600000,
      status: 'running'
    },
    {
      id: 'system-2',
      name: 'Input Handler',
      type: 'system',
      memory: 512000,
      cpu: 0.5,
      startTime: Date.now() - 3600000,
      status: 'running'
    },
    {
      id: 'system-3',
      name: 'Graphics Server',
      type: 'system',
      memory: 4096000,
      cpu: 5.2,
      startTime: Date.now() - 3600000,
      status: 'running'
    }
  ];

  res.json({
    timestamp: new Date().toISOString(),
    processes: processes,
    count: processes.length
  });
});

module.exports = router;

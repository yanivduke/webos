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

module.exports = router;

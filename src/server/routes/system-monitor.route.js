/**
 * System Monitor API Routes
 * Provides system resource monitoring, process management, and disk analysis
 */

const express = require('express');
const router = express.Router();

// In-memory storage for monitoring data
let mockProcesses = [
  {
    pid: 1,
    name: 'Workbench',
    cpu: 2.5,
    memory: 50 * 1024 * 1024,
    memoryPercent: 9.7,
    status: 'running',
    startTime: Date.now() - 3600000,
    user: 'system',
    command: 'workbench'
  },
  {
    pid: 42,
    name: 'AmigaShell',
    cpu: 0.5,
    memory: 10 * 1024 * 1024,
    memoryPercent: 1.9,
    status: 'sleeping',
    startTime: Date.now() - 1800000,
    user: 'user',
    command: 'shell'
  },
  {
    pid: 128,
    name: 'DiskValidator',
    cpu: 1.2,
    memory: 5 * 1024 * 1024,
    memoryPercent: 0.9,
    status: 'running',
    startTime: Date.now() - 7200000,
    user: 'system',
    command: 'validator'
  },
  {
    pid: 256,
    name: 'FileSystem',
    cpu: 0.8,
    memory: 15 * 1024 * 1024,
    memoryPercent: 2.9,
    status: 'running',
    startTime: Date.now() - 10800000,
    user: 'system',
    command: 'filesystem'
  },
  {
    pid: 512,
    name: 'NetworkHandler',
    cpu: 1.5,
    memory: 8 * 1024 * 1024,
    memoryPercent: 1.5,
    status: 'running',
    startTime: Date.now() - 5400000,
    user: 'system',
    command: 'network'
  }
];

let networkStats = {
  totalUploaded: 1024 * 1024 * 50,
  totalDownloaded: 1024 * 1024 * 200,
  connections: 0
};

/**
 * GET /api/monitor/resources
 * Get current system resources
 */
router.get('/resources', (req, res) => {
  try {
    // Generate dynamic CPU usage
    const cpuUsage = 20 + Math.random() * 40; // 20-60%

    // Calculate memory usage
    const memTotal = 512 * 1024 * 1024; // 512MB
    const memUsed = mockProcesses.reduce((sum, p) => sum + p.memory, 0);
    const memAvailable = memTotal - memUsed;

    // Generate disk info (from file system - simplified)
    const disks = [
      {
        id: 'df0',
        name: 'Workbench3.1',
        used: 700 * 1024,
        total: 880 * 1024,
        free: 180 * 1024,
        percentage: 79.5,
        type: 'floppy'
      },
      {
        id: 'dh0',
        name: 'System',
        used: 450 * 1024 * 1024,
        total: 1024 * 1024 * 1024,
        free: 574 * 1024 * 1024,
        percentage: 43.9,
        type: 'hard'
      },
      {
        id: 'dh1',
        name: 'Work',
        used: 200 * 1024 * 1024,
        total: 512 * 1024 * 1024,
        free: 312 * 1024 * 1024,
        percentage: 39.1,
        type: 'hard'
      }
    ];

    // Update network stats with some activity
    networkStats.totalDownloaded += Math.random() * 1024 * 10; // 0-10KB
    networkStats.totalUploaded += Math.random() * 1024 * 5; // 0-5KB
    networkStats.connections = Math.floor(Math.random() * 10);

    const resources = {
      timestamp: Date.now(),
      cpu: {
        usage: cpuUsage,
        cores: 4,
        speed: 2400,
        model: 'Motorola 68040',
        loadAverage: [cpuUsage / 100, cpuUsage / 100, cpuUsage / 100]
      },
      memory: {
        used: memUsed,
        total: memTotal,
        available: memAvailable,
        percentage: (memUsed / memTotal) * 100,
        swap: {
          used: 0,
          total: 0,
          percentage: 0
        }
      },
      disks,
      network: {
        uploadSpeed: Math.random() * 1024 * 100, // 0-100KB/s
        downloadSpeed: Math.random() * 1024 * 500, // 0-500KB/s
        totalUploaded: networkStats.totalUploaded,
        totalDownloaded: networkStats.totalDownloaded,
        connections: networkStats.connections
      },
      processes: mockProcesses.map(p => ({
        ...p,
        cpu: p.cpu + (Math.random() - 0.5) * 2 // Slight variation
      }))
    };

    res.json(resources);
  } catch (error) {
    console.error('Get resources error:', error);
    res.status(500).json({ error: 'Failed to get system resources' });
  }
});

/**
 * GET /api/monitor/processes
 * Get list of running processes
 */
router.get('/processes', (req, res) => {
  try {
    res.json({ processes: mockProcesses });
  } catch (error) {
    console.error('Get processes error:', error);
    res.status(500).json({ error: 'Failed to get processes' });
  }
});

/**
 * GET /api/monitor/process/:pid
 * Get details for specific process
 */
router.get('/process/:pid', (req, res) => {
  try {
    const pid = parseInt(req.params.pid, 10);
    const process = mockProcesses.find(p => p.pid === pid);

    if (!process) {
      return res.status(404).json({ error: 'Process not found' });
    }

    res.json(process);
  } catch (error) {
    console.error('Get process error:', error);
    res.status(500).json({ error: 'Failed to get process' });
  }
});

/**
 * POST /api/monitor/process/:pid/kill
 * Kill a process
 */
router.post('/process/:pid/kill', (req, res) => {
  try {
    const pid = parseInt(req.params.pid, 10);
    const index = mockProcesses.findIndex(p => p.pid === pid);

    if (index === -1) {
      return res.status(404).json({ error: 'Process not found' });
    }

    // Don't allow killing system processes
    if (mockProcesses[index].user === 'system') {
      return res.status(403).json({ error: 'Cannot kill system process' });
    }

    mockProcesses.splice(index, 1);
    res.json({ success: true, message: `Process ${pid} killed` });
  } catch (error) {
    console.error('Kill process error:', error);
    res.status(500).json({ error: 'Failed to kill process' });
  }
});

/**
 * GET /api/monitor/disk/:id
 * Get disk usage for specific disk
 */
router.get('/disk/:id', (req, res) => {
  try {
    const diskId = req.params.id;

    // Mock disk data
    const diskData = {
      df0: {
        id: 'df0',
        name: 'Workbench3.1',
        used: 700 * 1024,
        total: 880 * 1024,
        free: 180 * 1024,
        percentage: 79.5,
        type: 'floppy'
      },
      dh0: {
        id: 'dh0',
        name: 'System',
        used: 450 * 1024 * 1024,
        total: 1024 * 1024 * 1024,
        free: 574 * 1024 * 1024,
        percentage: 43.9,
        type: 'hard'
      },
      dh1: {
        id: 'dh1',
        name: 'Work',
        used: 200 * 1024 * 1024,
        total: 512 * 1024 * 1024,
        free: 312 * 1024 * 1024,
        percentage: 39.1,
        type: 'hard'
      }
    };

    const disk = diskData[diskId];
    if (!disk) {
      return res.status(404).json({ error: 'Disk not found' });
    }

    res.json(disk);
  } catch (error) {
    console.error('Get disk error:', error);
    res.status(500).json({ error: 'Failed to get disk info' });
  }
});

/**
 * GET /api/monitor/disk/:id/analyze
 * Perform deep disk analysis
 */
router.get('/disk/:id/analyze', (req, res) => {
  try {
    const diskId = req.params.id;

    // Generate mock file structure
    const mockFileStructure = {
      items: [
        {
          name: 'Documents',
          type: 'folder',
          size: 50 * 1024 * 1024,
          modified: Date.now() - 86400000,
          items: [
            {
              name: 'Report.txt',
              type: 'file',
              size: 10 * 1024,
              modified: Date.now() - 86400000
            },
            {
              name: 'Presentation.awml',
              type: 'file',
              size: 25 * 1024,
              modified: Date.now() - 172800000
            },
            {
              name: 'Budget.txt',
              type: 'file',
              size: 5 * 1024,
              modified: Date.now() - 259200000
            }
          ]
        },
        {
          name: 'Pictures',
          type: 'folder',
          size: 120 * 1024 * 1024,
          modified: Date.now() - 172800000,
          items: [
            {
              name: 'Photo1.jpg',
              type: 'file',
              size: 2 * 1024 * 1024,
              modified: Date.now() - 259200000
            },
            {
              name: 'Photo2.jpg',
              type: 'file',
              size: 2.5 * 1024 * 1024,
              modified: Date.now() - 345600000
            },
            {
              name: 'Vacation',
              type: 'folder',
              size: 50 * 1024 * 1024,
              modified: Date.now() - 432000000,
              items: [
                {
                  name: 'Beach.jpg',
                  type: 'file',
                  size: 3 * 1024 * 1024,
                  modified: Date.now() - 432000000
                }
              ]
            }
          ]
        },
        {
          name: 'System',
          type: 'folder',
          size: 80 * 1024 * 1024,
          modified: Date.now() - 604800000,
          items: [
            {
              name: 'system.log',
              type: 'file',
              size: 10 * 1024 * 1024,
              modified: Date.now() - 3600000
            },
            {
              name: 'config.txt',
              type: 'file',
              size: 2 * 1024,
              modified: Date.now() - 604800000
            }
          ]
        },
        {
          name: 'Downloads',
          type: 'folder',
          size: 100 * 1024 * 1024,
          modified: Date.now() - 86400000,
          items: [
            {
              name: 'file.zip',
              type: 'file',
              size: 50 * 1024 * 1024,
              modified: Date.now() - 2592000000 // 30 days ago
            },
            {
              name: 'old.tmp',
              type: 'file',
              size: 1 * 1024 * 1024,
              modified: Date.now() - 2592000000
            }
          ]
        },
        {
          name: 'Cache',
          type: 'folder',
          size: 30 * 1024 * 1024,
          modified: Date.now() - 3600000,
          items: [
            {
              name: 'temp1.cache',
              type: 'file',
              size: 10 * 1024 * 1024,
              modified: Date.now() - 3600000
            },
            {
              name: 'temp2.cache',
              type: 'file',
              size: 10 * 1024 * 1024,
              modified: Date.now() - 7200000
            }
          ]
        }
      ]
    };

    res.json(mockFileStructure);
  } catch (error) {
    console.error('Disk analyze error:', error);
    res.status(500).json({ error: 'Failed to analyze disk' });
  }
});

/**
 * GET /api/monitor/disk/:id/breakdown
 * Get storage breakdown by file type
 */
router.get('/disk/:id/breakdown', (req, res) => {
  try {
    const breakdown = {
      breakdown: {
        'jpg': 120 * 1024 * 1024,
        'txt': 50 * 1024 * 1024,
        'awml': 40 * 1024 * 1024,
        'log': 30 * 1024 * 1024,
        'zip': 20 * 1024 * 1024,
        'cache': 20 * 1024 * 1024,
        'tmp': 10 * 1024 * 1024,
        'other': 10 * 1024 * 1024
      }
    };

    res.json(breakdown);
  } catch (error) {
    console.error('Get breakdown error:', error);
    res.status(500).json({ error: 'Failed to get storage breakdown' });
  }
});

/**
 * GET /api/monitor/storage/breakdown
 * Get overall storage breakdown across all disks
 */
router.get('/storage/breakdown', (req, res) => {
  try {
    const breakdown = {
      breakdown: {
        'Documents': 50 * 1024 * 1024,
        'Images': 120 * 1024 * 1024,
        'Videos': 250 * 1024 * 1024,
        'Audio': 80 * 1024 * 1024,
        'Archives': 40 * 1024 * 1024,
        'Code': 30 * 1024 * 1024,
        'Other': 20 * 1024 * 1024
      }
    };

    res.json(breakdown);
  } catch (error) {
    console.error('Get storage breakdown error:', error);
    res.status(500).json({ error: 'Failed to get storage breakdown' });
  }
});

/**
 * POST /api/monitor/cleanup
 * Execute cleanup operation
 */
router.post('/cleanup', (req, res) => {
  try {
    const { suggestionId, type, items, action } = req.body;

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Invalid items list' });
    }

    // Simulate cleanup operation
    const itemsProcessed = items.length;
    const itemsFailed = 0;

    // Calculate freed space (mock calculation)
    let freedSpace = 0;
    items.forEach(item => {
      // Extract size from path or use default
      freedSpace += Math.random() * 1024 * 1024 * 10; // 0-10MB per item
    });

    const result = {
      success: true,
      freedSpace: Math.floor(freedSpace),
      itemsProcessed,
      itemsFailed,
      errors: []
    };

    res.json(result);
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({
      success: false,
      freedSpace: 0,
      itemsProcessed: 0,
      itemsFailed: 0,
      errors: ['Cleanup operation failed']
    });
  }
});

/**
 * GET /api/monitor/suggestions
 * Get optimization suggestions
 */
router.get('/suggestions', (req, res) => {
  try {
    const suggestions = [
      {
        id: 'temp-files-' + Date.now(),
        type: 'temp-files',
        severity: 'medium',
        title: '15 Temporary Files Found',
        description: 'Found 15 temporary files (.tmp, .cache) that can be safely deleted.',
        potentialSavings: 30 * 1024 * 1024,
        affectedItems: [
          'dh0/Cache/temp1.cache',
          'dh0/Cache/temp2.cache',
          'dh0/Downloads/old.tmp'
        ],
        action: {
          type: 'delete',
          label: 'Delete Temp Files',
          description: 'Remove all temporary files'
        },
        autoFixable: true,
        createdAt: Date.now()
      },
      {
        id: 'old-downloads-' + Date.now(),
        type: 'old-downloads',
        severity: 'low',
        title: '2 Old Downloads',
        description: 'Found 2 files in Downloads older than 30 days.',
        potentialSavings: 51 * 1024 * 1024,
        affectedItems: [
          'dh0/Downloads/file.zip'
        ],
        action: {
          type: 'delete',
          label: 'Clean Old Downloads',
          description: 'Remove old files from Downloads folder'
        },
        autoFixable: false,
        createdAt: Date.now()
      },
      {
        id: 'large-logs-' + Date.now(),
        type: 'large-logs',
        severity: 'medium',
        title: '1 Large Log File',
        description: 'Found 1 log file larger than 5MB that can be archived or deleted.',
        potentialSavings: 10 * 1024 * 1024,
        affectedItems: [
          'dh0/System/system.log'
        ],
        action: {
          type: 'compress',
          label: 'Archive Log',
          description: 'Compress old log file'
        },
        autoFixable: true,
        createdAt: Date.now()
      }
    ];

    res.json({ suggestions });
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
});

module.exports = router;

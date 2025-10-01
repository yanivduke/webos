/*
 * System Status Controller
 * Handles requests for system status information
 */

import { Request, Response } from 'express';

// Mock system status data (in a real implementation, this would come from actual system calls)
const getSystemStatus = (req: Request, res: Response) => {
  try {
    const systemStatus = {
      timestamp: new Date().toISOString(),
      uptime: '12h 34m 56s',
      memory: {
        total: '16GB',
        used: '4.2GB',
        free: '11.8GB'
      },
      cpu: {
        usage: '23%',
        temperature: '35°C'
      },
      disk: {
        total: '500GB',
        used: '150GB',
        free: '350GB'
      },
      network: {
        up: '1.2 Mbps',
        down: '0.8 Mbps'
      },
      activeApplications: [
        { name: 'Web Browser', pid: 1234, memory: '1.5GB' },
        { name: 'Terminal', pid: 5678, memory: '0.8GB' }
      ]
    };

    res.status(200).json({
      success: true,
      data: systemStatus
    });
  } catch (error) {
    console.error('Error retrieving system status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve system status'
    });
  }
};

export { getSystemStatus };
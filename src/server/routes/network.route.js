const express = require('express');
const router = express.Router();
const net = require('net');
const dns = require('dns').promises;
const http = require('http');
const https = require('https');
const { URL } = require('url');

// Session storage for persistent connections (telnet, ftp)
const sessions = new Map();

// Helper function to generate session IDs
function generateSessionId() {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================
// TELNET ENDPOINTS
// ============================================================

/**
 * Connect to a telnet server
 * POST /api/network/telnet/connect
 * Body: { host, port }
 */
router.post('/telnet/connect', async (req, res) => {
  try {
    const { host, port = 23 } = req.body;

    if (!host) {
      return res.status(400).json({ error: 'Host is required' });
    }

    const sessionId = generateSessionId();
    const socket = new net.Socket();
    const buffer = [];

    socket.connect(port, host, () => {
      console.log(`Telnet connected to ${host}:${port}`);
    });

    socket.on('data', (data) => {
      buffer.push(data.toString());
    });

    socket.on('error', (error) => {
      console.error('Telnet error:', error);
      sessions.delete(sessionId);
    });

    socket.on('close', () => {
      console.log('Telnet connection closed');
      sessions.delete(sessionId);
    });

    sessions.set(sessionId, { socket, buffer, type: 'telnet' });

    // Wait a bit for initial server response
    setTimeout(() => {
      res.json({ sessionId, message: 'Connected successfully' });
    }, 500);

  } catch (error) {
    console.error('Telnet connect error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Send data to telnet session
 * POST /api/network/telnet/send
 * Body: { sessionId, data }
 */
router.post('/telnet/send', async (req, res) => {
  try {
    const { sessionId, data } = req.body;

    if (!sessionId || !data) {
      return res.status(400).json({ error: 'Session ID and data are required' });
    }

    const session = sessions.get(sessionId);
    if (!session || session.type !== 'telnet') {
      return res.status(404).json({ error: 'Session not found' });
    }

    session.socket.write(data);
    res.json({ success: true });

  } catch (error) {
    console.error('Telnet send error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Receive data from telnet session
 * GET /api/network/telnet/receive/:sessionId
 */
router.get('/telnet/receive/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = sessions.get(sessionId);
    if (!session || session.type !== 'telnet') {
      return res.status(404).json({ error: 'Session not found' });
    }

    const data = session.buffer.join('');
    session.buffer.length = 0; // Clear buffer

    res.json({ data });

  } catch (error) {
    console.error('Telnet receive error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Disconnect telnet session
 * POST /api/network/telnet/disconnect/:sessionId
 */
router.post('/telnet/disconnect/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = sessions.get(sessionId);
    if (session && session.type === 'telnet') {
      session.socket.destroy();
      sessions.delete(sessionId);
    }

    res.json({ success: true });

  } catch (error) {
    console.error('Telnet disconnect error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// FTP ENDPOINTS (Simplified - Using basic FTP protocol)
// ============================================================

router.post('/ftp/connect', async (req, res) => {
  res.status(501).json({
    error: 'FTP support requires additional dependencies',
    message: 'Please install ftp or basic-ftp package to enable FTP functionality'
  });
});

router.post('/ftp/disconnect/:sessionId', async (req, res) => {
  res.json({ success: true });
});

router.post('/ftp/list', async (req, res) => {
  res.status(501).json({ error: 'FTP not implemented - requires ftp package' });
});

router.post('/ftp/download', async (req, res) => {
  res.status(501).json({ error: 'FTP not implemented - requires ftp package' });
});

// ============================================================
// GOPHER ENDPOINTS
// ============================================================

/**
 * Fetch gopher content
 * POST /api/network/gopher/fetch
 * Body: { url }
 */
router.post('/gopher/fetch', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url || !url.startsWith('gopher://')) {
      return res.status(400).json({ error: 'Valid gopher:// URL required' });
    }

    // Parse gopher URL
    const urlObj = new URL(url);
    const host = urlObj.hostname;
    const port = urlObj.port || 70;
    const path = urlObj.pathname || '/';

    // Extract gopher type and selector
    let gopherType = '1'; // Default to directory
    let selector = path.slice(1); // Remove leading slash

    if (path.length > 1 && path[1]) {
      gopherType = path[1];
      selector = path.slice(2);
    }

    // Connect to gopher server
    const socket = new net.Socket();
    let data = '';

    await new Promise((resolve, reject) => {
      socket.setTimeout(10000);

      socket.connect(port, host, () => {
        // Send selector
        socket.write(selector + '\r\n');
      });

      socket.on('data', (chunk) => {
        data += chunk.toString();
      });

      socket.on('end', () => {
        socket.destroy();
        resolve();
      });

      socket.on('error', (error) => {
        socket.destroy();
        reject(error);
      });

      socket.on('timeout', () => {
        socket.destroy();
        reject(new Error('Connection timeout'));
      });
    });

    // Parse gopher response
    if (gopherType === '1' || gopherType === '7') {
      // Directory/Menu
      const items = [];
      const lines = data.split('\n');

      for (const line of lines) {
        if (!line || line === '.' || line === '.\r') break;
        if (line.length < 2) continue;

        const type = line[0];
        const rest = line.slice(1).split('\t');

        if (rest.length >= 3) {
          items.push({
            type: type,
            display: rest[0],
            selector: rest[1],
            host: rest[2],
            port: parseInt(rest[3]) || 70
          });
        }
      }

      res.json({ type: 'menu', items });

    } else if (gopherType === '0') {
      // Text file
      res.json({ type: 'text', content: data });
    } else {
      // Binary data
      res.json({ type: 'binary', content: data });
    }

  } catch (error) {
    console.error('Gopher fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// NETWORK DIAGNOSTIC ENDPOINTS
// ============================================================

/**
 * Ping a host
 * POST /api/network/ping
 * Body: { host, count }
 */
router.post('/ping', async (req, res) => {
  try {
    const { host, count = 4 } = req.body;

    if (!host) {
      return res.status(400).json({ error: 'Host is required' });
    }

    // Simple ping implementation using TCP connection attempt
    const results = [];
    let received = 0;

    for (let i = 0; i < count; i++) {
      const start = Date.now();
      try {
        await new Promise((resolve, reject) => {
          const socket = new net.Socket();
          socket.setTimeout(3000);

          socket.connect(80, host, () => {
            const time = Date.now() - start;
            socket.destroy();
            results.push({ host, alive: true, time });
            received++;
            resolve();
          });

          socket.on('error', () => {
            socket.destroy();
            results.push({ host, alive: false });
            resolve();
          });

          socket.on('timeout', () => {
            socket.destroy();
            results.push({ host, alive: false });
            resolve();
          });
        });
      } catch (error) {
        results.push({ host, alive: false });
      }
    }

    const avgTime = received > 0
      ? Math.round(results.filter(r => r.alive).reduce((sum, r) => sum + r.time, 0) / received)
      : 0;

    res.json({
      results,
      summary: {
        sent: count,
        received,
        lost: count - received,
        avgTime
      }
    });

  } catch (error) {
    console.error('Ping error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DNS lookup
 * POST /api/network/dns
 * Body: { hostname }
 */
router.post('/dns', async (req, res) => {
  try {
    const { hostname } = req.body;

    if (!hostname) {
      return res.status(400).json({ error: 'Hostname is required' });
    }

    const results = {};

    try {
      results.addresses = await dns.resolve4(hostname);
    } catch (e) {
      results.addresses = [];
    }

    try {
      results.addresses6 = await dns.resolve6(hostname);
    } catch (e) {
      results.addresses6 = [];
    }

    try {
      results.mx = await dns.resolveMx(hostname);
    } catch (e) {
      results.mx = [];
    }

    try {
      results.txt = await dns.resolveTxt(hostname);
      results.txt = results.txt.map(record => record.join(''));
    } catch (e) {
      results.txt = [];
    }

    res.json(results);

  } catch (error) {
    console.error('DNS lookup error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Traceroute (simplified)
 * POST /api/network/traceroute
 * Body: { host }
 */
router.post('/traceroute', async (req, res) => {
  try {
    const { host } = req.body;

    if (!host) {
      return res.status(400).json({ error: 'Host is required' });
    }

    // This is a simplified traceroute - real implementation would need raw sockets
    // For now, we'll just do DNS resolution and a single hop test
    const hops = [];

    try {
      const addresses = await dns.resolve4(host);
      hops.push({
        hop: 1,
        ip: addresses[0],
        host: host,
        time: 1
      });
    } catch (error) {
      hops.push({
        hop: 1,
        error: 'Could not resolve host'
      });
    }

    res.json({
      hops,
      note: 'Traceroute requires elevated privileges - showing simplified results'
    });

  } catch (error) {
    console.error('Traceroute error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * WHOIS lookup
 * POST /api/network/whois
 * Body: { domain }
 */
router.post('/whois', async (req, res) => {
  try {
    const { domain } = req.body;

    if (!domain) {
      return res.status(400).json({ error: 'Domain is required' });
    }

    // WHOIS would require additional package (node-whois)
    res.json({
      whois: `WHOIS information for ${domain}\n\nWHOIS functionality requires additional package installation.\nPlease install 'node-whois' to enable full WHOIS lookups.`,
      note: 'WHOIS package not installed'
    });

  } catch (error) {
    console.error('WHOIS error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Port scan
 * POST /api/network/portscan
 * Body: { host, ports }
 */
router.post('/portscan', async (req, res) => {
  try {
    const { host, ports } = req.body;

    if (!host || !ports || !Array.isArray(ports)) {
      return res.status(400).json({ error: 'Host and ports array are required' });
    }

    const results = [];

    for (const port of ports.slice(0, 100)) { // Limit to 100 ports
      try {
        const isOpen = await new Promise((resolve) => {
          const socket = new net.Socket();
          socket.setTimeout(2000);

          socket.connect(port, host, () => {
            socket.destroy();
            resolve(true);
          });

          socket.on('error', () => {
            socket.destroy();
            resolve(false);
          });

          socket.on('timeout', () => {
            socket.destroy();
            resolve(false);
          });
        });

        results.push({
          port,
          open: isOpen,
          service: getServiceName(port)
        });

      } catch (error) {
        results.push({ port, open: false });
      }
    }

    res.json({ results });

  } catch (error) {
    console.error('Port scan error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * HTTP test
 * POST /api/network/http-test
 * Body: { url }
 */
router.post('/http-test', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    const startTime = Date.now();

    const result = await new Promise((resolve, reject) => {
      const request = protocol.get(url, (response) => {
        const responseTime = Date.now() - startTime;

        resolve({
          statusCode: response.statusCode,
          statusMessage: response.statusMessage,
          headers: response.headers,
          responseTime,
          redirects: []
        });

        response.resume(); // Consume response data
      });

      request.on('error', reject);
      request.setTimeout(10000, () => {
        request.destroy();
        reject(new Error('Request timeout'));
      });
    });

    res.json(result);

  } catch (error) {
    console.error('HTTP test error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function getServiceName(port) {
  const services = {
    20: 'FTP-DATA',
    21: 'FTP',
    22: 'SSH',
    23: 'Telnet',
    25: 'SMTP',
    53: 'DNS',
    70: 'Gopher',
    80: 'HTTP',
    110: 'POP3',
    143: 'IMAP',
    443: 'HTTPS',
    3306: 'MySQL',
    5432: 'PostgreSQL',
    6379: 'Redis',
    8080: 'HTTP-Alt',
    27017: 'MongoDB'
  };
  return services[port] || '';
}

// Cleanup old sessions periodically
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of sessions.entries()) {
    // Remove sessions older than 1 hour
    if (now - parseInt(sessionId.split('-')[1]) > 3600000) {
      if (session.socket) {
        session.socket.destroy();
      }
      sessions.delete(sessionId);
    }
  }
}, 600000); // Every 10 minutes

module.exports = router;

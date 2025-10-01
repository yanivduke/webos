const WebSocket = require('ws');
const FileWatcher = require('./file-watcher');
const path = require('path');

/**
 * WebSocket Server for real-time updates
 */
class WebSocketServer {
  constructor(server) {
    this.wss = new WebSocket.Server({ server, path: '/ws' });
    this.clients = new Map();
    this.fileWatcher = new FileWatcher(path.join(__dirname, '../storage/workbench'));

    this.setupFileWatcher();
    this.setupWebSocketServer();
  }

  /**
   * Setup file watcher event handlers
   */
  setupFileWatcher() {
    // Watch default directories
    this.fileWatcher.watchDirectory('df0');
    this.fileWatcher.watchDirectory('dh0');
    this.fileWatcher.watchDirectory('dh1');
    this.fileWatcher.watchDirectory('ram');
    this.fileWatcher.watchDirectory('trash');

    // Listen for file changes
    this.fileWatcher.on('change', (event) => {
      this.broadcast({
        type: 'file-change',
        data: event
      });
    });
  }

  /**
   * Setup WebSocket server
   */
  setupWebSocketServer() {
    this.wss.on('connection', (ws, req) => {
      const clientId = this.generateClientId();
      const clientInfo = {
        id: clientId,
        ws: ws,
        subscriptions: new Set(),
        connected: new Date().toISOString()
      };

      this.clients.set(clientId, clientInfo);
      console.log(`WebSocket client connected: ${clientId}`);

      // Send welcome message
      this.send(ws, {
        type: 'connected',
        data: {
          clientId: clientId,
          timestamp: new Date().toISOString()
        }
      });

      // Handle messages from client
      ws.on('message', (message) => {
        this.handleMessage(clientId, message);
      });

      // Handle client disconnect
      ws.on('close', () => {
        console.log(`WebSocket client disconnected: ${clientId}`);
        this.clients.delete(clientId);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error(`WebSocket error for client ${clientId}:`, error);
      });
    });

    console.log('WebSocket server initialized');
  }

  /**
   * Handle incoming messages from clients
   */
  handleMessage(clientId, message) {
    try {
      const data = JSON.parse(message);
      const client = this.clients.get(clientId);

      if (!client) return;

      switch (data.type) {
        case 'subscribe':
          // Subscribe to specific path updates
          if (data.path) {
            client.subscriptions.add(data.path);
            this.send(client.ws, {
              type: 'subscribed',
              data: { path: data.path }
            });
          }
          break;

        case 'unsubscribe':
          // Unsubscribe from path updates
          if (data.path) {
            client.subscriptions.delete(data.path);
            this.send(client.ws, {
              type: 'unsubscribed',
              data: { path: data.path }
            });
          }
          break;

        case 'ping':
          // Respond to ping
          this.send(client.ws, {
            type: 'pong',
            data: { timestamp: new Date().toISOString() }
          });
          break;

        default:
          console.log(`Unknown message type from ${clientId}:`, data.type);
      }
    } catch (error) {
      console.error(`Failed to handle message from ${clientId}:`, error);
    }
  }

  /**
   * Send message to a specific client
   */
  send(ws, message) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Broadcast message to all connected clients
   */
  broadcast(message, filter = null) {
    for (const [clientId, client] of this.clients.entries()) {
      // Apply filter if provided
      if (filter && !filter(client)) continue;

      this.send(client.ws, message);
    }
  }

  /**
   * Broadcast to clients subscribed to a specific path
   */
  broadcastToSubscribers(path, message) {
    this.broadcast(message, (client) => {
      return client.subscriptions.has(path) || client.subscriptions.has('*');
    });
  }

  /**
   * Generate unique client ID
   */
  generateClientId() {
    return `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get connected clients count
   */
  getClientCount() {
    return this.clients.size;
  }

  /**
   * Close all connections and cleanup
   */
  close() {
    this.fileWatcher.unwatchAll();
    this.wss.close();
    console.log('WebSocket server closed');
  }
}

module.exports = WebSocketServer;

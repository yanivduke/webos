/**
 * Network Browser Utility
 * Manages network connections, bookmarks, and file transfers
 */

export type NetworkProtocol = 'ftp' | 'sftp' | 'webdav' | 'http';

export interface NetworkConnection {
  id: string;
  protocol: NetworkProtocol;
  host: string;
  port: number;
  username?: string;
  password?: string;
  path?: string;
  name?: string;
  lastConnected?: Date;
}

export interface NetworkBookmark extends NetworkConnection {
  name: string;
  favorite: boolean;
}

export interface NetworkFile {
  name: string;
  path: string;
  size: number;
  modified: Date;
  isDirectory: boolean;
  permissions?: string;
  owner?: string;
}

export interface TransferItem {
  id: string;
  filename: string;
  source: string;
  destination: string;
  size: number;
  transferred: number;
  progress: number;
  speed: number;
  timeRemaining: number;
  status: 'pending' | 'active' | 'paused' | 'completed' | 'failed' | 'cancelled';
  error?: string;
  startTime?: Date;
  endTime?: Date;
  direction: 'upload' | 'download';
}

export interface ConnectionHistory {
  connection: NetworkConnection;
  timestamp: Date;
  success: boolean;
}

class NetworkBrowserManager {
  private bookmarks: NetworkBookmark[] = [];
  private connectionHistory: ConnectionHistory[] = [];
  private activeConnections: Map<string, NetworkConnection> = new Map();
  private transferQueue: TransferItem[] = [];
  private activeTransfers: Set<string> = new Set();
  private maxConcurrentTransfers = 3;
  private subscribers: Array<() => void> = [];
  private encryptionKey = 'webos-network-browser-key'; // Simple XOR encryption

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Simple XOR encryption/decryption for passwords
   */
  private encryptPassword(password: string): string {
    let encrypted = '';
    for (let i = 0; i < password.length; i++) {
      encrypted += String.fromCharCode(
        password.charCodeAt(i) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length)
      );
    }
    return btoa(encrypted);
  }

  private decryptPassword(encrypted: string): string {
    try {
      const decoded = atob(encrypted);
      let decrypted = '';
      for (let i = 0; i < decoded.length; i++) {
        decrypted += String.fromCharCode(
          decoded.charCodeAt(i) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length)
        );
      }
      return decrypted;
    } catch {
      return '';
    }
  }

  /**
   * Get default port for protocol
   */
  getDefaultPort(protocol: NetworkProtocol): number {
    const ports = {
      ftp: 21,
      sftp: 22,
      webdav: 443,
      http: 80
    };
    return ports[protocol] || 21;
  }

  /**
   * Test connection to server
   */
  async testConnection(connection: NetworkConnection): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch('/api/network/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(connection)
      });

      const result = await response.json();

      if (response.ok) {
        return { success: true, message: 'Connection successful' };
      } else {
        return { success: false, message: result.error || 'Connection failed' };
      }
    } catch (error) {
      return { success: false, message: `Connection error: ${error}` };
    }
  }

  /**
   * Connect to remote server
   */
  async connect(connection: NetworkConnection): Promise<{ success: boolean; message: string }> {
    // Validate connection
    if (!connection.host) {
      return { success: false, message: 'Host is required' };
    }

    // Security check: warn for unencrypted connections
    if (connection.protocol === 'http' && !connection.host.startsWith('https://')) {
      console.warn('Warning: Unencrypted connection');
    }

    const result = await this.testConnection(connection);

    if (result.success) {
      // Store active connection
      this.activeConnections.set(connection.id, connection);

      // Add to connection history
      this.addToHistory(connection, true);

      this.notifySubscribers();
    } else {
      this.addToHistory(connection, false);
    }

    return result;
  }

  /**
   * Disconnect from server
   */
  async disconnect(connectionId: string): Promise<void> {
    this.activeConnections.delete(connectionId);
    this.notifySubscribers();
  }

  /**
   * List remote files
   */
  async listRemoteFiles(connectionId: string, remotePath: string = '/'): Promise<NetworkFile[]> {
    const connection = this.activeConnections.get(connectionId);
    if (!connection) {
      throw new Error('Not connected');
    }

    try {
      const response = await fetch(`/api/network/list?path=${encodeURIComponent(remotePath)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(connection)
      });

      if (!response.ok) {
        throw new Error('Failed to list files');
      }

      const data = await response.json();
      return data.files || [];
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  }

  /**
   * Upload file to remote server
   */
  async uploadFile(
    connectionId: string,
    localPath: string,
    remotePath: string,
    fileContent: Blob
  ): Promise<string> {
    const connection = this.activeConnections.get(connectionId);
    if (!connection) {
      throw new Error('Not connected');
    }

    // Create transfer item
    const transferId = `upload-${Date.now()}-${Math.random()}`;
    const transferItem: TransferItem = {
      id: transferId,
      filename: localPath.split('/').pop() || 'file',
      source: localPath,
      destination: remotePath,
      size: fileContent.size,
      transferred: 0,
      progress: 0,
      speed: 0,
      timeRemaining: 0,
      status: 'pending',
      direction: 'upload'
    };

    this.transferQueue.push(transferItem);
    this.notifySubscribers();

    // Start transfer
    this.processTransferQueue();

    return transferId;
  }

  /**
   * Download file from remote server
   */
  async downloadFile(
    connectionId: string,
    remotePath: string,
    localPath: string
  ): Promise<string> {
    const connection = this.activeConnections.get(connectionId);
    if (!connection) {
      throw new Error('Not connected');
    }

    // Create transfer item
    const transferId = `download-${Date.now()}-${Math.random()}`;
    const transferItem: TransferItem = {
      id: transferId,
      filename: remotePath.split('/').pop() || 'file',
      source: remotePath,
      destination: localPath,
      size: 0, // Will be set when download starts
      transferred: 0,
      progress: 0,
      speed: 0,
      timeRemaining: 0,
      status: 'pending',
      direction: 'download'
    };

    this.transferQueue.push(transferItem);
    this.notifySubscribers();

    // Start transfer
    this.processTransferQueue();

    return transferId;
  }

  /**
   * Process transfer queue
   */
  private async processTransferQueue(): Promise<void> {
    // Start transfers up to max concurrent
    while (this.activeTransfers.size < this.maxConcurrentTransfers) {
      const pendingTransfer = this.transferQueue.find(t => t.status === 'pending');
      if (!pendingTransfer) break;

      this.activeTransfers.add(pendingTransfer.id);
      pendingTransfer.status = 'active';
      pendingTransfer.startTime = new Date();

      // Process transfer
      if (pendingTransfer.direction === 'upload') {
        this.executeUpload(pendingTransfer);
      } else {
        this.executeDownload(pendingTransfer);
      }
    }
  }

  /**
   * Execute upload
   */
  private async executeUpload(transfer: TransferItem): Promise<void> {
    try {
      // Simulate upload with progress
      const chunkSize = 64 * 1024; // 64KB chunks
      const totalChunks = Math.ceil(transfer.size / chunkSize);

      for (let i = 0; i < totalChunks; i++) {
        if (transfer.status === 'cancelled') break;
        if (transfer.status === 'paused') {
          await new Promise(resolve => setTimeout(resolve, 100));
          i--;
          continue;
        }

        // Simulate chunk upload
        await new Promise(resolve => setTimeout(resolve, 50));

        transfer.transferred = Math.min((i + 1) * chunkSize, transfer.size);
        transfer.progress = (transfer.transferred / transfer.size) * 100;

        // Calculate speed and time remaining
        const elapsed = (Date.now() - transfer.startTime!.getTime()) / 1000;
        transfer.speed = elapsed > 0 ? transfer.transferred / elapsed : 0;
        transfer.timeRemaining = transfer.speed > 0
          ? (transfer.size - transfer.transferred) / transfer.speed
          : 0;

        this.notifySubscribers();
      }

      if (transfer.status !== 'cancelled') {
        transfer.status = 'completed';
        transfer.progress = 100;
        transfer.transferred = transfer.size;
        transfer.endTime = new Date();
      }

    } catch (error) {
      transfer.status = 'failed';
      transfer.error = `Upload failed: ${error}`;
    } finally {
      this.activeTransfers.delete(transfer.id);
      this.notifySubscribers();
      this.processTransferQueue();
    }
  }

  /**
   * Execute download
   */
  private async executeDownload(transfer: TransferItem): Promise<void> {
    try {
      // Simulate download with progress
      const chunkSize = 64 * 1024; // 64KB chunks
      const simulatedSize = 1024 * 1024; // 1MB default
      transfer.size = simulatedSize;
      const totalChunks = Math.ceil(transfer.size / chunkSize);

      for (let i = 0; i < totalChunks; i++) {
        if (transfer.status === 'cancelled') break;
        if (transfer.status === 'paused') {
          await new Promise(resolve => setTimeout(resolve, 100));
          i--;
          continue;
        }

        // Simulate chunk download
        await new Promise(resolve => setTimeout(resolve, 50));

        transfer.transferred = Math.min((i + 1) * chunkSize, transfer.size);
        transfer.progress = (transfer.transferred / transfer.size) * 100;

        // Calculate speed and time remaining
        const elapsed = (Date.now() - transfer.startTime!.getTime()) / 1000;
        transfer.speed = elapsed > 0 ? transfer.transferred / elapsed : 0;
        transfer.timeRemaining = transfer.speed > 0
          ? (transfer.size - transfer.transferred) / transfer.speed
          : 0;

        this.notifySubscribers();
      }

      if (transfer.status !== 'cancelled') {
        transfer.status = 'completed';
        transfer.progress = 100;
        transfer.transferred = transfer.size;
        transfer.endTime = new Date();
      }

    } catch (error) {
      transfer.status = 'failed';
      transfer.error = `Download failed: ${error}`;
    } finally {
      this.activeTransfers.delete(transfer.id);
      this.notifySubscribers();
      this.processTransferQueue();
    }
  }

  /**
   * Pause transfer
   */
  pauseTransfer(transferId: string): void {
    const transfer = this.transferQueue.find(t => t.id === transferId);
    if (transfer && transfer.status === 'active') {
      transfer.status = 'paused';
      this.notifySubscribers();
    }
  }

  /**
   * Resume transfer
   */
  resumeTransfer(transferId: string): void {
    const transfer = this.transferQueue.find(t => t.id === transferId);
    if (transfer && transfer.status === 'paused') {
      transfer.status = 'active';
      this.notifySubscribers();
      this.processTransferQueue();
    }
  }

  /**
   * Cancel transfer
   */
  cancelTransfer(transferId: string): void {
    const transfer = this.transferQueue.find(t => t.id === transferId);
    if (transfer) {
      transfer.status = 'cancelled';
      this.activeTransfers.delete(transferId);
      this.notifySubscribers();
      this.processTransferQueue();
    }
  }

  /**
   * Get all transfers
   */
  getTransfers(): TransferItem[] {
    return this.transferQueue;
  }

  /**
   * Clear completed transfers
   */
  clearCompletedTransfers(): void {
    this.transferQueue = this.transferQueue.filter(
      t => t.status !== 'completed' && t.status !== 'cancelled' && t.status !== 'failed'
    );
    this.notifySubscribers();
  }

  /**
   * Bookmark management
   */
  addBookmark(connection: NetworkConnection, name: string, favorite: boolean = false): void {
    const bookmark: NetworkBookmark = {
      ...connection,
      id: `bookmark-${Date.now()}`,
      name,
      favorite,
      password: connection.password ? this.encryptPassword(connection.password) : undefined
    };

    this.bookmarks.push(bookmark);
    this.saveToStorage();
    this.notifySubscribers();
  }

  removeBookmark(bookmarkId: string): void {
    this.bookmarks = this.bookmarks.filter(b => b.id !== bookmarkId);
    this.saveToStorage();
    this.notifySubscribers();
  }

  updateBookmark(bookmarkId: string, updates: Partial<NetworkBookmark>): void {
    const bookmark = this.bookmarks.find(b => b.id === bookmarkId);
    if (bookmark) {
      Object.assign(bookmark, updates);
      if (updates.password) {
        bookmark.password = this.encryptPassword(updates.password);
      }
      this.saveToStorage();
      this.notifySubscribers();
    }
  }

  getBookmarks(): NetworkBookmark[] {
    return this.bookmarks.map(b => ({
      ...b,
      password: b.password ? this.decryptPassword(b.password) : undefined
    }));
  }

  /**
   * Connection history
   */
  private addToHistory(connection: NetworkConnection, success: boolean): void {
    this.connectionHistory.unshift({
      connection: { ...connection, password: undefined }, // Don't store password in history
      timestamp: new Date(),
      success
    });

    // Keep only last 20 connections
    if (this.connectionHistory.length > 20) {
      this.connectionHistory = this.connectionHistory.slice(0, 20);
    }

    this.saveToStorage();
  }

  getConnectionHistory(): ConnectionHistory[] {
    return this.connectionHistory;
  }

  /**
   * Active connections
   */
  getActiveConnections(): NetworkConnection[] {
    return Array.from(this.activeConnections.values());
  }

  isConnected(connectionId: string): boolean {
    return this.activeConnections.has(connectionId);
  }

  /**
   * Storage persistence
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem('webos-network-bookmarks', JSON.stringify(this.bookmarks));
      localStorage.setItem('webos-network-history', JSON.stringify(this.connectionHistory));
    } catch (error) {
      console.error('Failed to save to storage:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const bookmarks = localStorage.getItem('webos-network-bookmarks');
      if (bookmarks) {
        this.bookmarks = JSON.parse(bookmarks);
      }

      const history = localStorage.getItem('webos-network-history');
      if (history) {
        this.connectionHistory = JSON.parse(history);
      }
    } catch (error) {
      console.error('Failed to load from storage:', error);
    }
  }

  /**
   * Subscribers
   */
  subscribe(callback: () => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback());
  }
}

// Singleton instance
const networkBrowser = new NetworkBrowserManager();
export default networkBrowser;

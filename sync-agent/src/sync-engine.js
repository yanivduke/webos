const EventEmitter = require('events');
const chokidar = require('chokidar');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

/**
 * Sync Engine - handles file synchronization between local and WebOS cloud
 */
class SyncEngine extends EventEmitter {
  constructor(configManager, authManager) {
    super();
    this.configManager = configManager;
    this.authManager = authManager;
    this.watcher = null;
    this.syncInterval = null;
    this.isRunning = false;
    this.isPaused = false;
    this.syncInProgress = false;
    this.fileHashes = new Map();
    this.syncQueue = [];
  }

  /**
   * Start the sync engine
   */
  async start() {
    if (this.isRunning) {
      return;
    }

    const config = this.configManager.getConfig();

    if (!config.authToken || !config.serverUrl) {
      throw new Error('Not authenticated. Please login first.');
    }

    if (!config.syncFolder) {
      throw new Error('Sync folder not configured.');
    }

    // Ensure sync folder exists
    try {
      await fs.mkdir(config.syncFolder, { recursive: true });
    } catch (error) {
      throw new Error(`Cannot create sync folder: ${error.message}`);
    }

    this.isRunning = true;
    this.isPaused = false;

    // Start file watcher
    this.startWatcher();

    // Perform initial sync
    await this.syncNow();

    // Start periodic sync
    this.syncInterval = setInterval(() => {
      if (!this.isPaused && !this.syncInProgress) {
        this.syncNow().catch(err => {
          console.error('Periodic sync error:', err);
        });
      }
    }, config.syncInterval || 30000);

    console.log('Sync engine started');
  }

  /**
   * Stop the sync engine
   */
  async stop() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    // Stop watcher
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }

    // Stop periodic sync
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    console.log('Sync engine stopped');
  }

  /**
   * Pause sync
   */
  pause() {
    this.isPaused = true;
    console.log('Sync paused');
  }

  /**
   * Resume sync
   */
  resume() {
    this.isPaused = false;
    console.log('Sync resumed');
  }

  /**
   * Start file watcher
   */
  startWatcher() {
    const config = this.configManager.getConfig();

    this.watcher = chokidar.watch(config.syncFolder, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 100
      }
    });

    this.watcher
      .on('add', (filePath) => this.onFileAdded(filePath))
      .on('change', (filePath) => this.onFileChanged(filePath))
      .on('unlink', (filePath) => this.onFileDeleted(filePath))
      .on('addDir', (dirPath) => this.onFolderAdded(dirPath))
      .on('unlinkDir', (dirPath) => this.onFolderDeleted(dirPath))
      .on('error', (error) => {
        console.error('Watcher error:', error);
        this.emit('sync-error', error);
      });
  }

  /**
   * Handle file added
   */
  async onFileAdded(filePath) {
    if (this.isPaused || this.syncInProgress) return;

    try {
      this.emit('file-changed', { type: 'add', path: filePath });
      await this.uploadFile(filePath);
    } catch (error) {
      console.error('Error uploading file:', error);
      this.emit('sync-error', error);
    }
  }

  /**
   * Handle file changed
   */
  async onFileChanged(filePath) {
    if (this.isPaused || this.syncInProgress) return;

    try {
      // Check if file actually changed using hash
      const currentHash = await this.calculateFileHash(filePath);
      const previousHash = this.fileHashes.get(filePath);

      if (currentHash === previousHash) {
        return; // File hasn't actually changed
      }

      this.emit('file-changed', { type: 'change', path: filePath });
      await this.uploadFile(filePath);
    } catch (error) {
      console.error('Error updating file:', error);
      this.emit('sync-error', error);
    }
  }

  /**
   * Handle file deleted
   */
  async onFileDeleted(filePath) {
    if (this.isPaused || this.syncInProgress) return;

    try {
      this.emit('file-changed', { type: 'delete', path: filePath });
      await this.deleteRemoteFile(filePath);
      this.fileHashes.delete(filePath);
    } catch (error) {
      console.error('Error deleting file:', error);
      this.emit('sync-error', error);
    }
  }

  /**
   * Handle folder added
   */
  async onFolderAdded(dirPath) {
    if (this.isPaused || this.syncInProgress) return;

    try {
      this.emit('file-changed', { type: 'add-dir', path: dirPath });
      await this.createRemoteFolder(dirPath);
    } catch (error) {
      console.error('Error creating folder:', error);
      this.emit('sync-error', error);
    }
  }

  /**
   * Handle folder deleted
   */
  async onFolderDeleted(dirPath) {
    if (this.isPaused || this.syncInProgress) return;

    try {
      this.emit('file-changed', { type: 'delete-dir', path: dirPath });
      await this.deleteRemoteFolder(dirPath);
    } catch (error) {
      console.error('Error deleting folder:', error);
      this.emit('sync-error', error);
    }
  }

  /**
   * Perform synchronization now
   */
  async syncNow() {
    if (this.syncInProgress || this.isPaused) {
      return;
    }

    this.syncInProgress = true;
    this.emit('sync-started');

    const stats = {
      uploaded: 0,
      downloaded: 0,
      deleted: 0,
      errors: 0
    };

    try {
      // 1. Get remote file list
      const remoteFiles = await this.getRemoteFileList();

      // 2. Get local file list
      const localFiles = await this.getLocalFileList();

      // 3. Compare and sync
      await this.reconcileFiles(localFiles, remoteFiles, stats);

      // Update last sync time
      this.configManager.set('lastSync', new Date().toISOString());

      this.emit('sync-completed', stats);
    } catch (error) {
      console.error('Sync error:', error);
      stats.errors++;
      this.emit('sync-error', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Get remote file list from WebOS server
   */
  async getRemoteFileList() {
    const config = this.configManager.getConfig();
    const files = [];

    try {
      const response = await axios.get(
        `${config.serverUrl}/api/files/list?path=df0`,
        {
          headers: this.authManager.getAuthHeaders(),
          timeout: 10000
        }
      );

      if (response.data && response.data.items) {
        for (const item of response.data.items) {
          files.push({
            path: item.path,
            name: item.name,
            type: item.type,
            modified: item.modified,
            size: item.size
          });

          // Recursively get subdirectories
          if (item.type === 'folder') {
            const subFiles = await this.getRemoteFilesRecursive(item.path);
            files.push(...subFiles);
          }
        }
      }

      return files;
    } catch (error) {
      throw new Error(`Failed to get remote files: ${error.message}`);
    }
  }

  /**
   * Get remote files recursively
   */
  async getRemoteFilesRecursive(remotePath) {
    const config = this.configManager.getConfig();
    const files = [];

    try {
      const response = await axios.get(
        `${config.serverUrl}/api/files/list?path=${encodeURIComponent(remotePath)}`,
        {
          headers: this.authManager.getAuthHeaders(),
          timeout: 10000
        }
      );

      if (response.data && response.data.items) {
        for (const item of response.data.items) {
          files.push({
            path: item.path,
            name: item.name,
            type: item.type,
            modified: item.modified,
            size: item.size
          });

          if (item.type === 'folder') {
            const subFiles = await this.getRemoteFilesRecursive(item.path);
            files.push(...subFiles);
          }
        }
      }

      return files;
    } catch (error) {
      console.error(`Error getting files from ${remotePath}:`, error.message);
      return [];
    }
  }

  /**
   * Get local file list
   */
  async getLocalFileList() {
    const config = this.configManager.getConfig();
    const files = [];

    async function scanDirectory(dirPath, basePath) {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.name.startsWith('.')) continue; // Skip hidden files

        const fullPath = path.join(dirPath, entry.name);
        const relativePath = path.relative(basePath, fullPath);

        if (entry.isDirectory()) {
          files.push({
            path: relativePath,
            name: entry.name,
            type: 'folder',
            fullPath
          });

          await scanDirectory(fullPath, basePath);
        } else {
          const stats = await fs.stat(fullPath);
          files.push({
            path: relativePath,
            name: entry.name,
            type: 'file',
            modified: stats.mtime,
            size: stats.size,
            fullPath
          });
        }
      }
    }

    await scanDirectory(config.syncFolder, config.syncFolder);
    return files;
  }

  /**
   * Reconcile local and remote files
   */
  async reconcileFiles(localFiles, remoteFiles, stats) {
    const localMap = new Map(localFiles.map(f => [f.path, f]));
    const remoteMap = new Map(remoteFiles.map(f => [f.path, f]));

    // Files to upload (new or modified locally)
    for (const [filePath, localFile] of localMap) {
      const remoteFile = remoteMap.get(filePath);

      if (!remoteFile) {
        // New local file
        if (localFile.type === 'file') {
          await this.uploadFile(localFile.fullPath);
          stats.uploaded++;
        } else {
          await this.createRemoteFolder(localFile.fullPath);
        }
      } else if (localFile.type === 'file' && remoteFile.type === 'file') {
        // Compare modification times
        const localTime = new Date(localFile.modified).getTime();
        const remoteTime = new Date(remoteFile.modified).getTime();

        if (localTime > remoteTime) {
          // Local is newer - upload
          await this.uploadFile(localFile.fullPath);
          stats.uploaded++;
        } else if (remoteTime > localTime) {
          // Remote is newer - download
          await this.downloadFile(remoteFile.path);
          stats.downloaded++;
        }
      }
    }

    // Files to download (only on remote)
    for (const [filePath, remoteFile] of remoteMap) {
      if (!localMap.has(filePath)) {
        if (remoteFile.type === 'file') {
          await this.downloadFile(remoteFile.path);
          stats.downloaded++;
        } else {
          await this.createLocalFolder(remoteFile.path);
        }
      }
    }
  }

  /**
   * Upload file to WebOS
   */
  async uploadFile(filePath) {
    const config = this.configManager.getConfig();
    const relativePath = path.relative(config.syncFolder, filePath);
    const content = await fs.readFile(filePath, 'utf-8');
    const remotePath = this.toRemotePath(relativePath);

    try {
      await axios.post(
        `${config.serverUrl}/api/files/write`,
        {
          path: remotePath,
          content
        },
        {
          headers: this.authManager.getAuthHeaders(),
          timeout: 30000
        }
      );

      // Update file hash
      const hash = await this.calculateFileHash(filePath);
      this.fileHashes.set(filePath, hash);

      console.log(`Uploaded: ${relativePath}`);
    } catch (error) {
      console.error(`Failed to upload ${relativePath}:`, error.message);
      throw error;
    }
  }

  /**
   * Download file from WebOS
   */
  async downloadFile(remotePath) {
    const config = this.configManager.getConfig();
    const localPath = this.toLocalPath(remotePath);

    try {
      const response = await axios.post(
        `${config.serverUrl}/api/files/read`,
        { path: remotePath },
        {
          headers: this.authManager.getAuthHeaders(),
          timeout: 30000
        }
      );

      if (response.data && response.data.content !== undefined) {
        // Ensure directory exists
        await fs.mkdir(path.dirname(localPath), { recursive: true });

        // Write file
        await fs.writeFile(localPath, response.data.content, 'utf-8');

        // Update file hash
        const hash = await this.calculateFileHash(localPath);
        this.fileHashes.set(localPath, hash);

        console.log(`Downloaded: ${remotePath}`);
      }
    } catch (error) {
      console.error(`Failed to download ${remotePath}:`, error.message);
      throw error;
    }
  }

  /**
   * Create remote folder
   */
  async createRemoteFolder(folderPath) {
    const config = this.configManager.getConfig();
    const relativePath = path.relative(config.syncFolder, folderPath);
    const remotePath = this.toRemotePath(path.dirname(relativePath));
    const folderName = path.basename(relativePath);

    try {
      await axios.post(
        `${config.serverUrl}/api/files/create`,
        {
          path: remotePath,
          name: folderName,
          type: 'folder'
        },
        {
          headers: this.authManager.getAuthHeaders(),
          timeout: 10000
        }
      );

      console.log(`Created remote folder: ${relativePath}`);
    } catch (error) {
      if (error.response && error.response.status === 409) {
        // Already exists - not an error
        return;
      }
      console.error(`Failed to create remote folder ${relativePath}:`, error.message);
      throw error;
    }
  }

  /**
   * Create local folder
   */
  async createLocalFolder(remotePath) {
    const localPath = this.toLocalPath(remotePath);

    try {
      await fs.mkdir(localPath, { recursive: true });
      console.log(`Created local folder: ${remotePath}`);
    } catch (error) {
      console.error(`Failed to create local folder ${remotePath}:`, error.message);
      throw error;
    }
  }

  /**
   * Delete remote file
   */
  async deleteRemoteFile(filePath) {
    const config = this.configManager.getConfig();
    const relativePath = path.relative(config.syncFolder, filePath);
    const remotePath = this.toRemotePath(relativePath);

    try {
      await axios.delete(
        `${config.serverUrl}/api/files/delete?path=${encodeURIComponent(remotePath)}`,
        {
          headers: this.authManager.getAuthHeaders(),
          timeout: 10000
        }
      );

      console.log(`Deleted remote file: ${relativePath}`);
    } catch (error) {
      console.error(`Failed to delete remote file ${relativePath}:`, error.message);
    }
  }

  /**
   * Delete remote folder
   */
  async deleteRemoteFolder(folderPath) {
    const config = this.configManager.getConfig();
    const relativePath = path.relative(config.syncFolder, folderPath);
    const remotePath = this.toRemotePath(relativePath);

    try {
      await axios.delete(
        `${config.serverUrl}/api/files/delete?path=${encodeURIComponent(remotePath)}`,
        {
          headers: this.authManager.getAuthHeaders(),
          timeout: 10000
        }
      );

      console.log(`Deleted remote folder: ${relativePath}`);
    } catch (error) {
      console.error(`Failed to delete remote folder ${relativePath}:`, error.message);
    }
  }

  /**
   * Convert local path to remote path
   */
  toRemotePath(localPath) {
    // Convert Windows backslashes to forward slashes
    const normalized = localPath.replace(/\\/g, '/');
    // Prepend 'df0/' for WebOS disk path
    return `df0/${normalized}`;
  }

  /**
   * Convert remote path to local path
   */
  toLocalPath(remotePath) {
    const config = this.configManager.getConfig();
    // Remove 'df0/' prefix if present
    const normalized = remotePath.replace(/^df0\//, '');
    return path.join(config.syncFolder, normalized);
  }

  /**
   * Calculate file hash
   */
  async calculateFileHash(filePath) {
    try {
      const content = await fs.readFile(filePath);
      return crypto.createHash('md5').update(content).digest('hex');
    } catch (error) {
      return null;
    }
  }

  /**
   * Get sync status
   */
  getStatus() {
    return {
      state: this.isRunning ? (this.isPaused ? 'paused' : 'running') : 'stopped',
      syncInProgress: this.syncInProgress,
      lastSync: this.configManager.get('lastSync')
    };
  }
}

module.exports = SyncEngine;

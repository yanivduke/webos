/**
 * Drag-and-Drop File Upload Manager for WebOS
 *
 * Global handler for drag-and-drop file uploads with validation,
 * queue management, progress tracking, and duplicate detection.
 */

// File validation configuration
export interface DragDropConfig {
  maxFileSize: number; // in bytes
  maxSimultaneousUploads: number;
  allowedExtensions: string[];
  blockedExtensions: string[];
  autoRetryOnFailure: boolean;
  maxRetries: number;
  retryDelay: number; // in milliseconds
  enabled: boolean;
}

// Upload item in queue
export interface UploadItem {
  id: string;
  file: File;
  path: string; // Destination path
  status: 'queued' | 'uploading' | 'completed' | 'failed' | 'cancelled' | 'paused';
  progress: number; // 0-100
  speed: number; // bytes per second
  timeRemaining: number; // seconds
  error?: string;
  retryCount: number;
  uploadedBytes: number;
  totalBytes: number;
  startTime?: number;
  controller?: AbortController;
}

// Duplicate handling options
export type DuplicateAction = 'overwrite' | 'keep-both' | 'skip' | 'ask';

export interface DuplicateOptions {
  action: DuplicateAction;
  rememberChoice: boolean;
}

// Callbacks
export type UploadProgressCallback = (item: UploadItem) => void;
export type UploadCompleteCallback = (item: UploadItem) => void;
export type UploadErrorCallback = (item: UploadItem, error: string) => void;
export type DuplicateDetectedCallback = (item: UploadItem, existingFile: string) => Promise<DuplicateAction>;

class DragDropManager {
  private config: DragDropConfig;
  private uploadQueue: UploadItem[] = [];
  private activeUploads: Map<string, UploadItem> = new Map();
  private completedUploads: UploadItem[] = [];
  private subscribers: Set<() => void> = new Set();
  private duplicateAction: DuplicateAction = 'ask';
  private rememberDuplicateChoice = false;

  // Callbacks
  private onProgressCallback?: UploadProgressCallback;
  private onCompleteCallback?: UploadCompleteCallback;
  private onErrorCallback?: UploadErrorCallback;
  private onDuplicateCallback?: DuplicateDetectedCallback;

  constructor() {
    // Default configuration
    this.config = {
      maxFileSize: 100 * 1024 * 1024, // 100MB
      maxSimultaneousUploads: 5,
      allowedExtensions: [], // Empty means allow all (except blocked)
      blockedExtensions: ['.exe', '.bat', '.cmd', '.scr', '.com', '.pif', '.msi', '.vbs', '.js'],
      autoRetryOnFailure: true,
      maxRetries: 3,
      retryDelay: 2000,
      enabled: true
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<DragDropConfig>) {
    this.config = { ...this.config, ...newConfig };
    this.notifySubscribers();
  }

  /**
   * Get current configuration
   */
  getConfig(): DragDropConfig {
    return { ...this.config };
  }

  /**
   * Subscribe to upload queue changes
   */
  subscribe(callback: () => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Set upload progress callback
   */
  onProgress(callback: UploadProgressCallback) {
    this.onProgressCallback = callback;
  }

  /**
   * Set upload complete callback
   */
  onComplete(callback: UploadCompleteCallback) {
    this.onCompleteCallback = callback;
  }

  /**
   * Set upload error callback
   */
  onError(callback: UploadErrorCallback) {
    this.onErrorCallback = callback;
  }

  /**
   * Set duplicate detected callback
   */
  onDuplicateDetected(callback: DuplicateDetectedCallback) {
    this.onDuplicateCallback = callback;
  }

  /**
   * Validate file before upload
   */
  private validateFile(file: File): { valid: boolean; error?: string } {
    if (!this.config.enabled) {
      return { valid: false, error: 'Drag-and-drop upload is disabled' };
    }

    // Check file size
    if (file.size > this.config.maxFileSize) {
      const maxSizeMB = (this.config.maxFileSize / (1024 * 1024)).toFixed(0);
      return { valid: false, error: `File exceeds maximum size of ${maxSizeMB}MB` };
    }

    // Get file extension
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();

    // Check blocked extensions
    if (this.config.blockedExtensions.includes(ext)) {
      return { valid: false, error: `File type ${ext} is not allowed for security reasons` };
    }

    // Check allowed extensions (if specified)
    if (this.config.allowedExtensions.length > 0 && !this.config.allowedExtensions.includes(ext)) {
      return { valid: false, error: `File type ${ext} is not allowed` };
    }

    return { valid: true };
  }

  /**
   * Add files to upload queue
   */
  async addFiles(files: File[], destinationPath: string): Promise<void> {
    const validatedFiles: UploadItem[] = [];

    for (const file of files) {
      const validation = this.validateFile(file);

      if (!validation.valid) {
        console.warn(`File ${file.name} rejected: ${validation.error}`);
        if (this.onErrorCallback) {
          const errorItem: UploadItem = {
            id: this.generateId(),
            file,
            path: destinationPath,
            status: 'failed',
            progress: 0,
            speed: 0,
            timeRemaining: 0,
            error: validation.error,
            retryCount: 0,
            uploadedBytes: 0,
            totalBytes: file.size
          };
          this.onErrorCallback(errorItem, validation.error!);
        }
        continue;
      }

      // Check for duplicates
      const duplicate = await this.checkDuplicate(file, destinationPath);
      if (duplicate) {
        let action = this.duplicateAction;

        if (!this.rememberDuplicateChoice || this.duplicateAction === 'ask') {
          if (this.onDuplicateCallback) {
            action = await this.onDuplicateCallback({
              id: '',
              file,
              path: destinationPath,
              status: 'queued',
              progress: 0,
              speed: 0,
              timeRemaining: 0,
              retryCount: 0,
              uploadedBytes: 0,
              totalBytes: file.size
            }, duplicate);
          }
        }

        if (action === 'skip') {
          continue;
        }

        if (action !== 'ask') {
          this.duplicateAction = action;
        }
      }

      const uploadItem: UploadItem = {
        id: this.generateId(),
        file,
        path: destinationPath,
        status: 'queued',
        progress: 0,
        speed: 0,
        timeRemaining: 0,
        retryCount: 0,
        uploadedBytes: 0,
        totalBytes: file.size,
        controller: new AbortController()
      };

      validatedFiles.push(uploadItem);
    }

    this.uploadQueue.push(...validatedFiles);
    this.notifySubscribers();
    this.processQueue();
  }

  /**
   * Check if file already exists at destination
   */
  private async checkDuplicate(file: File, destinationPath: string): Promise<string | null> {
    try {
      const response = await fetch(`/api/files/list?path=${encodeURIComponent(destinationPath)}`);
      if (!response.ok) return null;

      const data = await response.json();
      const existingFile = data.items?.find((item: any) => item.name === file.name);

      return existingFile ? existingFile.name : null;
    } catch (error) {
      console.error('Error checking for duplicates:', error);
      return null;
    }
  }

  /**
   * Process upload queue
   */
  private async processQueue() {
    // Start uploads up to max simultaneous
    while (
      this.activeUploads.size < this.config.maxSimultaneousUploads &&
      this.uploadQueue.length > 0
    ) {
      const item = this.uploadQueue.shift();
      if (item) {
        this.startUpload(item);
      }
    }
  }

  /**
   * Start uploading a file
   */
  private async startUpload(item: UploadItem) {
    item.status = 'uploading';
    item.startTime = Date.now();
    this.activeUploads.set(item.id, item);
    this.notifySubscribers();

    try {
      await this.uploadFile(item);

      item.status = 'completed';
      item.progress = 100;
      this.completedUploads.push(item);
      this.activeUploads.delete(item.id);

      if (this.onCompleteCallback) {
        this.onCompleteCallback(item);
      }

      this.notifySubscribers();
      this.processQueue(); // Start next upload
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      item.error = errorMessage;

      // Retry logic
      if (this.config.autoRetryOnFailure && item.retryCount < this.config.maxRetries) {
        item.retryCount++;
        item.status = 'queued';

        console.log(`Retrying upload for ${item.file.name} (attempt ${item.retryCount}/${this.config.maxRetries})`);

        setTimeout(() => {
          this.uploadQueue.unshift(item); // Add to front of queue
          this.activeUploads.delete(item.id);
          this.processQueue();
        }, this.config.retryDelay);
      } else {
        item.status = 'failed';
        this.activeUploads.delete(item.id);

        if (this.onErrorCallback) {
          this.onErrorCallback(item, errorMessage);
        }

        this.notifySubscribers();
        this.processQueue(); // Start next upload
      }
    }
  }

  /**
   * Upload file with progress tracking
   */
  private async uploadFile(item: UploadItem): Promise<void> {
    const formData = new FormData();
    formData.append('file', item.file);
    formData.append('path', item.path);
    formData.append('overwrite', this.duplicateAction === 'overwrite' ? 'true' : 'false');

    const xhr = new XMLHttpRequest();

    return new Promise((resolve, reject) => {
      // Progress tracking
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          item.uploadedBytes = e.loaded;
          item.totalBytes = e.total;
          item.progress = Math.round((e.loaded / e.total) * 100);

          // Calculate speed and time remaining
          if (item.startTime) {
            const elapsed = (Date.now() - item.startTime) / 1000; // seconds
            item.speed = e.loaded / elapsed; // bytes per second
            const remaining = e.total - e.loaded;
            item.timeRemaining = item.speed > 0 ? remaining / item.speed : 0;
          }

          if (this.onProgressCallback) {
            this.onProgressCallback(item);
          }

          this.notifySubscribers();
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload failed: ${xhr.statusText}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload cancelled'));
      });

      // Handle abort controller
      if (item.controller) {
        item.controller.signal.addEventListener('abort', () => {
          xhr.abort();
        });
      }

      xhr.open('POST', '/api/files/upload');
      xhr.send(formData);
    });
  }

  /**
   * Pause an upload
   */
  pauseUpload(itemId: string) {
    const item = this.activeUploads.get(itemId) || this.uploadQueue.find(i => i.id === itemId);
    if (item && item.status === 'uploading') {
      item.controller?.abort();
      item.status = 'paused';
      this.activeUploads.delete(itemId);
      this.notifySubscribers();
    }
  }

  /**
   * Resume a paused upload
   */
  resumeUpload(itemId: string) {
    const item = this.uploadQueue.find(i => i.id === itemId);
    if (item && item.status === 'paused') {
      item.status = 'queued';
      item.controller = new AbortController();
      this.processQueue();
    }
  }

  /**
   * Cancel an upload
   */
  cancelUpload(itemId: string) {
    const item = this.activeUploads.get(itemId) || this.uploadQueue.find(i => i.id === itemId);
    if (item) {
      item.controller?.abort();
      item.status = 'cancelled';
      this.activeUploads.delete(itemId);

      // Remove from queue
      const queueIndex = this.uploadQueue.findIndex(i => i.id === itemId);
      if (queueIndex !== -1) {
        this.uploadQueue.splice(queueIndex, 1);
      }

      this.notifySubscribers();
      this.processQueue(); // Start next upload
    }
  }

  /**
   * Cancel all uploads
   */
  cancelAll() {
    // Cancel active uploads
    this.activeUploads.forEach(item => {
      item.controller?.abort();
      item.status = 'cancelled';
    });
    this.activeUploads.clear();

    // Cancel queued uploads
    this.uploadQueue.forEach(item => {
      item.status = 'cancelled';
    });
    this.uploadQueue = [];

    this.notifySubscribers();
  }

  /**
   * Get all uploads (active, queued, completed)
   */
  getAllUploads(): UploadItem[] {
    return [
      ...Array.from(this.activeUploads.values()),
      ...this.uploadQueue,
      ...this.completedUploads.slice(-10) // Keep last 10 completed
    ];
  }

  /**
   * Get active uploads
   */
  getActiveUploads(): UploadItem[] {
    return Array.from(this.activeUploads.values());
  }

  /**
   * Get queued uploads
   */
  getQueuedUploads(): UploadItem[] {
    return this.uploadQueue.filter(item => item.status === 'queued');
  }

  /**
   * Get completed uploads
   */
  getCompletedUploads(): UploadItem[] {
    return this.completedUploads;
  }

  /**
   * Clear completed uploads
   */
  clearCompleted() {
    this.completedUploads = [];
    this.notifySubscribers();
  }

  /**
   * Set duplicate handling preference
   */
  setDuplicatePreference(action: DuplicateAction, remember: boolean = false) {
    this.duplicateAction = action;
    this.rememberDuplicateChoice = remember;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Notify all subscribers
   */
  private notifySubscribers() {
    this.subscribers.forEach(callback => callback());
  }

  /**
   * Format file size for display
   */
  static formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }

  /**
   * Format time for display
   */
  static formatTime(seconds: number): string {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  }

  /**
   * Format speed for display
   */
  static formatSpeed(bytesPerSecond: number): string {
    if (bytesPerSecond < 1024) return `${bytesPerSecond.toFixed(0)} B/s`;
    if (bytesPerSecond < 1024 * 1024) return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
    return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
  }
}

// Global instance
const dragDropManager = new DragDropManager();

export { DragDropManager };
export default dragDropManager;

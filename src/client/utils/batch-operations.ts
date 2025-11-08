/**
 * Batch Operations Manager
 * Handles queuing, execution, and tracking of file operations in WebOS
 */

export enum OperationType {
  COPY = 'COPY',
  MOVE = 'MOVE',
  DELETE = 'DELETE',
  RENAME = 'RENAME',
  COMPRESS = 'COMPRESS',
  EXTRACT = 'EXTRACT'
}

export enum OperationStatus {
  QUEUED = 'QUEUED',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export enum ConflictStrategy {
  SKIP = 'SKIP',
  OVERWRITE = 'OVERWRITE',
  RENAME = 'RENAME',
  ASK = 'ASK'
}

export interface OperationDefinition {
  id: string;
  type: OperationType;
  source: string | string[];
  destination?: string;
  status: OperationStatus;
  progress: number; // 0-100
  bytesTransferred: number;
  totalBytes: number;
  itemsProcessed: number;
  totalItems: number;
  timestamp: number;
  startTime?: number;
  endTime?: number;
  dependencies?: string[]; // IDs of operations that must complete first
  conflictStrategy: ConflictStrategy;
  error?: string;
  retryCount: number;
  maxRetries: number;
}

export interface UndoableOperation {
  id: string;
  type: OperationType;
  timestamp: number;
  description: string;
  undoData: any; // Store necessary data for undo
}

class BatchOperationsManager {
  private operations: Map<string, OperationDefinition> = new Map();
  private undoHistory: UndoableOperation[] = [];
  private maxUndoHistory = 50;
  private maxSimultaneousOps = 3;
  private runningOperations: Set<string> = new Set();
  private eventListeners: Map<string, Set<Function>> = new Map();

  /**
   * Add a new operation to the queue
   */
  add(operation: Omit<OperationDefinition, 'id' | 'status' | 'timestamp' | 'progress' | 'bytesTransferred' | 'itemsProcessed' | 'retryCount'>): string {
    const id = this.generateId();
    const fullOperation: OperationDefinition = {
      ...operation,
      id,
      status: OperationStatus.QUEUED,
      timestamp: Date.now(),
      progress: 0,
      bytesTransferred: 0,
      itemsProcessed: 0,
      retryCount: 0,
      maxRetries: operation.maxRetries ?? 3
    };

    this.operations.set(id, fullOperation);
    this.emit('operation-added', fullOperation);

    // Try to start execution if we have capacity
    this.processQueue();

    return id;
  }

  /**
   * Remove an operation from the queue
   */
  remove(id: string): boolean {
    const operation = this.operations.get(id);
    if (!operation) return false;

    // Can only remove queued or completed operations
    if (operation.status === OperationStatus.RUNNING) {
      this.cancel(id);
    }

    this.operations.delete(id);
    this.emit('operation-removed', id);
    return true;
  }

  /**
   * Pause a running operation
   */
  pause(id: string): boolean {
    const operation = this.operations.get(id);
    if (!operation || operation.status !== OperationStatus.RUNNING) {
      return false;
    }

    operation.status = OperationStatus.PAUSED;
    this.runningOperations.delete(id);
    this.emit('operation-paused', operation);

    // Process queue to start next operation
    this.processQueue();

    return true;
  }

  /**
   * Resume a paused operation
   */
  resume(id: string): boolean {
    const operation = this.operations.get(id);
    if (!operation || operation.status !== OperationStatus.PAUSED) {
      return false;
    }

    operation.status = OperationStatus.QUEUED;
    this.emit('operation-resumed', operation);
    this.processQueue();

    return true;
  }

  /**
   * Cancel an operation
   */
  cancel(id: string): boolean {
    const operation = this.operations.get(id);
    if (!operation) return false;

    operation.status = OperationStatus.CANCELLED;
    operation.endTime = Date.now();
    this.runningOperations.delete(id);
    this.emit('operation-cancelled', operation);

    // Process queue to start next operation
    this.processQueue();

    return true;
  }

  /**
   * Pause all operations
   */
  pauseAll(): void {
    for (const [id, operation] of this.operations) {
      if (operation.status === OperationStatus.RUNNING) {
        this.pause(id);
      }
    }
  }

  /**
   * Resume all paused operations
   */
  resumeAll(): void {
    for (const [id, operation] of this.operations) {
      if (operation.status === OperationStatus.PAUSED) {
        this.resume(id);
      }
    }
  }

  /**
   * Cancel all operations
   */
  cancelAll(): void {
    for (const [id, operation] of this.operations) {
      if (operation.status !== OperationStatus.COMPLETED &&
          operation.status !== OperationStatus.FAILED) {
        this.cancel(id);
      }
    }
  }

  /**
   * Clear completed operations
   */
  clearCompleted(): void {
    const toRemove: string[] = [];
    for (const [id, operation] of this.operations) {
      if (operation.status === OperationStatus.COMPLETED ||
          operation.status === OperationStatus.CANCELLED) {
        toRemove.push(id);
      }
    }
    toRemove.forEach(id => this.operations.delete(id));
    this.emit('queue-cleared', toRemove);
  }

  /**
   * Get an operation by ID
   */
  get(id: string): OperationDefinition | undefined {
    return this.operations.get(id);
  }

  /**
   * Get all operations
   */
  getAll(): OperationDefinition[] {
    return Array.from(this.operations.values());
  }

  /**
   * Get operations by status
   */
  getByStatus(status: OperationStatus): OperationDefinition[] {
    return Array.from(this.operations.values()).filter(op => op.status === status);
  }

  /**
   * Get queued operations
   */
  getQueued(): OperationDefinition[] {
    return this.getByStatus(OperationStatus.QUEUED);
  }

  /**
   * Get running operations
   */
  getRunning(): OperationDefinition[] {
    return this.getByStatus(OperationStatus.RUNNING);
  }

  /**
   * Get completed operations
   */
  getCompleted(): OperationDefinition[] {
    return this.getByStatus(OperationStatus.COMPLETED);
  }

  /**
   * Get failed operations
   */
  getFailed(): OperationDefinition[] {
    return this.getByStatus(OperationStatus.FAILED);
  }

  /**
   * Get undo history
   */
  getUndoHistory(): UndoableOperation[] {
    return [...this.undoHistory];
  }

  /**
   * Undo an operation
   */
  async undo(id: string): Promise<boolean> {
    const undoOp = this.undoHistory.find(op => op.id === id);
    if (!undoOp) return false;

    try {
      switch (undoOp.type) {
        case OperationType.COPY:
        case OperationType.MOVE:
          // Delete the copied/moved files
          if (undoOp.undoData.destination) {
            await this.executeDelete([undoOp.undoData.destination]);
          }
          break;

        case OperationType.DELETE:
          // Restore from trash or backup
          // This would need integration with a trash system
          console.warn('Delete undo not fully implemented');
          break;

        case OperationType.RENAME:
          // Rename back to original
          if (undoOp.undoData.originalName && undoOp.undoData.newName) {
            await this.executeRename(undoOp.undoData.newName, undoOp.undoData.originalName);
          }
          break;
      }

      // Remove from undo history
      const index = this.undoHistory.findIndex(op => op.id === id);
      if (index >= 0) {
        this.undoHistory.splice(index, 1);
      }

      this.emit('operation-undone', id);
      return true;
    } catch (error) {
      console.error('Undo failed:', error);
      return false;
    }
  }

  /**
   * Process the queue and start operations if capacity available
   */
  private async processQueue(): Promise<void> {
    // Check if we can start more operations
    if (this.runningOperations.size >= this.maxSimultaneousOps) {
      return;
    }

    // Get queued operations
    const queued = this.getQueued();

    // Find operations that can start (no pending dependencies)
    for (const operation of queued) {
      if (this.runningOperations.size >= this.maxSimultaneousOps) {
        break;
      }

      // Check dependencies
      if (this.hasPendingDependencies(operation)) {
        continue;
      }

      // Start this operation
      await this.startOperation(operation);
    }
  }

  /**
   * Check if operation has pending dependencies
   */
  private hasPendingDependencies(operation: OperationDefinition): boolean {
    if (!operation.dependencies || operation.dependencies.length === 0) {
      return false;
    }

    for (const depId of operation.dependencies) {
      const dep = this.operations.get(depId);
      if (!dep || dep.status !== OperationStatus.COMPLETED) {
        return true;
      }
    }

    return false;
  }

  /**
   * Start executing an operation
   */
  private async startOperation(operation: OperationDefinition): Promise<void> {
    operation.status = OperationStatus.RUNNING;
    operation.startTime = Date.now();
    this.runningOperations.add(operation.id);
    this.emit('operation-started', operation);

    try {
      switch (operation.type) {
        case OperationType.COPY:
          await this.executeCopy(operation);
          break;
        case OperationType.MOVE:
          await this.executeMove(operation);
          break;
        case OperationType.DELETE:
          await this.executeDeleteOp(operation);
          break;
        case OperationType.RENAME:
          await this.executeRenameOp(operation);
          break;
        case OperationType.COMPRESS:
          await this.executeCompress(operation);
          break;
        case OperationType.EXTRACT:
          await this.executeExtract(operation);
          break;
      }

      // Mark as completed
      operation.status = OperationStatus.COMPLETED;
      operation.endTime = Date.now();
      operation.progress = 100;
      this.runningOperations.delete(operation.id);

      // Add to undo history
      this.addToUndoHistory(operation);

      this.emit('operation-completed', operation);

      // Process queue to start next operation
      this.processQueue();

    } catch (error: any) {
      // Handle error
      operation.error = error.message || 'Unknown error';

      // Retry if applicable
      if (operation.retryCount < operation.maxRetries) {
        operation.retryCount++;
        operation.status = OperationStatus.QUEUED;
        this.runningOperations.delete(operation.id);
        this.emit('operation-retry', operation);

        // Wait before retrying
        setTimeout(() => this.processQueue(), 1000 * operation.retryCount);
      } else {
        operation.status = OperationStatus.FAILED;
        operation.endTime = Date.now();
        this.runningOperations.delete(operation.id);
        this.emit('operation-failed', operation);

        // Process queue to start next operation
        this.processQueue();
      }
    }
  }

  /**
   * Execute copy operation
   */
  private async executeCopy(operation: OperationDefinition): Promise<void> {
    const sources = Array.isArray(operation.source) ? operation.source : [operation.source];

    for (let i = 0; i < sources.length; i++) {
      const source = sources[i];

      // Simulate progress
      operation.itemsProcessed = i;
      operation.progress = Math.floor((i / sources.length) * 100);
      this.emit('operation-progress', operation);

      // Call API
      const response = await fetch('/api/batch/copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source,
          destination: operation.destination,
          conflictStrategy: operation.conflictStrategy
        })
      });

      if (!response.ok) {
        throw new Error(`Copy failed: ${response.statusText}`);
      }

      // Update progress
      operation.itemsProcessed = i + 1;
      operation.progress = Math.floor(((i + 1) / sources.length) * 100);
      this.emit('operation-progress', operation);
    }
  }

  /**
   * Execute move operation
   */
  private async executeMove(operation: OperationDefinition): Promise<void> {
    const sources = Array.isArray(operation.source) ? operation.source : [operation.source];

    for (let i = 0; i < sources.length; i++) {
      const source = sources[i];

      operation.itemsProcessed = i;
      operation.progress = Math.floor((i / sources.length) * 100);
      this.emit('operation-progress', operation);

      const response = await fetch('/api/batch/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source,
          destination: operation.destination,
          conflictStrategy: operation.conflictStrategy
        })
      });

      if (!response.ok) {
        throw new Error(`Move failed: ${response.statusText}`);
      }

      operation.itemsProcessed = i + 1;
      operation.progress = Math.floor(((i + 1) / sources.length) * 100);
      this.emit('operation-progress', operation);
    }
  }

  /**
   * Execute delete operation
   */
  private async executeDeleteOp(operation: OperationDefinition): Promise<void> {
    const sources = Array.isArray(operation.source) ? operation.source : [operation.source];
    await this.executeDelete(sources, operation);
  }

  /**
   * Execute delete helper
   */
  private async executeDelete(sources: string[], operation?: OperationDefinition): Promise<void> {
    for (let i = 0; i < sources.length; i++) {
      const source = sources[i];

      if (operation) {
        operation.itemsProcessed = i;
        operation.progress = Math.floor((i / sources.length) * 100);
        this.emit('operation-progress', operation);
      }

      const response = await fetch('/api/batch/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source })
      });

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.statusText}`);
      }

      if (operation) {
        operation.itemsProcessed = i + 1;
        operation.progress = Math.floor(((i + 1) / sources.length) * 100);
        this.emit('operation-progress', operation);
      }
    }
  }

  /**
   * Execute rename operation
   */
  private async executeRenameOp(operation: OperationDefinition): Promise<void> {
    const source = Array.isArray(operation.source) ? operation.source[0] : operation.source;
    await this.executeRename(source, operation.destination!);

    operation.itemsProcessed = 1;
    operation.progress = 100;
    this.emit('operation-progress', operation);
  }

  /**
   * Execute rename helper
   */
  private async executeRename(source: string, newName: string): Promise<void> {
    const response = await fetch('/api/batch/rename', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source, newName })
    });

    if (!response.ok) {
      throw new Error(`Rename failed: ${response.statusText}`);
    }
  }

  /**
   * Execute compress operation
   */
  private async executeCompress(operation: OperationDefinition): Promise<void> {
    // Placeholder for compress functionality
    operation.itemsProcessed = operation.totalItems;
    operation.progress = 100;
    this.emit('operation-progress', operation);
  }

  /**
   * Execute extract operation
   */
  private async executeExtract(operation: OperationDefinition): Promise<void> {
    // Placeholder for extract functionality
    operation.itemsProcessed = operation.totalItems;
    operation.progress = 100;
    this.emit('operation-progress', operation);
  }

  /**
   * Add operation to undo history
   */
  private addToUndoHistory(operation: OperationDefinition): void {
    const undoOp: UndoableOperation = {
      id: operation.id,
      type: operation.type,
      timestamp: Date.now(),
      description: this.getOperationDescription(operation),
      undoData: {
        source: operation.source,
        destination: operation.destination
      }
    };

    this.undoHistory.unshift(undoOp);

    // Trim history
    if (this.undoHistory.length > this.maxUndoHistory) {
      this.undoHistory = this.undoHistory.slice(0, this.maxUndoHistory);
    }

    this.emit('undo-history-updated', this.undoHistory);
  }

  /**
   * Get human-readable operation description
   */
  private getOperationDescription(operation: OperationDefinition): string {
    const sources = Array.isArray(operation.source) ? operation.source : [operation.source];
    const count = sources.length;

    switch (operation.type) {
      case OperationType.COPY:
        return `Copied ${count} item${count > 1 ? 's' : ''} to ${operation.destination}`;
      case OperationType.MOVE:
        return `Moved ${count} item${count > 1 ? 's' : ''} to ${operation.destination}`;
      case OperationType.DELETE:
        return `Deleted ${count} item${count > 1 ? 's' : ''}`;
      case OperationType.RENAME:
        return `Renamed ${sources[0]} to ${operation.destination}`;
      case OperationType.COMPRESS:
        return `Compressed ${count} item${count > 1 ? 's' : ''}`;
      case OperationType.EXTRACT:
        return `Extracted ${sources[0]}`;
      default:
        return 'Unknown operation';
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Event listener management
   */
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  /**
   * Get operation statistics
   */
  getStatistics() {
    const all = this.getAll();
    return {
      total: all.length,
      queued: this.getQueued().length,
      running: this.getRunning().length,
      completed: this.getCompleted().length,
      failed: this.getFailed().length,
      totalProgress: this.calculateTotalProgress()
    };
  }

  /**
   * Calculate overall progress
   */
  private calculateTotalProgress(): number {
    const all = this.getAll();
    if (all.length === 0) return 0;

    const totalProgress = all.reduce((sum, op) => sum + op.progress, 0);
    return Math.floor(totalProgress / all.length);
  }
}

// Singleton instance
export const batchOperations = new BatchOperationsManager();

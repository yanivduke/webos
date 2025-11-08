/**
 * Advanced Clipboard Manager with History
 * Maintains clipboard history with support for files, text, and images
 * Includes persistent storage, pinned items, and search functionality
 */

export type ClipboardDataType = 'file' | 'folder' | 'text' | 'image';

export interface ClipboardHistoryItem {
  id: string;
  type: ClipboardDataType;
  operation: 'copy' | 'cut';
  timestamp: Date;

  // File/folder specific
  name?: string;
  path?: string;
  size?: string;

  // Text specific
  text?: string;

  // Image specific
  imageData?: string; // base64 or URL

  // Metadata
  preview?: string;
  pinned?: boolean;
}

export interface ClipboardEvent {
  type: 'copy' | 'cut' | 'paste' | 'clear' | 'pin' | 'unpin' | 'delete';
  items?: ClipboardHistoryItem[];
  timestamp: Date;
}

type ClipboardListener = (event: ClipboardEvent) => void;

class AdvancedClipboardManager {
  private static readonly STORAGE_KEY = 'webos_clipboard_history';
  private static readonly MAX_HISTORY = 20;

  private history: ClipboardHistoryItem[] = [];
  private currentItems: ClipboardHistoryItem[] = [];
  private listeners: ClipboardListener[] = [];

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Copy items to clipboard and add to history
   */
  copy(items: ClipboardHistoryItem[]): void {
    const clipboardItems = items.map(item => ({
      ...item,
      id: this.generateId(),
      operation: 'copy' as const,
      timestamp: new Date(),
      preview: this.generatePreview(item)
    }));

    this.currentItems = clipboardItems;
    this.addToHistory(clipboardItems);
    this.saveToStorage();
    this.emitEvent({ type: 'copy', items: clipboardItems, timestamp: new Date() });
  }

  /**
   * Cut items to clipboard and add to history
   */
  cut(items: ClipboardHistoryItem[]): void {
    const clipboardItems = items.map(item => ({
      ...item,
      id: this.generateId(),
      operation: 'cut' as const,
      timestamp: new Date(),
      preview: this.generatePreview(item)
    }));

    this.currentItems = clipboardItems;
    this.addToHistory(clipboardItems);
    this.saveToStorage();
    this.emitEvent({ type: 'cut', items: clipboardItems, timestamp: new Date() });
  }

  /**
   * Paste current clipboard items
   */
  async paste(destinationPath?: string): Promise<void> {
    if (!this.hasItems()) {
      throw new Error('Clipboard is empty');
    }

    const isCutOperation = this.currentItems[0]?.operation === 'cut';

    if (destinationPath) {
      // Perform actual file operations
      for (const item of this.currentItems) {
        if (item.type === 'file' || item.type === 'folder') {
          await this.pasteFileItem(item, destinationPath);
        }
      }
    }

    // Clear current items if it was a cut operation
    if (isCutOperation) {
      this.currentItems = [];
    }

    this.emitEvent({ type: 'paste', items: this.currentItems, timestamp: new Date() });
  }

  /**
   * Get clipboard history
   */
  getHistory(): ClipboardHistoryItem[] {
    // Return pinned items first, then the rest sorted by timestamp
    const pinned = this.history.filter(item => item.pinned);
    const unpinned = this.history.filter(item => !item.pinned);
    return [...pinned, ...unpinned];
  }

  /**
   * Get current clipboard items
   */
  getCurrentItems(): ClipboardHistoryItem[] {
    return [...this.currentItems];
  }

  /**
   * Check if clipboard has items
   */
  hasItems(): boolean {
    return this.currentItems.length > 0;
  }

  /**
   * Search clipboard history
   */
  search(query: string): ClipboardHistoryItem[] {
    const lowerQuery = query.toLowerCase();
    return this.history.filter(item => {
      if (item.name?.toLowerCase().includes(lowerQuery)) return true;
      if (item.text?.toLowerCase().includes(lowerQuery)) return true;
      if (item.preview?.toLowerCase().includes(lowerQuery)) return true;
      return false;
    });
  }

  /**
   * Pin an item
   */
  pin(itemId: string): void {
    const item = this.history.find(i => i.id === itemId);
    if (item) {
      item.pinned = true;
      this.saveToStorage();
      this.emitEvent({ type: 'pin', items: [item], timestamp: new Date() });
    }
  }

  /**
   * Unpin an item
   */
  unpin(itemId: string): void {
    const item = this.history.find(i => i.id === itemId);
    if (item) {
      item.pinned = false;
      this.saveToStorage();
      this.emitEvent({ type: 'unpin', items: [item], timestamp: new Date() });
    }
  }

  /**
   * Delete an item from history
   */
  deleteHistoryItem(itemId: string): void {
    const index = this.history.findIndex(i => i.id === itemId);
    if (index !== -1) {
      const [item] = this.history.splice(index, 1);
      this.saveToStorage();
      this.emitEvent({ type: 'delete', items: [item], timestamp: new Date() });
    }
  }

  /**
   * Clear all history (except pinned items)
   */
  clearHistory(includePinned: boolean = false): void {
    if (includePinned) {
      this.history = [];
      this.currentItems = [];
    } else {
      this.history = this.history.filter(item => item.pinned);
    }

    this.saveToStorage();
    this.emitEvent({ type: 'clear', timestamp: new Date() });
  }

  /**
   * Set an item from history as current clipboard
   */
  useHistoryItem(itemId: string): void {
    const item = this.history.find(i => i.id === itemId);
    if (item) {
      this.currentItems = [item];
      this.emitEvent({ type: 'copy', items: [item], timestamp: new Date() });
    }
  }

  /**
   * Subscribe to clipboard events
   */
  subscribe(listener: ClipboardListener): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Get clipboard status summary
   */
  getStatus(): string {
    if (!this.hasItems()) return 'Clipboard empty';

    const count = this.currentItems.length;
    const operation = this.currentItems[0].operation;
    const verb = operation === 'copy' ? 'Copied' : 'Cut';

    if (count === 1) {
      return `${verb}: ${this.currentItems[0].name || this.currentItems[0].text?.substring(0, 20) || 'item'}`;
    }

    return `${verb}: ${count} items`;
  }

  /**
   * Get preview text for an item
   */
  private generatePreview(item: ClipboardHistoryItem): string {
    if (item.type === 'file' || item.type === 'folder') {
      return `${item.name || 'Unknown'} (${item.size || '0 bytes'})`;
    } else if (item.type === 'text') {
      return item.text?.substring(0, 100) || '';
    } else if (item.type === 'image') {
      return 'Image';
    }
    return 'Unknown item';
  }

  /**
   * Add items to history
   */
  private addToHistory(items: ClipboardHistoryItem[]): void {
    // Add new items to the beginning
    this.history.unshift(...items);

    // Remove duplicates (same path or text)
    const seen = new Set<string>();
    this.history = this.history.filter(item => {
      const key = item.path || item.text || item.imageData || item.id;
      if (item.pinned || !seen.has(key)) {
        seen.add(key);
        return true;
      }
      return false;
    });

    // Keep only last MAX_HISTORY items (excluding pinned)
    const pinned = this.history.filter(item => item.pinned);
    const unpinned = this.history.filter(item => !item.pinned);

    this.history = [
      ...pinned,
      ...unpinned.slice(0, AdvancedClipboardManager.MAX_HISTORY)
    ];
  }

  /**
   * Paste a file/folder item
   */
  private async pasteFileItem(item: ClipboardHistoryItem, destinationPath: string): Promise<void> {
    if (!item.path || !item.name) {
      throw new Error('Invalid file item');
    }

    const endpoint = item.operation === 'copy' ? '/api/files/copy' : '/api/files/rename';
    const body = item.operation === 'copy'
      ? {
          sourcePath: item.path,
          destinationPath: destinationPath,
          newName: item.name
        }
      : {
          path: item.path,
          newName: `${destinationPath}/${item.name}`.replace(/\/+/g, '/')
        };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `${item.operation} operation failed`);
    }
  }

  /**
   * Save history to localStorage
   */
  private saveToStorage(): void {
    try {
      const data = {
        history: this.history.map(item => ({
          ...item,
          timestamp: item.timestamp.toISOString()
        })),
        currentItems: this.currentItems.map(item => ({
          ...item,
          timestamp: item.timestamp.toISOString()
        }))
      };
      localStorage.setItem(AdvancedClipboardManager.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save clipboard to storage:', error);
    }
  }

  /**
   * Load history from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(AdvancedClipboardManager.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.history = (data.history || []).map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
        this.currentItems = (data.currentItems || []).map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
      }
    } catch (error) {
      console.error('Failed to load clipboard from storage:', error);
      this.history = [];
      this.currentItems = [];
    }
  }

  /**
   * Emit an event to all listeners
   */
  private emitEvent(event: ClipboardEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Clipboard listener error:', error);
      }
    });
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `clip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const advancedClipboard = new AdvancedClipboardManager();
export default advancedClipboard;

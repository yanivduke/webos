/**
 * Clipboard Manager for Amiga Workbench File Operations
 * Handles copy/cut/paste operations for files and folders
 */

export interface ClipboardItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  operation: 'copy' | 'cut';
  size?: string;
  created?: Date;
  modified?: Date;
}

class AmigaClipboard {
  private items: ClipboardItem[] = [];
  private listeners: ((items: ClipboardItem[]) => void)[] = [];

  // Copy items to clipboard
  copy(items: ClipboardItem[]): void {
    this.items = items.map(item => ({ ...item, operation: 'copy' }));
    this.notifyListeners();
    console.log(`Copied ${items.length} item(s) to clipboard`);
  }

  // Cut items to clipboard
  cut(items: ClipboardItem[]): void {
    this.items = items.map(item => ({ ...item, operation: 'cut' }));
    this.notifyListeners();
    console.log(`Cut ${items.length} item(s) to clipboard`);
  }

  // Get clipboard items
  getItems(): ClipboardItem[] {
    return [...this.items];
  }

  // Check if clipboard has items
  hasItems(): boolean {
    return this.items.length > 0;
  }

  // Check if clipboard has items with specific operation
  hasOperation(operation: 'copy' | 'cut'): boolean {
    return this.items.some(item => item.operation === operation);
  }

  // Clear clipboard
  clear(): void {
    this.items = [];
    this.notifyListeners();
    console.log('Clipboard cleared');
  }

  // Paste items to destination (API call)
  async paste(destinationPath: string): Promise<void> {
    if (!this.hasItems()) {
      throw new Error('Clipboard is empty');
    }

    const isCutOperation = this.items[0].operation === 'cut';
    const results = [];

    for (const item of this.items) {
      try {
        if (item.operation === 'copy') {
          // Copy file/folder
          await this.copyItem(item, destinationPath);
        } else if (item.operation === 'cut') {
          // Move file/folder
          await this.moveItem(item, destinationPath);
        }
        results.push({ success: true, item: item.name });
      } catch (error) {
        console.error(`Failed to paste ${item.name}:`, error);
        results.push({ success: false, item: item.name, error });
      }
    }

    // Clear clipboard after cut operation
    if (isCutOperation) {
      this.clear();
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    if (failCount > 0) {
      throw new Error(`${successCount} items pasted successfully, ${failCount} failed`);
    }
  }

  // Copy a single item via API
  private async copyItem(item: ClipboardItem, destinationPath: string): Promise<void> {
    const response = await fetch('/api/files/copy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourcePath: item.path,
        destinationPath: destinationPath,
        newName: item.name
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Copy operation failed');
    }
  }

  // Move a single item via API
  private async moveItem(item: ClipboardItem, destinationPath: string): Promise<void> {
    const newPath = `${destinationPath}/${item.name}`.replace(/\/+/g, '/');
    
    const response = await fetch('/api/files/rename', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: item.path,
        newName: newPath
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Move operation failed');
    }
  }

  // Subscribe to clipboard changes
  subscribe(callback: (items: ClipboardItem[]) => void): () => void {
    this.listeners.push(callback);
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Notify all listeners of clipboard changes
  private notifyListeners(): void {
    this.listeners.forEach(callback => callback(this.items));
  }

  // Get clipboard summary for status display
  getStatus(): string {
    if (!this.hasItems()) return 'Clipboard empty';
    
    const count = this.items.length;
    const operation = this.items[0].operation;
    const verb = operation === 'copy' ? 'Copied' : 'Cut';
    
    if (count === 1) {
      return `${verb}: ${this.items[0].name}`;
    }
    
    return `${verb}: ${count} items`;
  }
}

// Export singleton instance
export const clipboard = new AmigaClipboard();
export default clipboard;

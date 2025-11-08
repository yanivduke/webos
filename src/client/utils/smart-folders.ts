/**
 * Smart Folder Manager for WebOS
 * Dynamic folders with saved search criteria that auto-update
 */

import {
  SearchCriteria,
  SearchResult,
  performAdvancedSearch,
  buildFileIndex
} from './advanced-search';

// ==================== Interfaces ====================

export interface SmartFolder {
  id: string;
  name: string;
  criteria: SearchCriteria;
  icon: string;
  color: string;
  autoRefresh: boolean;
  created: Date;
  lastUpdated: Date;
  fileCount?: number;
  results?: SearchResult[];
}

export interface SmartFolderExport {
  version: string;
  folders: SmartFolder[];
  exportedAt: Date;
}

// ==================== Storage ====================

const STORAGE_KEY = 'webos_smart_folders';
const STORAGE_VERSION = '1.0';

// Smart folder subscribers
type SmartFolderSubscriber = (folders: SmartFolder[]) => void;
const subscribers: Set<SmartFolderSubscriber> = new Set();

// ==================== Predefined Smart Folders ====================

export const PREDEFINED_FOLDERS: Omit<SmartFolder, 'id' | 'created' | 'lastUpdated'>[] = [
  {
    name: 'Recent Files',
    criteria: {
      query: '',
      mode: 'metadata',
      dateRange: {
        field: 'modified',
        from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
      }
    },
    icon: 'clock',
    color: '#00aa00',
    autoRefresh: true
  },
  {
    name: 'Large Files',
    criteria: {
      query: '',
      mode: 'metadata',
      sizeRange: {
        min: 1024 * 1024 // > 1MB
      }
    },
    icon: 'database',
    color: '#ff6600',
    autoRefresh: true
  },
  {
    name: 'Images',
    criteria: {
      query: '',
      mode: 'simple',
      fileTypes: ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg', 'webp']
    },
    icon: 'image',
    color: '#aa00aa',
    autoRefresh: true
  },
  {
    name: 'Documents',
    criteria: {
      query: '',
      mode: 'simple',
      fileTypes: ['txt', 'doc', 'pdf', 'md', 'rtf']
    },
    icon: 'document',
    color: '#0055aa',
    autoRefresh: true
  },
  {
    name: 'Videos',
    criteria: {
      query: '',
      mode: 'simple',
      fileTypes: ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm']
    },
    icon: 'video',
    color: '#aa0000',
    autoRefresh: true
  },
  {
    name: 'Code Files',
    criteria: {
      query: '',
      mode: 'simple',
      fileTypes: ['js', 'ts', 'jsx', 'tsx', 'vue', 'html', 'css', 'scss', 'json', 'xml']
    },
    icon: 'code',
    color: '#00aaaa',
    autoRefresh: true
  }
];

// ==================== Smart Folder Management ====================

export function getAllSmartFolders(): SmartFolder[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const data = JSON.parse(stored);

    // Convert date strings back to Date objects
    return data.folders.map((folder: any) => ({
      ...folder,
      created: new Date(folder.created),
      lastUpdated: new Date(folder.lastUpdated),
      criteria: {
        ...folder.criteria,
        dateRange: folder.criteria.dateRange ? {
          ...folder.criteria.dateRange,
          from: folder.criteria.dateRange.from ? new Date(folder.criteria.dateRange.from) : undefined,
          to: folder.criteria.dateRange.to ? new Date(folder.criteria.dateRange.to) : undefined
        } : undefined
      }
    }));
  } catch (error) {
    console.error('Failed to load smart folders:', error);
    return [];
  }
}

export function getSmartFolder(id: string): SmartFolder | null {
  const folders = getAllSmartFolders();
  return folders.find(f => f.id === id) || null;
}

export function saveSmartFolders(folders: SmartFolder[]): void {
  try {
    const data = {
      version: STORAGE_VERSION,
      folders
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    notifySubscribers(folders);
  } catch (error) {
    console.error('Failed to save smart folders:', error);
    throw new Error('Failed to save smart folders');
  }
}

export function createSmartFolder(
  name: string,
  criteria: SearchCriteria,
  options: {
    icon?: string;
    color?: string;
    autoRefresh?: boolean;
  } = {}
): SmartFolder {
  const folder: SmartFolder = {
    id: `smart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    criteria,
    icon: options.icon || 'folder',
    color: options.color || '#ffaa00',
    autoRefresh: options.autoRefresh !== false,
    created: new Date(),
    lastUpdated: new Date()
  };

  const folders = getAllSmartFolders();
  folders.push(folder);
  saveSmartFolders(folders);

  return folder;
}

export function updateSmartFolder(id: string, updates: Partial<SmartFolder>): void {
  const folders = getAllSmartFolders();
  const index = folders.findIndex(f => f.id === id);

  if (index === -1) {
    throw new Error('Smart folder not found');
  }

  folders[index] = {
    ...folders[index],
    ...updates,
    lastUpdated: new Date()
  };

  saveSmartFolders(folders);
}

export function deleteSmartFolder(id: string): void {
  const folders = getAllSmartFolders();
  const filtered = folders.filter(f => f.id !== id);

  if (filtered.length === folders.length) {
    throw new Error('Smart folder not found');
  }

  saveSmartFolders(filtered);
}

export function duplicateSmartFolder(id: string): SmartFolder {
  const original = getSmartFolder(id);
  if (!original) {
    throw new Error('Smart folder not found');
  }

  return createSmartFolder(
    `${original.name} (Copy)`,
    original.criteria,
    {
      icon: original.icon,
      color: original.color,
      autoRefresh: original.autoRefresh
    }
  );
}

// ==================== Predefined Folders ====================

export function installPredefinedFolders(): void {
  const existing = getAllSmartFolders();
  const newFolders: SmartFolder[] = [];

  for (const template of PREDEFINED_FOLDERS) {
    // Check if folder with this name already exists
    if (existing.some(f => f.name === template.name)) {
      continue;
    }

    const folder: SmartFolder = {
      ...template,
      id: `predefined-${template.name.toLowerCase().replace(/\s+/g, '-')}`,
      created: new Date(),
      lastUpdated: new Date()
    };

    newFolders.push(folder);
  }

  if (newFolders.length > 0) {
    saveSmartFolders([...existing, ...newFolders]);
    console.log(`Installed ${newFolders.length} predefined smart folders`);
  }
}

export function isPredefinedFolder(id: string): boolean {
  return id.startsWith('predefined-');
}

// ==================== Refresh & Update ====================

export async function refreshSmartFolder(id: string): Promise<SearchResult[]> {
  const folder = getSmartFolder(id);
  if (!folder) {
    throw new Error('Smart folder not found');
  }

  try {
    // Ensure file index is up to date
    await buildFileIndex();

    // Perform search with folder's criteria
    const results = await performAdvancedSearch(folder.criteria);

    // Update folder with new results and file count
    updateSmartFolder(id, {
      results,
      fileCount: results.length,
      lastUpdated: new Date()
    });

    return results;
  } catch (error) {
    console.error(`Failed to refresh smart folder "${folder.name}":`, error);
    throw error;
  }
}

export async function refreshAllSmartFolders(): Promise<void> {
  const folders = getAllSmartFolders();
  const autoRefreshFolders = folders.filter(f => f.autoRefresh);

  console.log(`Refreshing ${autoRefreshFolders.length} smart folders...`);

  for (const folder of autoRefreshFolders) {
    try {
      await refreshSmartFolder(folder.id);
    } catch (error) {
      console.error(`Failed to refresh folder "${folder.name}":`, error);
    }
  }

  console.log('All smart folders refreshed');
}

// ==================== Auto-refresh on File System Changes ====================

let autoRefreshEnabled = false;
let refreshInterval: number | null = null;

export function enableAutoRefresh(intervalMs = 60000): void {
  if (autoRefreshEnabled) return;

  autoRefreshEnabled = true;

  // Initial refresh
  refreshAllSmartFolders();

  // Set up periodic refresh
  refreshInterval = window.setInterval(() => {
    refreshAllSmartFolders();
  }, intervalMs);

  console.log('Smart folder auto-refresh enabled');
}

export function disableAutoRefresh(): void {
  if (!autoRefreshEnabled) return;

  autoRefreshEnabled = false;

  if (refreshInterval !== null) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }

  console.log('Smart folder auto-refresh disabled');
}

export function isAutoRefreshEnabled(): boolean {
  return autoRefreshEnabled;
}

// ==================== Export/Import ====================

export function exportSmartFolders(): SmartFolderExport {
  return {
    version: STORAGE_VERSION,
    folders: getAllSmartFolders(),
    exportedAt: new Date()
  };
}

export function exportToJSON(): string {
  const data = exportSmartFolders();
  return JSON.stringify(data, null, 2);
}

export function downloadSmartFoldersExport(filename?: string): void {
  const json = exportToJSON();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `smart-folders-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importSmartFolders(data: SmartFolderExport, mode: 'replace' | 'merge' = 'merge'): void {
  try {
    // Validate data
    if (!data.version || !Array.isArray(data.folders)) {
      throw new Error('Invalid smart folder export format');
    }

    // Convert dates
    const imported = data.folders.map(folder => ({
      ...folder,
      created: new Date(folder.created),
      lastUpdated: new Date(folder.lastUpdated),
      criteria: {
        ...folder.criteria,
        dateRange: folder.criteria.dateRange ? {
          ...folder.criteria.dateRange,
          from: folder.criteria.dateRange.from ? new Date(folder.criteria.dateRange.from) : undefined,
          to: folder.criteria.dateRange.to ? new Date(folder.criteria.dateRange.to) : undefined
        } : undefined
      }
    }));

    let finalFolders: SmartFolder[];

    if (mode === 'replace') {
      finalFolders = imported;
    } else {
      // Merge mode
      const existing = getAllSmartFolders();
      const existingIds = new Set(existing.map(f => f.id));

      // Add imported folders with new IDs if they conflict
      const merged = [...existing];
      for (const folder of imported) {
        if (existingIds.has(folder.id)) {
          // Generate new ID for conflicting folder
          const newFolder = {
            ...folder,
            id: `smart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: `${folder.name} (Imported)`
          };
          merged.push(newFolder);
        } else {
          merged.push(folder);
        }
      }

      finalFolders = merged;
    }

    saveSmartFolders(finalFolders);
    console.log(`Imported ${imported.length} smart folders (${mode} mode)`);
  } catch (error) {
    console.error('Failed to import smart folders:', error);
    throw new Error('Failed to import smart folders');
  }
}

export async function importFromJSON(json: string, mode: 'replace' | 'merge' = 'merge'): Promise<void> {
  try {
    const data = JSON.parse(json) as SmartFolderExport;
    importSmartFolders(data, mode);
  } catch (error) {
    console.error('Failed to parse smart folder JSON:', error);
    throw new Error('Invalid JSON format');
  }
}

export async function importFromFile(file: File, mode: 'replace' | 'merge' = 'merge'): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const json = e.target?.result as string;
        await importFromJSON(json, mode);
        resolve();
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}

// ==================== Subscriptions ====================

export function subscribe(callback: SmartFolderSubscriber): () => void {
  subscribers.add(callback);

  // Return unsubscribe function
  return () => {
    subscribers.delete(callback);
  };
}

function notifySubscribers(folders: SmartFolder[]): void {
  for (const callback of subscribers) {
    try {
      callback(folders);
    } catch (error) {
      console.error('Smart folder subscriber error:', error);
    }
  }
}

// ==================== Utility Functions ====================

export function getSmartFolderStats(): {
  total: number;
  autoRefresh: number;
  predefined: number;
  custom: number;
  totalFiles: number;
} {
  const folders = getAllSmartFolders();

  return {
    total: folders.length,
    autoRefresh: folders.filter(f => f.autoRefresh).length,
    predefined: folders.filter(f => isPredefinedFolder(f.id)).length,
    custom: folders.filter(f => !isPredefinedFolder(f.id)).length,
    totalFiles: folders.reduce((sum, f) => sum + (f.fileCount || 0), 0)
  };
}

export function searchSmartFolders(query: string): SmartFolder[] {
  const folders = getAllSmartFolders();
  const lowerQuery = query.toLowerCase();

  return folders.filter(folder =>
    folder.name.toLowerCase().includes(lowerQuery) ||
    folder.criteria.query.toLowerCase().includes(lowerQuery)
  );
}

export function getSmartFoldersByTag(tag: string): SmartFolder[] {
  const folders = getAllSmartFolders();

  return folders.filter(folder =>
    folder.criteria.tags?.includes(tag)
  );
}

export function clearAllSmartFolders(): void {
  if (confirm('Are you sure you want to delete all smart folders? This cannot be undone.')) {
    saveSmartFolders([]);
  }
}

// ==================== Initialize ====================

export function initializeSmartFolders(): void {
  console.log('Initializing smart folders...');

  // Install predefined folders on first run
  const existing = getAllSmartFolders();
  if (existing.length === 0) {
    installPredefinedFolders();
  }

  // Enable auto-refresh by default
  enableAutoRefresh();

  console.log('Smart folders initialized');
}

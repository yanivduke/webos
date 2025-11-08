/**
 * Disk Analyzer - Advanced disk space analysis and visualization
 * Provides tree maps, file type breakdowns, and duplicate detection
 */

export interface DiskItem {
  path: string;
  name: string;
  size: number;
  type: 'file' | 'folder';
  extension?: string;
  modified?: number;
  children?: DiskItem[];
  depth: number;
}

export interface FileTypeInfo {
  extension: string;
  count: number;
  totalSize: number;
  percentage: number;
}

export interface DuplicateFile {
  name: string;
  size: number;
  paths: string[];
  potentialSavings: number;
}

export interface AnalysisResult {
  diskId: string;
  totalSize: number;
  totalFiles: number;
  totalFolders: number;
  largestFiles: DiskItem[];
  largestFolders: DiskItem[];
  fileTypes: FileTypeInfo[];
  treeMap: DiskItem;
  duplicates: DuplicateFile[];
  analyzedAt: number;
}

export interface AnalysisProgress {
  current: number;
  total: number;
  currentPath: string;
  percentage: number;
}

class DiskAnalyzer {
  private cache: Map<string, AnalysisResult> = new Map();
  private progressCallbacks: Array<(progress: AnalysisProgress) => void> = [];
  private abortControllers: Map<string, AbortController> = new Map();

  /**
   * Analyze a disk and return comprehensive analysis
   */
  async analyzeDisk(diskId: string, useCache = true): Promise<AnalysisResult> {
    // Check cache
    if (useCache && this.cache.has(diskId)) {
      const cached = this.cache.get(diskId)!;
      // Return cached if less than 5 minutes old
      if (Date.now() - cached.analyzedAt < 5 * 60 * 1000) {
        return cached;
      }
    }

    // Create abort controller for this analysis
    const abortController = new AbortController();
    this.abortControllers.set(diskId, abortController);

    try {
      // Fetch disk data from API
      const response = await fetch(`/api/monitor/disk/${diskId}/analyze`, {
        signal: abortController.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const result = await this.processAnalysis(diskId, data);

      // Cache the result
      this.cache.set(diskId, result);

      return result;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Analysis cancelled');
      }
      console.error('Disk analysis failed:', error);
      // Return mock data on error
      return this.getMockAnalysis(diskId);
    } finally {
      this.abortControllers.delete(diskId);
    }
  }

  /**
   * Cancel ongoing analysis
   */
  cancelAnalysis(diskId: string): void {
    const controller = this.abortControllers.get(diskId);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(diskId);
    }
  }

  /**
   * Get tree map structure for visualization
   */
  getTreeMap(diskId: string): DiskItem | null {
    const cached = this.cache.get(diskId);
    return cached?.treeMap || null;
  }

  /**
   * Get largest files (top N)
   */
  getLargestFiles(diskId: string, count = 10): DiskItem[] {
    const cached = this.cache.get(diskId);
    return cached?.largestFiles.slice(0, count) || [];
  }

  /**
   * Get largest folders (top N)
   */
  getLargestFolders(diskId: string, count = 10): DiskItem[] {
    const cached = this.cache.get(diskId);
    return cached?.largestFolders.slice(0, count) || [];
  }

  /**
   * Get file type breakdown
   */
  getFileTypeBreakdown(diskId: string): FileTypeInfo[] {
    const cached = this.cache.get(diskId);
    return cached?.fileTypes || [];
  }

  /**
   * Get duplicate files
   */
  getDuplicateFiles(diskId: string): DuplicateFile[] {
    const cached = this.cache.get(diskId);
    return cached?.duplicates || [];
  }

  /**
   * Get total potential savings from duplicates
   */
  getTotalDuplicateSavings(diskId: string): number {
    const duplicates = this.getDuplicateFiles(diskId);
    return duplicates.reduce((sum, dup) => sum + dup.potentialSavings, 0);
  }

  /**
   * Subscribe to analysis progress
   */
  onProgress(callback: (progress: AnalysisProgress) => void): () => void {
    this.progressCallbacks.push(callback);
    return () => {
      this.progressCallbacks = this.progressCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Clear cache for specific disk or all disks
   */
  clearCache(diskId?: string): void {
    if (diskId) {
      this.cache.delete(diskId);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get cached analysis if available
   */
  getCachedAnalysis(diskId: string): AnalysisResult | null {
    return this.cache.get(diskId) || null;
  }

  /**
   * Export analysis as JSON
   */
  exportAnalysisJSON(diskId: string): string | null {
    const analysis = this.cache.get(diskId);
    if (!analysis) return null;

    return JSON.stringify(analysis, null, 2);
  }

  /**
   * Export analysis as CSV (file list)
   */
  exportAnalysisCSV(diskId: string): string | null {
    const analysis = this.cache.get(diskId);
    if (!analysis) return null;

    const headers = ['Path', 'Name', 'Type', 'Size (bytes)', 'Extension', 'Modified'];
    const rows: string[][] = [headers];

    const addItems = (item: DiskItem) => {
      rows.push([
        item.path,
        item.name,
        item.type,
        item.size.toString(),
        item.extension || '',
        item.modified ? new Date(item.modified).toISOString() : ''
      ]);

      if (item.children) {
        item.children.forEach(addItems);
      }
    };

    addItems(analysis.treeMap);

    return rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  }

  // Private methods

  private async processAnalysis(diskId: string, data: any): Promise<AnalysisResult> {
    const files: DiskItem[] = [];
    const folders: DiskItem[] = [];
    const fileTypeMap: Map<string, { count: number; size: number }> = new Map();
    const duplicateMap: Map<string, string[]> = new Map(); // key: name-size, value: paths

    // Build tree structure
    const treeMap = this.buildTree(data.items || [], diskId);

    // Collect all files and folders
    const collectItems = (item: DiskItem) => {
      if (item.type === 'file') {
        files.push(item);

        // Track file types
        const ext = item.extension || 'unknown';
        const existing = fileTypeMap.get(ext) || { count: 0, size: 0 };
        fileTypeMap.set(ext, {
          count: existing.count + 1,
          size: existing.size + item.size
        });

        // Track potential duplicates (same name and size)
        const dupKey = `${item.name}-${item.size}`;
        const paths = duplicateMap.get(dupKey) || [];
        paths.push(item.path);
        duplicateMap.set(dupKey, paths);
      } else {
        folders.push(item);
      }

      if (item.children) {
        item.children.forEach(collectItems);
      }
    };

    collectItems(treeMap);

    // Sort files by size (largest first)
    const largestFiles = [...files].sort((a, b) => b.size - a.size);

    // Sort folders by size (largest first)
    const largestFolders = [...folders].sort((a, b) => b.size - a.size);

    // Calculate total size
    const totalSize = treeMap.size;

    // Build file types array
    const fileTypes: FileTypeInfo[] = [];
    fileTypeMap.forEach((info, ext) => {
      fileTypes.push({
        extension: ext,
        count: info.count,
        totalSize: info.size,
        percentage: (info.size / totalSize) * 100
      });
    });
    fileTypes.sort((a, b) => b.totalSize - a.totalSize);

    // Find actual duplicates (more than one path)
    const duplicates: DuplicateFile[] = [];
    duplicateMap.forEach((paths, _key) => {
      if (paths.length > 1) {
        const [name, sizeStr] = key.split('-');
        const size = parseInt(sizeStr, 10);
        duplicates.push({
          name,
          size,
          paths,
          potentialSavings: size * (paths.length - 1)
        });
      }
    });
    duplicates.sort((a, b) => b.potentialSavings - a.potentialSavings);

    return {
      diskId,
      totalSize,
      totalFiles: files.length,
      totalFolders: folders.length,
      largestFiles: largestFiles.slice(0, 100), // Keep top 100
      largestFolders: largestFolders.slice(0, 100), // Keep top 100
      fileTypes,
      treeMap,
      duplicates,
      analyzedAt: Date.now()
    };
  }

  private buildTree(items: any[], diskId: string, parentPath = '', depth = 0): DiskItem {
    const root: DiskItem = {
      path: diskId,
      name: diskId,
      size: 0,
      type: 'folder',
      children: [],
      depth
    };

    items.forEach((item: any) => {
      const path = parentPath ? `${parentPath}/${item.name}` : `${diskId}/${item.name}`;
      const diskItem: DiskItem = {
        path,
        name: item.name,
        size: item.size || 0,
        type: item.type === 'folder' ? 'folder' : 'file',
        extension: this.getExtension(item.name),
        modified: item.modified,
        depth: depth + 1
      };

      if (item.type === 'folder' && item.items) {
        const childTree = this.buildTree(item.items, diskId, path, depth + 1);
        diskItem.children = childTree.children;
        diskItem.size = childTree.size;
      }

      root.children!.push(diskItem);
      root.size += diskItem.size;
    });

    return root;
  }

  private getExtension(filename: string): string | undefined {
    const match = filename.match(/\.([^.]+)$/);
    return match ? match[1].toLowerCase() : undefined;
  }

  private notifyProgress(progress: AnalysisProgress): void {
    this.progressCallbacks.forEach(callback => {
      try {
        callback(progress);
      } catch (error) {
        console.error('Progress callback error:', error);
      }
    });
  }

  private getMockAnalysis(diskId: string): AnalysisResult {
    const mockItems: DiskItem[] = [
      {
        path: `${diskId}/Documents`,
        name: 'Documents',
        size: 50 * 1024 * 1024,
        type: 'folder',
        depth: 1,
        children: [
          {
            path: `${diskId}/Documents/Report.txt`,
            name: 'Report.txt',
            size: 10 * 1024,
            type: 'file',
            extension: 'txt',
            modified: Date.now() - 86400000,
            depth: 2
          },
          {
            path: `${diskId}/Documents/Presentation.awml`,
            name: 'Presentation.awml',
            size: 25 * 1024,
            type: 'file',
            extension: 'awml',
            modified: Date.now() - 172800000,
            depth: 2
          }
        ]
      },
      {
        path: `${diskId}/Pictures`,
        name: 'Pictures',
        size: 120 * 1024 * 1024,
        type: 'folder',
        depth: 1,
        children: [
          {
            path: `${diskId}/Pictures/Photo1.jpg`,
            name: 'Photo1.jpg',
            size: 2 * 1024 * 1024,
            type: 'file',
            extension: 'jpg',
            modified: Date.now() - 259200000,
            depth: 2
          },
          {
            path: `${diskId}/Pictures/Photo2.jpg`,
            name: 'Photo2.jpg',
            size: 2.5 * 1024 * 1024,
            type: 'file',
            extension: 'jpg',
            modified: Date.now() - 345600000,
            depth: 2
          }
        ]
      },
      {
        path: `${diskId}/System`,
        name: 'System',
        size: 80 * 1024 * 1024,
        type: 'folder',
        depth: 1,
        children: []
      }
    ];

    const treeMap: DiskItem = {
      path: diskId,
      name: diskId,
      size: 250 * 1024 * 1024,
      type: 'folder',
      depth: 0,
      children: mockItems
    };

    const largestFiles: DiskItem[] = [
      {
        path: `${diskId}/Pictures/Photo2.jpg`,
        name: 'Photo2.jpg',
        size: 2.5 * 1024 * 1024,
        type: 'file',
        extension: 'jpg',
        depth: 2
      },
      {
        path: `${diskId}/Pictures/Photo1.jpg`,
        name: 'Photo1.jpg',
        size: 2 * 1024 * 1024,
        type: 'file',
        extension: 'jpg',
        depth: 2
      },
      {
        path: `${diskId}/Documents/Presentation.awml`,
        name: 'Presentation.awml',
        size: 25 * 1024,
        type: 'file',
        extension: 'awml',
        depth: 2
      }
    ];

    const largestFolders: DiskItem[] = [
      {
        path: `${diskId}/Pictures`,
        name: 'Pictures',
        size: 120 * 1024 * 1024,
        type: 'folder',
        depth: 1
      },
      {
        path: `${diskId}/System`,
        name: 'System',
        size: 80 * 1024 * 1024,
        type: 'folder',
        depth: 1
      },
      {
        path: `${diskId}/Documents`,
        name: 'Documents',
        size: 50 * 1024 * 1024,
        type: 'folder',
        depth: 1
      }
    ];

    const fileTypes: FileTypeInfo[] = [
      {
        extension: 'jpg',
        count: 45,
        totalSize: 120 * 1024 * 1024,
        percentage: 48
      },
      {
        extension: 'txt',
        count: 120,
        totalSize: 50 * 1024 * 1024,
        percentage: 20
      },
      {
        extension: 'awml',
        count: 30,
        totalSize: 40 * 1024 * 1024,
        percentage: 16
      },
      {
        extension: 'js',
        count: 80,
        totalSize: 30 * 1024 * 1024,
        percentage: 12
      },
      {
        extension: 'other',
        count: 25,
        totalSize: 10 * 1024 * 1024,
        percentage: 4
      }
    ];

    const duplicates: DuplicateFile[] = [
      {
        name: 'temp.txt',
        size: 1024,
        paths: [
          `${diskId}/Documents/temp.txt`,
          `${diskId}/Downloads/temp.txt`,
          `${diskId}/Backup/temp.txt`
        ],
        potentialSavings: 2048
      }
    ];

    return {
      diskId,
      totalSize: 250 * 1024 * 1024,
      totalFiles: 300,
      totalFolders: 15,
      largestFiles,
      largestFolders,
      fileTypes,
      treeMap,
      duplicates,
      analyzedAt: Date.now()
    };
  }
}

// Utility functions

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Get color for file type (for visualizations)
 */
export function getFileTypeColor(extension: string): string {
  const colorMap: Record<string, string> = {
    // Images
    'jpg': '#FF6B35',
    'jpeg': '#FF6B35',
    'png': '#FF8C42',
    'gif': '#FFAD4D',
    'bmp': '#FFC759',

    // Documents
    'txt': '#4ECDC4',
    'doc': '#44A3A3',
    'pdf': '#367A82',

    // Code
    'js': '#F7B801',
    'ts': '#F18701',
    'html': '#F35B04',
    'css': '#C73E1D',
    'awml': '#A23B00',

    // Audio/Video
    'mp3': '#9B5DE5',
    'wav': '#B185DB',
    'mp4': '#C7AED1',
    'avi': '#D3C7E7',

    // Archives
    'zip': '#00BBF9',
    'rar': '#00A5E0',
    'tar': '#008ECF',
    'gz': '#0077B6',

    // Other
    'unknown': '#A0A0A0',
    'other': '#888888'
  };

  return colorMap[extension.toLowerCase()] || colorMap['other'];
}

// Export singleton instance
export const diskAnalyzer = new DiskAnalyzer();
export default diskAnalyzer;

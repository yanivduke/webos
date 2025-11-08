/**
 * Optimization Suggestions - System optimization recommendations engine
 * Analyzes system and generates actionable optimization suggestions
 */

import { diskAnalyzer, type DiskItem } from './disk-analyzer';
import { resourceMonitor } from './resource-monitor';

export type SuggestionType =
  | 'large-files'
  | 'duplicates'
  | 'empty-folders'
  | 'temp-files'
  | 'old-downloads'
  | 'large-logs'
  | 'unused-apps'
  | 'cache-cleanup'
  | 'memory-optimization'
  | 'disk-fragmentation';

export type SuggestionSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface OptimizationSuggestion {
  id: string;
  type: SuggestionType;
  severity: SuggestionSeverity;
  title: string;
  description: string;
  potentialSavings: number; // Bytes
  affectedItems: string[]; // File/folder paths
  action: {
    type: 'delete' | 'move' | 'compress' | 'defragment' | 'configure';
    label: string;
    description: string;
  };
  autoFixable: boolean;
  createdAt: number;
}

export interface OptimizationReport {
  totalSuggestions: number;
  totalPotentialSavings: number;
  suggestionsByType: Record<SuggestionType, number>;
  suggestionsBySeverity: Record<SuggestionSeverity, number>;
  suggestions: OptimizationSuggestion[];
  generatedAt: number;
}

export interface CleanupResult {
  success: boolean;
  freedSpace: number;
  itemsProcessed: number;
  itemsFailed: number;
  errors: string[];
}

class OptimizationEngine {
  private suggestions: OptimizationSuggestion[] = [];
  private ignoredSuggestions: Set<string> = new Set();
  private readonly STORAGE_KEY = 'webos_ignored_suggestions';

  // Thresholds
  private readonly LARGE_FILE_THRESHOLD = 10 * 1024 * 1024; // 10MB
  private readonly OLD_FILE_DAYS = 30;
  private readonly TEMP_EXTENSIONS = ['.tmp', '.temp', '.cache', '.bak', '.old'];
  private readonly LOG_EXTENSIONS = ['.log', '.txt'];
  private readonly MAX_LOG_SIZE = 5 * 1024 * 1024; // 5MB

  constructor() {
    this.loadIgnoredSuggestions();
  }

  /**
   * Analyze system and generate optimization suggestions
   */
  async generateSuggestions(diskId?: string): Promise<OptimizationReport> {
    this.suggestions = [];

    try {
      // Get system resources
      const resources = await resourceMonitor.getCurrentResources();

      // Analyze each disk or specific disk
      const disks = diskId
        ? resources.disks.filter(d => d.id === diskId)
        : resources.disks;

      for (const disk of disks) {
        await this.analyzeDisk(disk.id);
      }

      // Add memory optimization suggestions
      if (resources.memory.percentage > 80) {
        this.addMemoryOptimizationSuggestion(resources.memory.percentage);
      }

      // Filter out ignored suggestions
      const activeSuggestions = this.suggestions.filter(
        s => !this.ignoredSuggestions.has(s.id)
      );

      return this.buildReport(activeSuggestions);
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
      return this.buildReport([]);
    }
  }

  /**
   * Execute cleanup for specific suggestion
   */
  async executeSuggestion(suggestionId: string): Promise<CleanupResult> {
    const suggestion = this.suggestions.find(s => s.id === suggestionId);
    if (!suggestion) {
      return {
        success: false,
        freedSpace: 0,
        itemsProcessed: 0,
        itemsFailed: 0,
        errors: ['Suggestion not found']
      };
    }

    try {
      const response = await fetch('/api/monitor/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          suggestionId,
          type: suggestion.type,
          items: suggestion.affectedItems,
          action: suggestion.action.type
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: CleanupResult = await response.json();

      // Remove suggestion if successful
      if (result.success) {
        this.suggestions = this.suggestions.filter(s => s.id !== suggestionId);
      }

      return result;
    } catch (error) {
      console.error('Cleanup failed:', error);
      return {
        success: false,
        freedSpace: 0,
        itemsProcessed: 0,
        itemsFailed: suggestion.affectedItems.length,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Execute all auto-fixable suggestions
   */
  async executeAllAutoFix(): Promise<CleanupResult> {
    const autoFixable = this.suggestions.filter(s => s.autoFixable);
    const results: CleanupResult[] = [];

    for (const suggestion of autoFixable) {
      const result = await this.executeSuggestion(suggestion.id);
      results.push(result);
    }

    // Aggregate results
    return {
      success: results.every(r => r.success),
      freedSpace: results.reduce((sum, r) => sum + r.freedSpace, 0),
      itemsProcessed: results.reduce((sum, r) => sum + r.itemsProcessed, 0),
      itemsFailed: results.reduce((sum, r) => sum + r.itemsFailed, 0),
      errors: results.flatMap(r => r.errors)
    };
  }

  /**
   * Ignore a suggestion
   */
  ignoreSuggestion(suggestionId: string): void {
    this.ignoredSuggestions.add(suggestionId);
    this.saveIgnoredSuggestions();
  }

  /**
   * Unignore a suggestion
   */
  unignoreSuggestion(suggestionId: string): void {
    this.ignoredSuggestions.delete(suggestionId);
    this.saveIgnoredSuggestions();
  }

  /**
   * Clear all ignored suggestions
   */
  clearIgnored(): void {
    this.ignoredSuggestions.clear();
    this.saveIgnoredSuggestions();
  }

  /**
   * Get current suggestions
   */
  getSuggestions(): OptimizationSuggestion[] {
    return this.suggestions.filter(s => !this.ignoredSuggestions.has(s.id));
  }

  /**
   * Get suggestion by ID
   */
  getSuggestion(id: string): OptimizationSuggestion | undefined {
    return this.suggestions.find(s => s.id === id);
  }

  // Private methods

  private async analyzeDisk(diskId: string): Promise<void> {
    // Get disk analysis
    const analysis = await diskAnalyzer.analyzeDisk(diskId);

    // Check for large files
    this.findLargeFiles(analysis.largestFiles, diskId);

    // Check for duplicates
    this.findDuplicates(analysis.duplicates, diskId);

    // Check for empty folders
    this.findEmptyFolders(analysis.treeMap, diskId);

    // Check for temp files
    this.findTempFiles(analysis.treeMap, diskId);

    // Check for old downloads
    this.findOldDownloads(analysis.treeMap, diskId);

    // Check for large logs
    this.findLargeLogs(analysis.largestFiles, diskId);

    // Check for cache files
    this.findCacheFiles(analysis.treeMap, diskId);
  }

  private findLargeFiles(files: DiskItem[], diskId: string): void {
    const largeFiles = files.filter(f => f.size >= this.LARGE_FILE_THRESHOLD);

    if (largeFiles.length === 0) return;

    const totalSize = largeFiles.reduce((sum, f) => sum + f.size, 0);

    this.suggestions.push({
      id: `large-files-${diskId}-${Date.now()}`,
      type: 'large-files',
      severity: this.calculateSeverity(totalSize),
      title: `${largeFiles.length} Large Files Found`,
      description: `Found ${largeFiles.length} files larger than 10MB that may be candidates for cleanup or archival.`,
      potentialSavings: totalSize,
      affectedItems: largeFiles.map(f => f.path),
      action: {
        type: 'move',
        label: 'Review Files',
        description: 'Review large files and decide which to keep, archive, or delete'
      },
      autoFixable: false,
      createdAt: Date.now()
    });
  }

  private findDuplicates(duplicates: any[], diskId: string): void {
    if (duplicates.length === 0) return;

    const totalSavings = duplicates.reduce((sum, d) => sum + d.potentialSavings, 0);
    const affectedPaths = duplicates.flatMap(d => d.paths);

    this.suggestions.push({
      id: `duplicates-${diskId}-${Date.now()}`,
      type: 'duplicates',
      severity: this.calculateSeverity(totalSavings),
      title: `${duplicates.length} Duplicate Files Found`,
      description: `Found ${duplicates.length} sets of duplicate files. Removing duplicates could free significant space.`,
      potentialSavings: totalSavings,
      affectedItems: affectedPaths,
      action: {
        type: 'delete',
        label: 'Remove Duplicates',
        description: 'Keep one copy of each duplicate file and delete the rest'
      },
      autoFixable: true,
      createdAt: Date.now()
    });
  }

  private findEmptyFolders(tree: DiskItem, diskId: string): void {
    const emptyFolders: string[] = [];

    const checkFolder = (item: DiskItem) => {
      if (item.type === 'folder' && (!item.children || item.children.length === 0)) {
        emptyFolders.push(item.path);
      }

      if (item.children) {
        item.children.forEach(checkFolder);
      }
    };

    checkFolder(tree);

    if (emptyFolders.length === 0) return;

    this.suggestions.push({
      id: `empty-folders-${diskId}-${Date.now()}`,
      type: 'empty-folders',
      severity: 'low',
      title: `${emptyFolders.length} Empty Folders`,
      description: `Found ${emptyFolders.length} empty folders that can be safely removed.`,
      potentialSavings: 0,
      affectedItems: emptyFolders,
      action: {
        type: 'delete',
        label: 'Remove Empty Folders',
        description: 'Delete all empty folders to clean up directory structure'
      },
      autoFixable: true,
      createdAt: Date.now()
    });
  }

  private findTempFiles(tree: DiskItem, diskId: string): void {
    const tempFiles: DiskItem[] = [];

    const checkItem = (item: DiskItem) => {
      if (item.type === 'file' && item.extension) {
        if (this.TEMP_EXTENSIONS.includes(`.${item.extension}`)) {
          tempFiles.push(item);
        }
      }

      if (item.children) {
        item.children.forEach(checkItem);
      }
    };

    checkItem(tree);

    if (tempFiles.length === 0) return;

    const totalSize = tempFiles.reduce((sum, f) => sum + f.size, 0);

    this.suggestions.push({
      id: `temp-files-${diskId}-${Date.now()}`,
      type: 'temp-files',
      severity: this.calculateSeverity(totalSize),
      title: `${tempFiles.length} Temporary Files`,
      description: `Found ${tempFiles.length} temporary files (.tmp, .cache, .bak) that can be safely deleted.`,
      potentialSavings: totalSize,
      affectedItems: tempFiles.map(f => f.path),
      action: {
        type: 'delete',
        label: 'Delete Temp Files',
        description: 'Remove all temporary and backup files'
      },
      autoFixable: true,
      createdAt: Date.now()
    });
  }

  private findOldDownloads(tree: DiskItem, diskId: string): void {
    const oldFiles: DiskItem[] = [];
    const cutoffDate = Date.now() - this.OLD_FILE_DAYS * 24 * 60 * 60 * 1000;

    const checkItem = (item: DiskItem) => {
      // Check if in Downloads folder
      if (item.path.includes('/Downloads/') || item.path.includes('/Download/')) {
        if (item.type === 'file' && item.modified && item.modified < cutoffDate) {
          oldFiles.push(item);
        }
      }

      if (item.children) {
        item.children.forEach(checkItem);
      }
    };

    checkItem(tree);

    if (oldFiles.length === 0) return;

    const totalSize = oldFiles.reduce((sum, f) => sum + f.size, 0);

    this.suggestions.push({
      id: `old-downloads-${diskId}-${Date.now()}`,
      type: 'old-downloads',
      severity: this.calculateSeverity(totalSize),
      title: `${oldFiles.length} Old Downloads`,
      description: `Found ${oldFiles.length} files in Downloads older than ${this.OLD_FILE_DAYS} days.`,
      potentialSavings: totalSize,
      affectedItems: oldFiles.map(f => f.path),
      action: {
        type: 'delete',
        label: 'Clean Old Downloads',
        description: 'Remove old files from Downloads folder'
      },
      autoFixable: false,
      createdAt: Date.now()
    });
  }

  private findLargeLogs(files: DiskItem[], diskId: string): void {
    const largeLogs = files.filter(f => {
      if (!f.extension) return false;
      return this.LOG_EXTENSIONS.includes(`.${f.extension}`) && f.size >= this.MAX_LOG_SIZE;
    });

    if (largeLogs.length === 0) return;

    const totalSize = largeLogs.reduce((sum, f) => sum + f.size, 0);

    this.suggestions.push({
      id: `large-logs-${diskId}-${Date.now()}`,
      type: 'large-logs',
      severity: this.calculateSeverity(totalSize),
      title: `${largeLogs.length} Large Log Files`,
      description: `Found ${largeLogs.length} log files larger than 5MB that can be archived or deleted.`,
      potentialSavings: totalSize,
      affectedItems: largeLogs.map(f => f.path),
      action: {
        type: 'compress',
        label: 'Archive Logs',
        description: 'Compress old log files to save space'
      },
      autoFixable: true,
      createdAt: Date.now()
    });
  }

  private findCacheFiles(tree: DiskItem, diskId: string): void {
    const cacheFiles: DiskItem[] = [];

    const checkItem = (item: DiskItem) => {
      // Check if in cache folder
      if (item.path.toLowerCase().includes('/cache/') ||
          item.path.toLowerCase().includes('/.cache/') ||
          item.name.toLowerCase().includes('cache')) {
        if (item.type === 'file') {
          cacheFiles.push(item);
        }
      }

      if (item.children) {
        item.children.forEach(checkItem);
      }
    };

    checkItem(tree);

    if (cacheFiles.length === 0) return;

    const totalSize = cacheFiles.reduce((sum, f) => sum + f.size, 0);

    // Only suggest if cache is substantial
    if (totalSize < 1024 * 1024) return; // Less than 1MB

    this.suggestions.push({
      id: `cache-cleanup-${diskId}-${Date.now()}`,
      type: 'cache-cleanup',
      severity: this.calculateSeverity(totalSize),
      title: `Cache Cleanup Available`,
      description: `Found ${cacheFiles.length} cache files taking up space. Clearing cache is safe and can improve performance.`,
      potentialSavings: totalSize,
      affectedItems: cacheFiles.map(f => f.path),
      action: {
        type: 'delete',
        label: 'Clear Cache',
        description: 'Delete all cache files'
      },
      autoFixable: true,
      createdAt: Date.now()
    });
  }

  private addMemoryOptimizationSuggestion(memoryPercent: number): void {
    this.suggestions.push({
      id: `memory-optimization-${Date.now()}`,
      type: 'memory-optimization',
      severity: memoryPercent > 95 ? 'critical' : 'high',
      title: 'High Memory Usage',
      description: `Memory usage is at ${memoryPercent.toFixed(1)}%. Consider closing unused applications or increasing system memory.`,
      potentialSavings: 0,
      affectedItems: [],
      action: {
        type: 'configure',
        label: 'Review Processes',
        description: 'Open Task Manager to identify and close memory-intensive processes'
      },
      autoFixable: false,
      createdAt: Date.now()
    });
  }

  private calculateSeverity(bytes: number): SuggestionSeverity {
    const mb = bytes / (1024 * 1024);

    if (mb >= 500) return 'critical';
    if (mb >= 100) return 'high';
    if (mb >= 10) return 'medium';
    return 'low';
  }

  private buildReport(suggestions: OptimizationSuggestion[]): OptimizationReport {
    const totalPotentialSavings = suggestions.reduce(
      (sum, s) => sum + s.potentialSavings,
      0
    );

    const suggestionsByType: Record<string, number> = {};
    const suggestionsBySeverity: Record<string, number> = {};

    suggestions.forEach(s => {
      suggestionsByType[s.type] = (suggestionsByType[s.type] || 0) + 1;
      suggestionsBySeverity[s.severity] = (suggestionsBySeverity[s.severity] || 0) + 1;
    });

    return {
      totalSuggestions: suggestions.length,
      totalPotentialSavings,
      suggestionsByType: suggestionsByType as any,
      suggestionsBySeverity: suggestionsBySeverity as any,
      suggestions,
      generatedAt: Date.now()
    };
  }

  private saveIgnoredSuggestions(): void {
    try {
      localStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify(Array.from(this.ignoredSuggestions))
      );
    } catch (error) {
      console.error('Failed to save ignored suggestions:', error);
    }
  }

  private loadIgnoredSuggestions(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.ignoredSuggestions = new Set(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load ignored suggestions:', error);
    }
  }
}

// Export singleton instance
export const optimizationEngine = new OptimizationEngine();
export default optimizationEngine;

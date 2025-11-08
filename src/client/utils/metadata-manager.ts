/**
 * Metadata Manager for WebOS
 * Manages file metadata including tags, labels, ratings, and custom properties
 */

export interface FileNote {
  id: string;
  text: string;
  timestamp: number;
  author?: string;
}

export interface FileMetadata {
  // Basic properties
  name: string;
  path: string;
  size: number;
  type: string;
  created: number;
  modified: number;

  // Extended properties
  permissions?: {
    read: boolean;
    write: boolean;
    execute: boolean;
  };
  owner?: string;
  group?: string;
  hidden?: boolean;

  // Custom properties
  tags: string[];
  labels: string[];
  rating: number; // 0-5 (0 = no rating)
  color: string | null; // red, orange, yellow, green, blue, purple, gray, null
  comments: string;
  notes: FileNote[];

  // Additional metadata
  lastAccessed?: number;
  description?: string;
  category?: string;

  // File-type specific metadata
  imageMetadata?: {
    width?: number;
    height?: number;
    format?: string;
    colorSpace?: string;
  };
  textMetadata?: {
    lineCount?: number;
    wordCount?: number;
    characterCount?: number;
  };
  archiveMetadata?: {
    compressedSize?: number;
    fileCount?: number;
    compressionRatio?: number;
  };
}

export interface MetadataSearchCriteria {
  tags?: string[];
  rating?: number;
  color?: string | null;
  type?: string;
  minSize?: number;
  maxSize?: number;
  createdAfter?: number;
  createdBefore?: number;
  modifiedAfter?: number;
  modifiedBefore?: number;
  searchText?: string; // Search in name, comments, notes
}

export interface Tag {
  name: string;
  color: string;
  count: number;
  created: number;
}

// Color label definitions (Amiga-style colors)
export const COLOR_LABELS = {
  red: '#cc0000',
  orange: '#ff8800',
  yellow: '#ffcc00',
  green: '#00aa00',
  blue: '#0055aa',
  purple: '#8800cc',
  gray: '#888888',
} as const;

export type ColorLabel = keyof typeof COLOR_LABELS | null;

// Predefined tags
export const PREDEFINED_TAGS = [
  { name: 'Important', color: '#cc0000' },
  { name: 'Work', color: '#0055aa' },
  { name: 'Personal', color: '#00aa00' },
  { name: 'Archive', color: '#888888' },
  { name: 'Todo', color: '#ff8800' },
  { name: 'Review', color: '#8800cc' },
];

class MetadataManager {
  private metadata: Map<string, FileMetadata>;
  private tags: Map<string, Tag>;
  private storageKey = 'webos_file_metadata';
  private tagsKey = 'webos_tags';

  constructor() {
    this.metadata = new Map();
    this.tags = new Map();
    this.loadFromStorage();
    this.initializePredefinedTags();
  }

  /**
   * Initialize predefined tags if they don't exist
   */
  private initializePredefinedTags(): void {
    PREDEFINED_TAGS.forEach(tag => {
      if (!this.tags.has(tag.name)) {
        this.tags.set(tag.name, {
          name: tag.name,
          color: tag.color,
          count: 0,
          created: Date.now(),
        });
      }
    });
    this.saveTagsToStorage();
  }

  /**
   * Load metadata from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.metadata = new Map(Object.entries(data));
      }

      const storedTags = localStorage.getItem(this.tagsKey);
      if (storedTags) {
        const tagsData = JSON.parse(storedTags);
        this.tags = new Map(Object.entries(tagsData));
      }
    } catch (error) {
      console.error('Failed to load metadata from storage:', error);
    }
  }

  /**
   * Save metadata to localStorage
   */
  private saveToStorage(): void {
    try {
      const data = Object.fromEntries(this.metadata);
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save metadata to storage:', error);
    }
  }

  /**
   * Save tags to localStorage
   */
  private saveTagsToStorage(): void {
    try {
      const data = Object.fromEntries(this.tags);
      localStorage.setItem(this.tagsKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save tags to storage:', error);
    }
  }

  /**
   * Get metadata for a file
   */
  getMetadata(filePath: string): FileMetadata | null {
    return this.metadata.get(filePath) || null;
  }

  /**
   * Set metadata for a file
   */
  setMetadata(filePath: string, metadata: Partial<FileMetadata>): void {
    const existing = this.metadata.get(filePath);
    const updated = {
      ...existing,
      ...metadata,
      path: filePath,
    } as FileMetadata;

    // Update tag counts
    if (existing && existing.tags) {
      existing.tags.forEach(tag => {
        this.decrementTagCount(tag);
      });
    }
    if (updated.tags) {
      updated.tags.forEach(tag => {
        this.incrementTagCount(tag);
      });
    }

    this.metadata.set(filePath, updated);
    this.saveToStorage();
  }

  /**
   * Create default metadata for a file
   */
  createDefaultMetadata(filePath: string, name: string, type: string, size: number): FileMetadata {
    const now = Date.now();
    return {
      name,
      path: filePath,
      size,
      type,
      created: now,
      modified: now,
      tags: [],
      labels: [],
      rating: 0,
      color: null,
      comments: '',
      notes: [],
      permissions: {
        read: true,
        write: true,
        execute: false,
      },
    };
  }

  /**
   * Add a tag to a file
   */
  addTag(filePath: string, tag: string): void {
    const metadata = this.metadata.get(filePath);
    if (!metadata) {
      console.warn(`No metadata found for ${filePath}`);
      return;
    }

    if (!metadata.tags.includes(tag)) {
      metadata.tags.push(tag);
      this.incrementTagCount(tag);
      this.saveToStorage();
    }
  }

  /**
   * Remove a tag from a file
   */
  removeTag(filePath: string, tag: string): void {
    const metadata = this.metadata.get(filePath);
    if (!metadata) {
      return;
    }

    const index = metadata.tags.indexOf(tag);
    if (index > -1) {
      metadata.tags.splice(index, 1);
      this.decrementTagCount(tag);
      this.saveToStorage();
    }
  }

  /**
   * Set rating for a file
   */
  setRating(filePath: string, rating: number): void {
    const metadata = this.metadata.get(filePath);
    if (!metadata) {
      return;
    }

    metadata.rating = Math.max(0, Math.min(5, rating));
    this.saveToStorage();
  }

  /**
   * Set color label for a file
   */
  setColor(filePath: string, color: ColorLabel): void {
    const metadata = this.metadata.get(filePath);
    if (!metadata) {
      return;
    }

    metadata.color = color;
    this.saveToStorage();
  }

  /**
   * Add a comment to a file
   */
  addComment(filePath: string, comment: string): void {
    const metadata = this.metadata.get(filePath);
    if (!metadata) {
      return;
    }

    metadata.comments = comment;
    this.saveToStorage();
  }

  /**
   * Add a note to a file
   */
  addNote(filePath: string, text: string, author?: string): void {
    const metadata = this.metadata.get(filePath);
    if (!metadata) {
      return;
    }

    const note: FileNote = {
      id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text,
      timestamp: Date.now(),
      author,
    };

    metadata.notes.push(note);
    this.saveToStorage();
  }

  /**
   * Remove a note from a file
   */
  removeNote(filePath: string, noteId: string): void {
    const metadata = this.metadata.get(filePath);
    if (!metadata) {
      return;
    }

    const index = metadata.notes.findIndex(note => note.id === noteId);
    if (index > -1) {
      metadata.notes.splice(index, 1);
      this.saveToStorage();
    }
  }

  /**
   * Clear all notes from a file
   */
  clearNotes(filePath: string): void {
    const metadata = this.metadata.get(filePath);
    if (!metadata) {
      return;
    }

    metadata.notes = [];
    this.saveToStorage();
  }

  /**
   * Search files by metadata criteria
   */
  searchByMetadata(criteria: MetadataSearchCriteria): FileMetadata[] {
    const results: FileMetadata[] = [];

    for (const [path, metadata] of this.metadata) {
      let matches = true;

      // Check tags
      if (criteria.tags && criteria.tags.length > 0) {
        const hasAllTags = criteria.tags.every(tag => metadata.tags.includes(tag));
        if (!hasAllTags) {
          matches = false;
        }
      }

      // Check rating
      if (criteria.rating !== undefined && metadata.rating !== criteria.rating) {
        matches = false;
      }

      // Check color
      if (criteria.color !== undefined && metadata.color !== criteria.color) {
        matches = false;
      }

      // Check type
      if (criteria.type && metadata.type !== criteria.type) {
        matches = false;
      }

      // Check size range
      if (criteria.minSize !== undefined && metadata.size < criteria.minSize) {
        matches = false;
      }
      if (criteria.maxSize !== undefined && metadata.size > criteria.maxSize) {
        matches = false;
      }

      // Check creation date range
      if (criteria.createdAfter !== undefined && metadata.created < criteria.createdAfter) {
        matches = false;
      }
      if (criteria.createdBefore !== undefined && metadata.created > criteria.createdBefore) {
        matches = false;
      }

      // Check modification date range
      if (criteria.modifiedAfter !== undefined && metadata.modified < criteria.modifiedAfter) {
        matches = false;
      }
      if (criteria.modifiedBefore !== undefined && metadata.modified > criteria.modifiedBefore) {
        matches = false;
      }

      // Check search text
      if (criteria.searchText) {
        const searchLower = criteria.searchText.toLowerCase();
        const nameMatch = metadata.name.toLowerCase().includes(searchLower);
        const commentMatch = metadata.comments.toLowerCase().includes(searchLower);
        const notesMatch = metadata.notes.some(note =>
          note.text.toLowerCase().includes(searchLower)
        );

        if (!nameMatch && !commentMatch && !notesMatch) {
          matches = false;
        }
      }

      if (matches) {
        results.push(metadata);
      }
    }

    return results;
  }

  /**
   * Get all tags
   */
  getAllTags(): Tag[] {
    return Array.from(this.tags.values());
  }

  /**
   * Get tag by name
   */
  getTag(name: string): Tag | null {
    return this.tags.get(name) || null;
  }

  /**
   * Create a new tag
   */
  createTag(name: string, color: string): void {
    if (!this.tags.has(name)) {
      this.tags.set(name, {
        name,
        color,
        count: 0,
        created: Date.now(),
      });
      this.saveTagsToStorage();
    }
  }

  /**
   * Delete a tag
   */
  deleteTag(name: string): void {
    // Remove tag from all files
    for (const [path, metadata] of this.metadata) {
      const index = metadata.tags.indexOf(name);
      if (index > -1) {
        metadata.tags.splice(index, 1);
      }
    }

    this.tags.delete(name);
    this.saveToStorage();
    this.saveTagsToStorage();
  }

  /**
   * Rename a tag
   */
  renameTag(oldName: string, newName: string): void {
    const tag = this.tags.get(oldName);
    if (!tag) {
      return;
    }

    // Update tag name in all files
    for (const [path, metadata] of this.metadata) {
      const index = metadata.tags.indexOf(oldName);
      if (index > -1) {
        metadata.tags[index] = newName;
      }
    }

    // Update tag in tags map
    tag.name = newName;
    this.tags.delete(oldName);
    this.tags.set(newName, tag);

    this.saveToStorage();
    this.saveTagsToStorage();
  }

  /**
   * Get files by tag
   */
  getFilesByTag(tagName: string): FileMetadata[] {
    const results: FileMetadata[] = [];

    for (const [path, metadata] of this.metadata) {
      if (metadata.tags.includes(tagName)) {
        results.push(metadata);
      }
    }

    return results;
  }

  /**
   * Get most used tags
   */
  getMostUsedTags(limit: number = 10): Tag[] {
    return Array.from(this.tags.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Get tag suggestions based on file type
   */
  getTagSuggestions(fileType: string): string[] {
    const suggestions: string[] = [];

    if (fileType.includes('image')) {
      suggestions.push('Photo', 'Screenshot', 'Design', 'Artwork');
    } else if (fileType.includes('text') || fileType.includes('document')) {
      suggestions.push('Document', 'Notes', 'Draft', 'Work');
    } else if (fileType.includes('video')) {
      suggestions.push('Video', 'Movie', 'Tutorial', 'Recording');
    } else if (fileType.includes('audio')) {
      suggestions.push('Music', 'Audio', 'Podcast', 'Sound');
    } else if (fileType.includes('archive') || fileType.includes('zip')) {
      suggestions.push('Archive', 'Backup', 'Download');
    } else if (fileType.includes('code') || fileType.includes('script')) {
      suggestions.push('Code', 'Project', 'Development', 'Source');
    }

    return suggestions;
  }

  /**
   * Increment tag count
   */
  private incrementTagCount(tagName: string): void {
    let tag = this.tags.get(tagName);
    if (!tag) {
      // Create tag if it doesn't exist
      tag = {
        name: tagName,
        color: '#0055aa',
        count: 0,
        created: Date.now(),
      };
      this.tags.set(tagName, tag);
    }
    tag.count++;
    this.saveTagsToStorage();
  }

  /**
   * Decrement tag count
   */
  private decrementTagCount(tagName: string): void {
    const tag = this.tags.get(tagName);
    if (tag) {
      tag.count = Math.max(0, tag.count - 1);
      this.saveTagsToStorage();
    }
  }

  /**
   * Bulk update metadata for multiple files
   */
  bulkUpdate(filePaths: string[], updates: Partial<FileMetadata>): void {
    filePaths.forEach(_path => {
      const existing = this.metadata.get(path);
      if (existing) {
        // For tags, we want to add not replace
        if (updates.tags) {
          updates.tags.forEach(tag => {
            if (!existing.tags.includes(tag)) {
              this.addTag(path, tag);
            }
          });
          delete updates.tags; // Don't set tags in the update
        }

        this.setMetadata(path, { ...existing, ...updates });
      }
    });
  }

  /**
   * Clear all metadata for a file
   */
  clearMetadata(filePath: string): void {
    const metadata = this.metadata.get(filePath);
    if (metadata) {
      // Decrement tag counts
      metadata.tags.forEach(tag => {
        this.decrementTagCount(tag);
      });
    }

    this.metadata.delete(filePath);
    this.saveToStorage();
  }

  /**
   * Clear all metadata (reset)
   */
  clearAllMetadata(): void {
    this.metadata.clear();
    this.tags.clear();
    this.initializePredefinedTags();
    this.saveToStorage();
    this.saveTagsToStorage();
  }

  /**
   * Export metadata to JSON
   */
  exportMetadata(): string {
    const data = {
      metadata: Object.fromEntries(this.metadata),
      tags: Object.fromEntries(this.tags),
      exportDate: Date.now(),
      version: '1.0',
    };
    return JSON.stringify(data, null, 2);
  }

  /**
   * Import metadata from JSON
   */
  importMetadata(json: string): void {
    try {
      const data = JSON.parse(json);

      if (data.metadata) {
        this.metadata = new Map(Object.entries(data.metadata));
      }

      if (data.tags) {
        this.tags = new Map(Object.entries(data.tags));
      }

      this.saveToStorage();
      this.saveTagsToStorage();
    } catch (error) {
      console.error('Failed to import metadata:', error);
      throw error;
    }
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalFiles: number;
    totalTags: number;
    averageRating: number;
    colorDistribution: Record<string, number>;
    topTags: Tag[];
  } {
    const totalFiles = this.metadata.size;
    const totalTags = this.tags.size;

    let totalRating = 0;
    let ratedFiles = 0;
    const colorDistribution: Record<string, number> = {};

    for (const [path, metadata] of this.metadata) {
      if (metadata.rating > 0) {
        totalRating += metadata.rating;
        ratedFiles++;
      }

      if (metadata.color) {
        colorDistribution[metadata.color] = (colorDistribution[metadata.color] || 0) + 1;
      }
    }

    const averageRating = ratedFiles > 0 ? totalRating / ratedFiles : 0;
    const topTags = this.getMostUsedTags(5);

    return {
      totalFiles,
      totalTags,
      averageRating,
      colorDistribution,
      topTags,
    };
  }
}

// Singleton instance
export const metadataManager = new MetadataManager();

// Utility functions
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateShort(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getFileTypeIcon(type: string): string {
  if (type.includes('image')) return '🖼️';
  if (type.includes('video')) return '🎬';
  if (type.includes('audio')) return '🎵';
  if (type.includes('text')) return '📄';
  if (type.includes('pdf')) return '📕';
  if (type.includes('archive') || type.includes('zip')) return '📦';
  if (type.includes('code')) return '💻';
  return '📄';
}

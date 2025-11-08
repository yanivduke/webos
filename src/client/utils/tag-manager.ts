/**
 * Tag Manager for WebOS
 * Advanced tag management with autocomplete, suggestions, and statistics
 */

import { metadataManager, type Tag, type FileMetadata } from './metadata-manager';

export interface TagSuggestion {
  name: string;
  color: string;
  score: number; // Relevance score for sorting
  reason: string; // Why this tag is suggested
}

export interface TagStatistics {
  name: string;
  count: number;
  color: string;
  lastUsed: number;
  filesWithTag: string[];
  averageRating: number;
  sizeDistribution: {
    small: number; // < 1MB
    medium: number; // 1MB - 10MB
    large: number; // > 10MB
  };
}

class TagManager {
  private autocompleteCache: Map<string, TagSuggestion[]>;

  constructor() {
    this.autocompleteCache = new Map();
  }

  /**
   * Get all tags with statistics
   */
  getAllTags(): Tag[] {
    return metadataManager.getAllTags();
  }

  /**
   * Get tag by name
   */
  getTag(name: string): Tag | null {
    return metadataManager.getTag(name);
  }

  /**
   * Create a new tag
   */
  createTag(name: string, color: string = '#0055aa'): void {
    // Validate tag name
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new Error('Tag name cannot be empty');
    }

    if (trimmedName.length > 50) {
      throw new Error('Tag name is too long (max 50 characters)');
    }

    // Check if tag already exists (case insensitive)
    const existingTags = this.getAllTags();
    const exists = existingTags.some(
      tag => tag.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (exists) {
      throw new Error('Tag already exists');
    }

    metadataManager.createTag(trimmedName, color);
    this.clearAutocompleteCache();
  }

  /**
   * Delete a tag
   */
  deleteTag(name: string): void {
    metadataManager.deleteTag(name);
    this.clearAutocompleteCache();
  }

  /**
   * Rename a tag
   */
  renameTag(oldName: string, newName: string): void {
    const trimmedName = newName.trim();
    if (!trimmedName) {
      throw new Error('Tag name cannot be empty');
    }

    if (trimmedName.length > 50) {
      throw new Error('Tag name is too long (max 50 characters)');
    }

    // Check if new name already exists
    const existingTags = this.getAllTags();
    const exists = existingTags.some(
      tag => tag.name.toLowerCase() === trimmedName.toLowerCase() && tag.name !== oldName
    );

    if (exists) {
      throw new Error('A tag with this name already exists');
    }

    metadataManager.renameTag(oldName, trimmedName);
    this.clearAutocompleteCache();
  }

  /**
   * Change tag color
   */
  changeTagColor(name: string, color: string): void {
    const tag = metadataManager.getTag(name);
    if (!tag) {
      throw new Error('Tag not found');
    }

    tag.color = color;
    // This will trigger a save via the metadata manager
    metadataManager.createTag(name, color);
  }

  /**
   * Get files with a specific tag
   */
  getFilesByTag(tagName: string): FileMetadata[] {
    return metadataManager.getFilesByTag(tagName);
  }

  /**
   * Get most used tags
   */
  getMostUsedTags(limit: number = 10): Tag[] {
    return metadataManager.getMostUsedTags(limit);
  }

  /**
   * Get tag suggestions for autocomplete
   */
  getTagSuggestions(input: string, fileType?: string): TagSuggestion[] {
    const cacheKey = `${input}_${fileType || 'any'}`;

    // Check cache
    if (this.autocompleteCache.has(cacheKey)) {
      return this.autocompleteCache.get(cacheKey)!;
    }

    const suggestions: TagSuggestion[] = [];
    const inputLower = input.toLowerCase().trim();

    // Get all existing tags
    const allTags = this.getAllTags();

    // Add matching existing tags
    allTags.forEach(tag => {
      const tagLower = tag.name.toLowerCase();

      if (tagLower.includes(inputLower)) {
        const score = this.calculateMatchScore(tagLower, inputLower, tag.count);
        suggestions.push({
          name: tag.name,
          color: tag.color,
          score,
          reason: `Used ${tag.count} time${tag.count !== 1 ? 's' : ''}`,
        });
      }
    });

    // Add file type suggestions if applicable
    if (fileType) {
      const typeSuggestions = metadataManager.getTagSuggestions(fileType);
      typeSuggestions.forEach(tagName => {
        const nameLower = tagName.toLowerCase();
        if (nameLower.includes(inputLower) && !suggestions.some(s => s.name === tagName)) {
          suggestions.push({
            name: tagName,
            color: '#0055aa',
            score: 50,
            reason: 'Suggested for this file type',
          });
        }
      });
    }

    // Sort by score (highest first)
    suggestions.sort((a, b) => b.score - a.score);

    // Cache the results
    this.autocompleteCache.set(cacheKey, suggestions);

    return suggestions;
  }

  /**
   * Calculate match score for autocomplete
   */
  private calculateMatchScore(tagName: string, input: string, usageCount: number): number {
    let score = 0;

    // Exact match
    if (tagName === input) {
      score += 100;
    }
    // Starts with input
    else if (tagName.startsWith(input)) {
      score += 80;
    }
    // Contains input
    else if (tagName.includes(input)) {
      score += 60;
    }

    // Bonus for usage count
    score += Math.min(usageCount * 2, 40);

    // Penalty for length difference
    const lengthDiff = Math.abs(tagName.length - input.length);
    score -= lengthDiff * 0.5;

    return Math.max(0, score);
  }

  /**
   * Clear autocomplete cache
   */
  private clearAutocompleteCache(): void {
    this.autocompleteCache.clear();
  }

  /**
   * Get detailed statistics for a tag
   */
  getTagStatistics(tagName: string): TagStatistics | null {
    const tag = metadataManager.getTag(tagName);
    if (!tag) {
      return null;
    }

    const files = this.getFilesByTag(tagName);
    const filesWithTag = files.map(f => f.path);

    let totalRating = 0;
    let ratedCount = 0;
    const sizeDistribution = {
      small: 0,
      medium: 0,
      large: 0,
    };

    let lastUsed = 0;

    files.forEach(file => {
      // Calculate average rating
      if (file.rating > 0) {
        totalRating += file.rating;
        ratedCount++;
      }

      // Size distribution
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB < 1) {
        sizeDistribution.small++;
      } else if (sizeMB < 10) {
        sizeDistribution.medium++;
      } else {
        sizeDistribution.large++;
      }

      // Last used
      if (file.modified > lastUsed) {
        lastUsed = file.modified;
      }
    });

    const averageRating = ratedCount > 0 ? totalRating / ratedCount : 0;

    return {
      name: tag.name,
      count: tag.count,
      color: tag.color,
      lastUsed,
      filesWithTag,
      averageRating,
      sizeDistribution,
    };
  }

  /**
   * Get tag cloud data for visualization
   */
  getTagCloud(maxTags: number = 20): Array<{ name: string; size: number; color: string }> {
    const tags = this.getMostUsedTags(maxTags);

    if (tags.length === 0) {
      return [];
    }

    // Find min and max counts for normalization
    const counts = tags.map(t => t.count);
    const minCount = Math.min(...counts);
    const maxCount = Math.max(...counts);
    const range = maxCount - minCount || 1;

    // Normalize sizes to 1-5 scale
    return tags.map(tag => ({
      name: tag.name,
      size: minCount === maxCount ? 3 : Math.round(((tag.count - minCount) / range) * 4) + 1,
      color: tag.color,
    }));
  }

  /**
   * Get related tags (tags that appear together frequently)
   */
  getRelatedTags(tagName: string, limit: number = 5): Tag[] {
    const filesWithTag = this.getFilesByTag(tagName);

    if (filesWithTag.length === 0) {
      return [];
    }

    // Count co-occurrences
    const cooccurrences = new Map<string, number>();

    filesWithTag.forEach(file => {
      file.tags.forEach(otherTag => {
        if (otherTag !== tagName) {
          cooccurrences.set(otherTag, (cooccurrences.get(otherTag) || 0) + 1);
        }
      });
    });

    // Sort by count and get top tags
    const relatedTagNames = Array.from(cooccurrences.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([name]) => name);

    // Get full tag objects
    return relatedTagNames
      .map(name => metadataManager.getTag(name))
      .filter(tag => tag !== null) as Tag[];
  }

  /**
   * Merge two tags
   */
  mergeTags(sourceTag: string, targetTag: string): void {
    const source = metadataManager.getTag(sourceTag);
    const target = metadataManager.getTag(targetTag);

    if (!source || !target) {
      throw new Error('One or both tags not found');
    }

    // Get all files with source tag
    const files = this.getFilesByTag(sourceTag);

    // Add target tag to all files and remove source tag
    files.forEach(file => {
      if (!file.tags.includes(targetTag)) {
        metadataManager.addTag(file.path, targetTag);
      }
      metadataManager.removeTag(file.path, sourceTag);
    });

    // Delete source tag
    this.deleteTag(sourceTag);
  }

  /**
   * Suggest tags for a file based on its properties
   */
  suggestTagsForFile(file: FileMetadata): TagSuggestion[] {
    const suggestions: TagSuggestion[] = [];

    // Suggest based on file type
    const typeSuggestions = metadataManager.getTagSuggestions(file.type);
    typeSuggestions.forEach(tagName => {
      if (!file.tags.includes(tagName)) {
        const existingTag = metadataManager.getTag(tagName);
        suggestions.push({
          name: tagName,
          color: existingTag?.color || '#0055aa',
          score: 70,
          reason: 'Common for this file type',
        });
      }
    });

    // Suggest based on file name patterns
    const nameLower = file.name.toLowerCase();

    if (nameLower.includes('important') || nameLower.includes('urgent')) {
      suggestions.push({
        name: 'Important',
        color: '#cc0000',
        score: 90,
        reason: 'File name indicates importance',
      });
    }

    if (nameLower.includes('draft') || nameLower.includes('wip')) {
      suggestions.push({
        name: 'Draft',
        color: '#ff8800',
        score: 85,
        reason: 'File appears to be a draft',
      });
    }

    if (nameLower.includes('final') || nameLower.includes('complete')) {
      suggestions.push({
        name: 'Complete',
        color: '#00aa00',
        score: 85,
        reason: 'File appears to be final',
      });
    }

    if (nameLower.includes('backup') || nameLower.includes('old')) {
      suggestions.push({
        name: 'Archive',
        color: '#888888',
        score: 80,
        reason: 'File appears to be archived',
      });
    }

    // Suggest based on rating
    if (file.rating >= 4) {
      suggestions.push({
        name: 'Favorite',
        color: '#ffcc00',
        score: 75,
        reason: 'Highly rated file',
      });
    }

    // Remove duplicates and sort by score
    const uniqueSuggestions = suggestions.filter(
      (suggestion, index, self) =>
        index === self.findIndex(s => s.name === suggestion.name) &&
        !file.tags.includes(suggestion.name)
    );

    uniqueSuggestions.sort((a, b) => b.score - a.score);

    return uniqueSuggestions.slice(0, 5);
  }

  /**
   * Bulk tag operations
   */
  bulkAddTag(filePaths: string[], tagName: string): void {
    filePaths.forEach(_path => {
      metadataManager.addTag(path, tagName);
    });
  }

  bulkRemoveTag(filePaths: string[], tagName: string): void {
    filePaths.forEach(_path => {
      metadataManager.removeTag(path, tagName);
    });
  }

  /**
   * Export tags to JSON
   */
  exportTags(): string {
    const tags = this.getAllTags();
    return JSON.stringify(tags, null, 2);
  }

  /**
   * Import tags from JSON
   */
  importTags(json: string): void {
    try {
      const tags = JSON.parse(json);

      if (!Array.isArray(tags)) {
        throw new Error('Invalid format: expected array of tags');
      }

      tags.forEach((tag: any) => {
        if (tag.name && tag.color) {
          metadataManager.createTag(tag.name, tag.color);
        }
      });

      this.clearAutocompleteCache();
    } catch (error) {
      console.error('Failed to import tags:', error);
      throw error;
    }
  }
}

// Singleton instance
export const tagManager = new TagManager();

// Utility functions for tag display
export function getTagDisplayName(tagName: string, maxLength: number = 20): string {
  if (tagName.length <= maxLength) {
    return tagName;
  }
  return tagName.substring(0, maxLength - 3) + '...';
}

export function generateTagColor(tagName: string): string {
  // Generate a consistent color based on tag name
  let hash = 0;
  for (let i = 0; i < tagName.length; i++) {
    hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
  }

  const colors = [
    '#cc0000', // red
    '#ff8800', // orange
    '#ffcc00', // yellow
    '#00aa00', // green
    '#0055aa', // blue
    '#8800cc', // purple
    '#888888', // gray
  ];

  return colors[Math.abs(hash) % colors.length];
}

export function sortTags(tags: string[], sortBy: 'name' | 'count' | 'recent' = 'name'): string[] {
  const tagObjects = tags
    .map(name => metadataManager.getTag(name))
    .filter(tag => tag !== null) as Tag[];

  switch (sortBy) {
    case 'count':
      return tagObjects.sort((a, b) => b.count - a.count).map(t => t.name);
    case 'recent':
      return tagObjects.sort((a, b) => b.created - a.created).map(t => t.name);
    case 'name':
    default:
      return tagObjects.sort((a, b) => a.name.localeCompare(b.name)).map(t => t.name);
  }
}

/**
 * Advanced Search Engine for WebOS
 * Comprehensive search capabilities with metadata, content search, regex, and indexing
 */

import { fuzzyMatch, parseSizeToBytes } from './file-search';

// ==================== Interfaces ====================

export interface SearchCriteria {
  query: string;
  fileTypes?: string[];
  dateRange?: {
    from?: Date;
    to?: Date;
    field?: 'created' | 'modified';
  };
  sizeRange?: {
    min?: number; // bytes
    max?: number; // bytes
  };
  tags?: string[];
  metadata?: {
    [key: string]: any;
  };
  regex?: boolean;
  mode?: SearchMode;
  scope?: string; // 'all', 'df0', 'dh0', etc.
  contentSearch?: boolean;
  caseSensitive?: boolean;
}

export interface SearchResult {
  id: string;
  file: FileItem;
  matches: SearchMatch[];
  relevanceScore: number;
  snippets: ContentSnippet[];
  matchCount: number;
}

export interface FileItem {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder' | 'disk';
  size?: number; // bytes
  sizeFormatted?: string;
  created?: Date;
  modified?: Date;
  tags?: string[];
  metadata?: {
    [key: string]: any;
  };
  content?: string;
}

export interface SearchMatch {
  field: string;
  value: string;
  start: number;
  end: number;
  matchType: 'exact' | 'fuzzy' | 'regex';
}

export interface ContentSnippet {
  text: string;
  lineNumber: number;
  highlighted: string; // HTML with highlights
  context: string; // surrounding text
}

export type SearchMode = 'simple' | 'metadata' | 'content' | 'advanced';

export interface SearchHistoryItem {
  criteria: SearchCriteria;
  timestamp: Date;
  resultCount: number;
}

// ==================== Search History ====================

const HISTORY_KEY = 'webos_advanced_search_history';
const MAX_HISTORY = 50;

export function getSearchHistory(): SearchHistoryItem[] {
  try {
    const history = localStorage.getItem(HISTORY_KEY);
    if (!history) return [];
    const parsed = JSON.parse(history);
    // Convert timestamp strings back to Date objects
    return parsed.map((item: any) => ({
      ...item,
      timestamp: new Date(item.timestamp),
      criteria: {
        ...item.criteria,
        dateRange: item.criteria.dateRange ? {
          ...item.criteria.dateRange,
          from: item.criteria.dateRange.from ? new Date(item.criteria.dateRange.from) : undefined,
          to: item.criteria.dateRange.to ? new Date(item.criteria.dateRange.to) : undefined
        } : undefined
      }
    }));
  } catch (error) {
    console.error('Failed to load search history:', error);
    return [];
  }
}

export function addSearchHistory(criteria: SearchCriteria, resultCount: number): void {
  try {
    let history = getSearchHistory();

    // Remove duplicates based on query
    history = history.filter(item => item.criteria.query !== criteria.query);

    // Add new item at the beginning
    history.unshift({
      criteria,
      timestamp: new Date(),
      resultCount
    });

    // Limit size
    if (history.length > MAX_HISTORY) {
      history = history.slice(0, MAX_HISTORY);
    }

    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Failed to save search history:', error);
  }
}

export function clearSearchHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (error) {
    console.error('Failed to clear search history:', error);
  }
}

export function getSearchSuggestions(partial: string): string[] {
  const history = getSearchHistory();
  const suggestions = new Set<string>();

  for (const item of history) {
    if (item.criteria.query.toLowerCase().startsWith(partial.toLowerCase())) {
      suggestions.add(item.criteria.query);
    }
  }

  return Array.from(suggestions).slice(0, 10);
}

// ==================== File Indexing ====================

interface FileIndex {
  files: Map<string, FileItem>;
  tags: Map<string, Set<string>>; // tag -> file ids
  lastIndexed: Date;
}

let fileIndex: FileIndex = {
  files: new Map(),
  tags: new Map(),
  lastIndexed: new Date(0)
};

export async function buildFileIndex(forceRefresh = false): Promise<void> {
  const now = new Date();
  const indexAge = now.getTime() - fileIndex.lastIndexed.getTime();

  // Refresh if older than 5 minutes or forced
  if (indexAge < 5 * 60 * 1000 && !forceRefresh) {
    console.log('Using cached file index');
    return;
  }

  console.log('Building file index...');

  try {
    // Fetch all files from API
    const response = await fetch('/api/files/list?recursive=true');
    if (!response.ok) {
      throw new Error('Failed to fetch file list');
    }

    const data = await response.json();
    const files: FileItem[] = data.files || [];

    // Clear existing index
    fileIndex.files.clear();
    fileIndex.tags.clear();

    // Build new index
    for (const file of files) {
      fileIndex.files.set(file.id, file);

      // Index tags
      if (file.tags) {
        for (const tag of file.tags) {
          if (!fileIndex.tags.has(tag)) {
            fileIndex.tags.set(tag, new Set());
          }
          fileIndex.tags.get(tag)!.add(file.id);
        }
      }
    }

    fileIndex.lastIndexed = now;
    console.log(`File index built: ${fileIndex.files.size} files, ${fileIndex.tags.size} tags`);
  } catch (error) {
    console.error('Failed to build file index:', error);
  }
}

export function getIndexStats(): { files: number; tags: number; lastIndexed: Date } {
  return {
    files: fileIndex.files.size,
    tags: fileIndex.tags.size,
    lastIndexed: fileIndex.lastIndexed
  };
}

// ==================== Search Engine ====================

export async function performAdvancedSearch(criteria: SearchCriteria): Promise<SearchResult[]> {
  // Ensure index is up to date
  await buildFileIndex();

  let candidates: FileItem[] = Array.from(fileIndex.files.values());

  // Filter by scope
  if (criteria.scope && criteria.scope !== 'all') {
    candidates = candidates.filter(file => file.path.startsWith(criteria.scope!));
  }

  // Filter by type
  if (criteria.fileTypes && criteria.fileTypes.length > 0) {
    candidates = candidates.filter(file => {
      if (file.type !== 'file') return false;
      const ext = file.name.split('.').pop()?.toLowerCase();
      return ext && criteria.fileTypes!.includes(ext);
    });
  }

  // Filter by size range
  if (criteria.sizeRange) {
    candidates = candidates.filter(file => {
      if (!file.size) return false;
      const { min, max } = criteria.sizeRange!;
      if (min !== undefined && file.size < min) return false;
      if (max !== undefined && file.size > max) return false;
      return true;
    });
  }

  // Filter by date range
  if (criteria.dateRange) {
    const { from, to, field = 'modified' } = criteria.dateRange;
    candidates = candidates.filter(file => {
      const date = field === 'created' ? file.created : file.modified;
      if (!date) return false;
      const fileDate = new Date(date);
      if (from && fileDate < from) return false;
      if (to && fileDate > to) return false;
      return true;
    });
  }

  // Filter by tags
  if (criteria.tags && criteria.tags.length > 0) {
    candidates = candidates.filter(file => {
      if (!file.tags) return false;
      return criteria.tags!.some(tag => file.tags!.includes(tag));
    });
  }

  // Filter by metadata
  if (criteria.metadata) {
    candidates = candidates.filter(file => {
      if (!file.metadata) return false;
      for (const [key, value] of Object.entries(criteria.metadata!)) {
        if (file.metadata[key] !== value) return false;
      }
      return true;
    });
  }

  // Search query matching
  const results: SearchResult[] = [];

  for (const file of candidates) {
    const result = await matchFile(file, criteria);
    if (result) {
      results.push(result);
    }
  }

  // Sort by relevance
  results.sort((a, b) => b.relevanceScore - a.relevanceScore);

  // Add to history
  addSearchHistory(criteria, results.length);

  return results;
}

async function matchFile(file: FileItem, criteria: SearchCriteria): Promise<SearchResult | null> {
  const matches: SearchMatch[] = [];
  const snippets: ContentSnippet[] = [];
  let relevanceScore = 0;

  const query = criteria.query.trim();
  if (!query) {
    // If no query, include all files that passed filters
    return {
      id: file.id,
      file,
      matches,
      relevanceScore: 0.5,
      snippets,
      matchCount: 0
    };
  }

  // Match filename
  const nameMatch = matchText(file.name, query, criteria);
  if (nameMatch) {
    matches.push({
      field: 'name',
      value: file.name,
      start: nameMatch.start,
      end: nameMatch.end,
      matchType: nameMatch.type
    });
    relevanceScore += 1.0; // Filename matches are most relevant
  }

  // Match path
  const pathMatch = matchText(file.path, query, criteria);
  if (pathMatch) {
    matches.push({
      field: 'path',
      value: file.path,
      start: pathMatch.start,
      end: pathMatch.end,
      matchType: pathMatch.type
    });
    relevanceScore += 0.5;
  }

  // Match tags
  if (file.tags) {
    for (const tag of file.tags) {
      const tagMatch = matchText(tag, query, criteria);
      if (tagMatch) {
        matches.push({
          field: 'tag',
          value: tag,
          start: tagMatch.start,
          end: tagMatch.end,
          matchType: tagMatch.type
        });
        relevanceScore += 0.7;
      }
    }
  }

  // Content search (if enabled)
  if (criteria.contentSearch && file.content) {
    const contentMatches = matchContent(file.content, query, criteria);
    snippets.push(...contentMatches);
    if (contentMatches.length > 0) {
      relevanceScore += 0.3 * contentMatches.length;
    }
  }

  // If no matches found, return null
  if (matches.length === 0 && snippets.length === 0) {
    return null;
  }

  // Normalize relevance score
  relevanceScore = Math.min(1.0, relevanceScore);

  return {
    id: file.id,
    file,
    matches,
    relevanceScore,
    snippets,
    matchCount: matches.length + snippets.length
  };
}

interface MatchInfo {
  start: number;
  end: number;
  type: 'exact' | 'fuzzy' | 'regex';
}

function matchText(text: string, query: string, criteria: SearchCriteria): MatchInfo | null {
  const _caseSensitive = criteria.caseSensitive || false;
  const searchText = caseSensitive ? text : text.toLowerCase();
  const searchQuery = caseSensitive ? query : query.toLowerCase();

  if (criteria.regex) {
    try {
      const flags = caseSensitive ? 'g' : 'gi';
      const regex = new RegExp(query, flags);
      const match = regex.exec(text);
      if (match) {
        return {
          start: match.index,
          end: match.index + match[0].length,
          type: 'regex'
        };
      }
    } catch (error) {
      console.error('Invalid regex:', error);
      return null;
    }
  }

  // Exact match
  const exactIndex = searchText.indexOf(searchQuery);
  if (exactIndex !== -1) {
    return {
      start: exactIndex,
      end: exactIndex + searchQuery.length,
      type: 'exact'
    };
  }

  // Fuzzy match
  const fuzzy = fuzzyMatch(searchQuery, searchText);
  if (fuzzy.score > 0.5) {
    return {
      start: 0,
      end: text.length,
      type: 'fuzzy'
    };
  }

  return null;
}

function matchContent(content: string, query: string, criteria: SearchCriteria): ContentSnippet[] {
  const snippets: ContentSnippet[] = [];
  const lines = content.split('\n');
  const _caseSensitive = criteria.caseSensitive || false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const matchInfo = matchText(line, query, criteria);

    if (matchInfo) {
      // Create highlighted version
      const before = line.substring(0, matchInfo.start);
      const match = line.substring(matchInfo.start, matchInfo.end);
      const after = line.substring(matchInfo.end);
      const highlighted = `${before}<mark>${match}</mark>${after}`;

      // Get context (line before and after)
      const contextLines: string[] = [];
      if (i > 0) contextLines.push(lines[i - 1]);
      contextLines.push(line);
      if (i < lines.length - 1) contextLines.push(lines[i + 1]);

      snippets.push({
        text: line,
        lineNumber: i + 1,
        highlighted,
        context: contextLines.join('\n')
      });

      // Limit snippets per file
      if (snippets.length >= 5) break;
    }
  }

  return snippets;
}

// ==================== Export Functionality ====================

export interface ExportFormat {
  format: 'json' | 'csv';
  fields?: string[];
}

export function exportResults(results: SearchResult[], format: ExportFormat): string {
  if (format.format === 'json') {
    return exportToJSON(results, format.fields);
  } else {
    return exportToCSV(results, format.fields);
  }
}

function exportToJSON(results: SearchResult[], fields?: string[]): string {
  const data = results.map(result => {
    const obj: any = {
      id: result.file.id,
      name: result.file.name,
      path: result.file.path,
      type: result.file.type,
      relevance: result.relevanceScore,
      matchCount: result.matchCount
    };

    if (!fields || fields.includes('size')) {
      obj.size = result.file.size;
      obj.sizeFormatted = result.file.sizeFormatted;
    }

    if (!fields || fields.includes('dates')) {
      obj.created = result.file.created;
      obj.modified = result.file.modified;
    }

    if (!fields || fields.includes('tags')) {
      obj.tags = result.file.tags;
    }

    if (!fields || fields.includes('matches')) {
      obj.matches = result.matches;
    }

    if (!fields || fields.includes('snippets')) {
      obj.snippets = result.snippets.map(s => ({
        line: s.lineNumber,
        text: s.text
      }));
    }

    return obj;
  });

  return JSON.stringify(data, null, 2);
}

function exportToCSV(results: SearchResult[], fields?: string[]): string {
  const headers = ['Name', 'Path', 'Type', 'Size', 'Modified', 'Relevance', 'Matches'];
  const rows: string[][] = [];

  for (const result of results) {
    const row = [
      escapeCSV(result.file.name),
      escapeCSV(result.file.path),
      result.file.type,
      result.file.sizeFormatted || '',
      result.file.modified ? new Date(result.file.modified).toISOString() : '',
      (result.relevanceScore * 100).toFixed(1) + '%',
      result.matchCount.toString()
    ];
    rows.push(row);
  }

  // Build CSV
  const csv = [headers.join(',')];
  for (const row of rows) {
    csv.push(row.join(','));
  }

  return csv.join('\n');
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function downloadResults(results: SearchResult[], format: ExportFormat, filename?: string): void {
  const content = exportResults(results, format);
  const blob = new Blob([content], {
    type: format.format === 'json' ? 'application/json' : 'text/csv'
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `search-results-${Date.now()}.${format.format}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ==================== Regex Validation ====================

export function validateRegex(pattern: string): { valid: boolean; error?: string } {
  try {
    new RegExp(pattern);
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid regex pattern'
    };
  }
}

// ==================== Utility Functions ====================

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}K`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}M`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}G`;
}

export function parseFileSize(input: string): number | null {
  const match = input.match(/^(\d+(?:\.\d+)?)\s*([BKMG]?)$/i);
  if (!match) return null;

  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();

  switch (unit) {
    case 'K': return value * 1024;
    case 'M': return value * 1024 * 1024;
    case 'G': return value * 1024 * 1024 * 1024;
    default: return value;
  }
}

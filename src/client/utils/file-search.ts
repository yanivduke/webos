/**
 * File Search Utility for WebOS
 * Provides fuzzy search, filtering, and caching for file system operations
 */

export interface FileSearchResult {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  size?: string;
  modified?: Date | string;
  created?: Date | string;
  relevance: number;
  matchedParts?: string[];
}

export interface SearchFilters {
  query: string;
  fileTypes?: string[];
  minSize?: number;
  maxSize?: number;
  dateFrom?: Date;
  dateTo?: Date;
  scope?: string; // 'all', 'df0', 'dh0', etc.
}

export type SortBy = 'relevance' | 'name' | 'date' | 'size';

// Cache for search results
interface SearchCache {
  query: string;
  filters: SearchFilters;
  results: FileSearchResult[];
  timestamp: number;
}

const searchCache: SearchCache[] = [];
const MAX_CACHE_SIZE = 10;
const CACHE_TTL = 60000; // 1 minute

/**
 * Fuzzy match algorithm - returns score between 0 and 1
 */
export function fuzzyMatch(query: string, target: string): { score: number; matches: number[] } {
  query = query.toLowerCase();
  target = target.toLowerCase();

  if (!query) return { score: 1, matches: [] };
  if (target.includes(query)) {
    // Exact substring match gets high score
    return { score: 0.9, matches: [] };
  }

  let score = 0;
  let queryIndex = 0;
  let matches: number[] = [];

  for (let i = 0; i < target.length && queryIndex < query.length; i++) {
    if (target[i] === query[queryIndex]) {
      matches.push(i);
      score += (1.0 / query.length);

      // Bonus for matching at start
      if (i === 0 || target[i - 1] === ' ' || target[i - 1] === '/') {
        score += 0.1;
      }

      queryIndex++;
    }
  }

  // All characters must match for valid fuzzy match
  if (queryIndex !== query.length) {
    return { score: 0, matches: [] };
  }

  // Penalty for gaps between matches
  if (matches.length > 1) {
    const gaps = matches[matches.length - 1] - matches[0] - matches.length;
    score -= (gaps * 0.01);
  }

  return { score: Math.max(0, Math.min(1, score)), matches };
}

/**
 * Convert file size string to bytes for comparison
 */
export function parseSizeToBytes(sizeStr: string): number {
  if (!sizeStr) return 0;

  const match = sizeStr.match(/^([\d.]+)([KMG]?)$/);
  if (!match) return parseInt(sizeStr) || 0;

  const value = parseFloat(match[1]);
  const unit = match[2];

  switch (unit) {
    case 'K': return value * 1024;
    case 'M': return value * 1024 * 1024;
    case 'G': return value * 1024 * 1024 * 1024;
    default: return value;
  }
}

/**
 * Filter results based on criteria
 */
export function filterResults(
  results: FileSearchResult[],
  filters: SearchFilters
): FileSearchResult[] {
  return results.filter(result => {
    // File type filter
    if (filters.fileTypes && filters.fileTypes.length > 0) {
      const ext = result.name.split('.').pop()?.toLowerCase() || '';
      if (result.type === 'file' && !filters.fileTypes.includes(ext)) {
        return false;
      }
    }

    // Size filter
    if (result.size && (filters.minSize || filters.maxSize)) {
      const sizeBytes = parseSizeToBytes(result.size);
      if (filters.minSize && sizeBytes < filters.minSize) return false;
      if (filters.maxSize && sizeBytes > filters.maxSize) return false;
    }

    // Date filter
    if (result.modified && (filters.dateFrom || filters.dateTo)) {
      const modDate = new Date(result.modified);
      if (filters.dateFrom && modDate < filters.dateFrom) return false;
      if (filters.dateTo && modDate > filters.dateTo) return false;
    }

    return true;
  });
}

/**
 * Sort results by specified criteria
 */
export function sortResults(
  results: FileSearchResult[],
  sortBy: SortBy,
  ascending = false
): FileSearchResult[] {
  const sorted = [...results].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'relevance':
        comparison = b.relevance - a.relevance;
        break;
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'date':
        const aDate = new Date(a.modified || 0).getTime();
        const bDate = new Date(b.modified || 0).getTime();
        comparison = bDate - aDate;
        break;
      case 'size':
        const aSize = parseSizeToBytes(a.size || '0');
        const bSize = parseSizeToBytes(b.size || '0');
        comparison = bSize - aSize;
        break;
    }

    return ascending ? -comparison : comparison;
  });

  return sorted;
}

/**
 * Search in cached results
 */
function searchInCache(filters: SearchFilters): FileSearchResult[] | null {
  const now = Date.now();

  // Find matching cache entry
  const cached = searchCache.find(cache => {
    if (now - cache.timestamp > CACHE_TTL) return false;
    return cache.query === filters.query && cache.filters.scope === filters.scope;
  });

  if (cached) {
    console.log('Search cache hit:', filters.query);
    return cached.results;
  }

  return null;
}

/**
 * Add results to cache
 */
function addToCache(filters: SearchFilters, results: FileSearchResult[]): void {
  // Remove oldest if cache is full
  if (searchCache.length >= MAX_CACHE_SIZE) {
    searchCache.shift();
  }

  searchCache.push({
    query: filters.query,
    filters,
    results,
    timestamp: Date.now()
  });
}

/**
 * Clear search cache
 */
export function clearSearchCache(): void {
  searchCache.length = 0;
}

/**
 * Perform search using API
 */
export async function searchFiles(
  filters: SearchFilters,
  sortBy: SortBy = 'relevance'
): Promise<FileSearchResult[]> {
  // Check cache first
  const cached = searchInCache(filters);
  if (cached) {
    const filtered = filterResults(cached, filters);
    return sortResults(filtered, sortBy);
  }

  try {
    // Build query params
    const params = new URLSearchParams();
    params.append('query', filters.query);

    if (filters.scope && filters.scope !== 'all') {
      params.append('disk', filters.scope);
    }

    if (filters.fileTypes && filters.fileTypes.length > 0) {
      params.append('types', filters.fileTypes.join(','));
    }

    if (filters.minSize) {
      params.append('minSize', filters.minSize.toString());
    }

    if (filters.maxSize) {
      params.append('maxSize', filters.maxSize.toString());
    }

    // Call API
    const response = await fetch(`/api/files/search?${params.toString()}`);

    if (!response.ok) {
      throw new Error('Search failed');
    }

    const data = await response.json();
    const results: FileSearchResult[] = data.results || [];

    // Add to cache
    addToCache(filters, results);

    // Apply filters and sort
    const filtered = filterResults(results, filters);
    return sortResults(filtered, sortBy);
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
}

/**
 * Search history management
 */
const SEARCH_HISTORY_KEY = 'webos_search_history';
const MAX_HISTORY = 10;

export function getSearchHistory(): string[] {
  try {
    const history = localStorage.getItem(SEARCH_HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch {
    return [];
  }
}

export function addSearchHistory(query: string): void {
  if (!query.trim()) return;

  try {
    let history = getSearchHistory();

    // Remove duplicate
    history = history.filter(q => q !== query);

    // Add to front
    history.unshift(query);

    // Limit size
    if (history.length > MAX_HISTORY) {
      history = history.slice(0, MAX_HISTORY);
    }

    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Failed to save search history:', error);
  }
}

export function clearSearchHistory(): void {
  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch (error) {
    console.error('Failed to clear search history:', error);
  }
}

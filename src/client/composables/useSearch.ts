import { ref, computed, type Ref } from 'vue';

export interface SearchResult {
  name: string;
  type: 'file' | 'folder' | 'app' | 'widget' | 'action';
  category: 'File' | 'Folder' | 'Application' | 'Widget' | 'Action';
  path?: string;
  size?: string;
  score?: number;
  menu?: string;
  modified?: string;
}

export interface SearchState {
  query: string;
  results: SearchResult[];
  isSearching: boolean;
  recentSearches: string[];
}

const RECENT_SEARCHES_KEY = 'webos-recent-searches';
const MAX_RECENT_SEARCHES = 10;

// Singleton state for search
const searchState = ref<SearchState>({
  query: '',
  results: [],
  isSearching: false,
  recentSearches: []
});

let debounceTimer: number | null = null;

// Load recent searches from localStorage
const loadRecentSearches = (): string[] => {
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load recent searches:', error);
  }
  return [];
};

// Save recent searches to localStorage
const saveRecentSearches = (searches: string[]) => {
  try {
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
  } catch (error) {
    console.error('Failed to save recent searches:', error);
  }
};

// Add a search to recent searches
const addRecentSearch = (query: string) => {
  if (!query || query.trim() === '') return;

  const trimmedQuery = query.trim();
  const recent = [...searchState.value.recentSearches];

  // Remove if already exists
  const index = recent.indexOf(trimmedQuery);
  if (index > -1) {
    recent.splice(index, 1);
  }

  // Add to beginning
  recent.unshift(trimmedQuery);

  // Keep only MAX_RECENT_SEARCHES
  if (recent.length > MAX_RECENT_SEARCHES) {
    recent.length = MAX_RECENT_SEARCHES;
  }

  searchState.value.recentSearches = recent;
  saveRecentSearches(recent);
};

// Clear recent searches
const clearRecentSearches = () => {
  searchState.value.recentSearches = [];
  saveRecentSearches([]);
};

// Perform search via API
const performSearch = async (query: string): Promise<SearchResult[]> => {
  if (!query || query.trim() === '') {
    return [];
  }

  try {
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
};

// Debounced search function
const search = (query: string, debounceMs: number = 300) => {
  searchState.value.query = query;

  // Clear existing timer
  if (debounceTimer !== null) {
    clearTimeout(debounceTimer);
  }

  // If query is empty, clear results immediately
  if (!query || query.trim() === '') {
    searchState.value.results = [];
    searchState.value.isSearching = false;
    return;
  }

  // Set searching state
  searchState.value.isSearching = true;

  // Debounce the search
  debounceTimer = window.setTimeout(async () => {
    try {
      const results = await performSearch(query);
      searchState.value.results = results;
    } catch (error) {
      console.error('Search failed:', error);
      searchState.value.results = [];
    } finally {
      searchState.value.isSearching = false;
    }
  }, debounceMs);
};

// Immediate search (no debounce)
const searchImmediate = async (query: string) => {
  searchState.value.query = query;
  searchState.value.isSearching = true;

  try {
    const results = await performSearch(query);
    searchState.value.results = results;
  } catch (error) {
    console.error('Search failed:', error);
    searchState.value.results = [];
  } finally {
    searchState.value.isSearching = false;
  }
};

// Clear search results
const clearSearch = () => {
  searchState.value.query = '';
  searchState.value.results = [];
  searchState.value.isSearching = false;

  if (debounceTimer !== null) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
};

// Get icon for result type
const getResultIcon = (result: SearchResult): string => {
  switch (result.type) {
    case 'file':
      if (result.name.endsWith('.txt') || result.name.endsWith('.doc')) {
        return '📄';
      } else if (result.name.endsWith('.awml')) {
        return '📜';
      } else if (result.name.endsWith('.png') || result.name.endsWith('.jpg')) {
        return '🖼️';
      }
      return '📄';
    case 'folder':
      return '📁';
    case 'app':
      return '🔧';
    case 'widget':
      return '🎨';
    case 'action':
      return '⚡';
    default:
      return '📄';
  }
};

// Export composable
export function useSearch() {
  // Load recent searches on first use
  if (searchState.value.recentSearches.length === 0) {
    searchState.value.recentSearches = loadRecentSearches();
  }

  return {
    // State
    query: computed(() => searchState.value.query),
    results: computed(() => searchState.value.results),
    isSearching: computed(() => searchState.value.isSearching),
    recentSearches: computed(() => searchState.value.recentSearches),

    // Methods
    search,
    searchImmediate,
    clearSearch,
    addRecentSearch,
    clearRecentSearches,
    getResultIcon
  };
}

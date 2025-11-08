import { ref, computed } from 'vue';

export interface TooltipPosition {
  x: number;
  y: number;
}

export interface FileMetadata {
  name: string;
  path: string;
  type: 'file' | 'folder';
  extension?: string;
  size?: string;
  sizeBytes?: number;
  modified?: string;
  created?: string;
  itemCount?: number;
  fileCount?: number;
  folderCount?: number;
  totalSize?: string;
}

// Metadata cache to avoid repeated API calls
const metadataCache = ref<Map<string, FileMetadata>>(new Map());

// Cache TTL in milliseconds (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;
const cacheTimestamps = ref<Map<string, number>>(new Map());

export const useTooltip = () => {
  /**
   * Calculate tooltip position based on cursor coordinates
   * Keeps tooltip within viewport bounds
   */
  const calculatePosition = (
    clientX: number,
    clientY: number,
    tooltipWidth: number,
    tooltipHeight: number,
    offset = { x: 10, y: 10 }
  ): TooltipPosition => {
    let x = clientX + offset.x;
    let y = clientY + offset.y;

    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Adjust X position if tooltip goes off-screen (right edge)
    if (x + tooltipWidth > viewportWidth) {
      x = clientX - tooltipWidth - offset.x;
    }

    // Ensure minimum X position
    if (x < 0) {
      x = 10;
    }

    // Adjust Y position if tooltip goes off-screen (bottom edge)
    if (y + tooltipHeight > viewportHeight) {
      y = clientY - tooltipHeight - offset.y;
    }

    // Ensure minimum Y position
    if (y < 0) {
      y = 10;
    }

    return { x, y };
  };

  /**
   * Format date to readable string
   */
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  /**
   * Check if cached metadata is still valid
   */
  const isCacheValid = (path: string): boolean => {
    const timestamp = cacheTimestamps.value.get(path);
    if (!timestamp) return false;
    return Date.now() - timestamp < CACHE_TTL;
  };

  /**
   * Get cached metadata if valid, null otherwise
   */
  const getCachedMetadata = (path: string): FileMetadata | null => {
    if (!isCacheValid(path)) {
      // Cache expired, remove it
      metadataCache.value.delete(path);
      cacheTimestamps.value.delete(path);
      return null;
    }
    return metadataCache.value.get(path) || null;
  };

  /**
   * Fetch file metadata from API
   */
  const fetchMetadata = async (path: string): Promise<FileMetadata | null> => {
    // Check cache first
    const cached = getCachedMetadata(path);
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(`/api/files/info?path=${encodeURIComponent(path)}`);
      if (!response.ok) {
        console.error('Failed to fetch metadata:', response.statusText);
        return null;
      }

      const metadata: FileMetadata = await response.json();

      // Store in cache
      metadataCache.value.set(path, metadata);
      cacheTimestamps.value.set(path, Date.now());

      return metadata;
    } catch (error) {
      console.error('Error fetching metadata:', error);
      return null;
    }
  };

  /**
   * Clear cache
   */
  const clearCache = () => {
    metadataCache.value.clear();
    cacheTimestamps.value.clear();
  };

  /**
   * Clear specific cache entry
   */
  const clearCacheEntry = (path: string) => {
    metadataCache.value.delete(path);
    cacheTimestamps.value.delete(path);
  };

  return {
    calculatePosition,
    formatDate,
    fetchMetadata,
    getCachedMetadata,
    isCacheValid,
    clearCache,
    clearCacheEntry
  };
};

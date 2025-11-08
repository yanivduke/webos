/**
 * File Preview Manager
 * Handles file type detection, preview generation, and metadata extraction
 */

export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  extension: string;
  mimeType: string;
  created?: Date;
  modified?: Date;
  width?: number;
  height?: number;
  duration?: number;
  artist?: string;
  title?: string;
  album?: string;
  [key: string]: any;
}

export interface PreviewCacheEntry {
  thumbnail?: string;
  metadata: FileMetadata;
  timestamp: number;
}

export type FileCategory = 'image' | 'text' | 'audio' | 'video' | 'pdf' | 'archive' | 'unknown';

// MIME type mappings
const MIME_TYPES: Record<string, string> = {
  // Images
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.bmp': 'image/bmp',
  '.ico': 'image/x-icon',

  // Text
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.csv': 'text/csv',
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.ts': 'text/typescript',
  '.py': 'text/x-python',
  '.java': 'text/x-java',
  '.cpp': 'text/x-c++src',
  '.c': 'text/x-csrc',
  '.h': 'text/x-chdr',
  '.log': 'text/plain',

  // Audio
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.m4a': 'audio/mp4',
  '.flac': 'audio/flac',
  '.aac': 'audio/aac',

  // Video
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mkv': 'video/x-matroska',
  '.avi': 'video/x-msvideo',
  '.mov': 'video/quicktime',

  // Documents
  '.pdf': 'application/pdf',

  // Archives
  '.zip': 'application/zip',
  '.tar': 'application/x-tar',
  '.gz': 'application/gzip',
  '.7z': 'application/x-7z-compressed',
  '.rar': 'application/x-rar-compressed',
};

class FilePreviewManager {
  private cache: Map<string, PreviewCacheEntry> = new Map();
  private readonly CACHE_KEY = 'webos_file_preview_cache';
  private readonly MAX_CACHE_SIZE = 50;
  private readonly CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    this.loadCache();
  }

  /**
   * Detect file category from extension
   */
  getFileCategory(filename: string): FileCategory {
    const ext = this.getExtension(filename);
    const mimeType = this.getMimeType(filename);

    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType === 'application/pdf') return 'pdf';
    if (['.zip', '.tar', '.gz', '.7z', '.rar'].includes(ext)) return 'archive';
    if (mimeType.startsWith('text/') || mimeType.includes('json') || mimeType.includes('xml')) return 'text';

    return 'unknown';
  }

  /**
   * Get file extension
   */
  getExtension(filename: string): string {
    const match = filename.match(/\.[^.]+$/);
    return match ? match[0].toLowerCase() : '';
  }

  /**
   * Get MIME type from filename
   */
  getMimeType(filename: string): string {
    const ext = this.getExtension(filename);
    return MIME_TYPES[ext] || 'application/octet-stream';
  }

  /**
   * Format file size to human-readable string
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * Generate thumbnail for image files
   */
  async generateImageThumbnail(file: File, maxSize: number = 256): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate thumbnail size maintaining aspect ratio
          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
          } else {
            reject(new Error('Failed to get canvas context'));
          }
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Extract metadata from image
   */
  async extractImageMetadata(file: File): Promise<Partial<FileMetadata>> {
    return new Promise((resolve) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.onload = () => {
          resolve({
            width: img.width,
            height: img.height,
          });
        };
        img.onerror = () => resolve({});
        img.src = e.target?.result as string;
      };

      reader.onerror = () => resolve({});
      reader.readAsDataURL(file);
    });
  }

  /**
   * Extract metadata from audio
   */
  async extractAudioMetadata(file: File): Promise<Partial<FileMetadata>> {
    return new Promise((resolve) => {
      const audio = new Audio();
      const reader = new FileReader();

      reader.onload = (e) => {
        audio.onloadedmetadata = () => {
          resolve({
            duration: audio.duration,
          });
        };
        audio.onerror = () => resolve({});
        audio.src = e.target?.result as string;
      };

      reader.onerror = () => resolve({});
      reader.readAsDataURL(file);
    });
  }

  /**
   * Extract metadata from video
   */
  async extractVideoMetadata(file: File): Promise<Partial<FileMetadata>> {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const reader = new FileReader();

      reader.onload = (e) => {
        video.onloadedmetadata = () => {
          resolve({
            width: video.videoWidth,
            height: video.videoHeight,
            duration: video.duration,
          });
        };
        video.onerror = () => resolve({});
        video.src = e.target?.result as string;
      };

      reader.onerror = () => resolve({});
      reader.readAsDataURL(file);
    });
  }

  /**
   * Extract basic file metadata
   */
  async extractMetadata(file: File): Promise<FileMetadata> {
    const category = this.getFileCategory(file.name);
    const baseMetadata: FileMetadata = {
      name: file.name,
      size: file.size,
      type: category,
      extension: this.getExtension(file.name),
      mimeType: this.getMimeType(file.name),
      modified: new Date(file.lastModified),
    };

    // Extract type-specific metadata
    let specificMetadata: Partial<FileMetadata> = {};

    switch (category) {
      case 'image':
        specificMetadata = await this.extractImageMetadata(file);
        break;
      case 'audio':
        specificMetadata = await this.extractAudioMetadata(file);
        break;
      case 'video':
        specificMetadata = await this.extractVideoMetadata(file);
        break;
    }

    return { ...baseMetadata, ...specificMetadata };
  }

  /**
   * Get preview from cache or generate new one
   */
  async getPreview(filePath: string, file?: File): Promise<PreviewCacheEntry | null> {
    // Check cache first
    const cached = this.getFromCache(filePath);
    if (cached) {
      return cached;
    }

    // Generate new preview if file is provided
    if (!file) {
      return null;
    }

    try {
      const metadata = await this.extractMetadata(file);
      let thumbnail: string | undefined;

      // Generate thumbnail for images
      if (metadata.type === 'image') {
        try {
          thumbnail = await this.generateImageThumbnail(file);
        } catch (error) {
          console.error('Failed to generate thumbnail:', error);
        }
      }

      const entry: PreviewCacheEntry = {
        thumbnail,
        metadata,
        timestamp: Date.now(),
      };

      this.addToCache(filePath, entry);
      return entry;
    } catch (error) {
      console.error('Failed to generate preview:', error);
      return null;
    }
  }

  /**
   * Get from cache
   */
  private getFromCache(filePath: string): PreviewCacheEntry | null {
    const entry = this.cache.get(filePath);
    if (!entry) return null;

    // Check if cache entry is expired
    if (Date.now() - entry.timestamp > this.CACHE_EXPIRY) {
      this.cache.delete(filePath);
      this.saveCache();
      return null;
    }

    return entry;
  }

  /**
   * Add to cache
   */
  private addToCache(filePath: string, entry: PreviewCacheEntry): void {
    // Ensure cache doesn't exceed max size
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      // Remove oldest entry
      const oldestKey = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
      this.cache.delete(oldestKey);
    }

    this.cache.set(filePath, entry);
    this.saveCache();
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    localStorage.removeItem(this.CACHE_KEY);
  }

  /**
   * Load cache from localStorage
   */
  private loadCache(): void {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (cached) {
        const entries = JSON.parse(cached);
        this.cache = new Map(entries);
      }
    } catch (error) {
      console.error('Failed to load preview cache:', error);
    }
  }

  /**
   * Save cache to localStorage
   */
  private saveCache(): void {
    try {
      const entries = Array.from(this.cache.entries());
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(entries));
    } catch (error) {
      console.error('Failed to save preview cache:', error);
    }
  }

  /**
   * Check if file type is previewable
   */
  isPreviewable(filename: string): boolean {
    const category = this.getFileCategory(filename);
    return category !== 'unknown';
  }

  /**
   * Get file icon based on type
   */
  getFileIcon(filename: string): string {
    const category = this.getFileCategory(filename);
    const icons: Record<FileCategory, string> = {
      image: '🖼️',
      text: '📄',
      audio: '🎵',
      video: '🎬',
      pdf: '📕',
      archive: '📦',
      unknown: '📄',
    };
    return icons[category];
  }

  /**
   * Format duration from seconds to readable string
   */
  formatDuration(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '0:00';

    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}

// Export singleton instance
export const filePreview = new FilePreviewManager();
export default filePreview;

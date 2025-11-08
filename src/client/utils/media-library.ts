/**
 * Media Library Manager
 * Manages media files, playlists, and metadata for WebOS Media Player
 */

export interface MediaFile {
  id: string;
  path: string;
  name: string;
  type: 'audio' | 'video';
  duration: number; // in seconds
  artist?: string;
  album?: string;
  genre?: string;
  year?: number;
  trackNumber?: number;
  artwork?: string; // Base64 or URL
  addedDate: number; // timestamp
  playCount: number;
  lastPlayed?: number; // timestamp
  fileSize?: number; // in bytes
  format?: string; // mp3, wav, etc.
  bitrate?: number; // kbps
  sampleRate?: number; // Hz
  comments?: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  tracks: string[]; // Array of MediaFile IDs
  created: number; // timestamp
  modified: number; // timestamp
  artwork?: string; // Base64 or URL
}

export interface MediaLibraryStats {
  totalTracks: number;
  totalPlaylists: number;
  totalDuration: number;
  totalSize: number;
  mostPlayedTrack?: MediaFile;
  recentlyAddedCount: number;
}

export interface SearchFilters {
  type?: 'audio' | 'video';
  artist?: string;
  album?: string;
  genre?: string;
  year?: number;
  minDuration?: number;
  maxDuration?: number;
}

class MediaLibrary {
  private mediaFiles: Map<string, MediaFile> = new Map();
  private playlists: Map<string, Playlist> = new Map();
  private readonly STORAGE_KEY_MEDIA = 'webos_media_library';
  private readonly STORAGE_KEY_PLAYLISTS = 'webos_playlists';

  constructor() {
    this.loadFromStorage();
  }

  // ==================== Media File Management ====================

  /**
   * Add a media file to the library
   */
  addMediaFile(file: Omit<MediaFile, 'id' | 'addedDate' | 'playCount'>): MediaFile {
    const id = this.generateId();
    const mediaFile: MediaFile = {
      ...file,
      id,
      addedDate: Date.now(),
      playCount: 0,
    };

    this.mediaFiles.set(id, mediaFile);
    this.saveToStorage();
    return mediaFile;
  }

  /**
   * Update a media file
   */
  updateMediaFile(id: string, updates: Partial<MediaFile>): MediaFile | null {
    const file = this.mediaFiles.get(id);
    if (!file) return null;

    const updatedFile = { ...file, ...updates, id }; // Preserve ID
    this.mediaFiles.set(id, updatedFile);
    this.saveToStorage();
    return updatedFile;
  }

  /**
   * Remove a media file from the library
   */
  removeMediaFile(id: string): boolean {
    const removed = this.mediaFiles.delete(id);
    if (removed) {
      // Remove from all playlists
      this.playlists.forEach(playlist => {
        playlist.tracks = playlist.tracks.filter(trackId => trackId !== id);
        playlist.modified = Date.now();
      });
      this.saveToStorage();
    }
    return removed;
  }

  /**
   * Get a single media file by ID
   */
  getMediaFile(id: string): MediaFile | null {
    return this.mediaFiles.get(id) || null;
  }

  /**
   * Get all media files with optional filters
   */
  getMediaFiles(filters?: SearchFilters): MediaFile[] {
    let files = Array.from(this.mediaFiles.values());

    if (!filters) return files;

    if (filters.type) {
      files = files.filter(f => f.type === filters.type);
    }

    if (filters.artist) {
      files = files.filter(f =>
        f.artist?.toLowerCase().includes(filters.artist!.toLowerCase())
      );
    }

    if (filters.album) {
      files = files.filter(f =>
        f.album?.toLowerCase().includes(filters.album!.toLowerCase())
      );
    }

    if (filters.genre) {
      files = files.filter(f =>
        f.genre?.toLowerCase().includes(filters.genre!.toLowerCase())
      );
    }

    if (filters.year) {
      files = files.filter(f => f.year === filters.year);
    }

    if (filters.minDuration !== undefined) {
      files = files.filter(f => f.duration >= filters.minDuration!);
    }

    if (filters.maxDuration !== undefined) {
      files = files.filter(f => f.duration <= filters.maxDuration!);
    }

    return files;
  }

  /**
   * Search media library
   */
  searchMedia(query: string): MediaFile[] {
    if (!query) return Array.from(this.mediaFiles.values());

    const lowerQuery = query.toLowerCase();
    return Array.from(this.mediaFiles.values()).filter(file =>
      file.name.toLowerCase().includes(lowerQuery) ||
      file.artist?.toLowerCase().includes(lowerQuery) ||
      file.album?.toLowerCase().includes(lowerQuery) ||
      file.genre?.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get most played tracks
   */
  getMostPlayed(limit: number = 10): MediaFile[] {
    return Array.from(this.mediaFiles.values())
      .filter(f => f.playCount > 0)
      .sort((a, b) => b.playCount - a.playCount)
      .slice(0, limit);
  }

  /**
   * Get recently played tracks
   */
  getRecentlyPlayed(limit: number = 10): MediaFile[] {
    return Array.from(this.mediaFiles.values())
      .filter(f => f.lastPlayed !== undefined)
      .sort((a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0))
      .slice(0, limit);
  }

  /**
   * Get recently added tracks
   */
  getRecentlyAdded(limit: number = 10): MediaFile[] {
    return Array.from(this.mediaFiles.values())
      .sort((a, b) => b.addedDate - a.addedDate)
      .slice(0, limit);
  }

  /**
   * Get all unique artists
   */
  getArtists(): string[] {
    const artists = new Set<string>();
    this.mediaFiles.forEach(file => {
      if (file.artist) artists.add(file.artist);
    });
    return Array.from(artists).sort();
  }

  /**
   * Get all unique albums
   */
  getAlbums(): string[] {
    const albums = new Set<string>();
    this.mediaFiles.forEach(file => {
      if (file.album) albums.add(file.album);
    });
    return Array.from(albums).sort();
  }

  /**
   * Get all unique genres
   */
  getGenres(): string[] {
    const genres = new Set<string>();
    this.mediaFiles.forEach(file => {
      if (file.genre) genres.add(file.genre);
    });
    return Array.from(genres).sort();
  }

  /**
   * Get tracks by artist
   */
  getByArtist(artist: string): MediaFile[] {
    return Array.from(this.mediaFiles.values())
      .filter(f => f.artist === artist)
      .sort((a, b) => {
        // Sort by album, then track number
        if (a.album !== b.album) {
          return (a.album || '').localeCompare(b.album || '');
        }
        return (a.trackNumber || 0) - (b.trackNumber || 0);
      });
  }

  /**
   * Get tracks by album
   */
  getByAlbum(album: string): MediaFile[] {
    return Array.from(this.mediaFiles.values())
      .filter(f => f.album === album)
      .sort((a, b) => (a.trackNumber || 0) - (b.trackNumber || 0));
  }

  /**
   * Get tracks by genre
   */
  getByGenre(genre: string): MediaFile[] {
    return Array.from(this.mediaFiles.values())
      .filter(f => f.genre === genre)
      .sort((a, b) => {
        if (a.artist !== b.artist) {
          return (a.artist || '').localeCompare(b.artist || '');
        }
        return a.name.localeCompare(b.name);
      });
  }

  /**
   * Increment play count and update last played
   */
  trackPlayed(id: string): void {
    const file = this.mediaFiles.get(id);
    if (file) {
      file.playCount++;
      file.lastPlayed = Date.now();
      this.saveToStorage();
    }
  }

  // ==================== Playlist Management ====================

  /**
   * Create a new playlist
   */
  createPlaylist(name: string, description: string = ''): Playlist {
    const id = this.generateId();
    const playlist: Playlist = {
      id,
      name,
      description,
      tracks: [],
      created: Date.now(),
      modified: Date.now(),
    };

    this.playlists.set(id, playlist);
    this.saveToStorage();
    return playlist;
  }

  /**
   * Update a playlist
   */
  updatePlaylist(id: string, updates: Partial<Playlist>): Playlist | null {
    const playlist = this.playlists.get(id);
    if (!playlist) return null;

    const updatedPlaylist = {
      ...playlist,
      ...updates,
      id, // Preserve ID
      modified: Date.now(),
    };

    this.playlists.set(id, updatedPlaylist);
    this.saveToStorage();
    return updatedPlaylist;
  }

  /**
   * Delete a playlist
   */
  deletePlaylist(id: string): boolean {
    const deleted = this.playlists.delete(id);
    if (deleted) {
      this.saveToStorage();
    }
    return deleted;
  }

  /**
   * Get a single playlist by ID
   */
  getPlaylist(id: string): Playlist | null {
    return this.playlists.get(id) || null;
  }

  /**
   * Get all playlists
   */
  getPlaylists(): Playlist[] {
    return Array.from(this.playlists.values())
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Add tracks to a playlist
   */
  addToPlaylist(playlistId: string, trackIds: string[]): boolean {
    const playlist = this.playlists.get(playlistId);
    if (!playlist) return false;

    // Filter out invalid track IDs and duplicates
    const validTrackIds = trackIds.filter(id =>
      this.mediaFiles.has(id) && !playlist.tracks.includes(id)
    );

    playlist.tracks.push(...validTrackIds);
    playlist.modified = Date.now();
    this.saveToStorage();
    return true;
  }

  /**
   * Remove tracks from a playlist
   */
  removeFromPlaylist(playlistId: string, trackIds: string[]): boolean {
    const playlist = this.playlists.get(playlistId);
    if (!playlist) return false;

    playlist.tracks = playlist.tracks.filter(id => !trackIds.includes(id));
    playlist.modified = Date.now();
    this.saveToStorage();
    return true;
  }

  /**
   * Reorder tracks in a playlist
   */
  reorderPlaylist(playlistId: string, fromIndex: number, toIndex: number): boolean {
    const playlist = this.playlists.get(playlistId);
    if (!playlist) return false;

    if (fromIndex < 0 || fromIndex >= playlist.tracks.length ||
        toIndex < 0 || toIndex >= playlist.tracks.length) {
      return false;
    }

    const [removed] = playlist.tracks.splice(fromIndex, 1);
    playlist.tracks.splice(toIndex, 0, removed);
    playlist.modified = Date.now();
    this.saveToStorage();
    return true;
  }

  /**
   * Get tracks in a playlist
   */
  getPlaylistTracks(playlistId: string): MediaFile[] {
    const playlist = this.playlists.get(playlistId);
    if (!playlist) return [];

    return playlist.tracks
      .map(id => this.mediaFiles.get(id))
      .filter((file): file is MediaFile => file !== undefined);
  }

  // ==================== Statistics ====================

  /**
   * Get library statistics
   */
  getStats(): MediaLibraryStats {
    const files = Array.from(this.mediaFiles.values());
    const totalDuration = files.reduce((sum, f) => sum + f.duration, 0);
    const totalSize = files.reduce((sum, f) => sum + (f.fileSize || 0), 0);

    const mostPlayed = files
      .filter(f => f.playCount > 0)
      .sort((a, b) => b.playCount - a.playCount)[0];

    const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const recentlyAddedCount = files.filter(f => f.addedDate > weekAgo).length;

    return {
      totalTracks: files.length,
      totalPlaylists: this.playlists.size,
      totalDuration,
      totalSize,
      mostPlayedTrack: mostPlayed,
      recentlyAddedCount,
    };
  }

  /**
   * Get album artwork (first track with artwork from album)
   */
  getAlbumArtwork(album: string): string | undefined {
    const tracks = this.getByAlbum(album);
    return tracks.find(t => t.artwork)?.artwork;
  }

  /**
   * Get artist artwork (first track with artwork from artist)
   */
  getArtistArtwork(artist: string): string | undefined {
    const tracks = this.getByArtist(artist);
    return tracks.find(t => t.artwork)?.artwork;
  }

  // ==================== Import/Export ====================

  /**
   * Import multiple media files
   */
  async importMediaFiles(files: Omit<MediaFile, 'id' | 'addedDate' | 'playCount'>[]): Promise<MediaFile[]> {
    const imported: MediaFile[] = [];

    for (const file of files) {
      const mediaFile = this.addMediaFile(file);
      imported.push(mediaFile);
    }

    return imported;
  }

  /**
   * Export library to JSON
   */
  exportLibrary(): string {
    const data = {
      mediaFiles: Array.from(this.mediaFiles.entries()),
      playlists: Array.from(this.playlists.entries()),
      exportDate: Date.now(),
    };
    return JSON.stringify(data, null, 2);
  }

  /**
   * Import library from JSON
   */
  importLibrary(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);

      if (data.mediaFiles) {
        this.mediaFiles = new Map(data.mediaFiles);
      }

      if (data.playlists) {
        this.playlists = new Map(data.playlists);
      }

      this.saveToStorage();
      return true;
    } catch (error) {
      console.error('Failed to import library:', error);
      return false;
    }
  }

  /**
   * Clear all media and playlists
   */
  clearLibrary(): void {
    this.mediaFiles.clear();
    this.playlists.clear();
    this.saveToStorage();
  }

  // ==================== Storage ====================

  /**
   * Save to localStorage
   */
  private saveToStorage(): void {
    try {
      const mediaData = Array.from(this.mediaFiles.entries());
      const playlistData = Array.from(this.playlists.entries());

      localStorage.setItem(this.STORAGE_KEY_MEDIA, JSON.stringify(mediaData));
      localStorage.setItem(this.STORAGE_KEY_PLAYLISTS, JSON.stringify(playlistData));
    } catch (error) {
      console.error('Failed to save media library to storage:', error);
    }
  }

  /**
   * Load from localStorage
   */
  private loadFromStorage(): void {
    try {
      const mediaData = localStorage.getItem(this.STORAGE_KEY_MEDIA);
      const playlistData = localStorage.getItem(this.STORAGE_KEY_PLAYLISTS);

      if (mediaData) {
        const parsed = JSON.parse(mediaData);
        this.mediaFiles = new Map(parsed);
      }

      if (playlistData) {
        const parsed = JSON.parse(playlistData);
        this.playlists = new Map(parsed);
      }
    } catch (error) {
      console.error('Failed to load media library from storage:', error);
    }
  }

  // ==================== Utilities ====================

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Format duration in seconds to MM:SS or HH:MM:SS
   */
  static formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Format file size in bytes to human-readable format
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  }

  /**
   * Parse filename to extract basic metadata
   */
  static parseFilename(filename: string): Partial<MediaFile> {
    const metadata: Partial<MediaFile> = {
      name: filename,
    };

    // Try to parse "Artist - Title.mp3" format
    const artistTitleMatch = filename.match(/^(.+?)\s*-\s*(.+?)\.(mp3|wav|ogg|flac|m4a|mp4|webm|ogv)$/i);
    if (artistTitleMatch) {
      metadata.artist = artistTitleMatch[1].trim();
      metadata.name = artistTitleMatch[2].trim();
      metadata.format = artistTitleMatch[3].toLowerCase();
    }

    // Try to parse "Track Number - Title.mp3" format
    const trackMatch = filename.match(/^(\d+)\s*-\s*(.+?)\.(mp3|wav|ogg|flac|m4a|mp4|webm|ogv)$/i);
    if (trackMatch) {
      metadata.trackNumber = parseInt(trackMatch[1]);
      metadata.name = trackMatch[2].trim();
      metadata.format = trackMatch[3].toLowerCase();
    }

    return metadata;
  }

  /**
   * Detect media type from filename
   */
  static detectMediaType(filename: string): 'audio' | 'video' | null {
    const ext = filename.split('.').pop()?.toLowerCase();

    const audioFormats = ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac', 'wma'];
    const videoFormats = ['mp4', 'webm', 'ogv', 'avi', 'mov', 'mkv'];

    if (ext && audioFormats.includes(ext)) return 'audio';
    if (ext && videoFormats.includes(ext)) return 'video';

    return null;
  }
}

// Export singleton instance
export const mediaLibrary = new MediaLibrary();

/**
 * Media API Routes
 * Handles media file management, playlists, and streaming
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// In-memory media storage (would be replaced with database in production)
let mediaLibrary = {
  files: new Map(),
  playlists: new Map(),
  nextFileId: 1,
  nextPlaylistId: 1
};

// Initialize with some sample media
const initializeSampleMedia = () => {
  // Sample audio files
  const sampleAudio = [
    {
      id: '1',
      path: '/media/audio/sample1.mp3',
      name: 'Retro Beats',
      type: 'audio',
      duration: 180,
      artist: 'Amiga Musician',
      album: 'Workbench Classics',
      genre: 'Electronic',
      year: 1992,
      trackNumber: 1,
      addedDate: Date.now() - 86400000 * 7,
      playCount: 12,
      lastPlayed: Date.now() - 3600000,
      fileSize: 4200000,
      format: 'mp3',
      bitrate: 192,
      sampleRate: 44100
    },
    {
      id: '2',
      path: '/media/audio/sample2.mp3',
      name: 'Amiga Dreams',
      type: 'audio',
      duration: 240,
      artist: 'Amiga Musician',
      album: 'Workbench Classics',
      genre: 'Electronic',
      year: 1992,
      trackNumber: 2,
      addedDate: Date.now() - 86400000 * 7,
      playCount: 8,
      fileSize: 5600000,
      format: 'mp3',
      bitrate: 192,
      sampleRate: 44100
    },
    {
      id: '3',
      path: '/media/audio/sample3.mp3',
      name: 'Copper Bars',
      type: 'audio',
      duration: 195,
      artist: 'Demo Scene Artist',
      album: 'Demoscene Anthology',
      genre: 'Chiptune',
      year: 1991,
      trackNumber: 1,
      addedDate: Date.now() - 86400000 * 14,
      playCount: 25,
      lastPlayed: Date.now() - 7200000,
      fileSize: 4550000,
      format: 'mp3',
      bitrate: 192,
      sampleRate: 44100
    }
  ];

  sampleAudio.forEach(file => {
    mediaLibrary.files.set(file.id, file);
  });

  // Sample playlist
  const samplePlaylist = {
    id: '1',
    name: 'Amiga Favorites',
    description: 'Best tracks from the Amiga era',
    tracks: ['1', '2', '3'],
    created: Date.now() - 86400000 * 7,
    modified: Date.now() - 86400000 * 2
  };

  mediaLibrary.playlists.set(samplePlaylist.id, samplePlaylist);
  mediaLibrary.nextFileId = 4;
  mediaLibrary.nextPlaylistId = 2;
};

// Initialize sample data
initializeSampleMedia();

// ==================== Media File Routes ====================

/**
 * GET /api/media/files
 * Get all media files with optional filtering
 */
router.get('/files', (req, res) => {
  try {
    const { type, artist, album, genre, search } = req.query;
    let files = Array.from(mediaLibrary.files.values());

    // Apply filters
    if (type) {
      files = files.filter(f => f.type === type);
    }

    if (artist) {
      files = files.filter(f =>
        f.artist && f.artist.toLowerCase().includes(artist.toLowerCase())
      );
    }

    if (album) {
      files = files.filter(f =>
        f.album && f.album.toLowerCase().includes(album.toLowerCase())
      );
    }

    if (genre) {
      files = files.filter(f =>
        f.genre && f.genre.toLowerCase().includes(genre.toLowerCase())
      );
    }

    if (search) {
      const searchLower = search.toLowerCase();
      files = files.filter(f =>
        f.name.toLowerCase().includes(searchLower) ||
        (f.artist && f.artist.toLowerCase().includes(searchLower)) ||
        (f.album && f.album.toLowerCase().includes(searchLower))
      );
    }

    res.json({
      success: true,
      files,
      count: files.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve media files',
      message: error.message
    });
  }
});

/**
 * GET /api/media/file/:id
 * Get a single media file by ID
 */
router.get('/file/:id', (req, res) => {
  try {
    const { id } = req.params;
    const file = mediaLibrary.files.get(id);

    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'Media file not found'
      });
    }

    res.json({
      success: true,
      file
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve media file',
      message: error.message
    });
  }
});

/**
 * POST /api/media/import
 * Import media files
 */
router.post('/import', (req, res) => {
  try {
    const { files } = req.body;

    if (!files || !Array.isArray(files)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request: files array required'
      });
    }

    const importedFiles = [];

    files.forEach(fileData => {
      const id = String(mediaLibrary.nextFileId++);
      const mediaFile = {
        id,
        ...fileData,
        addedDate: Date.now(),
        playCount: 0
      };

      mediaLibrary.files.set(id, mediaFile);
      importedFiles.push(mediaFile);
    });

    res.json({
      success: true,
      imported: importedFiles,
      count: importedFiles.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to import media files',
      message: error.message
    });
  }
});

/**
 * PUT /api/media/file/:id
 * Update media file metadata
 */
router.put('/file/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const file = mediaLibrary.files.get(id);

    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'Media file not found'
      });
    }

    // Update file metadata
    const updatedFile = {
      ...file,
      ...updates,
      id // Preserve ID
    };

    mediaLibrary.files.set(id, updatedFile);

    res.json({
      success: true,
      file: updatedFile
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update media file',
      message: error.message
    });
  }
});

/**
 * DELETE /api/media/file/:id
 * Remove media file from library
 */
router.delete('/file/:id', (req, res) => {
  try {
    const { id } = req.params;

    if (!mediaLibrary.files.has(id)) {
      return res.status(404).json({
        success: false,
        error: 'Media file not found'
      });
    }

    mediaLibrary.files.delete(id);

    // Remove from all playlists
    mediaLibrary.playlists.forEach(playlist => {
      playlist.tracks = playlist.tracks.filter(trackId => trackId !== id);
      playlist.modified = Date.now();
    });

    res.json({
      success: true,
      message: 'Media file removed'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to remove media file',
      message: error.message
    });
  }
});

/**
 * POST /api/media/file/:id/play
 * Track media file play (increment play count)
 */
router.post('/file/:id/play', (req, res) => {
  try {
    const { id } = req.params;
    const file = mediaLibrary.files.get(id);

    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'Media file not found'
      });
    }

    file.playCount++;
    file.lastPlayed = Date.now();

    res.json({
      success: true,
      file
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to track play',
      message: error.message
    });
  }
});

// ==================== Playlist Routes ====================

/**
 * GET /api/media/playlists
 * Get all playlists
 */
router.get('/playlists', (req, res) => {
  try {
    const playlists = Array.from(mediaLibrary.playlists.values());

    res.json({
      success: true,
      playlists,
      count: playlists.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve playlists',
      message: error.message
    });
  }
});

/**
 * GET /api/media/playlists/:id
 * Get a single playlist by ID
 */
router.get('/playlists/:id', (req, res) => {
  try {
    const { id } = req.params;
    const playlist = mediaLibrary.playlists.get(id);

    if (!playlist) {
      return res.status(404).json({
        success: false,
        error: 'Playlist not found'
      });
    }

    // Include track details
    const tracks = playlist.tracks
      .map(trackId => mediaLibrary.files.get(trackId))
      .filter(track => track !== undefined);

    res.json({
      success: true,
      playlist: {
        ...playlist,
        trackDetails: tracks
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve playlist',
      message: error.message
    });
  }
});

/**
 * POST /api/media/playlists
 * Create a new playlist
 */
router.post('/playlists', (req, res) => {
  try {
    const { name, description, tracks } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Playlist name required'
      });
    }

    const id = String(mediaLibrary.nextPlaylistId++);
    const playlist = {
      id,
      name,
      description: description || '',
      tracks: tracks || [],
      created: Date.now(),
      modified: Date.now()
    };

    mediaLibrary.playlists.set(id, playlist);

    res.json({
      success: true,
      playlist
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create playlist',
      message: error.message
    });
  }
});

/**
 * PUT /api/media/playlists/:id
 * Update playlist
 */
router.put('/playlists/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const playlist = mediaLibrary.playlists.get(id);

    if (!playlist) {
      return res.status(404).json({
        success: false,
        error: 'Playlist not found'
      });
    }

    const updatedPlaylist = {
      ...playlist,
      ...updates,
      id, // Preserve ID
      modified: Date.now()
    };

    mediaLibrary.playlists.set(id, updatedPlaylist);

    res.json({
      success: true,
      playlist: updatedPlaylist
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update playlist',
      message: error.message
    });
  }
});

/**
 * DELETE /api/media/playlists/:id
 * Delete playlist
 */
router.delete('/playlists/:id', (req, res) => {
  try {
    const { id } = req.params;

    if (!mediaLibrary.playlists.has(id)) {
      return res.status(404).json({
        success: false,
        error: 'Playlist not found'
      });
    }

    mediaLibrary.playlists.delete(id);

    res.json({
      success: true,
      message: 'Playlist deleted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete playlist',
      message: error.message
    });
  }
});

/**
 * POST /api/media/playlists/:id/tracks
 * Add tracks to playlist
 */
router.post('/playlists/:id/tracks', (req, res) => {
  try {
    const { id } = req.params;
    const { trackIds } = req.body;

    const playlist = mediaLibrary.playlists.get(id);

    if (!playlist) {
      return res.status(404).json({
        success: false,
        error: 'Playlist not found'
      });
    }

    if (!trackIds || !Array.isArray(trackIds)) {
      return res.status(400).json({
        success: false,
        error: 'Track IDs array required'
      });
    }

    // Add tracks (avoid duplicates)
    trackIds.forEach(trackId => {
      if (mediaLibrary.files.has(trackId) && !playlist.tracks.includes(trackId)) {
        playlist.tracks.push(trackId);
      }
    });

    playlist.modified = Date.now();

    res.json({
      success: true,
      playlist
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to add tracks to playlist',
      message: error.message
    });
  }
});

/**
 * DELETE /api/media/playlists/:id/tracks
 * Remove tracks from playlist
 */
router.delete('/playlists/:id/tracks', (req, res) => {
  try {
    const { id } = req.params;
    const { trackIds } = req.body;

    const playlist = mediaLibrary.playlists.get(id);

    if (!playlist) {
      return res.status(404).json({
        success: false,
        error: 'Playlist not found'
      });
    }

    if (!trackIds || !Array.isArray(trackIds)) {
      return res.status(400).json({
        success: false,
        error: 'Track IDs array required'
      });
    }

    playlist.tracks = playlist.tracks.filter(trackId => !trackIds.includes(trackId));
    playlist.modified = Date.now();

    res.json({
      success: true,
      playlist
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to remove tracks from playlist',
      message: error.message
    });
  }
});

// ==================== Statistics & Aggregations ====================

/**
 * GET /api/media/stats
 * Get library statistics
 */
router.get('/stats', (req, res) => {
  try {
    const files = Array.from(mediaLibrary.files.values());
    const audioFiles = files.filter(f => f.type === 'audio');
    const videoFiles = files.filter(f => f.type === 'video');

    const totalDuration = files.reduce((sum, f) => sum + (f.duration || 0), 0);
    const totalSize = files.reduce((sum, f) => sum + (f.fileSize || 0), 0);

    const mostPlayed = files
      .filter(f => f.playCount > 0)
      .sort((a, b) => b.playCount - a.playCount)
      .slice(0, 10);

    const recentlyPlayed = files
      .filter(f => f.lastPlayed)
      .sort((a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0))
      .slice(0, 10);

    const recentlyAdded = files
      .sort((a, b) => b.addedDate - a.addedDate)
      .slice(0, 10);

    // Get unique values
    const artists = [...new Set(files.map(f => f.artist).filter(a => a))];
    const albums = [...new Set(files.map(f => f.album).filter(a => a))];
    const genres = [...new Set(files.map(f => f.genre).filter(g => g))];

    res.json({
      success: true,
      stats: {
        totalFiles: files.length,
        audioFiles: audioFiles.length,
        videoFiles: videoFiles.length,
        totalDuration,
        totalSize,
        totalPlaylists: mediaLibrary.playlists.size,
        artists: artists.length,
        albums: albums.length,
        genres: genres.length,
        mostPlayed,
        recentlyPlayed,
        recentlyAdded
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve statistics',
      message: error.message
    });
  }
});

/**
 * GET /api/media/artists
 * Get all unique artists
 */
router.get('/artists', (req, res) => {
  try {
    const files = Array.from(mediaLibrary.files.values());
    const artists = [...new Set(files.map(f => f.artist).filter(a => a))];

    res.json({
      success: true,
      artists: artists.sort()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve artists',
      message: error.message
    });
  }
});

/**
 * GET /api/media/albums
 * Get all unique albums
 */
router.get('/albums', (req, res) => {
  try {
    const files = Array.from(mediaLibrary.files.values());
    const albums = [...new Set(files.map(f => f.album).filter(a => a))];

    res.json({
      success: true,
      albums: albums.sort()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve albums',
      message: error.message
    });
  }
});

/**
 * GET /api/media/genres
 * Get all unique genres
 */
router.get('/genres', (req, res) => {
  try {
    const files = Array.from(mediaLibrary.files.values());
    const genres = [...new Set(files.map(f => f.genre).filter(g => g))];

    res.json({
      success: true,
      genres: genres.sort()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve genres',
      message: error.message
    });
  }
});

// ==================== Streaming ====================

/**
 * GET /api/media/stream/:id
 * Stream media file (placeholder - would need actual file access in production)
 */
router.get('/stream/:id', (req, res) => {
  try {
    const { id } = req.params;
    const file = mediaLibrary.files.get(id);

    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'Media file not found'
      });
    }

    // In production, this would stream the actual file
    // For now, return file info with instructions
    res.json({
      success: true,
      message: 'Streaming endpoint (placeholder)',
      file,
      note: 'In production, this would stream the actual media file'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to stream media',
      message: error.message
    });
  }
});

module.exports = router;

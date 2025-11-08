<template>
  <div class="media-player">
    <!-- Visualizer Panel (Toggleable) -->
    <div v-if="showVisualizer" class="visualizer-panel">
      <canvas ref="visualizerCanvas" class="visualizer-canvas"></canvas>
      <div class="visualizer-controls">
        <select v-model="visualizerType" class="amiga-select visualizer-type" @change="changeVisualizerType">
          <option value="spectrum">Spectrum</option>
          <option value="waveform">Waveform</option>
          <option value="circle">Circle</option>
          <option value="bars">Bars</option>
        </select>
        <select v-model="colorScheme" class="amiga-select color-scheme" @change="changeColorScheme">
          <option value="amiga">Amiga</option>
          <option value="blue">Blue</option>
          <option value="green">Green</option>
          <option value="orange">Orange</option>
          <option value="rainbow">Rainbow</option>
        </select>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="player-content">
      <!-- Left Sidebar - Library Navigation -->
      <div class="sidebar-left">
        <div class="search-box">
          <input
            v-model="searchQuery"
            type="text"
            class="amiga-input search-input"
            placeholder="Search..."
            @input="handleSearch"
          />
        </div>

        <div class="library-nav">
          <div
            v-for="item in navigationItems"
            :key="item.id"
            class="nav-item"
            :class="{ active: activeView === item.id }"
            @click="changeView(item.id)"
          >
            <span class="nav-icon">{{ item.icon }}</span>
            <span class="nav-label">{{ item.label }}</span>
            <span v-if="item.count !== undefined" class="nav-count">{{ item.count }}</span>
          </div>
        </div>
      </div>

      <!-- Center - Track List -->
      <div class="track-list-container">
        <!-- View Header -->
        <div class="view-header">
          <h2 class="view-title">{{ currentViewTitle }}</h2>
          <div class="view-actions">
            <button class="amiga-button btn-small" @click="showImportDialog = true">
              Import
            </button>
            <button v-if="selectedTracks.length > 0" class="amiga-button btn-small" @click="playSelected">
              Play
            </button>
            <button v-if="selectedTracks.length > 0" class="amiga-button btn-small" @click="addSelectedToQueue">
              Add to Queue
            </button>
          </div>
        </div>

        <!-- Track Table -->
        <div class="track-table-wrapper">
          <table class="track-table">
            <thead>
              <tr>
                <th class="col-checkbox">
                  <input type="checkbox" @change="toggleSelectAll" :checked="allSelected" />
                </th>
                <th class="col-number" @click="sortBy('trackNumber')">#</th>
                <th class="col-title" @click="sortBy('name')">Title</th>
                <th class="col-artist" @click="sortBy('artist')">Artist</th>
                <th class="col-album" @click="sortBy('album')">Album</th>
                <th class="col-duration" @click="sortBy('duration')">Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(track, index) in displayedTracks"
                :key="track.id"
                class="track-row"
                :class="{
                  selected: selectedTracks.includes(track.id),
                  playing: currentTrack?.id === track.id && isPlaying
                }"
                @click="handleTrackClick($event, track)"
                @dblclick="playTrack(track)"
                @contextmenu="showContextMenu($event, track)"
              >
                <td class="col-checkbox">
                  <input
                    type="checkbox"
                    :checked="selectedTracks.includes(track.id)"
                    @change.stop="toggleTrackSelection(track.id)"
                  />
                </td>
                <td class="col-number">{{ track.trackNumber || index + 1 }}</td>
                <td class="col-title">
                  <span v-if="currentTrack?.id === track.id" class="now-playing-icon">♪</span>
                  {{ track.name }}
                </td>
                <td class="col-artist">{{ track.artist || '—' }}</td>
                <td class="col-album">{{ track.album || '—' }}</td>
                <td class="col-duration">{{ formatDuration(track.duration) }}</td>
              </tr>
            </tbody>
          </table>
          <div v-if="displayedTracks.length === 0" class="no-tracks">
            <p>No tracks found</p>
            <button class="amiga-button" @click="showImportDialog = true">Import Media</button>
          </div>
        </div>
      </div>

      <!-- Right Sidebar - Queue (Toggleable) -->
      <div v-if="showQueue" class="sidebar-right">
        <div class="queue-header">
          <h3>Up Next</h3>
          <button class="amiga-button btn-small" @click="clearQueue">Clear</button>
        </div>
        <div class="queue-list">
          <div
            v-for="(track, index) in queueTracks"
            :key="track.id + '-' + index"
            class="queue-item"
            :class="{ current: index === queueIndex }"
            draggable="true"
            @dragstart="handleDragStart(index, $event)"
            @dragover="handleDragOver($event)"
            @drop="handleDrop(index, $event)"
          >
            <div class="queue-item-info">
              <div class="queue-item-title">{{ track.name }}</div>
              <div class="queue-item-artist">{{ track.artist || 'Unknown' }}</div>
            </div>
            <button class="queue-item-remove" @click="removeFromQueue(index)">×</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Player Controls -->
    <div class="player-controls">
      <!-- Now Playing Info -->
      <div class="now-playing-info">
        <div v-if="currentTrack" class="album-art">
          <img v-if="currentTrack.artwork" :src="currentTrack.artwork" alt="Album Art" />
          <div v-else class="album-art-placeholder">♪</div>
        </div>
        <div class="track-info">
          <div class="track-title">{{ currentTrack?.name || 'No track playing' }}</div>
          <div class="track-artist">{{ currentTrack?.artist || '—' }}</div>
        </div>
      </div>

      <!-- Playback Controls -->
      <div class="playback-controls">
        <div class="control-buttons">
          <button class="control-btn btn-previous" @click="previous" title="Previous">⏮</button>
          <button class="control-btn btn-play-pause" @click="togglePlayPause" title="Play/Pause">
            {{ isPlaying ? '⏸' : '▶' }}
          </button>
          <button class="control-btn btn-stop" @click="stop" title="Stop">⏹</button>
          <button class="control-btn btn-next" @click="next" title="Next">⏭</button>
        </div>

        <!-- Progress Bar -->
        <div class="progress-section">
          <div class="time-label">{{ formatDuration(currentTime) }}</div>
          <div class="progress-bar-container" @click="seekToPosition">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
              <div class="progress-handle" :style="{ left: progressPercent + '%' }"></div>
            </div>
          </div>
          <div class="time-label">{{ formatDuration(duration) }}</div>
        </div>
      </div>

      <!-- Additional Controls -->
      <div class="additional-controls">
        <button
          class="control-btn btn-shuffle"
          :class="{ active: playbackMode === 'shuffle' }"
          @click="toggleShuffle"
          title="Shuffle"
        >
          🔀
        </button>
        <button
          class="control-btn btn-repeat"
          :class="{ active: playbackMode.startsWith('repeat-') && playbackMode !== 'repeat-off' }"
          @click="cycleRepeat"
          :title="repeatModeTitle"
        >
          {{ repeatIcon }}
        </button>

        <!-- Volume Control -->
        <div class="volume-control">
          <button class="control-btn btn-volume" @click="toggleMute" title="Mute">
            {{ isMuted ? '🔇' : '🔊' }}
          </button>
          <input
            type="range"
            class="volume-slider"
            min="0"
            max="100"
            :value="volume * 100"
            @input="setVolume"
          />
        </div>

        <button
          class="control-btn btn-visualizer"
          :class="{ active: showVisualizer }"
          @click="toggleVisualizer"
          title="Toggle Visualizer"
        >
          📊
        </button>
        <button
          class="control-btn btn-queue"
          :class="{ active: showQueue }"
          @click="toggleQueue"
          title="Toggle Queue"
        >
          ≡
        </button>
      </div>
    </div>

    <!-- Context Menu -->
    <div
      v-if="contextMenu.visible"
      class="context-menu"
      :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
      @click="hideContextMenu"
    >
      <div class="context-menu-item" @click="playTrack(contextMenu.track!)">Play</div>
      <div class="context-menu-item" @click="addToQueueSingle(contextMenu.track!)">Add to Queue</div>
      <div class="context-menu-item" @click="showPlaylistMenu = true">Add to Playlist</div>
      <div class="context-menu-separator"></div>
      <div class="context-menu-item" @click="showTrackInfo(contextMenu.track!)">Get Info</div>
      <div class="context-menu-separator"></div>
      <div class="context-menu-item context-menu-delete" @click="removeTrack(contextMenu.track!)">
        Remove from Library
      </div>
    </div>

    <!-- Dialogs -->
    <AmigaMediaImport v-if="showImportDialog" @close="showImportDialog = false" @imported="handleImported" />
    <AmigaTrackInfo
      v-if="showInfoDialog && selectedTrackForInfo"
      :track="selectedTrackForInfo"
      @close="showInfoDialog = false"
      @updated="handleTrackUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { mediaLibrary, type MediaFile } from '../../utils/media-library';
import { audioPlayer, type PlaybackMode } from '../../utils/audio-player';
import { audioVisualizer, type VisualizerType } from '../../utils/visualizer';
import AmigaMediaImport from '../dialogs/AmigaMediaImport.vue';
import AmigaTrackInfo from '../dialogs/AmigaTrackInfo.vue';

// ==================== State ====================

const searchQuery = ref('');
const activeView = ref('all-music');
const selectedTracks = ref<string[]>([]);
const displayedTracks = ref<MediaFile[]>([]);
const sortColumn = ref<keyof MediaFile>('name');
const sortDirection = ref<'asc' | 'desc'>('asc');

// Player state
const currentTrack = ref<MediaFile | null>(null);
const isPlaying = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const volume = ref(0.7);
const isMuted = ref(false);
const playbackMode = ref<PlaybackMode>('normal');
const queueTracks = ref<MediaFile[]>([]);
const queueIndex = ref(-1);

// UI state
const showVisualizer = ref(false);
const showQueue = ref(false);
const showImportDialog = ref(false);
const showInfoDialog = ref(false);
const selectedTrackForInfo = ref<MediaFile | null>(null);

// Visualizer
const visualizerCanvas = ref<HTMLCanvasElement | null>(null);
const visualizerType = ref<VisualizerType>('spectrum');
const colorScheme = ref('amiga');

// Context menu
const contextMenu = ref<{
  visible: boolean;
  x: number;
  y: number;
  track: MediaFile | null;
}>({
  visible: false,
  x: 0,
  y: 0,
  track: null,
});

const showPlaylistMenu = ref(false);
let draggedIndex: number | null = null;

// ==================== Computed ====================

const navigationItems = computed(() => {
  const stats = mediaLibrary.getStats();
  return [
    { id: 'all-music', label: 'All Music', icon: '♪', count: stats.totalTracks },
    { id: 'artists', label: 'Artists', icon: '👤', count: mediaLibrary.getArtists().length },
    { id: 'albums', label: 'Albums', icon: '💿', count: mediaLibrary.getAlbums().length },
    { id: 'genres', label: 'Genres', icon: '🎵', count: mediaLibrary.getGenres().length },
    { id: 'playlists', label: 'Playlists', icon: '📋', count: mediaLibrary.getPlaylists().length },
    { id: 'recent', label: 'Recently Played', icon: '🕒' },
    { id: 'most-played', label: 'Most Played', icon: '🔥' },
  ];
});

const currentViewTitle = computed(() => {
  const item = navigationItems.value.find(i => i.id === activeView.value);
  return item?.label || 'Media Library';
});

const allSelected = computed(() => {
  return displayedTracks.value.length > 0 &&
         selectedTracks.value.length === displayedTracks.value.length;
});

const progressPercent = computed(() => {
  if (duration.value === 0) return 0;
  return (currentTime.value / duration.value) * 100;
});

const repeatIcon = computed(() => {
  switch (playbackMode.value) {
    case 'repeat-one': return '🔂';
    case 'repeat-all': return '🔁';
    default: return '↻';
  }
});

const repeatModeTitle = computed(() => {
  switch (playbackMode.value) {
    case 'repeat-one': return 'Repeat One';
    case 'repeat-all': return 'Repeat All';
    default: return 'Repeat Off';
  }
});

// ==================== Methods ====================

function changeView(viewId: string) {
  activeView.value = viewId;
  selectedTracks.value = [];
  loadTracksForView();
}

function loadTracksForView() {
  let tracks: MediaFile[] = [];

  switch (activeView.value) {
    case 'all-music':
      tracks = mediaLibrary.getMediaFiles({ type: 'audio' });
      break;
    case 'recent':
      tracks = mediaLibrary.getRecentlyPlayed(50);
      break;
    case 'most-played':
      tracks = mediaLibrary.getMostPlayed(50);
      break;
    // Add more views as needed
    default:
      tracks = mediaLibrary.getMediaFiles({ type: 'audio' });
  }

  displayedTracks.value = tracks;
  applySorting();
}

function handleSearch() {
  if (searchQuery.value.trim()) {
    displayedTracks.value = mediaLibrary.searchMedia(searchQuery.value);
  } else {
    loadTracksForView();
  }
}

function sortBy(column: keyof MediaFile) {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortColumn.value = column;
    sortDirection.value = 'asc';
  }
  applySorting();
}

function applySorting() {
  displayedTracks.value.sort((a, b) => {
    const aVal = a[sortColumn.value];
    const bVal = b[sortColumn.value];

    if (aVal === undefined || aVal === null) return 1;
    if (bVal === undefined || bVal === null) return -1;

    let comparison = 0;
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      comparison = aVal.localeCompare(bVal);
    } else if (typeof aVal === 'number' && typeof bVal === 'number') {
      comparison = aVal - bVal;
    }

    return sortDirection.value === 'asc' ? comparison : -comparison;
  });
}

function handleTrackClick(event: MouseEvent, track: MediaFile) {
  if (event.ctrlKey || event.metaKey) {
    toggleTrackSelection(track.id);
  } else if (event.shiftKey && selectedTracks.value.length > 0) {
    // Range selection
    const lastSelected = selectedTracks.value[selectedTracks.value.length - 1];
    const lastIndex = displayedTracks.value.findIndex(t => t.id === lastSelected);
    const currentIndex = displayedTracks.value.findIndex(t => t.id === track.id);

    const start = Math.min(lastIndex, currentIndex);
    const end = Math.max(lastIndex, currentIndex);

    selectedTracks.value = displayedTracks.value
      .slice(start, end + 1)
      .map(t => t.id);
  } else {
    selectedTracks.value = [track.id];
  }
}

function toggleTrackSelection(trackId: string) {
  const index = selectedTracks.value.indexOf(trackId);
  if (index >= 0) {
    selectedTracks.value.splice(index, 1);
  } else {
    selectedTracks.value.push(trackId);
  }
}

function toggleSelectAll() {
  if (allSelected.value) {
    selectedTracks.value = [];
  } else {
    selectedTracks.value = displayedTracks.value.map(t => t.id);
  }
}

async function playTrack(track: MediaFile) {
  const trackIndex = displayedTracks.value.findIndex(t => t.id === track.id);
  audioPlayer.setQueue(displayedTracks.value, trackIndex);
  await audioPlayer.play(track);
  mediaLibrary.trackPlayed(track.id);
}

async function playSelected() {
  if (selectedTracks.value.length === 0) return;

  const tracks = displayedTracks.value.filter(t => selectedTracks.value.includes(t.id));
  audioPlayer.setQueue(tracks, 0);
  await audioPlayer.play(tracks[0]);
  mediaLibrary.trackPlayed(tracks[0].id);
}

function addSelectedToQueue() {
  const tracks = displayedTracks.value.filter(t => selectedTracks.value.includes(t.id));
  audioPlayer.addToQueue(tracks);
}

function addToQueueSingle(track: MediaFile) {
  audioPlayer.addToQueue([track]);
}

async function togglePlayPause() {
  audioPlayer.togglePlayPause();
}

async function stop() {
  audioPlayer.stop();
}

async function next() {
  await audioPlayer.next();
}

async function previous() {
  await audioPlayer.previous();
}

function setVolume(event: Event) {
  const target = event.target as HTMLInputElement;
  audioPlayer.setVolume(parseInt(target.value) / 100);
}

function toggleMute() {
  audioPlayer.toggleMute();
}

function toggleShuffle() {
  audioPlayer.toggleShuffle();
}

function cycleRepeat() {
  audioPlayer.cycleRepeatMode();
}

function seekToPosition(event: MouseEvent) {
  const target = event.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  const percent = (event.clientX - rect.left) / rect.width;
  audioPlayer.seek(duration.value * percent);
}

function clearQueue() {
  audioPlayer.clearQueue();
}

function removeFromQueue(index: number) {
  audioPlayer.removeFromQueue(index);
}

function toggleVisualizer() {
  showVisualizer.value = !showVisualizer.value;
  if (showVisualizer.value) {
    nextTick(() => {
      initVisualizer();
    });
  } else {
    audioVisualizer.stop();
  }
}

function toggleQueue() {
  showQueue.value = !showQueue.value;
}

function initVisualizer() {
  if (!visualizerCanvas.value) return;

  const analyser = audioPlayer.getAnalyser();
  if (!analyser) return;

  audioVisualizer.initialize(visualizerCanvas.value, analyser);
  audioVisualizer.setOptions({
    type: visualizerType.value,
    colorScheme: colorScheme.value,
  });
  audioVisualizer.start();
}

function changeVisualizerType() {
  audioVisualizer.setOptions({ type: visualizerType.value });
}

function changeColorScheme() {
  audioVisualizer.setOptions({ colorScheme: colorScheme.value });
}

function showContextMenu(event: MouseEvent, track: MediaFile) {
  event.preventDefault();
  contextMenu.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY,
    track,
  };

  // Close context menu on click outside
  setTimeout(() => {
    document.addEventListener('click', hideContextMenu, { once: true });
  }, 0);
}

function hideContextMenu() {
  contextMenu.value.visible = false;
  contextMenu.value.track = null;
}

function showTrackInfo(track: MediaFile) {
  selectedTrackForInfo.value = track;
  showInfoDialog.value = true;
}

function removeTrack(track: MediaFile) {
  if (confirm(`Remove "${track.name}" from library?`)) {
    mediaLibrary.removeMediaFile(track.id);
    loadTracksForView();
  }
}

function handleImported() {
  loadTracksForView();
}

function handleTrackUpdated(track: MediaFile) {
  loadTracksForView();
}

function formatDuration(seconds: number): string {
  return MediaLibrary.formatDuration(seconds);
}

// Drag and drop for queue reordering
function handleDragStart(index: number, event: DragEvent) {
  draggedIndex = index;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
  }
}

function handleDragOver(event: DragEvent) {
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }
}

function handleDrop(index: number, event: DragEvent) {
  event.preventDefault();
  if (draggedIndex !== null && draggedIndex !== index) {
    audioPlayer.reorderQueue(draggedIndex, index);
    draggedIndex = null;
  }
}

// ==================== Audio Player Event Handlers ====================

function setupAudioPlayerListeners() {
  audioPlayer.on('trackchange', (data) => {
    currentTrack.value = data.track;
  });

  audioPlayer.on('play', () => {
    isPlaying.value = true;
  });

  audioPlayer.on('pause', () => {
    isPlaying.value = false;
  });

  audioPlayer.on('stop', () => {
    isPlaying.value = false;
  });

  audioPlayer.on('timeupdate', (data) => {
    currentTime.value = data.currentTime;
    duration.value = data.duration;
  });

  audioPlayer.on('volumechange', (data) => {
    volume.value = data.volume;
    isMuted.value = data.isMuted;
  });

  audioPlayer.on('queuechange', (data) => {
    queueTracks.value = data.queue;
    queueIndex.value = data.index;
  });

  audioPlayer.on('modechange', (data) => {
    playbackMode.value = data.mode;
  });
}

// ==================== Lifecycle ====================

onMounted(() => {
  loadTracksForView();
  setupAudioPlayerListeners();

  // Sync with audio player state
  const state = audioPlayer.getState();
  currentTrack.value = state.currentTrack;
  isPlaying.value = state.isPlaying;
  currentTime.value = state.currentTime;
  duration.value = state.duration;
  volume.value = state.volume;
  isMuted.value = state.isMuted;
  playbackMode.value = state.mode;
  queueTracks.value = state.queue;
  queueIndex.value = state.queueIndex;
});

onUnmounted(() => {
  audioVisualizer.stop();
});
</script>

<style scoped>
.media-player {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #a0a0a0;
  font-family: 'Press Start 2P', monospace;
}

/* Visualizer Panel */
.visualizer-panel {
  height: 200px;
  background: #000000;
  border-bottom: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  position: relative;
}

.visualizer-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.visualizer-controls {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 8px;
}

.visualizer-type,
.color-scheme {
  font-size: 8px;
  padding: 4px;
}

/* Main Content */
.player-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* Left Sidebar */
.sidebar-left {
  width: 250px;
  background: #888888;
  border-right: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  display: flex;
  flex-direction: column;
}

.search-box {
  padding: 8px;
  border-bottom: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
}

.search-input {
  width: 100%;
  padding: 4px;
  font-size: 8px;
}

.library-nav {
  flex: 1;
  overflow-y: auto;
}

.nav-item {
  padding: 8px 12px;
  cursor: pointer;
  font-size: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid #666666;
}

.nav-item:hover {
  background: #999999;
}

.nav-item.active {
  background: #0055aa;
  color: #ffffff;
}

.nav-icon {
  font-size: 10px;
}

.nav-label {
  flex: 1;
}

.nav-count {
  font-size: 7px;
  opacity: 0.7;
}

/* Track List */
.track-list-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.view-header {
  padding: 12px;
  background: #888888;
  border-bottom: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.view-title {
  font-size: 10px;
  margin: 0;
}

.view-actions {
  display: flex;
  gap: 8px;
}

.btn-small {
  font-size: 7px;
  padding: 4px 8px;
}

.track-table-wrapper {
  flex: 1;
  overflow-y: auto;
}

.track-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 8px;
}

.track-table thead {
  background: #666666;
  color: #ffffff;
  position: sticky;
  top: 0;
  z-index: 1;
}

.track-table th {
  padding: 8px;
  text-align: left;
  cursor: pointer;
  border-bottom: 2px solid #000000;
}

.track-table th:hover {
  background: #777777;
}

.track-row {
  cursor: pointer;
  border-bottom: 1px solid #888888;
}

.track-row:hover {
  background: #999999;
}

.track-row.selected {
  background: #0055aa;
  color: #ffffff;
}

.track-row.playing {
  background: #ffaa00;
  color: #000000;
}

.track-table td {
  padding: 6px 8px;
}

.col-checkbox {
  width: 30px;
  text-align: center;
}

.col-number {
  width: 50px;
}

.col-title {
  min-width: 200px;
}

.col-artist {
  min-width: 150px;
}

.col-album {
  min-width: 150px;
}

.col-duration {
  width: 80px;
  text-align: right;
}

.now-playing-icon {
  margin-right: 4px;
  color: #0055aa;
}

.no-tracks {
  padding: 40px;
  text-align: center;
}

.no-tracks p {
  font-size: 10px;
  margin-bottom: 20px;
}

/* Right Sidebar - Queue */
.sidebar-right {
  width: 300px;
  background: #888888;
  border-left: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  display: flex;
  flex-direction: column;
}

.queue-header {
  padding: 8px 12px;
  background: #666666;
  color: #ffffff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #000000;
}

.queue-header h3 {
  font-size: 9px;
  margin: 0;
}

.queue-list {
  flex: 1;
  overflow-y: auto;
}

.queue-item {
  padding: 8px 12px;
  border-bottom: 1px solid #666666;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: move;
}

.queue-item:hover {
  background: #999999;
}

.queue-item.current {
  background: #0055aa;
  color: #ffffff;
}

.queue-item-info {
  flex: 1;
  overflow: hidden;
}

.queue-item-title {
  font-size: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.queue-item-artist {
  font-size: 7px;
  opacity: 0.7;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.queue-item-remove {
  background: none;
  border: none;
  color: inherit;
  font-size: 16px;
  cursor: pointer;
  padding: 0 4px;
}

/* Player Controls */
.player-controls {
  height: 100px;
  background: #666666;
  border-top: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  display: flex;
  align-items: center;
  padding: 8px 12px;
  gap: 16px;
}

.now-playing-info {
  display: flex;
  gap: 8px;
  align-items: center;
  width: 250px;
}

.album-art {
  width: 64px;
  height: 64px;
  background: #000000;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.album-art img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.album-art-placeholder {
  font-size: 24px;
  color: #0055aa;
}

.track-info {
  flex: 1;
  overflow: hidden;
}

.track-title {
  font-size: 9px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.track-artist {
  font-size: 7px;
  opacity: 0.7;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.playback-controls {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-buttons {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.control-btn {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 8px 12px;
  font-size: 16px;
  cursor: pointer;
  font-family: inherit;
}

.control-btn:hover {
  background: #b0b0b0;
}

.control-btn:active {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}

.control-btn.active {
  background: #0055aa;
  color: #ffffff;
}

.progress-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.time-label {
  font-size: 7px;
  min-width: 40px;
}

.progress-bar-container {
  flex: 1;
  cursor: pointer;
  padding: 4px 0;
}

.progress-bar {
  height: 8px;
  background: #000000;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: #0055aa;
  transition: width 0.1s;
}

.progress-handle {
  position: absolute;
  top: -2px;
  width: 12px;
  height: 12px;
  background: #ffaa00;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  transform: translateX(-50%);
}

.additional-controls {
  display: flex;
  gap: 8px;
  align-items: center;
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.volume-slider {
  width: 80px;
}

/* Context Menu */
.context-menu {
  position: fixed;
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.5);
  z-index: 1000;
  min-width: 150px;
}

.context-menu-item {
  padding: 6px 12px;
  font-size: 8px;
  cursor: pointer;
}

.context-menu-item:hover {
  background: #0055aa;
  color: #ffffff;
}

.context-menu-separator {
  height: 2px;
  background: #666666;
  margin: 2px 0;
}

.context-menu-delete {
  color: #ff0000;
}

/* Amiga-style inputs */
.amiga-input,
.amiga-select {
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  font-family: 'Press Start 2P', monospace;
  color: #000000;
}

.amiga-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 6px 12px;
  font-size: 8px;
  font-family: 'Press Start 2P', monospace;
  cursor: pointer;
}

.amiga-button:hover {
  background: #b0b0b0;
}

.amiga-button:active {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}
</style>

<template>
  <div
    v-if="currentTrack"
    class="now-playing-widget"
    :class="{ minimized: isMinimized }"
    :style="{ left: position.x + 'px', top: position.y + 'px' }"
    @mousedown="startDrag"
  >
    <!-- Header -->
    <div class="widget-header" @dblclick="toggleMinimize">
      <span class="widget-title">♪ Now Playing</span>
      <div class="widget-controls">
        <button class="widget-btn" @click.stop="toggleMinimize" title="Minimize">
          {{ isMinimized ? '□' : '−' }}
        </button>
        <button class="widget-btn" @click.stop="close" title="Close">×</button>
      </div>
    </div>

    <!-- Content -->
    <div v-if="!isMinimized" class="widget-content">
      <!-- Album Art -->
      <div class="album-art" @click="openPlayer">
        <img v-if="currentTrack.artwork" :src="currentTrack.artwork" alt="Album Art" />
        <div v-else class="album-art-placeholder">♪</div>
        <div class="play-overlay">
          <div class="play-icon">{{ isPlaying ? '⏸' : '▶' }}</div>
        </div>
      </div>

      <!-- Track Info -->
      <div class="track-info">
        <div class="track-title" :title="currentTrack.name">
          {{ currentTrack.name }}
        </div>
        <div class="track-artist" :title="currentTrack.artist">
          {{ currentTrack.artist || 'Unknown Artist' }}
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="progress-bar-container" @click="seek">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
        <div class="time-display">
          <span>{{ formatTime(currentTime) }}</span>
          <span>{{ formatTime(duration) }}</span>
        </div>
      </div>

      <!-- Playback Controls -->
      <div class="playback-controls">
        <button class="control-btn" @click="previous" title="Previous">⏮</button>
        <button class="control-btn btn-play" @click="togglePlayPause" :title="isPlaying ? 'Pause' : 'Play'">
          {{ isPlaying ? '⏸' : '▶' }}
        </button>
        <button class="control-btn" @click="next" title="Next">⏭</button>

        <!-- Volume -->
        <div class="volume-control">
          <button class="control-btn btn-volume" @click="toggleMute" :title="isMuted ? 'Unmute' : 'Mute'">
            {{ volumeIcon }}
          </button>
          <input
            v-if="showVolume"
            type="range"
            class="volume-slider"
            min="0"
            max="100"
            :value="volume * 100"
            @input="setVolume"
          />
        </div>

        <button class="control-btn" @click="openPlayer" title="Open Player">⊞</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { audioPlayer } from '../../utils/audio-player';
import type { MediaFile } from '../../utils/media-library';

// Emits
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'openPlayer'): void;
}>();

// State
const currentTrack = ref<MediaFile | null>(null);
const isPlaying = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const volume = ref(0.7);
const isMuted = ref(false);
const isMinimized = ref(false);
const showVolume = ref(false);

// Position
const position = ref({ x: 20, y: 20 });
const isDragging = ref(false);
let dragStartX = 0;
let dragStartY = 0;
let dragOffsetX = 0;
let dragOffsetY = 0;

// Computed
const progressPercent = computed(() => {
  if (duration.value === 0) return 0;
  return (currentTime.value / duration.value) * 100;
});

const volumeIcon = computed(() => {
  if (isMuted.value || volume.value === 0) return '🔇';
  if (volume.value < 0.3) return '🔈';
  if (volume.value < 0.7) return '🔉';
  return '🔊';
});

// Methods
function startDrag(event: MouseEvent) {
  // Only drag from header
  if (!(event.target as HTMLElement).closest('.widget-header')) return;

  isDragging.value = true;
  dragStartX = event.clientX;
  dragStartY = event.clientY;
  dragOffsetX = position.value.x;
  dragOffsetY = position.value.y;

  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', stopDrag);
  event.preventDefault();
}

function onDrag(event: MouseEvent) {
  if (!isDragging.value) return;

  const dx = event.clientX - dragStartX;
  const dy = event.clientY - dragStartY;

  position.value = {
    x: dragOffsetX + dx,
    y: dragOffsetY + dy,
  };
}

function stopDrag() {
  isDragging.value = false;
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDrag);

  // Save position to localStorage
  localStorage.setItem('webos_nowplaying_position', JSON.stringify(position.value));
}

function toggleMinimize() {
  isMinimized.value = !isMinimized.value;
}

function close() {
  emit('close');
}

function togglePlayPause() {
  audioPlayer.togglePlayPause();
}

function previous() {
  audioPlayer.previous();
}

function next() {
  audioPlayer.next();
}

function setVolume(event: Event) {
  const target = event.target as HTMLInputElement;
  audioPlayer.setVolume(parseInt(target.value) / 100);
}

function toggleMute() {
  audioPlayer.toggleMute();
}

function seek(event: MouseEvent) {
  const target = event.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  const percent = (event.clientX - rect.left) / rect.width;
  audioPlayer.seek(duration.value * percent);
}

function openPlayer() {
  emit('openPlayer');
}

function formatTime(seconds: number): string {
  return MediaLibrary.formatDuration(seconds);
}

// Audio Player Event Handlers
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
}

// Load saved position
function loadPosition() {
  try {
    const saved = localStorage.getItem('webos_nowplaying_position');
    if (saved) {
      position.value = JSON.parse(saved);
    } else {
      // Default position: bottom-right corner
      position.value = {
        x: window.innerWidth - 320,
        y: window.innerHeight - 250,
      };
    }
  } catch (error) {
    console.error('Failed to load widget position:', error);
  }
}

// Lifecycle
onMounted(() => {
  loadPosition();
  setupAudioPlayerListeners();

  // Sync with audio player state
  const state = audioPlayer.getState();
  currentTrack.value = state.currentTrack;
  isPlaying.value = state.isPlaying;
  currentTime.value = state.currentTime;
  duration.value = state.duration;
  volume.value = state.volume;
  isMuted.value = state.isMuted;
});

onUnmounted(() => {
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDrag);
});
</script>

<style scoped>
.now-playing-widget {
  position: fixed;
  width: 300px;
  background: #a0a0a0;
  border: 4px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.5);
  z-index: 900;
  font-family: 'Press Start 2P', monospace;
}

.now-playing-widget.minimized {
  width: 200px;
}

.widget-header {
  background: #0055aa;
  color: #ffffff;
  padding: 6px 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: move;
  border-bottom: 2px solid #000000;
}

.widget-title {
  font-size: 8px;
}

.widget-controls {
  display: flex;
  gap: 4px;
}

.widget-btn {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  color: #000000;
  font-size: 10px;
  width: 20px;
  height: 20px;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.widget-btn:hover {
  background: #b0b0b0;
}

.widget-btn:active {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}

.widget-content {
  padding: 12px;
}

.album-art {
  width: 100%;
  aspect-ratio: 1;
  background: #666666;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  margin-bottom: 12px;
  position: relative;
  cursor: pointer;
  overflow: hidden;
}

.album-art img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.album-art-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  color: #0055aa;
}

.play-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.album-art:hover .play-overlay {
  opacity: 1;
}

.play-icon {
  width: 50px;
  height: 50px;
  background: #0055aa;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #ffffff;
}

.track-info {
  margin-bottom: 12px;
}

.track-title {
  font-size: 9px;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.track-artist {
  font-size: 7px;
  opacity: 0.7;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.progress-bar-container {
  margin-bottom: 12px;
  cursor: pointer;
}

.progress-bar {
  height: 8px;
  background: #666666;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  margin-bottom: 4px;
  position: relative;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #0055aa;
  transition: width 0.1s;
}

.time-display {
  display: flex;
  justify-content: space-between;
  font-size: 6px;
  opacity: 0.7;
}

.playback-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
}

.control-btn {
  background: #888888;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 6px 8px;
  font-size: 12px;
  cursor: pointer;
  flex-shrink: 0;
}

.control-btn:hover {
  background: #999999;
}

.control-btn:active {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #666666;
}

.btn-play {
  background: #0055aa;
  color: #ffffff;
}

.btn-play:hover {
  background: #0066cc;
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
}

.btn-volume {
  font-size: 10px;
}

.volume-slider {
  flex: 1;
  max-width: 80px;
}
</style>

<template>
  <div class="video-player" @mousemove="handleMouseMove">
    <!-- Video Element -->
    <div class="video-container">
      <video
        ref="videoElement"
        class="video-element"
        :src="videoSrc"
        @loadedmetadata="handleLoadedMetadata"
        @timeupdate="handleTimeUpdate"
        @play="isPlaying = true"
        @pause="isPlaying = false"
        @ended="handleEnded"
        @click="togglePlayPause"
      >
        <track
          v-if="subtitles"
          kind="subtitles"
          :src="subtitles"
          srclang="en"
          label="English"
          default
        />
      </video>

      <!-- Loading Overlay -->
      <div v-if="isLoading" class="loading-overlay">
        <div class="loading-text">Loading video...</div>
      </div>

      <!-- Controls Overlay -->
      <div
        v-show="showControls || !isPlaying"
        class="controls-overlay"
        :class="{ visible: showControls || !isPlaying }"
      >
        <!-- Top Info Bar -->
        <div class="top-info-bar">
          <div class="video-title">{{ videoTitle }}</div>
          <div class="video-info">
            {{ formatResolution() }} • {{ formatDuration(currentTime) }} / {{ formatDuration(duration) }}
          </div>
        </div>

        <!-- Center Play Button -->
        <div v-if="!isPlaying" class="center-play-button" @click="play">
          <div class="play-icon">▶</div>
        </div>

        <!-- Bottom Control Bar -->
        <div class="bottom-control-bar">
          <!-- Progress Bar -->
          <div class="progress-container" @click="seek">
            <div class="progress-bar">
              <div class="progress-buffer" :style="{ width: bufferPercent + '%' }"></div>
              <div class="progress-played" :style="{ width: progressPercent + '%' }"></div>
              <div class="progress-handle" :style="{ left: progressPercent + '%' }"></div>
            </div>
            <div class="time-tooltip" :style="{ left: tooltipPosition + '%' }">
              {{ tooltipTime }}
            </div>
          </div>

          <!-- Control Buttons -->
          <div class="control-buttons">
            <div class="left-controls">
              <button class="control-btn btn-play-pause" @click="togglePlayPause" :title="isPlaying ? 'Pause' : 'Play'">
                {{ isPlaying ? '⏸' : '▶' }}
              </button>
              <button class="control-btn btn-stop" @click="stop" title="Stop">
                ⏹
              </button>

              <!-- Volume Control -->
              <div class="volume-group">
                <button class="control-btn btn-volume" @click="toggleMute" :title="isMuted ? 'Unmute' : 'Mute'">
                  {{ volumeIcon }}
                </button>
                <div class="volume-slider-container" @mouseenter="showVolumeSlider = true" @mouseleave="showVolumeSlider = false">
                  <input
                    v-show="showVolumeSlider"
                    type="range"
                    class="volume-slider"
                    min="0"
                    max="100"
                    :value="volume * 100"
                    @input="setVolume"
                  />
                </div>
              </div>

              <!-- Time Display -->
              <div class="time-display">
                {{ formatDuration(currentTime) }} / {{ formatDuration(duration) }}
              </div>
            </div>

            <div class="right-controls">
              <!-- Playback Speed -->
              <div class="speed-control">
                <button class="control-btn btn-speed" @click="toggleSpeedMenu" title="Playback Speed">
                  {{ playbackSpeed }}x
                </button>
                <div v-if="showSpeedMenu" class="speed-menu">
                  <div
                    v-for="speed in speedOptions"
                    :key="speed"
                    class="speed-option"
                    :class="{ active: playbackSpeed === speed }"
                    @click="setPlaybackSpeed(speed)"
                  >
                    {{ speed }}x
                  </div>
                </div>
              </div>

              <!-- Settings Button -->
              <button class="control-btn btn-settings" @click="toggleSettings" title="Settings">
                ⚙
              </button>

              <!-- Fullscreen Button -->
              <button class="control-btn btn-fullscreen" @click="toggleFullscreen" title="Fullscreen">
                {{ isFullscreen ? '⛶' : '⛶' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Settings Panel -->
    <div v-if="showSettings" class="settings-panel">
      <div class="settings-header">
        <h3>Video Settings</h3>
        <button class="close-btn" @click="showSettings = false">×</button>
      </div>
      <div class="settings-content">
        <div class="setting-item">
          <label>Quality:</label>
          <select v-model="quality" class="amiga-select">
            <option value="auto">Auto</option>
            <option value="1080p">1080p</option>
            <option value="720p">720p</option>
            <option value="480p">480p</option>
            <option value="360p">360p</option>
          </select>
        </div>
        <div class="setting-item">
          <label>Subtitles:</label>
          <select v-model="subtitleTrack" class="amiga-select">
            <option value="">None</option>
            <option value="en">English</option>
          </select>
        </div>
        <div class="setting-item">
          <label>Loop:</label>
          <input type="checkbox" v-model="loop" @change="updateLoop" />
        </div>
      </div>
    </div>

    <!-- Video Info Panel (Bottom) -->
    <div class="info-panel">
      <div class="info-row">
        <span class="info-label">File:</span>
        <span class="info-value">{{ fileName }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Size:</span>
        <span class="info-value">{{ fileSize }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Format:</span>
        <span class="info-value">{{ videoFormat }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Resolution:</span>
        <span class="info-value">{{ formatResolution() }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

// Props
interface Props {
  src?: string;
  title?: string;
  autoplay?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  src: '',
  title: 'Video Player',
  autoplay: false,
});

// Emits
const emit = defineEmits<{
  (e: 'close'): void;
}>();

// Refs
const videoElement = ref<HTMLVideoElement | null>(null);
const videoSrc = ref(props.src);
const videoTitle = ref(props.title);

// State
const isPlaying = ref(false);
const isLoading = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const volume = ref(0.7);
const isMuted = ref(false);
const isFullscreen = ref(false);
const playbackSpeed = ref(1);
const bufferPercent = ref(0);

// UI State
const showControls = ref(true);
const showVolumeSlider = ref(false);
const showSpeedMenu = ref(false);
const showSettings = ref(false);
const tooltipPosition = ref(0);
const tooltipTime = ref('0:00');

// Settings
const quality = ref('auto');
const subtitleTrack = ref('');
const subtitles = ref('');
const loop = ref(false);

// Video Info
const fileName = ref('video.mp4');
const fileSize = ref('—');
const videoFormat = ref('MP4');
const videoWidth = ref(0);
const videoHeight = ref(0);

// Constants
const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 2];
let controlsTimeout: number | null = null;

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
function play() {
  videoElement.value?.play();
}

function pause() {
  videoElement.value?.pause();
}

function togglePlayPause() {
  if (isPlaying.value) {
    pause();
  } else {
    play();
  }
}

function stop() {
  pause();
  if (videoElement.value) {
    videoElement.value.currentTime = 0;
  }
  currentTime.value = 0;
}

function seek(event: MouseEvent) {
  if (!videoElement.value) return;

  const target = event.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  const percent = (event.clientX - rect.left) / rect.width;
  videoElement.value.currentTime = duration.value * percent;
}

function setVolume(event: Event) {
  const target = event.target as HTMLInputElement;
  const newVolume = parseInt(target.value) / 100;
  volume.value = newVolume;

  if (videoElement.value) {
    videoElement.value.volume = newVolume;
  }

  if (newVolume > 0 && isMuted.value) {
    isMuted.value = false;
    if (videoElement.value) {
      videoElement.value.muted = false;
    }
  }
}

function toggleMute() {
  isMuted.value = !isMuted.value;
  if (videoElement.value) {
    videoElement.value.muted = isMuted.value;
  }
}

function setPlaybackSpeed(speed: number) {
  playbackSpeed.value = speed;
  if (videoElement.value) {
    videoElement.value.playbackRate = speed;
  }
  showSpeedMenu.value = false;
}

function toggleSpeedMenu() {
  showSpeedMenu.value = !showSpeedMenu.value;
}

function toggleSettings() {
  showSettings.value = !showSettings.value;
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    videoElement.value?.requestFullscreen();
    isFullscreen.value = true;
  } else {
    document.exitFullscreen();
    isFullscreen.value = false;
  }
}

function updateLoop() {
  if (videoElement.value) {
    videoElement.value.loop = loop.value;
  }
}

function handleLoadedMetadata() {
  if (!videoElement.value) return;

  duration.value = videoElement.value.duration;
  videoWidth.value = videoElement.value.videoWidth;
  videoHeight.value = videoElement.value.videoHeight;
  isLoading.value = false;

  // Set initial volume
  videoElement.value.volume = volume.value;

  // Auto-play if enabled
  if (props.autoplay) {
    play();
  }
}

function handleTimeUpdate() {
  if (!videoElement.value) return;
  currentTime.value = videoElement.value.currentTime;

  // Update buffer percentage
  if (videoElement.value.buffered.length > 0) {
    const bufferedEnd = videoElement.value.buffered.end(videoElement.value.buffered.length - 1);
    bufferPercent.value = (bufferedEnd / duration.value) * 100;
  }
}

function handleEnded() {
  isPlaying.value = false;
  if (!loop.value) {
    currentTime.value = 0;
  }
}

function handleMouseMove() {
  showControls.value = true;

  // Auto-hide controls after 3 seconds of inactivity
  if (controlsTimeout) {
    clearTimeout(controlsTimeout);
  }

  if (isPlaying.value) {
    controlsTimeout = window.setTimeout(() => {
      showControls.value = false;
    }, 3000);
  }
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function formatResolution(): string {
  if (videoWidth.value === 0) return '—';
  return `${videoWidth.value}×${videoHeight.value}`;
}

// Keyboard shortcuts
function handleKeyPress(event: KeyboardEvent) {
  switch (event.key) {
    case ' ':
      event.preventDefault();
      togglePlayPause();
      break;
    case 'f':
    case 'F':
      event.preventDefault();
      toggleFullscreen();
      break;
    case 'm':
    case 'M':
      event.preventDefault();
      toggleMute();
      break;
    case 'ArrowLeft':
      event.preventDefault();
      if (videoElement.value) {
        videoElement.value.currentTime = Math.max(0, currentTime.value - 5);
      }
      break;
    case 'ArrowRight':
      event.preventDefault();
      if (videoElement.value) {
        videoElement.value.currentTime = Math.min(duration.value, currentTime.value + 5);
      }
      break;
    case 'ArrowUp':
      event.preventDefault();
      setVolume({ target: { value: Math.min(100, volume.value * 100 + 10).toString() } } as any);
      break;
    case 'ArrowDown':
      event.preventDefault();
      setVolume({ target: { value: Math.max(0, volume.value * 100 - 10).toString() } } as any);
      break;
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('keydown', handleKeyPress);

  // Extract file info from src
  if (videoSrc.value) {
    const urlParts = videoSrc.value.split('/');
    fileName.value = urlParts[urlParts.length - 1] || 'video.mp4';

    const ext = fileName.value.split('.').pop()?.toUpperCase();
    if (ext) {
      videoFormat.value = ext;
    }
  }
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyPress);
  if (controlsTimeout) {
    clearTimeout(controlsTimeout);
  }
});

// Public methods (for parent component)
defineExpose({
  play,
  pause,
  stop,
  togglePlayPause,
});
</script>

<style scoped>
.video-player {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #000000;
}

.video-container {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.video-element {
  width: 100%;
  height: 100%;
  object-fit: contain;
  cursor: pointer;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.loading-text {
  color: #ffffff;
  font-size: 12px;
  font-family: 'Press Start 2P', monospace;
}

.controls-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s;
  z-index: 5;
}

.controls-overlay.visible {
  opacity: 1;
  pointer-events: auto;
}

.top-info-bar {
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.7), transparent);
  padding: 16px;
  color: #ffffff;
}

.video-title {
  font-size: 10px;
  font-family: 'Press Start 2P', monospace;
  margin-bottom: 4px;
}

.video-info {
  font-size: 7px;
  font-family: 'Press Start 2P', monospace;
  opacity: 0.8;
}

.center-play-button {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.play-icon {
  width: 80px;
  height: 80px;
  background: rgba(0, 85, 170, 0.8);
  border: 4px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  color: #ffffff;
  transition: transform 0.2s;
}

.play-icon:hover {
  transform: scale(1.1);
  background: rgba(0, 85, 170, 1);
}

.bottom-control-bar {
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
  padding: 16px;
}

.progress-container {
  margin-bottom: 12px;
  cursor: pointer;
  position: relative;
}

.progress-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.3);
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  position: relative;
  overflow: hidden;
}

.progress-buffer {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: rgba(255, 255, 255, 0.5);
  transition: width 0.2s;
}

.progress-played {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: #0055aa;
  transition: width 0.1s;
}

.progress-handle {
  position: absolute;
  top: -4px;
  width: 16px;
  height: 16px;
  background: #ffaa00;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  transform: translateX(-50%);
}

.time-tooltip {
  position: absolute;
  bottom: 16px;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: #ffffff;
  padding: 4px 8px;
  font-size: 7px;
  font-family: 'Press Start 2P', monospace;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s;
}

.progress-container:hover .time-tooltip {
  opacity: 1;
}

.control-buttons {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.left-controls,
.right-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-btn {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 6px 12px;
  font-size: 14px;
  color: #000000;
  cursor: pointer;
  font-family: 'Press Start 2P', monospace;
}

.control-btn:hover {
  background: #b0b0b0;
}

.control-btn:active {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}

.volume-group {
  display: flex;
  align-items: center;
  gap: 4px;
  position: relative;
}

.volume-slider-container {
  position: relative;
}

.volume-slider {
  width: 80px;
}

.time-display {
  font-size: 8px;
  font-family: 'Press Start 2P', monospace;
  color: #ffffff;
  min-width: 80px;
}

.speed-control {
  position: relative;
}

.btn-speed {
  font-size: 8px;
  min-width: 48px;
}

.speed-menu {
  position: absolute;
  bottom: 100%;
  right: 0;
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  margin-bottom: 4px;
}

.speed-option {
  padding: 6px 12px;
  font-size: 8px;
  font-family: 'Press Start 2P', monospace;
  cursor: pointer;
  border-bottom: 1px solid #666666;
}

.speed-option:last-child {
  border-bottom: none;
}

.speed-option:hover {
  background: #b0b0b0;
}

.speed-option.active {
  background: #0055aa;
  color: #ffffff;
}

.settings-panel {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #a0a0a0;
  border: 4px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  width: 300px;
  z-index: 20;
  box-shadow: 8px 8px 0 rgba(0, 0, 0, 0.5);
}

.settings-header {
  background: #0055aa;
  color: #ffffff;
  padding: 8px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #000000;
}

.settings-header h3 {
  font-size: 9px;
  margin: 0;
  font-family: 'Press Start 2P', monospace;
}

.close-btn {
  background: none;
  border: none;
  color: #ffffff;
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.settings-content {
  padding: 16px;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 8px;
  font-family: 'Press Start 2P', monospace;
}

.setting-item label {
  flex: 1;
}

.amiga-select {
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 4px;
  font-size: 8px;
  font-family: 'Press Start 2P', monospace;
}

.info-panel {
  background: #666666;
  border-top: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 8px 12px;
  font-family: 'Press Start 2P', monospace;
  font-size: 7px;
  color: #ffffff;
}

.info-row {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-label {
  min-width: 80px;
  opacity: 0.7;
}

.info-value {
  flex: 1;
}
</style>

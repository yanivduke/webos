<template>
  <div class="audio-preview">
    <div class="audio-artwork">
      <div class="album-cover">
        <svg viewBox="0 0 200 200" class="default-artwork">
          <rect width="200" height="200" fill="#0055aa"/>
          <circle cx="100" cy="100" r="60" fill="#a0a0a0"/>
          <circle cx="100" cy="100" r="20" fill="#000000"/>
        </svg>
      </div>
    </div>

    <div class="audio-metadata">
      <div class="track-title">{{ metadata.title || metadata.name }}</div>
      <div class="track-artist">{{ metadata.artist || 'Unknown Artist' }}</div>
      <div class="track-album">{{ metadata.album || 'Unknown Album' }}</div>
    </div>

    <div class="audio-waveform" ref="waveformRef">
      <canvas ref="canvasRef"></canvas>
    </div>

    <div class="audio-controls">
      <button class="amiga-button play-button" @click="togglePlay">
        {{ isPlaying ? '⏸' : '▶' }}
      </button>
      <div class="progress-bar" @click="seek">
        <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
        <div class="progress-handle" :style="{ left: `${progress}%` }"></div>
      </div>
      <div class="time-display">
        {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
      </div>
    </div>

    <div class="volume-controls">
      <span class="volume-icon">{{ volumeIcon }}</span>
      <input
        type="range"
        class="volume-slider"
        min="0"
        max="100"
        v-model="volume"
        @input="updateVolume"
      />
    </div>

    <audio
      ref="audioRef"
      @loadedmetadata="onLoadedMetadata"
      @timeupdate="onTimeUpdate"
      @ended="onEnded"
    ></audio>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { FileMetadata } from '../../utils/file-preview';

interface Props {
  filePath: string;
  metadata: FileMetadata;
}

const props = defineProps<Props>();

const audioRef = ref<HTMLAudioElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const waveformRef = ref<HTMLElement | null>(null);
const isPlaying = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const volume = ref(75);

const progress = computed(() => {
  if (!duration.value) return 0;
  return (currentTime.value / duration.value) * 100;
});

const volumeIcon = computed(() => {
  if (volume.value === 0) return '🔇';
  if (volume.value < 50) return '🔉';
  return '🔊';
});

const togglePlay = () => {
  if (!audioRef.value) return;

  if (isPlaying.value) {
    audioRef.value.pause();
    isPlaying.value = false;
  } else {
    audioRef.value.play();
    isPlaying.value = true;
  }
};

const seek = (event: MouseEvent) => {
  if (!audioRef.value || !duration.value) return;

  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const x = event.clientX - rect.left;
  const percentage = x / rect.width;
  audioRef.value.currentTime = percentage * duration.value;
};

const updateVolume = () => {
  if (!audioRef.value) return;
  audioRef.value.volume = volume.value / 100;
};

const onLoadedMetadata = () => {
  if (!audioRef.value) return;
  duration.value = audioRef.value.duration;
  updateVolume();
  drawWaveform();
};

const onTimeUpdate = () => {
  if (!audioRef.value) return;
  currentTime.value = audioRef.value.currentTime;
};

const onEnded = () => {
  isPlaying.value = false;
};

const formatTime = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const drawWaveform = () => {
  if (!canvasRef.value || !waveformRef.value) return;

  const canvas = canvasRef.value;
  const container = waveformRef.value;

  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Draw simple waveform visualization (bars)
  ctx.fillStyle = '#0055aa';
  const barCount = 50;
  const barWidth = canvas.width / barCount;
  const maxHeight = canvas.height;

  for (let i = 0; i < barCount; i++) {
    const height = Math.random() * maxHeight * 0.8 + maxHeight * 0.2;
    const x = i * barWidth;
    const y = (maxHeight - height) / 2;

    ctx.fillRect(x + 1, y, barWidth - 2, height);
  }
};

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.code === 'Space') {
    event.preventDefault();
    togglePlay();
  }
};

onMounted(async () => {
  if (!audioRef.value) return;

  try {
    const response = await fetch(`/api/files/content?path=${encodeURIComponent(props.filePath)}`);
    if (response.ok) {
      const blob = await response.blob();
      audioRef.value.src = URL.createObjectURL(blob);
    }
  } catch (error) {
    console.error('Failed to load audio:', error);
  }

  document.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  if (audioRef.value?.src) {
    URL.revokeObjectURL(audioRef.value.src);
  }
  document.removeEventListener('keydown', handleKeyDown);
});
</script>

<style scoped>
.audio-preview {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #a0a0a0;
  padding: 16px;
  align-items: center;
  justify-content: center;
}

.audio-artwork {
  width: 200px;
  height: 200px;
  margin-bottom: 16px;
}

.album-cover {
  width: 100%;
  height: 100%;
  border: 4px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  background: #000000;
}

.default-artwork {
  width: 100%;
  height: 100%;
}

.audio-metadata {
  text-align: center;
  margin-bottom: 16px;
  max-width: 400px;
}

.track-title {
  font-size: 12px;
  font-family: 'Press Start 2P', monospace;
  color: #000000;
  margin-bottom: 8px;
  font-weight: bold;
}

.track-artist {
  font-size: 9px;
  font-family: 'Press Start 2P', monospace;
  color: #333333;
  margin-bottom: 4px;
}

.track-album {
  font-size: 8px;
  font-family: 'Press Start 2P', monospace;
  color: #666666;
}

.audio-waveform {
  width: 100%;
  max-width: 500px;
  height: 60px;
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  margin-bottom: 16px;
}

.audio-waveform canvas {
  width: 100%;
  height: 100%;
}

.audio-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  max-width: 500px;
  margin-bottom: 12px;
}

.play-button {
  min-width: 50px;
  font-size: 12px;
}

.progress-bar {
  flex: 1;
  height: 20px;
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  position: relative;
  cursor: pointer;
}

.progress-fill {
  height: 100%;
  background: #0055aa;
  transition: width 0.1s linear;
}

.progress-handle {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 12px;
  height: 12px;
  background: #ffaa00;
  border: 2px solid #000000;
  pointer-events: none;
}

.time-display {
  font-size: 8px;
  font-family: 'Press Start 2P', monospace;
  color: #000000;
  min-width: 80px;
}

.volume-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  max-width: 200px;
}

.volume-icon {
  font-size: 16px;
}

.volume-slider {
  flex: 1;
  height: 16px;
  -webkit-appearance: none;
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  outline: none;
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: #0055aa;
  border: 2px solid #000000;
  cursor: pointer;
}

.volume-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: #0055aa;
  border: 2px solid #000000;
  cursor: pointer;
}

.amiga-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 4px 8px;
  font-size: 9px;
  font-family: 'Press Start 2P', monospace;
  cursor: pointer;
  color: #000000;
}

.amiga-button:hover {
  background: #b0b0b0;
}

.amiga-button:active {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}
</style>

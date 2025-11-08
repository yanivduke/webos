<template>
  <div class="video-preview">
    <div class="video-container" ref="containerRef">
      <video
        ref="videoRef"
        @loadedmetadata="onLoadedMetadata"
        @timeupdate="onTimeUpdate"
        @ended="onEnded"
        @click="togglePlay"
      ></video>
    </div>

    <div class="video-controls">
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
      <button class="amiga-button" @click="toggleFullscreen">⛶</button>
    </div>

    <div class="video-info">
      <span>{{ metadata.width }} × {{ metadata.height }}</span>
      <span v-if="metadata.size">{{ formatSize(metadata.size) }}</span>
      <span v-if="videoCodec">{{ videoCodec }}</span>
    </div>
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

const videoRef = ref<HTMLVideoElement | null>(null);
const containerRef = ref<HTMLElement | null>(null);
const isPlaying = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const videoCodec = ref('');

const progress = computed(() => {
  if (!duration.value) return 0;
  return (currentTime.value / duration.value) * 100;
});

const togglePlay = () => {
  if (!videoRef.value) return;

  if (isPlaying.value) {
    videoRef.value.pause();
    isPlaying.value = false;
  } else {
    videoRef.value.play();
    isPlaying.value = true;
  }
};

const seek = (event: MouseEvent) => {
  if (!videoRef.value || !duration.value) return;

  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const x = event.clientX - rect.left;
  const percentage = x / rect.width;
  videoRef.value.currentTime = percentage * duration.value;
};

const toggleFullscreen = () => {
  if (!videoRef.value) return;

  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    videoRef.value.requestFullscreen();
  }
};

const onLoadedMetadata = () => {
  if (!videoRef.value) return;
  duration.value = videoRef.value.duration;

  // Try to detect codec
  const canPlayH264 = videoRef.value.canPlayType('video/mp4; codecs="avc1.42E01E"');
  const canPlayVP9 = videoRef.value.canPlayType('video/webm; codecs="vp9"');

  if (canPlayH264) videoCodec.value = 'H.264';
  else if (canPlayVP9) videoCodec.value = 'VP9';
};

const onTimeUpdate = () => {
  if (!videoRef.value) return;
  currentTime.value = videoRef.value.currentTime;
};

const onEnded = () => {
  isPlaying.value = false;
};

const formatTime = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const formatSize = (bytes: number): string => {
  const mb = bytes / (1024 * 1024);
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(1)} GB`;
};

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.code === 'Space') {
    event.preventDefault();
    togglePlay();
  } else if (event.key === 'f' || event.key === 'F') {
    event.preventDefault();
    toggleFullscreen();
  }
};

onMounted(async () => {
  if (!videoRef.value) return;

  try {
    const response = await fetch(`/api/files/content?path=${encodeURIComponent(props.filePath)}`);
    if (response.ok) {
      const blob = await response.blob();
      videoRef.value.src = URL.createObjectURL(blob);
    }
  } catch (error) {
    console.error('Failed to load video:', error);
  }

  document.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  if (videoRef.value?.src) {
    URL.revokeObjectURL(videoRef.value.src);
  }
  document.removeEventListener('keydown', handleKeyDown);
});
</script>

<style scoped>
.video-preview {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #000000;
}

.video-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000000;
  overflow: hidden;
}

.video-container video {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  cursor: pointer;
}

.video-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  background: #a0a0a0;
  border-top: 2px solid #000000;
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
  min-width: 100px;
}

.video-info {
  display: flex;
  gap: 16px;
  padding: 8px;
  background: #a0a0a0;
  border-top: 2px solid #000000;
  font-size: 8px;
  font-family: 'Press Start 2P', monospace;
  color: #000000;
  justify-content: center;
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
  min-width: 32px;
}

.amiga-button:hover {
  background: #b0b0b0;
}

.amiga-button:active {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}
</style>

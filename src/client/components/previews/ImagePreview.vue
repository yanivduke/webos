<template>
  <div class="image-preview">
    <div class="image-controls">
      <button class="amiga-button" @click="zoomOut" :disabled="zoomLevel <= 0.25">-</button>
      <span class="zoom-level">{{ Math.round(zoomLevel * 100) }}%</span>
      <button class="amiga-button" @click="zoomIn" :disabled="zoomLevel >= 4">+</button>
      <button class="amiga-button" @click="fitToWindow">Fit</button>
      <button class="amiga-button" @click="actualSize">100%</button>
      <button class="amiga-button" @click="rotate(-90)">↶</button>
      <button class="amiga-button" @click="rotate(90)">↷</button>
    </div>

    <div class="image-container" ref="containerRef">
      <img
        :src="imageUrl"
        :style="imageStyle"
        @load="onImageLoad"
        @error="onImageError"
        alt="Preview"
        draggable="false"
      />
    </div>

    <div class="image-info">
      <span>{{ metadata.width }} × {{ metadata.height }}</span>
      <span v-if="metadata.size">{{ formatSize(metadata.size) }}</span>
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

const containerRef = ref<HTMLElement | null>(null);
const zoomLevel = ref(1);
const rotation = ref(0);
const imageUrl = ref('');
const imageLoaded = ref(false);
const naturalWidth = ref(0);
const naturalHeight = ref(0);

const imageStyle = computed(() => {
  return {
    transform: `scale(${zoomLevel.value}) rotate(${rotation.value}deg)`,
    transformOrigin: 'center center',
    transition: 'transform 0.2s ease',
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain' as const,
  };
});

const formatSize = (bytes: number): string => {
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
};

const zoomIn = () => {
  zoomLevel.value = Math.min(zoomLevel.value * 1.25, 4);
};

const zoomOut = () => {
  zoomLevel.value = Math.max(zoomLevel.value / 1.25, 0.25);
};

const fitToWindow = () => {
  if (!containerRef.value || !naturalWidth.value) return;

  const container = containerRef.value;
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;

  const widthRatio = containerWidth / naturalWidth.value;
  const heightRatio = containerHeight / naturalHeight.value;

  zoomLevel.value = Math.min(widthRatio, heightRatio, 1);
};

const actualSize = () => {
  zoomLevel.value = 1;
};

const rotate = (degrees: number) => {
  rotation.value = (rotation.value + degrees) % 360;
};

const onImageLoad = (event: Event) => {
  const img = event.target as HTMLImageElement;
  naturalWidth.value = img.naturalWidth;
  naturalHeight.value = img.naturalHeight;
  imageLoaded.value = true;
  fitToWindow();
};

const onImageError = () => {
  console.error('Failed to load image');
};

const handleKeyDown = (event: KeyboardEvent) => {
  switch (event.key) {
    case '+':
    case '=':
      event.preventDefault();
      zoomIn();
      break;
    case '-':
    case '_':
      event.preventDefault();
      zoomOut();
      break;
    case '0':
      event.preventDefault();
      actualSize();
      break;
  }
};

onMounted(async () => {
  // Fetch image from server
  try {
    const response = await fetch(`/api/files/content?path=${encodeURIComponent(props.filePath)}`);
    if (response.ok) {
      const blob = await response.blob();
      imageUrl.value = URL.createObjectURL(blob);
    }
  } catch (error) {
    console.error('Failed to load image:', error);
  }

  document.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  if (imageUrl.value) {
    URL.revokeObjectURL(imageUrl.value);
  }
  document.removeEventListener('keydown', handleKeyDown);
});
</script>

<style scoped>
.image-preview {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #ffffff;
}

.image-controls {
  display: flex;
  gap: 8px;
  padding: 8px;
  background: #a0a0a0;
  border-bottom: 2px solid #000000;
  align-items: center;
}

.zoom-level {
  font-size: 9px;
  font-family: 'Press Start 2P', monospace;
  color: #000000;
  padding: 0 8px;
  min-width: 50px;
  text-align: center;
}

.image-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #ffffff;
  position: relative;
}

.image-container img {
  display: block;
}

.image-info {
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

.amiga-button:hover:not(:disabled) {
  background: #b0b0b0;
}

.amiga-button:active:not(:disabled) {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}

.amiga-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>

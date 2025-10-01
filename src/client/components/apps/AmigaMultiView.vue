<template>
  <div class="amiga-multiview">
    <!-- Toolbar -->
    <div class="multiview-toolbar">
      <div class="toolbar-section">
        <button class="amiga-button" @click="openFile" :disabled="loading">
          Open...
        </button>
        <button class="amiga-button" @click="prevImage" :disabled="!hasPrevious || loading">
          Prev
        </button>
        <button class="amiga-button" @click="nextImage" :disabled="!hasNext || loading">
          Next
        </button>
      </div>
      
      <div class="toolbar-section">
        <button class="amiga-button" @click="zoomIn" :disabled="!currentImage || loading">
          Zoom+
        </button>
        <button class="amiga-button" @click="zoomOut" :disabled="!currentImage || loading">
          Zoom-
        </button>
        <button class="amiga-button" @click="resetZoom" :disabled="!currentImage || loading">
          100%
        </button>
        <button class="amiga-button" @click="fitToWindow" :disabled="!currentImage || loading">
          Fit
        </button>
      </div>
    </div>

    <!-- Main display area -->
    <div class="multiview-display" ref="displayArea">
      <div v-if="loading" class="loading-indicator">
        Loading image...
      </div>
      
      <div v-else-if="!currentImage" class="no-image">
        <div class="no-image-text">
          No image loaded<br>
          Click "Open..." to select an image
        </div>
      </div>
      
      <div v-else class="image-container" 
           :style="{ 
             transform: `scale(${zoom}) translate(${panX}px, ${panY}px)`,
             transformOrigin: 'center center'
           }"
           @mousedown="startPan"
           @wheel="handleWheel">
        <img 
          :src="currentImageUrl" 
          :alt="currentImage.name"
          @load="onImageLoad"
          @error="onImageError"
          draggable="false"
        />
      </div>
    </div>

    <!-- Status bar -->
    <div class="multiview-status">
      <span v-if="currentImage" class="status-info">
        {{ currentImage.name }} ({{ imageIndex + 1 }}/{{ imageFiles.length }}) - 
        {{ imageWidth }}x{{ imageHeight }} - 
        {{ Math.round(zoom * 100) }}%
      </span>
      <span v-else class="status-info">
        Ready
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

// Props
interface Props {
  data?: {
    filePath?: string;
  };
}

const props = withDefaults(defineProps<Props>(), {
  data: () => ({})
});

// Refs
const displayArea = ref<HTMLElement>();
const currentImage = ref<any>(null);
const currentImageUrl = ref('');
const imageFiles = ref<any[]>([]);
const imageIndex = ref(0);
const loading = ref(false);
const zoom = ref(1);
const panX = ref(0);
const panY = ref(0);
const imageWidth = ref(0);
const imageHeight = ref(0);

// Panning
const isPanning = ref(false);
let lastPanX = 0;
let lastPanY = 0;

// Computed
const hasPrevious = computed(() => imageIndex.value > 0);
const hasNext = computed(() => imageIndex.value < imageFiles.length - 1);

// Methods
const openFile = async () => {
  try {
    // Load image files from current directory or show file picker
    const response = await fetch('/api/files?path=dh0&type=image');
    const data = await response.json();
    
    if (data.items) {
      imageFiles.value = data.items.filter((item: any) => 
        item.type === 'file' && 
        /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(item.name)
      );
      
      if (imageFiles.value.length > 0) {
        imageIndex.value = 0;
        await loadCurrentImage();
      }
    }
  } catch (error) {
    console.error('Failed to load image files:', error);
  }
};

const loadCurrentImage = async () => {
  if (imageFiles.value.length === 0) return;
  
  loading.value = true;
  const imageFile = imageFiles.value[imageIndex.value];
  currentImage.value = imageFile;
  
  // Create mock image URL for demo
  currentImageUrl.value = `data:image/svg+xml;base64,${btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
      <rect width="400" height="300" fill="#e0e0e0"/>
      <rect x="50" y="50" width="300" height="200" fill="#0055aa" opacity="0.3"/>
      <text x="200" y="160" text-anchor="middle" font-family="monospace" font-size="16" fill="#000">
        ${imageFile.name}
      </text>
      <text x="200" y="180" text-anchor="middle" font-family="monospace" font-size="12" fill="#666">
        Image Preview
      </text>
    </svg>
  `)}`;
  
  resetZoom();
  loading.value = false;
};

const prevImage = async () => {
  if (hasPrevious.value) {
    imageIndex.value--;
    await loadCurrentImage();
  }
};

const nextImage = async () => {
  if (hasNext.value) {
    imageIndex.value++;
    await loadCurrentImage();
  }
};

const zoomIn = () => {
  zoom.value = Math.min(zoom.value * 1.25, 5);
};

const zoomOut = () => {
  zoom.value = Math.max(zoom.value / 1.25, 0.1);
};

const resetZoom = () => {
  zoom.value = 1;
  panX.value = 0;
  panY.value = 0;
};

const fitToWindow = () => {
  if (!displayArea.value || !imageWidth.value || !imageHeight.value) return;
  
  const containerWidth = displayArea.value.clientWidth - 20;
  const containerHeight = displayArea.value.clientHeight - 20;
  
  const scaleX = containerWidth / imageWidth.value;
  const scaleY = containerHeight / imageHeight.value;
  
  zoom.value = Math.min(scaleX, scaleY, 1);
  panX.value = 0;
  panY.value = 0;
};

const onImageLoad = (event: Event) => {
  const img = event.target as HTMLImageElement;
  imageWidth.value = img.naturalWidth;
  imageHeight.value = img.naturalHeight;
};

const onImageError = () => {
  console.error('Failed to load image');
  loading.value = false;
};

// Panning handlers
const startPan = (event: MouseEvent) => {
  if (!currentImage.value || zoom.value <= 1) return;
  
  isPanning.value = true;
  lastPanX = event.clientX;
  lastPanY = event.clientY;
  
  document.addEventListener('mousemove', doPan);
  document.addEventListener('mouseup', stopPan);
  event.preventDefault();
};

const doPan = (event: MouseEvent) => {
  if (!isPanning.value) return;
  
  const deltaX = event.clientX - lastPanX;
  const deltaY = event.clientY - lastPanY;
  
  panX.value += deltaX / zoom.value;
  panY.value += deltaY / zoom.value;
  
  lastPanX = event.clientX;
  lastPanY = event.clientY;
};

const stopPan = () => {
  isPanning.value = false;
  document.removeEventListener('mousemove', doPan);
  document.removeEventListener('mouseup', stopPan);
};

// Wheel zoom
const handleWheel = (event: WheelEvent) => {
  if (!currentImage.value) return;
  
  event.preventDefault();
  
  if (event.deltaY < 0) {
    zoomIn();
  } else {
    zoomOut();
  }
};

// Keyboard shortcuts
const handleKeydown = (event: KeyboardEvent) => {
  if (!currentImage.value) return;
  
  switch (event.key) {
    case 'ArrowLeft':
      prevImage();
      break;
    case 'ArrowRight':
      nextImage();
      break;
    case '+':
    case '=':
      zoomIn();
      break;
    case '-':
      zoomOut();
      break;
    case '0':
      resetZoom();
      break;
    case 'f':
    case 'F':
      fitToWindow();
      break;
  }
};

// Lifecycle
onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
  
  // Auto-load if file path provided
  if (props.data?.filePath) {
    // Load specific image file
    const fileName = props.data.filePath.split('/').pop() || '';
    if (/\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(fileName)) {
      currentImage.value = { name: fileName, path: props.data.filePath };
      currentImageUrl.value = `data:image/svg+xml;base64,${btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
          <rect width="400" height="300" fill="#e0e0e0"/>
          <circle cx="200" cy="150" r="80" fill="#0055aa" opacity="0.3"/>
          <text x="200" y="160" text-anchor="middle" font-family="monospace" font-size="14" fill="#000">
            ${fileName}
          </text>
        </svg>
      `)}`;
    }
  }
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
  document.removeEventListener('mousemove', doPan);
  document.removeEventListener('mouseup', stopPan);
});
</script>

<style scoped>
.amiga-multiview {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #a0a0a0;
}

.multiview-toolbar {
  display: flex;
  justify-content: space-between;
  padding: 4px;
  background: #a0a0a0;
  border-bottom: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
}

.toolbar-section {
  display: flex;
  gap: 4px;
}

.amiga-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 2px 8px;
  font-size: 9px;
  font-family: 'Press Start 2P', monospace;
  cursor: pointer;
  min-width: 50px;
}

.amiga-button:active {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}

.amiga-button:disabled {
  background: #888888;
  color: #666666;
  cursor: not-allowed;
}

.multiview-display {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: #000000;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  margin: 2px;
}

.loading-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #ffffff;
  font-family: 'Press Start 2P', monospace;
  font-size: 10px;
}

.no-image {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.no-image-text {
  color: #666666;
  font-family: 'Press Start 2P', monospace;
  font-size: 10px;
  text-align: center;
  line-height: 1.8;
}

.image-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  cursor: grab;
}

.image-container:active {
  cursor: grabbing;
}

.image-container img {
  max-width: none;
  max-height: none;
  pointer-events: none;
}

.multiview-status {
  padding: 4px 8px;
  background: #a0a0a0;
  border-top: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
  height: 20px;
  display: flex;
  align-items: center;
}

.status-info {
  color: #000000;
}
</style>

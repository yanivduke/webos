<template>
  <div v-if="visible" class="quicklook-overlay" @click.self="close">
    <div class="quicklook-window" :style="windowStyle">
      <!-- Title Bar -->
      <div class="quicklook-titlebar" @mousedown="startDrag">
        <div class="title-bar-left">
          <div class="title-bar-button close-button" @click.stop="close">
            <div class="close-icon"></div>
          </div>
        </div>
        <div class="window-title">{{ currentFile?.name || 'Quick Look' }}</div>
        <div class="title-bar-right">
          <div class="file-info-compact">{{ formatFileSize(currentFile?.size || 0) }}</div>
        </div>
      </div>

      <!-- Preview Area -->
      <div class="preview-area">
        <component
          v-if="previewComponent"
          :is="previewComponent"
          :filePath="currentFile?.path || ''"
          :metadata="currentMetadata"
          @extract="handleExtract"
        />

        <!-- Loading State -->
        <div v-else-if="isLoading" class="preview-loading">
          <div class="loading-spinner"></div>
          <div class="loading-text">Loading preview...</div>
        </div>

        <!-- Error/Unsupported State -->
        <div v-else class="preview-unsupported">
          <div class="unsupported-icon">⚠</div>
          <div class="unsupported-text">Preview not available</div>
          <div class="unsupported-detail">{{ currentFile?.name }}</div>
          <button class="amiga-button" @click="openInApp">Open in Application</button>
        </div>
      </div>

      <!-- Footer Bar -->
      <div class="quicklook-footer">
        <div class="footer-metadata">
          <span v-if="currentFile?.created">Created: {{ formatDate(currentFile.created) }}</span>
          <span v-if="currentFile?.modified">Modified: {{ formatDate(currentFile.modified) }}</span>
          <span v-if="currentMetadata.width && currentMetadata.height">
            {{ currentMetadata.width }} × {{ currentMetadata.height }}
          </span>
          <span v-if="currentMetadata.duration">{{ formatDuration(currentMetadata.duration) }}</span>
        </div>

        <div class="footer-actions">
          <button
            class="amiga-button"
            @click="navigatePrevious"
            :disabled="!canNavigatePrevious"
            title="Previous (←)"
          >
            ◀
          </button>
          <span class="file-counter">{{ currentIndex + 1 }} / {{ totalFiles }}</span>
          <button
            class="amiga-button"
            @click="navigateNext"
            :disabled="!canNavigateNext"
            title="Next (→)"
          >
            ▶
          </button>
          <button class="amiga-button" @click="openInApp" title="Open (Enter)">Open</button>
          <button class="amiga-button" @click="copyPath" title="Copy Path">Copy Path</button>
          <button class="amiga-button" @click="toggleSlideshow" v-if="canSlideshow" title="Slideshow">
            {{ isSlideshow ? '⏸' : '▶' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted, onUnmounted, shallowRef } from 'vue';
import { filePreview, type FileMetadata } from '../utils/file-preview';
import ImagePreview from './previews/ImagePreview.vue';
import TextPreview from './previews/TextPreview.vue';
import AudioPreview from './previews/AudioPreview.vue';
import VideoPreview from './previews/VideoPreview.vue';
import PdfPreview from './previews/PdfPreview.vue';
import ArchivePreview from './previews/ArchivePreview.vue';

interface FileItem {
  id: string;
  name: string;
  type: string;
  size?: number | string;
  path?: string;
  created?: string | Date;
  modified?: string | Date;
}

interface Props {
  visible: boolean;
  file: FileItem | null;
  files?: FileItem[];
  currentPath?: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
  openFile: [path: string, item: FileItem];
  extract: [path: string];
}>();

// Window state
const windowX = ref(100);
const windowY = ref(80);
const isDragging = ref(false);
let dragStartX = 0;
let dragStartY = 0;

// Preview state
const currentFile = ref<FileItem | null>(null);
const currentIndex = ref(0);
const isLoading = ref(false);
const currentMetadata = ref<FileMetadata>({
  name: '',
  size: 0,
  type: 'unknown',
  extension: '',
  mimeType: '',
});

// Slideshow state
const isSlideshow = ref(false);
let slideshowTimer: number | null = null;
const SLIDESHOW_INTERVAL = 3000; // 3 seconds

const windowStyle = computed(() => ({
  left: `${windowX.value}px`,
  top: `${windowY.value}px`,
}));

const previewableFiles = computed(() => {
  if (!props.files) return [];
  return props.files.filter(f => f.type === 'file' && filePreview.isPreviewable(f.name));
});

const totalFiles = computed(() => previewableFiles.value.length);

const canNavigatePrevious = computed(() => currentIndex.value > 0);
const canNavigateNext = computed(() => currentIndex.value < totalFiles.value - 1);

const canSlideshow = computed(() => {
  const category = filePreview.getFileCategory(currentFile.value?.name || '');
  return category === 'image' && totalFiles.value > 1;
});

const previewComponent = shallowRef<any>(null);

// Watch for file changes
watch(() => props.file, (newFile) => {
  if (newFile && props.visible) {
    loadFile(newFile);
  }
}, { immediate: true });

watch(() => props.visible, (visible) => {
  if (!visible) {
    stopSlideshow();
  } else if (props.file) {
    loadFile(props.file);
  }
});

const loadFile = async (file: FileItem) => {
  currentFile.value = file;
  isLoading.value = true;

  // Find current index
  currentIndex.value = previewableFiles.value.findIndex(f => f.id === file.id);
  if (currentIndex.value === -1) currentIndex.value = 0;

  // Determine preview component
  const category = filePreview.getFileCategory(file.name);

  switch (category) {
    case 'image':
      previewComponent.value = ImagePreview;
      break;
    case 'text':
      previewComponent.value = TextPreview;
      break;
    case 'audio':
      previewComponent.value = AudioPreview;
      break;
    case 'video':
      previewComponent.value = VideoPreview;
      break;
    case 'pdf':
      previewComponent.value = PdfPreview;
      break;
    case 'archive':
      previewComponent.value = ArchivePreview;
      break;
    default:
      previewComponent.value = null;
  }

  // Extract metadata
  currentMetadata.value = {
    name: file.name,
    size: file.size || 0,
    type: category,
    extension: filePreview.getExtension(file.name),
    mimeType: filePreview.getMimeType(file.name),
    created: file.created ? new Date(file.created) : undefined,
    modified: file.modified ? new Date(file.modified) : undefined,
  };

  isLoading.value = false;
};

const navigatePrevious = () => {
  if (!canNavigatePrevious.value) return;
  const prevFile = previewableFiles.value[currentIndex.value - 1];
  if (prevFile) loadFile(prevFile);
};

const navigateNext = () => {
  if (!canNavigateNext.value) return;
  const nextFile = previewableFiles.value[currentIndex.value + 1];
  if (nextFile) loadFile(nextFile);
};

const toggleSlideshow = () => {
  if (isSlideshow.value) {
    stopSlideshow();
  } else {
    startSlideshow();
  }
};

const startSlideshow = () => {
  if (!canSlideshow.value) return;
  isSlideshow.value = true;
  slideshowTimer = window.setInterval(() => {
    if (canNavigateNext.value) {
      navigateNext();
    } else {
      // Loop back to start
      const firstFile = previewableFiles.value[0];
      if (firstFile) loadFile(firstFile);
    }
  }, SLIDESHOW_INTERVAL);
};

const stopSlideshow = () => {
  isSlideshow.value = false;
  if (slideshowTimer !== null) {
    clearInterval(slideshowTimer);
    slideshowTimer = null;
  }
};

const openInApp = () => {
  if (!currentFile.value) return;
  const filePath = currentFile.value.path || `${props.currentPath}/${currentFile.value.name}`;
  emit('openFile', filePath, currentFile.value);
  close();
};

const copyPath = async () => {
  if (!currentFile.value) return;
  const filePath = currentFile.value.path || `${props.currentPath}/${currentFile.value.name}`;
  try {
    await navigator.clipboard.writeText(filePath);
    console.log('Path copied to clipboard:', filePath);
  } catch (error) {
    console.error('Failed to copy path:', error);
  }
};

const handleExtract = (path: string) => {
  emit('extract', path);
};

const close = () => {
  stopSlideshow();
  emit('close');
};

// Drag functionality
const startDrag = (e: MouseEvent) => {
  isDragging.value = true;
  dragStartX = e.clientX - windowX.value;
  dragStartY = e.clientY - windowY.value;
  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', stopDrag);
  e.preventDefault();
};

const onDrag = (e: MouseEvent) => {
  if (!isDragging.value) return;
  windowX.value = e.clientX - dragStartX;
  windowY.value = e.clientY - dragStartY;
};

const stopDrag = () => {
  isDragging.value = false;
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDrag);
};

// Keyboard shortcuts
const handleKeyDown = (event: KeyboardEvent) => {
  if (!props.visible) return;

  switch (event.key) {
    case ' ':
    case 'Escape':
      event.preventDefault();
      close();
      break;
    case 'ArrowLeft':
      event.preventDefault();
      navigatePrevious();
      break;
    case 'ArrowRight':
      event.preventDefault();
      navigateNext();
      break;
    case 'Enter':
      event.preventDefault();
      openInApp();
      break;
  }
};

// Utility functions
const formatFileSize = (bytes: number): string => {
  return filePreview.formatFileSize(bytes);
};

const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
};

const formatDuration = (seconds: number): string => {
  return filePreview.formatDuration(seconds);
};

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown);
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDrag);
  stopSlideshow();
});
</script>

<style scoped>
.quicklook-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.quicklook-window {
  position: absolute;
  width: 800px;
  max-width: 90vw;
  height: 600px;
  max-height: 90vh;
  background: #a0a0a0;
  border: 4px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  display: flex;
  flex-direction: column;
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.5);
}

.quicklook-titlebar {
  display: flex;
  align-items: center;
  background: linear-gradient(180deg, #ffffff 0%, #a0a0a0 100%);
  border-bottom: 2px solid #000000;
  padding: 4px 8px;
  cursor: move;
  user-select: none;
  height: 28px;
}

.title-bar-left {
  display: flex;
  gap: 6px;
}

.title-bar-button {
  width: 18px;
  height: 18px;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  background: #a0a0a0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.title-bar-button:active {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}

.close-icon {
  width: 8px;
  height: 8px;
  background: #000000;
  position: relative;
}

.close-icon::before,
.close-icon::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 10px;
  height: 2px;
  background: #000000;
}

.close-icon::before {
  transform: translate(-50%, -50%) rotate(45deg);
}

.close-icon::after {
  transform: translate(-50%, -50%) rotate(-45deg);
}

.window-title {
  flex: 1;
  text-align: center;
  font-size: 10px;
  font-family: 'Press Start 2P', monospace;
  color: #000000;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 8px;
}

.title-bar-right {
  display: flex;
  gap: 6px;
}

.file-info-compact {
  font-size: 8px;
  font-family: 'Press Start 2P', monospace;
  color: #333333;
  padding: 0 4px;
}

.preview-area {
  flex: 1;
  display: flex;
  overflow: hidden;
  background: #ffffff;
}

.preview-loading,
.preview-unsupported {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: #a0a0a0;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 4px solid #ffffff;
  border-top: 4px solid #0055aa;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  font-size: 10px;
  font-family: 'Press Start 2P', monospace;
  color: #000000;
}

.unsupported-icon {
  font-size: 64px;
}

.unsupported-text {
  font-size: 12px;
  font-family: 'Press Start 2P', monospace;
  color: #000000;
}

.unsupported-detail {
  font-size: 9px;
  font-family: 'Press Start 2P', monospace;
  color: #666666;
  max-width: 400px;
  text-align: center;
  word-wrap: break-word;
}

.quicklook-footer {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
  background: #a0a0a0;
  border-top: 2px solid #000000;
}

.footer-metadata {
  display: flex;
  gap: 12px;
  font-size: 7px;
  font-family: 'Press Start 2P', monospace;
  color: #333333;
  justify-content: center;
  flex-wrap: wrap;
}

.footer-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
  align-items: center;
}

.file-counter {
  font-size: 8px;
  font-family: 'Press Start 2P', monospace;
  color: #000000;
  padding: 0 8px;
  min-width: 60px;
  text-align: center;
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

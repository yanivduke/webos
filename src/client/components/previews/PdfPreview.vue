<template>
  <div class="pdf-preview">
    <div class="pdf-controls">
      <button class="amiga-button" @click="previousPage" :disabled="currentPage <= 1">◀</button>
      <span class="page-display">Page {{ currentPage }} / {{ totalPages }}</span>
      <button class="amiga-button" @click="nextPage" :disabled="currentPage >= totalPages">▶</button>
      <button class="amiga-button" @click="zoomOut" :disabled="zoomLevel <= 0.5">-</button>
      <span class="zoom-level">{{ Math.round(zoomLevel * 100) }}%</span>
      <button class="amiga-button" @click="zoomIn" :disabled="zoomLevel >= 3">+</button>
      <button class="amiga-button" @click="fitToWidth">Fit Width</button>
    </div>

    <div class="pdf-container" ref="containerRef">
      <canvas ref="canvasRef"></canvas>
    </div>

    <div class="pdf-info">
      <span>{{ totalPages }} pages</span>
      <span v-if="metadata.size">{{ formatSize(metadata.size) }}</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue';
import type { FileMetadata } from '../../utils/file-preview';

interface Props {
  filePath: string;
  metadata: FileMetadata;
}

const props = defineProps<Props>();

const containerRef = ref<HTMLElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const currentPage = ref(1);
const totalPages = ref(0);
const zoomLevel = ref(1);
const pdfUrl = ref('');

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    renderPage();
  }
};

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    renderPage();
  }
};

const zoomIn = () => {
  zoomLevel.value = Math.min(zoomLevel.value * 1.25, 3);
  renderPage();
};

const zoomOut = () => {
  zoomLevel.value = Math.max(zoomLevel.value / 1.25, 0.5);
  renderPage();
};

const fitToWidth = () => {
  if (!containerRef.value || !canvasRef.value) return;
  const containerWidth = containerRef.value.clientWidth;
  const canvasWidth = canvasRef.value.width / window.devicePixelRatio;
  zoomLevel.value = containerWidth / canvasWidth;
  renderPage();
};

const formatSize = (bytes: number): string => {
  const mb = bytes / (1024 * 1024);
  if (mb < 1) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${mb.toFixed(1)} MB`;
};

const renderPage = async () => {
  // Note: This is a placeholder for PDF rendering
  // In a real implementation, you would use PDF.js library
  // For now, we'll just display a message

  if (!canvasRef.value) return;

  const canvas = canvasRef.value;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Set canvas size
  canvas.width = 600 * zoomLevel.value;
  canvas.height = 800 * zoomLevel.value;

  // Draw placeholder
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#000000';
  ctx.font = '16px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.fillText('PDF Preview', canvas.width / 2, canvas.height / 2 - 40);
  ctx.font = '12px "Press Start 2P"';
  ctx.fillText(`Page ${currentPage.value} of ${totalPages.value}`, canvas.width / 2, canvas.height / 2);
  ctx.font = '10px "Press Start 2P"';
  ctx.fillText('PDF.js library required', canvas.width / 2, canvas.height / 2 + 40);
  ctx.fillText('for full rendering', canvas.width / 2, canvas.height / 2 + 60);
};

const handleKeyDown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'ArrowLeft':
      event.preventDefault();
      previousPage();
      break;
    case 'ArrowRight':
      event.preventDefault();
      nextPage();
      break;
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
  }
};

onMounted(async () => {
  try {
    const response = await fetch(`/api/files/content?path=${encodeURIComponent(props.filePath)}`);
    if (response.ok) {
      const blob = await response.blob();
      pdfUrl.value = URL.createObjectURL(blob);

      // For now, set a default page count
      // In real implementation, PDF.js would provide this
      totalPages.value = 5;

      renderPage();
    }
  } catch (error) {
    console.error('Failed to load PDF:', error);
  }

  document.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  if (pdfUrl.value) {
    URL.revokeObjectURL(pdfUrl.value);
  }
  document.removeEventListener('keydown', handleKeyDown);
});
</script>

<style scoped>
.pdf-preview {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #ffffff;
}

.pdf-controls {
  display: flex;
  gap: 8px;
  padding: 8px;
  background: #a0a0a0;
  border-bottom: 2px solid #000000;
  align-items: center;
}

.page-display,
.zoom-level {
  font-size: 9px;
  font-family: 'Press Start 2P', monospace;
  color: #000000;
  padding: 0 8px;
  min-width: 100px;
  text-align: center;
}

.zoom-level {
  min-width: 50px;
}

.pdf-container {
  flex: 1;
  overflow: auto;
  background: #888888;
  padding: 16px;
  display: flex;
  justify-content: center;
}

.pdf-container canvas {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  background: #ffffff;
}

.pdf-info {
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

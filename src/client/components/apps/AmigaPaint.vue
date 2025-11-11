<template>
  <div class="amiga-paint">
    <!-- Menu Bar -->
    <div class="paint-menu">
      <div class="menu-item" @click="showFileMenu = !showFileMenu">File</div>
      <div class="menu-item" @click="clearCanvas">Edit</div>
      <div class="file-info">{{ fileName }} - {{ canvasWidth }}x{{ canvasHeight }}</div>
    </div>

    <!-- File Menu Dropdown -->
    <div v-if="showFileMenu" class="file-menu-dropdown">
      <div class="dropdown-item" @click="newCanvas">New</div>
      <div class="dropdown-item" @click="saveImage">Quick Save PNG</div>
      <div class="dropdown-item" @click="openExportDialog">Export As...</div>
      <div class="dropdown-item" @click="clearCanvas">Clear</div>
    </div>

    <!-- Toolbar -->
    <div class="paint-toolbar">
      <div class="tool-section">
        <button
          v-for="tool in tools"
          :key="tool.name"
          class="tool-button"
          :class="{ active: currentTool === tool.name }"
          @click="selectTool(tool.name)"
          :title="tool.label"
        >
          <div class="tool-icon" v-html="tool.icon"></div>
        </button>
      </div>

      <div class="tool-section">
        <label>Size:</label>
        <input
          v-model.number="brushSize"
          type="range"
          min="1"
          max="20"
          class="size-slider"
        />
        <span class="size-value">{{ brushSize }}</span>
      </div>
    </div>

    <!-- Color Palette -->
    <div class="color-palette">
      <div
        v-for="color in colors"
        :key="color"
        class="color-swatch"
        :class="{ active: currentColor === color }"
        :style="{ background: color }"
        @click="selectColor(color)"
        :title="color"
      ></div>
    </div>

    <!-- Canvas Container -->
    <div class="canvas-container">
      <canvas
        :id="canvasId"
        ref="canvasRef"
        :width="canvasWidth"
        :height="canvasHeight"
        @mousedown="startDrawing"
        @mousemove="draw"
        @mouseup="stopDrawing"
        @mouseleave="stopDrawing"
      ></canvas>
    </div>

    <!-- Status Bar -->
    <div class="paint-status">
      <span>Tool: {{ currentTool }}</span>
      <span>Color: {{ currentColor }}</span>
      <span>{{ statusMessage }}</span>
    </div>

    <!-- Export Dialog -->
    <AmigaExportDialog
      :visible="showExportDialog"
      :fileName="fileName"
      :elementId="canvasId"
      @close="closeExportDialog"
      @exported="handleExported"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import AmigaExportDialog from '../AmigaExportDialog.vue';

interface Props {
  data?: {
    fileName?: string;
  };
}

const props = defineProps<Props>();

// Canvas and drawing state
const canvasRef = ref<HTMLCanvasElement | null>(null);
const canvasWidth = ref(640);
const canvasHeight = ref(400);
const fileName = ref('Untitled.png');
const statusMessage = ref('Ready');
const showFileMenu = ref(false);
const showExportDialog = ref(false);
const canvasId = ref('paint-canvas');

// Drawing state
const isDrawing = ref(false);
const currentTool = ref('pencil');
const currentColor = ref('#000000');
const brushSize = ref(3);
const startX = ref(0);
const startY = ref(0);

// Tools
const tools = [
  { name: 'pencil', label: 'Pencil', icon: '✏' },
  { name: 'line', label: 'Line', icon: '╱' },
  { name: 'rectangle', label: 'Rectangle', icon: '▭' },
  { name: 'circle', label: 'Circle', icon: '○' },
  { name: 'fill', label: 'Fill', icon: '▨' },
  { name: 'eraser', label: 'Eraser', icon: '⌧' }
];

// Authentic Amiga 16 color palette
const colors = [
  '#000000', '#ffffff', '#880000', '#aaffee',
  '#cc44cc', '#00cc55', '#0000aa', '#eeee77',
  '#dd8855', '#664400', '#ff7777', '#333333',
  '#777777', '#aaff66', '#0088ff', '#bbbbbb'
];

let ctx: CanvasRenderingContext2D | null = null;
let imageData: ImageData | null = null;

onMounted(() => {
  if (canvasRef.value) {
    ctx = canvasRef.value.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvasWidth.value, canvasHeight.value);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }

  if (props.data?.fileName) {
    fileName.value = props.data.fileName;
  }
});

const selectTool = (tool: string) => {
  currentTool.value = tool;
  statusMessage.value = `Selected: ${tool}`;
  showFileMenu.value = false;
};

const selectColor = (color: string) => {
  currentColor.value = color;
  statusMessage.value = `Color: ${color}`;
};

const getMousePos = (e: MouseEvent) => {
  const rect = canvasRef.value?.getBoundingClientRect();
  if (!rect) return { x: 0, y: 0 };
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
};

const startDrawing = (e: MouseEvent) => {
  if (!ctx || !canvasRef.value) return;

  const pos = getMousePos(e);
  isDrawing.value = true;
  startX.value = pos.x;
  startY.value = pos.y;

  // Save image data for shape tools
  if (currentTool.value !== 'pencil' && currentTool.value !== 'eraser') {
    imageData = ctx.getImageData(0, 0, canvasWidth.value, canvasHeight.value);
  }

  if (currentTool.value === 'pencil' || currentTool.value === 'eraser') {
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  } else if (currentTool.value === 'fill') {
    floodFill(pos.x, pos.y);
    isDrawing.value = false;
  }
};

const draw = (e: MouseEvent) => {
  if (!isDrawing.value || !ctx || !canvasRef.value) return;

  const pos = getMousePos(e);

  if (currentTool.value === 'pencil') {
    ctx.strokeStyle = currentColor.value;
    ctx.lineWidth = brushSize.value;
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  } else if (currentTool.value === 'eraser') {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = brushSize.value * 2;
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  } else if (currentTool.value === 'line' && imageData) {
    // Restore and redraw
    ctx.putImageData(imageData, 0, 0);
    ctx.beginPath();
    ctx.strokeStyle = currentColor.value;
    ctx.lineWidth = brushSize.value;
    ctx.moveTo(startX.value, startY.value);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  } else if (currentTool.value === 'rectangle' && imageData) {
    ctx.putImageData(imageData, 0, 0);
    ctx.strokeStyle = currentColor.value;
    ctx.lineWidth = brushSize.value;
    ctx.strokeRect(
      startX.value,
      startY.value,
      pos.x - startX.value,
      pos.y - startY.value
    );
  } else if (currentTool.value === 'circle' && imageData) {
    ctx.putImageData(imageData, 0, 0);
    const radius = Math.sqrt(
      Math.pow(pos.x - startX.value, 2) + Math.pow(pos.y - startY.value, 2)
    );
    ctx.beginPath();
    ctx.strokeStyle = currentColor.value;
    ctx.lineWidth = brushSize.value;
    ctx.arc(startX.value, startY.value, radius, 0, 2 * Math.PI);
    ctx.stroke();
  }
};

const stopDrawing = () => {
  if (isDrawing.value && ctx) {
    ctx.closePath();
  }
  isDrawing.value = false;
  imageData = null;
};

const floodFill = (x: number, y: number) => {
  if (!ctx || !canvasRef.value) return;

  const imageData = ctx.getImageData(0, 0, canvasWidth.value, canvasHeight.value);
  const targetColor = getPixelColor(imageData, Math.floor(x), Math.floor(y));
  const fillColor = hexToRgb(currentColor.value);

  if (colorsMatch(targetColor, fillColor)) return;

  const stack: [number, number][] = [[Math.floor(x), Math.floor(y)]];

  while (stack.length > 0) {
    const [px, py] = stack.pop()!;

    if (px < 0 || px >= canvasWidth.value || py < 0 || py >= canvasHeight.value) continue;

    const currentColor = getPixelColor(imageData, px, py);
    if (!colorsMatch(currentColor, targetColor)) continue;

    setPixelColor(imageData, px, py, fillColor);

    stack.push([px + 1, py], [px - 1, py], [px, py + 1], [px, py - 1]);
  }

  ctx.putImageData(imageData, 0, 0);
  statusMessage.value = 'Fill complete';
};

const getPixelColor = (imageData: ImageData, x: number, y: number) => {
  const index = (y * imageData.width + x) * 4;
  return [
    imageData.data[index],
    imageData.data[index + 1],
    imageData.data[index + 2],
    imageData.data[index + 3]
  ];
};

const setPixelColor = (imageData: ImageData, x: number, y: number, color: number[]) => {
  const index = (y * imageData.width + x) * 4;
  imageData.data[index] = color[0];
  imageData.data[index + 1] = color[1];
  imageData.data[index + 2] = color[2];
  imageData.data[index + 3] = 255;
};

const colorsMatch = (a: number[], b: number[]) => {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
};

const hexToRgb = (hex: string): number[] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [0, 0, 0];
};

const newCanvas = () => {
  if (!ctx) return;
  if (confirm('Clear canvas and start new drawing?')) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasWidth.value, canvasHeight.value);
    fileName.value = 'Untitled.png';
    statusMessage.value = 'New canvas';
  }
  showFileMenu.value = false;
};

const clearCanvas = () => {
  if (!ctx) return;
  if (confirm('Clear entire canvas?')) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasWidth.value, canvasHeight.value);
    statusMessage.value = 'Canvas cleared';
  }
  showFileMenu.value = false;
};

const saveImage = () => {
  if (!canvasRef.value) return;

  try {
    const dataURL = canvasRef.value.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = fileName.value;
    link.href = dataURL;
    link.click();
    statusMessage.value = 'Image saved';
  } catch (error) {
    console.error('Error saving image:', error);
    statusMessage.value = 'Error saving image';
  }
  showFileMenu.value = false;
};

const openExportDialog = () => {
  showFileMenu.value = false;
  showExportDialog.value = true;
};

const closeExportDialog = () => {
  showExportDialog.value = false;
};

const handleExported = (format: string) => {
  statusMessage.value = `Canvas exported as ${format.toUpperCase()}`;
};
</script>

<style scoped>
.amiga-paint {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #a0a0a0;
  font-family: 'Press Start 2P', monospace;
}

/* Menu Bar */
.paint-menu {
  display: flex;
  background: #ffffff;
  border-bottom: 2px solid #000000;
  padding: 4px 8px;
  font-size: 10px;
  gap: 16px;
  align-items: center;
  position: relative;
}

.menu-item {
  cursor: pointer;
  padding: 2px 8px;
  color: #000000;
  transition: all 0.1s;
  user-select: none;
}

.menu-item:hover {
  background: #0055aa;
  color: #ffffff;
}

.file-info {
  margin-left: auto;
  color: #0055aa;
  font-size: 9px;
}

.file-menu-dropdown {
  position: absolute;
  top: 30px;
  left: 8px;
  background: #ffffff;
  border: 2px solid #000000;
  border-color: #ffffff #000000 #000000 #ffffff;
  box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

.dropdown-item {
  padding: 6px 12px;
  font-size: 9px;
  cursor: pointer;
  user-select: none;
  color: #000000;
  min-width: 100px;
}

.dropdown-item:hover {
  background: #0055aa;
  color: #ffffff;
}

/* Toolbar */
.paint-toolbar {
  display: flex;
  gap: 12px;
  padding: 6px;
  background: #a0a0a0;
  border-bottom: 2px solid #000000;
  align-items: center;
}

.tool-section {
  display: flex;
  gap: 4px;
  align-items: center;
  padding: 4px;
  border: 2px solid;
  border-color: #808080 #ffffff #ffffff #808080;
}

.tool-button {
  width: 32px;
  height: 32px;
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.05s;
  font-size: 16px;
}

.tool-button:hover {
  background: #b0b0b0;
}

.tool-button.active {
  background: #0055aa;
  border-color: #000000 #ffffff #ffffff #000000;
}

.tool-button.active .tool-icon {
  color: #ffffff;
}

.tool-icon {
  color: #000000;
  user-select: none;
}

label {
  font-size: 9px;
  color: #000000;
  margin-right: 4px;
}

.size-slider {
  width: 80px;
}

.size-value {
  font-size: 9px;
  color: #000000;
  min-width: 20px;
}

/* Color Palette */
.color-palette {
  display: flex;
  gap: 2px;
  padding: 6px;
  background: #a0a0a0;
  border-bottom: 2px solid #000000;
  flex-wrap: wrap;
}

.color-swatch {
  width: 32px;
  height: 32px;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  cursor: pointer;
  transition: all 0.05s;
}

.color-swatch:hover {
  transform: scale(1.1);
}

.color-swatch.active {
  border: 3px solid #ffaa00;
  border-color: #ffaa00;
  box-shadow: 0 0 4px #ffaa00;
}

/* Canvas Container */
.canvas-container {
  flex: 1;
  padding: 8px;
  background: #808080;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
}

canvas {
  background: #ffffff;
  border: 2px solid #000000;
  cursor: crosshair;
  image-rendering: pixelated;
}

/* Status Bar */
.paint-status {
  display: flex;
  gap: 16px;
  background: #ffffff;
  border-top: 2px solid #000000;
  padding: 4px 12px;
  font-size: 8px;
  color: #000000;
}
</style>

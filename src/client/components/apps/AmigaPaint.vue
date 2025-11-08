<template>
  <div class="amiga-paint">
    <!-- Menu Bar -->
    <div class="paint-menubar">
      <div class="menu-item" @click="toggleMenu('file')">
        File
        <div v-if="activeMenu === 'file'" class="dropdown-menu">
          <div class="menu-option" @click="newCanvas">New...</div>
          <div class="menu-option disabled">Open...</div>
          <div class="menu-option" @click="saveCanvas">Save</div>
          <div class="menu-option" @click="exportImage">Export...</div>
          <div class="menu-divider"></div>
          <div class="menu-option" @click="$emit('close')">Close</div>
        </div>
      </div>

      <div class="menu-item" @click="toggleMenu('edit')">
        Edit
        <div v-if="activeMenu === 'edit'" class="dropdown-menu">
          <div class="menu-option" @click="undo" :class="{ disabled: !canUndo }">
            Undo (Ctrl+Z)
          </div>
          <div class="menu-option" @click="redo" :class="{ disabled: !canRedo }">
            Redo (Ctrl+Y)
          </div>
          <div class="menu-divider"></div>
          <div class="menu-option disabled">Cut (Ctrl+X)</div>
          <div class="menu-option disabled">Copy (Ctrl+C)</div>
          <div class="menu-option disabled">Paste (Ctrl+V)</div>
          <div class="menu-divider"></div>
          <div class="menu-option" @click="clearCanvas">Clear All</div>
        </div>
      </div>

      <div class="menu-item" @click="toggleMenu('view')">
        View
        <div v-if="activeMenu === 'view'" class="dropdown-menu">
          <div class="menu-option" @click="toggleGrid">
            {{ showGrid ? '✓' : '' }} Grid
          </div>
          <div class="menu-option" @click="toggleRulers">
            {{ showRulers ? '✓' : '' }} Rulers
          </div>
          <div class="menu-divider"></div>
          <div class="menu-option" @click="setZoom(0.25)">Zoom 25%</div>
          <div class="menu-option" @click="setZoom(0.5)">Zoom 50%</div>
          <div class="menu-option" @click="setZoom(1)">Zoom 100%</div>
          <div class="menu-option" @click="setZoom(2)">Zoom 200%</div>
          <div class="menu-option" @click="setZoom(4)">Zoom 400%</div>
        </div>
      </div>

      <div class="menu-item" @click="toggleMenu('image')">
        Image
        <div v-if="activeMenu === 'image'" class="dropdown-menu">
          <div class="menu-option" @click="showResizeDialog = true">Resize...</div>
          <div class="menu-option" @click="showEffectsDialog = true">Effects...</div>
          <div class="menu-divider"></div>
          <div class="menu-option" @click="rotateImage(90)">Rotate 90° CW</div>
          <div class="menu-option" @click="rotateImage(-90)">Rotate 90° CCW</div>
          <div class="menu-option" @click="flipImage('horizontal')">Flip Horizontal</div>
          <div class="menu-option" @click="flipImage('vertical')">Flip Vertical</div>
        </div>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="paint-content">
      <!-- Left Toolbar (Tools) -->
      <div class="left-toolbar">
        <div class="toolbar-title">Tools</div>
        <div class="tools-grid">
          <button
            v-for="tool in tools"
            :key="tool.id"
            :class="['tool-button', { active: currentTool === tool.id }]"
            @click="selectTool(tool.id)"
            :title="`${tool.name} (${tool.shortcut})`"
          >
            {{ tool.icon }}
          </button>
        </div>

        <!-- Brush Size -->
        <div class="brush-settings">
          <div class="setting-label">Brush Size</div>
          <input
            type="range"
            v-model.number="brushSize"
            min="1"
            max="64"
            class="setting-slider"
            @input="updateBrushSize"
          />
          <div class="setting-value">{{ brushSize }}px</div>
        </div>

        <!-- Brush Opacity -->
        <div class="brush-settings">
          <div class="setting-label">Opacity</div>
          <input
            type="range"
            v-model.number="brushOpacity"
            min="0"
            max="100"
            class="setting-slider"
            @input="updateBrushOpacity"
          />
          <div class="setting-value">{{ brushOpacity }}%</div>
        </div>
      </div>

      <!-- Canvas Area -->
      <div class="canvas-area" ref="canvasArea" @wheel.prevent="handleWheel">
        <div
          class="canvas-container"
          :style="{
            transform: `scale(${zoom}) translate(${panX}px, ${panY}px)`,
            transformOrigin: 'top left'
          }"
        >
          <canvas
            ref="mainCanvas"
            class="main-canvas"
            @mousedown="startDrawing"
            @mousemove="draw"
            @mouseup="stopDrawing"
            @mouseleave="stopDrawing"
            @contextmenu.prevent="handleRightClick"
          ></canvas>

          <!-- Grid Overlay -->
          <canvas
            v-if="showGrid"
            ref="gridCanvas"
            class="grid-canvas"
          ></canvas>
        </div>

        <!-- Crosshair Cursor Info -->
        <div v-if="isDrawing || isHovering" class="cursor-info" :style="cursorInfoStyle">
          {{ mouseX }}, {{ mouseY }}
        </div>
      </div>

      <!-- Right Panel -->
      <div class="right-panel">
        <!-- Color Picker -->
        <div class="panel-section">
          <div class="section-title">Color</div>
          <AmigaColorPicker
            v-model="primaryColor"
            v-model:secondaryColor="secondaryColor"
          />
        </div>

        <!-- Layers Panel -->
        <div class="panel-section">
          <div class="section-title">Layers</div>
          <div class="layers-list">
            <div
              v-for="layer in layers"
              :key="layer.id"
              :class="['layer-item', { selected: layer.id === selectedLayerId }]"
              @click="selectLayer(layer.id)"
            >
              <input
                type="checkbox"
                :checked="layer.visible"
                @click.stop="toggleLayerVisibility(layer.id)"
                class="layer-visibility"
              />
              <div class="layer-name">{{ layer.name }}</div>
              <div class="layer-opacity">{{ layer.opacity }}%</div>
            </div>
          </div>

          <div class="layer-controls">
            <button class="layer-button" @click="addLayer" title="Add Layer">+</button>
            <button
              class="layer-button"
              @click="removeLayer"
              :disabled="layers.length <= 1"
              title="Remove Layer"
            >
              -
            </button>
            <button
              class="layer-button"
              @click="mergeDown"
              :disabled="!canMergeDown"
              title="Merge Down"
            >
              ↓
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Status Bar -->
    <div class="status-bar">
      <div class="status-item">{{ canvasWidth }} × {{ canvasHeight }}px</div>
      <div class="status-item">{{ mouseX }}, {{ mouseY }}</div>
      <div class="status-item">{{ Math.round(zoom * 100) }}%</div>
      <div class="status-item">{{ currentToolName }}</div>
      <div class="status-item">{{ fileSizeEstimate }}</div>
    </div>

    <!-- Dialogs -->
    <AmigaNewCanvas
      v-if="showNewCanvasDialog"
      @create="createNewCanvas"
      @cancel="showNewCanvasDialog = false"
    />

    <AmigaResizeCanvas
      v-if="showResizeDialog"
      :currentWidth="canvasWidth"
      :currentHeight="canvasHeight"
      @resize="resizeCanvas"
      @cancel="showResizeDialog = false"
    />

    <AmigaImageEffects
      v-if="showEffectsDialog"
      @apply="applyEffect"
      @cancel="showEffectsDialog = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { CanvasManager, DrawingTool } from '../../utils/canvas-manager';
import { adjustBrightness, adjustContrast, invertColors, grayscale, sepia, pixelate, blur } from '../../utils/paint-tools';
import AmigaColorPicker from '../widgets/AmigaColorPicker.vue';
import AmigaNewCanvas from '../dialogs/AmigaNewCanvas.vue';
import AmigaResizeCanvas from '../dialogs/AmigaResizeCanvas.vue';
import AmigaImageEffects from '../dialogs/AmigaImageEffects.vue';

defineEmits(['close']);

// Canvas references
const mainCanvas = ref<HTMLCanvasElement>();
const gridCanvas = ref<HTMLCanvasElement>();
const canvasArea = ref<HTMLDivElement>();

// Canvas manager
let canvasManager: CanvasManager;

// State
const currentTool = ref<DrawingTool>(DrawingTool.BRUSH);
const primaryColor = ref('#000000');
const secondaryColor = ref('#ffffff');
const brushSize = ref(3);
const brushOpacity = ref(100);

const isDrawing = ref(false);
const isHovering = ref(false);
const mouseX = ref(0);
const mouseY = ref(0);
const lastX = ref(0);
const lastY = ref(0);

const zoom = ref(1);
const panX = ref(0);
const panY = ref(0);

const showGrid = ref(false);
const showRulers = ref(false);

const activeMenu = ref<string | null>(null);

// Dialogs
const showNewCanvasDialog = ref(false);
const showResizeDialog = ref(false);
const showEffectsDialog = ref(false);

// Canvas state
const canvasWidth = ref(800);
const canvasHeight = ref(600);
const layers = ref<any[]>([]);
const selectedLayerId = ref('');

// Drawing state for shapes
let shapeStartX = 0;
let shapeStartY = 0;
let tempCanvas: HTMLCanvasElement | null = null;

// Tools definition
const tools = [
  { id: DrawingTool.PENCIL, name: 'Pencil', icon: '✏️', shortcut: 'P' },
  { id: DrawingTool.BRUSH, name: 'Brush', icon: '🖌️', shortcut: 'B' },
  { id: DrawingTool.ERASER, name: 'Eraser', icon: '🧹', shortcut: 'E' },
  { id: DrawingTool.LINE, name: 'Line', icon: '📏', shortcut: 'L' },
  { id: DrawingTool.RECTANGLE, name: 'Rectangle', icon: '⬜', shortcut: 'R' },
  { id: DrawingTool.FILLED_RECTANGLE, name: 'Filled Rectangle', icon: '⬛', shortcut: 'Shift+R' },
  { id: DrawingTool.CIRCLE, name: 'Circle', icon: '⭕', shortcut: 'C' },
  { id: DrawingTool.FILLED_CIRCLE, name: 'Filled Circle', icon: '⚫', shortcut: 'Shift+C' },
  { id: DrawingTool.FILL, name: 'Fill', icon: '🪣', shortcut: 'F' },
  { id: DrawingTool.EYEDROPPER, name: 'Eyedropper', icon: '💧', shortcut: 'I' }
];

// Computed
const currentToolName = computed(() => {
  const tool = tools.find(t => t.id === currentTool.value);
  return tool ? tool.name : '';
});

const canUndo = computed(() => canvasManager?.canUndo() || false);
const canRedo = computed(() => canvasManager?.canRedo() || false);

const canMergeDown = computed(() => {
  const layerIndex = layers.value.findIndex(l => l.id === selectedLayerId.value);
  return layerIndex > 0;
});

const fileSizeEstimate = computed(() => {
  const bytes = canvasWidth.value * canvasHeight.value * 4 * layers.value.length;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
});

const cursorInfoStyle = computed(() => ({
  left: `${mouseX.value * zoom.value + panX.value}px`,
  top: `${mouseY.value * zoom.value + panY.value - 30}px`
}));

// Lifecycle
onMounted(() => {
  initializeCanvas();
  setupKeyboardShortcuts();
  updateLayers();
  renderCanvas();
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
  document.removeEventListener('click', closeMenus);
});

// Watch for color changes
watch(primaryColor, (color) => {
  if (canvasManager) {
    canvasManager.setPrimaryColor(color);
  }
});

watch(secondaryColor, (color) => {
  if (canvasManager) {
    canvasManager.setSecondaryColor(color);
  }
});

// Initialize canvas
function initializeCanvas(width = 800, height = 600, bgColor = '#a0a0a0') {
  canvasManager = new CanvasManager(width, height, bgColor);
  canvasManager.setPrimaryColor(primaryColor.value);
  canvasManager.setSecondaryColor(secondaryColor.value);
  canvasManager.setBrushSize(brushSize.value);
  canvasManager.setBrushOpacity(brushOpacity.value);

  canvasWidth.value = width;
  canvasHeight.value = height;

  if (mainCanvas.value) {
    mainCanvas.value.width = width;
    mainCanvas.value.height = height;
  }

  if (gridCanvas.value) {
    gridCanvas.value.width = width;
    gridCanvas.value.height = height;
    drawGrid();
  }

  updateLayers();
  renderCanvas();
}

// Update layers list from canvas manager
function updateLayers() {
  if (canvasManager) {
    layers.value = canvasManager.getLayers();
    selectedLayerId.value = canvasManager.getState().selectedLayerId;
  }
}

// Render canvas
function renderCanvas() {
  if (!mainCanvas.value || !canvasManager) return;

  const ctx = mainCanvas.value.getContext('2d')!;
  const composite = canvasManager.getCompositeCanvas();
  ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value);
  ctx.drawImage(composite, 0, 0);
}

// Drawing functions
function startDrawing(e: MouseEvent) {
  if (e.button !== 0) return; // Only left click

  const rect = mainCanvas.value!.getBoundingClientRect();
  const x = (e.clientX - rect.left) / zoom.value;
  const y = (e.clientY - rect.top) / zoom.value;

  mouseX.value = Math.floor(x);
  mouseY.value = Math.floor(y);
  lastX.value = mouseX.value;
  lastY.value = mouseY.value;

  isDrawing.value = true;

  // Handle different tools
  if (currentTool.value === DrawingTool.EYEDROPPER) {
    const color = canvasManager.pickColor(mouseX.value, mouseY.value);
    if (color) {
      primaryColor.value = color;
    }
    isDrawing.value = false;
    return;
  }

  if (currentTool.value === DrawingTool.FILL) {
    canvasManager.floodFill(mouseX.value, mouseY.value);
    canvasManager.saveHistory();
    renderCanvas();
    isDrawing.value = false;
    return;
  }

  // For shape tools, save start position
  if ([DrawingTool.LINE, DrawingTool.RECTANGLE, DrawingTool.FILLED_RECTANGLE,
       DrawingTool.CIRCLE, DrawingTool.FILLED_CIRCLE].includes(currentTool.value)) {
    shapeStartX = mouseX.value;
    shapeStartY = mouseY.value;

    // Create temporary canvas for preview
    if (!tempCanvas) {
      tempCanvas = document.createElement('canvas');
    }
    tempCanvas.width = canvasWidth.value;
    tempCanvas.height = canvasHeight.value;

    // Copy current layer state
    const layer = canvasManager.getSelectedLayer();
    if (layer) {
      const tempCtx = tempCanvas.getContext('2d')!;
      tempCtx.drawImage(layer.canvas, 0, 0);
    }

    return;
  }

  // For pencil/brush/eraser, start drawing immediately
  if (currentTool.value === DrawingTool.PENCIL || currentTool.value === DrawingTool.BRUSH) {
    canvasManager.drawPixel(mouseX.value, mouseY.value);
    renderCanvas();
  }
}

function draw(e: MouseEvent) {
  const rect = mainCanvas.value!.getBoundingClientRect();
  const x = (e.clientX - rect.left) / zoom.value;
  const y = (e.clientY - rect.top) / zoom.value;

  mouseX.value = Math.floor(x);
  mouseY.value = Math.floor(y);
  isHovering.value = true;

  if (!isDrawing.value) return;

  // For shape tools, show preview
  if ([DrawingTool.LINE, DrawingTool.RECTANGLE, DrawingTool.FILLED_RECTANGLE,
       DrawingTool.CIRCLE, DrawingTool.FILLED_CIRCLE].includes(currentTool.value)) {
    drawShapePreview();
    return;
  }

  // For drawing tools, draw continuously
  if (currentTool.value === DrawingTool.PENCIL || currentTool.value === DrawingTool.BRUSH) {
    canvasManager.drawLine(lastX.value, lastY.value, mouseX.value, mouseY.value);
    renderCanvas();
  } else if (currentTool.value === DrawingTool.ERASER) {
    const layer = canvasManager.getSelectedLayer();
    if (layer) {
      const ctx = layer.ctx;
      ctx.globalCompositeOperation = 'destination-out';
      canvasManager.drawLine(lastX.value, lastY.value, mouseX.value, mouseY.value);
      ctx.globalCompositeOperation = 'source-over';
      renderCanvas();
    }
  }

  lastX.value = mouseX.value;
  lastY.value = mouseY.value;
}

function stopDrawing() {
  if (!isDrawing.value) return;

  isDrawing.value = false;

  // For shape tools, commit the shape
  if ([DrawingTool.LINE, DrawingTool.RECTANGLE, DrawingTool.FILLED_RECTANGLE,
       DrawingTool.CIRCLE, DrawingTool.FILLED_CIRCLE].includes(currentTool.value)) {
    commitShape();
  }

  canvasManager.saveHistory();
  tempCanvas = null;
}

function drawShapePreview() {
  if (!tempCanvas) return;

  const layer = canvasManager.getSelectedLayer();
  if (!layer) return;

  // Restore original layer state
  const tempCtx = tempCanvas.getContext('2d')!;
  layer.ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value);
  layer.ctx.drawImage(tempCanvas, 0, 0);

  // Draw preview shape
  const width = mouseX.value - shapeStartX;
  const height = mouseY.value - shapeStartY;

  if (currentTool.value === DrawingTool.LINE) {
    canvasManager.drawLine(shapeStartX, shapeStartY, mouseX.value, mouseY.value);
  } else if (currentTool.value === DrawingTool.RECTANGLE) {
    canvasManager.drawRectangle(shapeStartX, shapeStartY, width, height, false);
  } else if (currentTool.value === DrawingTool.FILLED_RECTANGLE) {
    canvasManager.drawRectangle(shapeStartX, shapeStartY, width, height, true);
  } else if (currentTool.value === DrawingTool.CIRCLE) {
    const radius = Math.sqrt(width * width + height * height);
    canvasManager.drawCircle(shapeStartX, shapeStartY, radius, false);
  } else if (currentTool.value === DrawingTool.FILLED_CIRCLE) {
    const radius = Math.sqrt(width * width + height * height);
    canvasManager.drawCircle(shapeStartX, shapeStartY, radius, true);
  }

  renderCanvas();
}

function commitShape() {
  // Shape is already drawn on the layer, just need to render
  renderCanvas();
}

function handleRightClick(e: MouseEvent) {
  // Swap to secondary color temporarily
  const temp = primaryColor.value;
  primaryColor.value = secondaryColor.value;
  secondaryColor.value = temp;
}

// Tool functions
function selectTool(tool: DrawingTool) {
  currentTool.value = tool;
  canvasManager.setTool(tool);
}

function updateBrushSize() {
  canvasManager.setBrushSize(brushSize.value);
}

function updateBrushOpacity() {
  canvasManager.setBrushOpacity(brushOpacity.value);
}

// Menu functions
function toggleMenu(menu: string) {
  activeMenu.value = activeMenu.value === menu ? null : menu;
}

function closeMenus() {
  activeMenu.value = null;
}

// File menu
function newCanvas() {
  showNewCanvasDialog.value = true;
  activeMenu.value = null;
}

function createNewCanvas(config: { width: number; height: number; backgroundColor: string }) {
  initializeCanvas(config.width, config.height, config.backgroundColor);
  showNewCanvasDialog.value = false;
}

function saveCanvas() {
  const json = canvasManager.exportToJSON();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'painting.paint';
  a.click();
  URL.revokeObjectURL(url);
  activeMenu.value = null;
}

function exportImage() {
  const dataUrl = canvasManager.exportToPNG();
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = 'painting.png';
  a.click();
  activeMenu.value = null;
}

// Edit menu
function undo() {
  if (canvasManager.undo()) {
    updateLayers();
    renderCanvas();
  }
  activeMenu.value = null;
}

function redo() {
  if (canvasManager.redo()) {
    updateLayers();
    renderCanvas();
  }
  activeMenu.value = null;
}

function clearCanvas() {
  const layer = canvasManager.getSelectedLayer();
  if (layer) {
    canvasManager.clearLayer(layer.id);
    canvasManager.saveHistory();
    renderCanvas();
  }
  activeMenu.value = null;
}

// View menu
function toggleGrid() {
  showGrid.value = !showGrid.value;
  if (showGrid.value && gridCanvas.value) {
    drawGrid();
  }
  activeMenu.value = null;
}

function toggleRulers() {
  showRulers.value = !showRulers.value;
  activeMenu.value = null;
}

function setZoom(level: number) {
  zoom.value = level;
  activeMenu.value = null;
}

function handleWheel(e: WheelEvent) {
  if (e.ctrlKey || e.metaKey) {
    // Zoom
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    zoom.value = Math.max(0.1, Math.min(8, zoom.value * delta));
  }
}

function drawGrid() {
  if (!gridCanvas.value) return;

  const ctx = gridCanvas.value.getContext('2d')!;
  ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value);
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.lineWidth = 1;

  const gridSize = 16;

  for (let x = 0; x <= canvasWidth.value; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvasHeight.value);
    ctx.stroke();
  }

  for (let y = 0; y <= canvasHeight.value; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvasWidth.value, y);
    ctx.stroke();
  }
}

// Image menu
function resizeCanvas(config: any) {
  canvasManager.resize(config.width, config.height, config.method, config.anchorX, config.anchorY);
  canvasWidth.value = config.width;
  canvasHeight.value = config.height;

  if (mainCanvas.value) {
    mainCanvas.value.width = config.width;
    mainCanvas.value.height = config.height;
  }

  if (gridCanvas.value) {
    gridCanvas.value.width = config.width;
    gridCanvas.value.height = config.height;
    if (showGrid.value) drawGrid();
  }

  updateLayers();
  renderCanvas();
  showResizeDialog.value = false;
  activeMenu.value = null;
}

function rotateImage(degrees: number) {
  canvasManager.rotate(degrees);
  const size = canvasManager.getCanvasSize();
  canvasWidth.value = size.width;
  canvasHeight.value = size.height;

  if (mainCanvas.value) {
    mainCanvas.value.width = size.width;
    mainCanvas.value.height = size.height;
  }

  if (gridCanvas.value) {
    gridCanvas.value.width = size.width;
    gridCanvas.value.height = size.height;
    if (showGrid.value) drawGrid();
  }

  updateLayers();
  renderCanvas();
  activeMenu.value = null;
}

function flipImage(direction: 'horizontal' | 'vertical') {
  canvasManager.flip(direction);
  updateLayers();
  renderCanvas();
  activeMenu.value = null;
}

function applyEffect(config: any) {
  const layer = canvasManager.getSelectedLayer();
  if (!layer) return;

  const imageData = layer.ctx.getImageData(0, 0, canvasWidth.value, canvasHeight.value);
  let result = imageData;

  switch (config.effect) {
    case 'brightness':
      result = adjustBrightness(imageData, config.parameters.value);
      break;
    case 'contrast':
      result = adjustContrast(imageData, config.parameters.value);
      break;
    case 'invert':
      result = invertColors(imageData);
      break;
    case 'grayscale':
      result = grayscale(imageData);
      break;
    case 'sepia':
      result = sepia(imageData);
      break;
    case 'pixelate':
      result = pixelate(imageData, config.parameters.blockSize);
      break;
    case 'blur':
      result = blur(imageData, config.parameters.radius);
      break;
    case 'flip-h':
      canvasManager.flip('horizontal');
      break;
    case 'flip-v':
      canvasManager.flip('vertical');
      break;
  }

  if (result !== imageData) {
    layer.ctx.putImageData(result, 0, 0);
  }

  canvasManager.saveHistory();
  updateLayers();
  renderCanvas();
  showEffectsDialog.value = false;
}

// Layer functions
function selectLayer(id: string) {
  canvasManager.selectLayer(id);
  updateLayers();
}

function toggleLayerVisibility(id: string) {
  const layer = layers.value.find(l => l.id === id);
  if (layer) {
    canvasManager.setLayerVisibility(id, !layer.visible);
    updateLayers();
    renderCanvas();
  }
}

function addLayer() {
  canvasManager.addLayer(`Layer ${layers.value.length + 1}`);
  updateLayers();
}

function removeLayer() {
  const layer = canvasManager.getSelectedLayer();
  if (layer && canvasManager.removeLayer(layer.id)) {
    updateLayers();
    renderCanvas();
  }
}

function mergeDown() {
  const layer = canvasManager.getSelectedLayer();
  if (layer && canvasManager.mergeLayerDown(layer.id)) {
    updateLayers();
    renderCanvas();
  }
}

// Keyboard shortcuts
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', handleKeydown);
  document.addEventListener('click', closeMenus);
}

function handleKeydown(e: KeyboardEvent) {
  // Prevent shortcuts when typing in inputs
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
    return;
  }

  // Tool shortcuts
  const toolMap: Record<string, DrawingTool> = {
    'p': DrawingTool.PENCIL,
    'b': DrawingTool.BRUSH,
    'e': DrawingTool.ERASER,
    'l': DrawingTool.LINE,
    'r': DrawingTool.RECTANGLE,
    'c': DrawingTool.CIRCLE,
    'f': DrawingTool.FILL,
    'i': DrawingTool.EYEDROPPER
  };

  if (toolMap[e.key.toLowerCase()] && !e.ctrlKey && !e.metaKey) {
    selectTool(toolMap[e.key.toLowerCase()]);
    e.preventDefault();
    return;
  }

  // Swap colors (X)
  if (e.key === 'x' && !e.ctrlKey && !e.metaKey) {
    const temp = primaryColor.value;
    primaryColor.value = secondaryColor.value;
    secondaryColor.value = temp;
    e.preventDefault();
    return;
  }

  // Brush size ([])
  if (e.key === '[') {
    brushSize.value = Math.max(1, brushSize.value - 1);
    updateBrushSize();
    e.preventDefault();
    return;
  }

  if (e.key === ']') {
    brushSize.value = Math.min(64, brushSize.value + 1);
    updateBrushSize();
    e.preventDefault();
    return;
  }

  // Undo/Redo
  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
    undo();
    e.preventDefault();
    return;
  }

  if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
    redo();
    e.preventDefault();
    return;
  }

  // New canvas
  if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
    newCanvas();
    e.preventDefault();
    return;
  }

  // Save
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    saveCanvas();
    e.preventDefault();
    return;
  }
}
</script>

<style scoped>
.amiga-paint {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #a0a0a0;
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
}

/* Menu Bar */
.paint-menubar {
  display: flex;
  gap: 2px;
  background: #a0a0a0;
  border-bottom: 2px solid #000000;
  padding: 4px;
}

.menu-item {
  position: relative;
  padding: 4px 12px;
  cursor: pointer;
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
}

.menu-item:hover {
  background: #0055aa;
  color: #ffffff;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  min-width: 180px;
  z-index: 1000;
  margin-top: 2px;
}

.menu-option {
  padding: 6px 12px;
  cursor: pointer;
  white-space: nowrap;
}

.menu-option:hover:not(.disabled) {
  background: #0055aa;
  color: #ffffff;
}

.menu-option.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.menu-divider {
  height: 2px;
  background: #888888;
  margin: 4px 0;
}

/* Main Content */
.paint-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* Left Toolbar */
.left-toolbar {
  width: 200px;
  background: #a0a0a0;
  border-right: 2px solid #000000;
  padding: 8px;
  overflow-y: auto;
}

.toolbar-title {
  font-size: 10px;
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 2px solid #888888;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px;
  margin-bottom: 16px;
}

.tool-button {
  aspect-ratio: 1;
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  cursor: pointer;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tool-button:hover {
  background: #b0b0b0;
}

.tool-button.active {
  background: #0055aa;
  border-color: #000000 #ffffff #ffffff #000000;
}

.brush-settings {
  margin-bottom: 16px;
}

.setting-label {
  font-size: 8px;
  margin-bottom: 4px;
}

.setting-slider {
  width: 100%;
  margin-bottom: 4px;
}

.setting-value {
  font-size: 8px;
  text-align: center;
  color: #333333;
}

/* Canvas Area */
.canvas-area {
  flex: 1;
  overflow: auto;
  background: #888888;
  position: relative;
}

.canvas-container {
  position: relative;
  display: inline-block;
}

.main-canvas {
  display: block;
  cursor: crosshair;
  image-rendering: pixelated;
}

.grid-canvas {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}

.cursor-info {
  position: absolute;
  background: rgba(0, 0, 0, 0.8);
  color: #ffffff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  pointer-events: none;
  z-index: 100;
}

/* Right Panel */
.right-panel {
  width: 280px;
  background: #a0a0a0;
  border-left: 2px solid #000000;
  overflow-y: auto;
}

.panel-section {
  padding: 8px;
  border-bottom: 2px solid #888888;
}

.section-title {
  font-size: 10px;
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 2px solid #888888;
}

/* Layers */
.layers-list {
  max-height: 200px;
  overflow-y: auto;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
  margin-bottom: 8px;
}

.layer-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px;
  background: #a0a0a0;
  border-bottom: 1px solid #888888;
  cursor: pointer;
}

.layer-item:hover {
  background: #b0b0b0;
}

.layer-item.selected {
  background: #0055aa;
  color: #ffffff;
}

.layer-visibility {
  width: 16px;
  height: 16px;
}

.layer-name {
  flex: 1;
  font-size: 8px;
}

.layer-opacity {
  font-size: 7px;
  opacity: 0.7;
}

.layer-controls {
  display: flex;
  gap: 4px;
}

.layer-button {
  flex: 1;
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 6px;
  font-family: 'Press Start 2P', monospace;
  font-size: 12px;
  cursor: pointer;
}

.layer-button:hover:not(:disabled) {
  background: #b0b0b0;
}

.layer-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Status Bar */
.status-bar {
  display: flex;
  gap: 16px;
  background: #888888;
  border-top: 2px solid #000000;
  padding: 4px 8px;
  font-size: 8px;
}

.status-item {
  padding: 2px 8px;
  background: #a0a0a0;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
}

/* Scrollbars */
::-webkit-scrollbar {
  width: 16px;
  height: 16px;
  background: #888888;
}

::-webkit-scrollbar-thumb {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
}

::-webkit-scrollbar-thumb:hover {
  background: #b0b0b0;
}

input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  background: #888888;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  height: 16px;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 20px;
  background: #0055aa;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  cursor: pointer;
}

input[type="range"]::-moz-range-thumb {
  width: 12px;
  height: 20px;
  background: #0055aa;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  cursor: pointer;
}
</style>

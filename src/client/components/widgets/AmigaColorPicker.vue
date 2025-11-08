<template>
  <div class="amiga-color-picker">
    <!-- Current Colors Display -->
    <div class="current-colors">
      <div class="color-box-container">
        <div
          class="color-box primary-color"
          :style="{ backgroundColor: modelValue }"
          @click="pickingPrimary = true"
          title="Primary Color (Left Click)"
        >
          <div class="color-label">1</div>
        </div>
        <div
          class="color-box secondary-color"
          :style="{ backgroundColor: secondaryColor }"
          @click="pickingPrimary = false"
          title="Secondary Color (Right Click)"
        >
          <div class="color-label">2</div>
        </div>
      </div>
      <button class="swap-button" @click="swapColors" title="Swap Colors (X)">
        ⇄
      </button>
    </div>

    <!-- Color Picker Type Tabs -->
    <div class="picker-tabs">
      <button
        :class="['tab-button', { active: pickerMode === 'hsv' }]"
        @click="pickerMode = 'hsv'"
      >
        HSV
      </button>
      <button
        :class="['tab-button', { active: pickerMode === 'rgb' }]"
        @click="pickerMode = 'rgb'"
      >
        RGB
      </button>
      <button
        :class="['tab-button', { active: pickerMode === 'palette' }]"
        @click="pickerMode = 'palette'"
      >
        Palette
      </button>
    </div>

    <!-- HSV Color Wheel -->
    <div v-if="pickerMode === 'hsv'" class="hsv-picker">
      <canvas
        ref="hsvCanvas"
        class="hsv-canvas"
        width="200"
        height="200"
        @mousedown="startHsvPick"
        @mousemove="updateHsvPick"
        @mouseup="endHsvPick"
      ></canvas>

      <div class="value-slider">
        <label>Value</label>
        <input
          type="range"
          min="0"
          max="100"
          v-model.number="hsv.v"
          @input="updateFromHsv"
        />
        <span>{{ hsv.v }}%</span>
      </div>
    </div>

    <!-- RGB Sliders -->
    <div v-if="pickerMode === 'rgb'" class="rgb-picker">
      <div class="rgb-slider">
        <label>R</label>
        <input
          type="range"
          min="0"
          max="255"
          v-model.number="rgb.r"
          @input="updateFromRgb"
        />
        <input
          type="number"
          min="0"
          max="255"
          v-model.number="rgb.r"
          @input="updateFromRgb"
          class="rgb-input"
        />
      </div>

      <div class="rgb-slider">
        <label>G</label>
        <input
          type="range"
          min="0"
          max="255"
          v-model.number="rgb.g"
          @input="updateFromRgb"
        />
        <input
          type="number"
          min="0"
          max="255"
          v-model.number="rgb.g"
          @input="updateFromRgb"
          class="rgb-input"
        />
      </div>

      <div class="rgb-slider">
        <label>B</label>
        <input
          type="range"
          min="0"
          max="255"
          v-model.number="rgb.b"
          @input="updateFromRgb"
        />
        <input
          type="number"
          min="0"
          max="255"
          v-model.number="rgb.b"
          @input="updateFromRgb"
          class="rgb-input"
        />
      </div>

      <div class="hex-input-container">
        <label>Hex</label>
        <input
          type="text"
          v-model="hexInput"
          @input="updateFromHex"
          maxlength="7"
          class="hex-input"
          placeholder="#000000"
        />
      </div>
    </div>

    <!-- Palette Picker -->
    <div v-if="pickerMode === 'palette'" class="palette-picker">
      <div class="palette-selector">
        <label>Palette:</label>
        <select v-model="selectedPaletteName" @change="loadPalette">
          <option v-for="name in paletteNames" :key="name" :value="name">
            {{ name }}
          </option>
        </select>
      </div>

      <div class="palette-grid">
        <div
          v-for="(color, index) in currentPaletteColors"
          :key="index"
          class="palette-color"
          :style="{ backgroundColor: color }"
          @click="selectPaletteColor(color)"
          :title="color"
        ></div>
      </div>
    </div>

    <!-- Recent Colors -->
    <div class="recent-colors">
      <div class="recent-label">Recent:</div>
      <div class="recent-colors-grid">
        <div
          v-for="(color, index) in recentColors"
          :key="index"
          class="recent-color"
          :style="{ backgroundColor: color }"
          @click="selectRecentColor(color)"
          :title="color"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { PaletteManager } from '../../utils/color-palettes';
import { hsvToRgb, rgbToHsv, rgbToHex, hexToRgb } from '../../utils/paint-tools';

const props = defineProps<{
  modelValue: string;
  secondaryColor: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
  'update:secondaryColor': [value: string];
}>();

// State
const pickerMode = ref<'hsv' | 'rgb' | 'palette'>('palette');
const pickingPrimary = ref(true);
const hsvCanvas = ref<HTMLCanvasElement>();
const isPickingHsv = ref(false);

// Color values
const rgb = ref({ r: 0, g: 0, b: 0 });
const hsv = ref({ h: 0, s: 100, v: 100 });
const hexInput = ref('#000000');

// Palette management
const paletteManager = new PaletteManager();
const selectedPaletteName = ref('Amiga OCS');
const currentPaletteColors = ref<string[]>([]);

// Recent colors
const recentColors = ref<string[]>([
  '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff',
  '#800000', '#008000', '#000080', '#808000', '#800080', '#008080', '#808080', '#c0c0c0'
]);

// Computed
const paletteNames = computed(() => paletteManager.getAllPaletteNames());

// Initialize
onMounted(() => {
  loadPalette();
  updateFromHex();
  drawHsvWheel();
});

watch(() => props.modelValue, () => {
  hexInput.value = props.modelValue;
  updateFromHex();
  drawHsvWheel();
});

// HSV Wheel Drawing
function drawHsvWheel() {
  if (!hsvCanvas.value) return;

  const canvas = hsvCanvas.value;
  const ctx = canvas.getContext('2d')!;
  const width = canvas.width;
  const height = canvas.height;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - 5;

  ctx.clearRect(0, 0, width, height);

  // Draw color wheel
  for (let angle = 0; angle < 360; angle++) {
    for (let r = 0; r < radius; r++) {
      const x = centerX + r * Math.cos((angle * Math.PI) / 180);
      const y = centerY + r * Math.sin((angle * Math.PI) / 180);

      const h = angle;
      const s = (r / radius) * 100;
      const v = hsv.value.v;

      const rgbColor = hsvToRgb(h, s, v);
      ctx.fillStyle = rgbToHex(rgbColor.r, rgbColor.g, rgbColor.b);
      ctx.fillRect(x, y, 2, 2);
    }
  }

  // Draw current selection indicator
  const currentAngle = (hsv.value.h * Math.PI) / 180;
  const currentRadius = (hsv.value.s / 100) * radius;
  const indicatorX = centerX + currentRadius * Math.cos(currentAngle);
  const indicatorY = centerY + currentRadius * Math.sin(currentAngle);

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(indicatorX, indicatorY, 5, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(indicatorX, indicatorY, 6, 0, Math.PI * 2);
  ctx.stroke();
}

function startHsvPick(e: MouseEvent) {
  isPickingHsv.value = true;
  updateHsvPick(e);
}

function updateHsvPick(e: MouseEvent) {
  if (!isPickingHsv.value || !hsvCanvas.value) return;

  const canvas = hsvCanvas.value;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = Math.min(canvas.width, canvas.height) / 2 - 5;

  const dx = x - centerX;
  const dy = y - centerY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance > radius) return;

  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  const normalizedAngle = angle < 0 ? angle + 360 : angle;

  hsv.value.h = normalizedAngle;
  hsv.value.s = (distance / radius) * 100;

  updateFromHsv();
  drawHsvWheel();
}

function endHsvPick() {
  isPickingHsv.value = false;
}

// Color updates
function updateFromHsv() {
  const rgbColor = hsvToRgb(hsv.value.h, hsv.value.s, hsv.value.v);
  rgb.value = rgbColor;
  const hex = rgbToHex(rgbColor.r, rgbColor.g, rgbColor.b);
  hexInput.value = hex;
  updateColor(hex);
  drawHsvWheel();
}

function updateFromRgb() {
  const hex = rgbToHex(rgb.value.r, rgb.value.g, rgb.value.b);
  hexInput.value = hex;
  const hsvColor = rgbToHsv(rgb.value.r, rgb.value.g, rgb.value.b);
  hsv.value = hsvColor;
  updateColor(hex);
}

function updateFromHex() {
  const color = hexToRgb(hexInput.value);
  if (color) {
    rgb.value = color;
    const hsvColor = rgbToHsv(color.r, color.g, color.b);
    hsv.value = hsvColor;
    updateColor(hexInput.value);
  }
}

function updateColor(color: string) {
  if (pickingPrimary.value) {
    emit('update:modelValue', color);
  } else {
    emit('update:secondaryColor', color);
  }
  addToRecent(color);
}

function swapColors() {
  emit('update:modelValue', props.secondaryColor);
  emit('update:secondaryColor', props.modelValue);
  hexInput.value = props.modelValue;
  updateFromHex();
}

// Palette functions
function loadPalette() {
  const palette = paletteManager.getPalette(selectedPaletteName.value);
  if (palette) {
    currentPaletteColors.value = palette.colors;
  }
}

function selectPaletteColor(color: string) {
  hexInput.value = color;
  updateFromHex();
}

function selectRecentColor(color: string) {
  hexInput.value = color;
  updateFromHex();
}

function addToRecent(color: string) {
  // Remove if already exists
  const index = recentColors.value.indexOf(color);
  if (index !== -1) {
    recentColors.value.splice(index, 1);
  }

  // Add to beginning
  recentColors.value.unshift(color);

  // Keep only last 16
  if (recentColors.value.length > 16) {
    recentColors.value.pop();
  }
}
</script>

<style scoped>
.amiga-color-picker {
  background: #a0a0a0;
  padding: 8px;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
}

.current-colors {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.color-box-container {
  display: flex;
  gap: 4px;
}

.color-box {
  width: 40px;
  height: 40px;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  cursor: pointer;
  position: relative;
}

.color-box:active {
  border-color: #ffffff #000000 #000000 #ffffff;
}

.color-label {
  position: absolute;
  bottom: 2px;
  right: 2px;
  background: rgba(0, 0, 0, 0.7);
  color: #ffffff;
  padding: 2px 4px;
  font-size: 8px;
}

.swap-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 8px 12px;
  font-size: 16px;
  cursor: pointer;
  font-family: monospace;
}

.swap-button:active {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}

.picker-tabs {
  display: flex;
  gap: 2px;
  margin-bottom: 8px;
}

.tab-button {
  flex: 1;
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 4px 8px;
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
  cursor: pointer;
}

.tab-button.active {
  background: #0055aa;
  color: #ffffff;
  border-color: #000000 #ffffff #ffffff #000000;
}

.tab-button:hover:not(.active) {
  background: #b0b0b0;
}

.hsv-picker {
  margin-bottom: 8px;
}

.hsv-canvas {
  width: 200px;
  height: 200px;
  cursor: crosshair;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  margin-bottom: 8px;
}

.value-slider {
  display: flex;
  align-items: center;
  gap: 8px;
}

.value-slider label {
  width: 40px;
}

.value-slider input[type="range"] {
  flex: 1;
}

.value-slider span {
  width: 40px;
  text-align: right;
}

.rgb-picker {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 8px;
}

.rgb-slider {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rgb-slider label {
  width: 16px;
}

.rgb-slider input[type="range"] {
  flex: 1;
}

.rgb-input {
  width: 50px;
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 2px 4px;
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
}

.hex-input-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hex-input-container label {
  width: 40px;
}

.hex-input {
  flex: 1;
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 4px 8px;
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
}

.palette-picker {
  margin-bottom: 8px;
}

.palette-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.palette-selector label {
  font-size: 8px;
}

.palette-selector select {
  flex: 1;
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 4px;
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
}

.palette-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 2px;
  margin-bottom: 8px;
}

.palette-color {
  width: 100%;
  aspect-ratio: 1;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  cursor: pointer;
}

.palette-color:hover {
  border-color: #ffffff #000000 #000000 #ffffff;
  transform: scale(1.1);
}

.recent-colors {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 2px solid #888888;
}

.recent-label {
  font-size: 8px;
  margin-bottom: 4px;
}

.recent-colors-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 2px;
}

.recent-color {
  width: 100%;
  aspect-ratio: 1;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  cursor: pointer;
}

.recent-color:hover {
  border-color: #ffffff #000000 #000000 #ffffff;
  transform: scale(1.1);
}

input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
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
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  cursor: pointer;
}

input[type="range"]::-moz-range-thumb {
  width: 12px;
  height: 20px;
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  cursor: pointer;
}
</style>

<template>
  <div class="dialog-overlay" @click.self="cancel">
    <div class="amiga-dialog new-canvas-dialog">
      <!-- Title Bar -->
      <div class="dialog-titlebar">
        <div class="dialog-title">New Canvas</div>
        <div class="dialog-close" @click="cancel">×</div>
      </div>

      <!-- Content -->
      <div class="dialog-content">
        <!-- Preset Sizes -->
        <div class="form-section">
          <label>Preset Size:</label>
          <select v-model="selectedPreset" @change="applyPreset" class="amiga-select">
            <option value="">Custom</option>
            <option value="amiga-lores">Amiga Lo-Res (320×200)</option>
            <option value="amiga-hires">Amiga Hi-Res (640×400)</option>
            <option value="amiga-super">Amiga Super Hi-Res (1280×400)</option>
            <option value="vga">VGA (640×480)</option>
            <option value="svga">SVGA (800×600)</option>
            <option value="xga">XGA (1024×768)</option>
            <option value="hd">HD (1920×1080)</option>
            <option value="square-small">Square Small (256×256)</option>
            <option value="square-medium">Square Medium (512×512)</option>
            <option value="square-large">Square Large (1024×1024)</option>
          </select>
        </div>

        <!-- Width -->
        <div class="form-section">
          <label>Width (px):</label>
          <div class="input-group">
            <input
              type="number"
              v-model.number="width"
              min="1"
              max="4096"
              class="amiga-input"
              @input="selectedPreset = ''"
            />
            <input
              type="range"
              v-model.number="width"
              min="1"
              max="2048"
              class="amiga-range"
              @input="selectedPreset = ''"
            />
          </div>
        </div>

        <!-- Height -->
        <div class="form-section">
          <label>Height (px):</label>
          <div class="input-group">
            <input
              type="number"
              v-model.number="height"
              min="1"
              max="4096"
              class="amiga-input"
              @input="selectedPreset = ''"
            />
            <input
              type="range"
              v-model.number="height"
              min="1"
              max="2048"
              class="amiga-range"
              @input="selectedPreset = ''"
            />
          </div>
        </div>

        <!-- Lock Aspect Ratio -->
        <div class="form-section checkbox-section">
          <label>
            <input type="checkbox" v-model="lockAspectRatio" class="amiga-checkbox" />
            Lock Aspect Ratio
          </label>
        </div>

        <!-- Background Color -->
        <div class="form-section">
          <label>Background Color:</label>
          <div class="color-options">
            <div
              v-for="color in colorPresets"
              :key="color.value"
              class="color-preset"
              :class="{ selected: backgroundColor === color.value }"
              :style="{ backgroundColor: color.value }"
              @click="backgroundColor = color.value"
              :title="color.name"
            ></div>
            <input
              type="color"
              v-model="backgroundColor"
              class="color-input"
              title="Custom Color"
            />
          </div>
        </div>

        <!-- Canvas Info -->
        <div class="canvas-info">
          <div class="info-row">
            <span>Canvas Size:</span>
            <span>{{ width }} × {{ height }} px</span>
          </div>
          <div class="info-row">
            <span>Aspect Ratio:</span>
            <span>{{ aspectRatio }}</span>
          </div>
          <div class="info-row">
            <span>Memory Est:</span>
            <span>{{ memoryEstimate }}</span>
          </div>
        </div>
      </div>

      <!-- Buttons -->
      <div class="dialog-buttons">
        <button class="amiga-button" @click="create">Create</button>
        <button class="amiga-button" @click="cancel">Cancel</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

const emit = defineEmits<{
  create: [config: { width: number; height: number; backgroundColor: string }];
  cancel: [];
}>();

// State
const width = ref(800);
const height = ref(600);
const backgroundColor = ref('#a0a0a0');
const selectedPreset = ref('svga');
const lockAspectRatio = ref(false);
let aspectRatioValue = 800 / 600;

// Color presets
const colorPresets = [
  { name: 'Amiga Gray', value: '#a0a0a0' },
  { name: 'White', value: '#ffffff' },
  { name: 'Black', value: '#000000' },
  { name: 'Amiga Blue', value: '#0055aa' },
  { name: 'Red', value: '#ff0000' },
  { name: 'Green', value: '#00ff00' },
  { name: 'Blue', value: '#0000ff' },
  { name: 'Yellow', value: '#ffff00' },
  { name: 'Magenta', value: '#ff00ff' },
  { name: 'Cyan', value: '#00ffff' }
];

// Preset configurations
const presets: Record<string, { width: number; height: number }> = {
  'amiga-lores': { width: 320, height: 200 },
  'amiga-hires': { width: 640, height: 400 },
  'amiga-super': { width: 1280, height: 400 },
  'vga': { width: 640, height: 480 },
  'svga': { width: 800, height: 600 },
  'xga': { width: 1024, height: 768 },
  'hd': { width: 1920, height: 1080 },
  'square-small': { width: 256, height: 256 },
  'square-medium': { width: 512, height: 512 },
  'square-large': { width: 1024, height: 1024 }
};

// Computed
const aspectRatio = computed(() => {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(width.value, height.value);
  const w = width.value / divisor;
  const h = height.value / divisor;

  // Common ratios
  if (w === 16 && h === 9) return '16:9';
  if (w === 4 && h === 3) return '4:3';
  if (w === 16 && h === 10) return '16:10';
  if (w === 1 && h === 1) return '1:1';
  if (w === 21 && h === 9) return '21:9';

  return `${w}:${h}`;
});

const memoryEstimate = computed(() => {
  const bytes = width.value * height.value * 4; // RGBA
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
});

// Watch for aspect ratio lock
watch(width, (newWidth, oldWidth) => {
  if (lockAspectRatio.value && oldWidth !== 0) {
    height.value = Math.round(newWidth / aspectRatioValue);
  } else {
    aspectRatioValue = newWidth / height.value;
  }
});

watch(height, (newHeight, oldHeight) => {
  if (lockAspectRatio.value && oldHeight !== 0) {
    width.value = Math.round(newHeight * aspectRatioValue);
  } else {
    aspectRatioValue = width.value / newHeight;
  }
});

// Methods
function applyPreset() {
  if (!selectedPreset.value) return;

  const preset = presets[selectedPreset.value];
  if (preset) {
    width.value = preset.width;
    height.value = preset.height;
    aspectRatioValue = preset.width / preset.height;
  }
}

function create() {
  if (width.value < 1 || height.value < 1) {
    alert('Canvas size must be at least 1×1 pixels');
    return;
  }

  if (width.value > 4096 || height.value > 4096) {
    alert('Canvas size cannot exceed 4096×4096 pixels');
    return;
  }

  emit('create', {
    width: width.value,
    height: height.value,
    backgroundColor: backgroundColor.value
  });
}

function cancel() {
  emit('cancel');
}

// Initialize
applyPreset();
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.amiga-dialog {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  min-width: 400px;
  max-width: 600px;
  font-family: 'Press Start 2P', monospace;
}

.dialog-titlebar {
  background: #0055aa;
  color: #ffffff;
  padding: 4px 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #000000;
}

.dialog-title {
  font-size: 10px;
}

.dialog-close {
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  padding: 0 4px;
}

.dialog-close:hover {
  background: #0077dd;
}

.dialog-content {
  padding: 16px;
}

.form-section {
  margin-bottom: 16px;
}

.form-section label {
  display: block;
  font-size: 8px;
  margin-bottom: 4px;
}

.input-group {
  display: flex;
  gap: 8px;
  align-items: center;
}

.amiga-input {
  width: 100px;
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 4px 8px;
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
}

.amiga-range {
  flex: 1;
  -webkit-appearance: none;
  appearance: none;
  background: #888888;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  height: 16px;
}

.amiga-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 20px;
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  cursor: pointer;
}

.amiga-range::-moz-range-thumb {
  width: 12px;
  height: 20px;
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  cursor: pointer;
}

.amiga-select {
  width: 100%;
  background: #ffffff;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 4px 8px;
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
}

.checkbox-section label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.amiga-checkbox {
  width: 16px;
  height: 16px;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
}

.color-options {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  align-items: center;
}

.color-preset {
  width: 32px;
  height: 32px;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  cursor: pointer;
}

.color-preset:hover {
  border-color: #ffffff #000000 #000000 #ffffff;
  transform: scale(1.1);
}

.color-preset.selected {
  border: 4px solid #ff0000;
}

.color-input {
  width: 32px;
  height: 32px;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  cursor: pointer;
  padding: 0;
}

.canvas-info {
  background: #888888;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 8px;
  font-size: 8px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.dialog-buttons {
  display: flex;
  gap: 8px;
  padding: 8px 16px 16px;
  justify-content: flex-end;
}

.amiga-button {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 6px 16px;
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
  cursor: pointer;
  min-width: 80px;
}

.amiga-button:hover {
  background: #b0b0b0;
}

.amiga-button:active {
  border-color: #000000 #ffffff #ffffff #000000;
  background: #888888;
}
</style>

<template>
  <div class="dialog-overlay" @click.self="cancel">
    <div class="amiga-dialog resize-canvas-dialog">
      <!-- Title Bar -->
      <div class="dialog-titlebar">
        <div class="dialog-title">Resize Canvas</div>
        <div class="dialog-close" @click="cancel">×</div>
      </div>

      <!-- Content -->
      <div class="dialog-content">
        <!-- Current Size Info -->
        <div class="current-size-info">
          <strong>Current Size:</strong> {{ currentWidth }} × {{ currentHeight }} px
        </div>

        <!-- New Width -->
        <div class="form-section">
          <label>New Width (px):</label>
          <div class="input-group">
            <input
              type="number"
              v-model.number="newWidth"
              min="1"
              max="4096"
              class="amiga-input"
              @input="onWidthChange"
            />
            <input
              type="range"
              v-model.number="newWidth"
              min="1"
              max="2048"
              class="amiga-range"
              @input="onWidthChange"
            />
          </div>
        </div>

        <!-- New Height -->
        <div class="form-section">
          <label>New Height (px):</label>
          <div class="input-group">
            <input
              type="number"
              v-model.number="newHeight"
              min="1"
              max="4096"
              class="amiga-input"
              @input="onHeightChange"
            />
            <input
              type="range"
              v-model.number="newHeight"
              min="1"
              max="2048"
              class="amiga-range"
              @input="onHeightChange"
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

        <!-- Resize Method -->
        <div class="form-section">
          <label>Resize Method:</label>
          <div class="method-options">
            <label class="method-option">
              <input
                type="radio"
                v-model="resizeMethod"
                value="stretch"
                class="amiga-radio"
              />
              <div class="method-details">
                <strong>Stretch</strong>
                <div class="method-description">
                  Scale image to fit new size
                </div>
              </div>
            </label>

            <label class="method-option">
              <input
                type="radio"
                v-model="resizeMethod"
                value="crop"
                class="amiga-radio"
              />
              <div class="method-details">
                <strong>Crop</strong>
                <div class="method-description">
                  Trim or cut image to new size
                </div>
              </div>
            </label>

            <label class="method-option">
              <input
                type="radio"
                v-model="resizeMethod"
                value="expand"
                class="amiga-radio"
              />
              <div class="method-details">
                <strong>Expand</strong>
                <div class="method-description">
                  Add borders around image
                </div>
              </div>
            </label>
          </div>
        </div>

        <!-- Anchor Position (for crop/expand) -->
        <div v-if="resizeMethod !== 'stretch'" class="form-section">
          <label>Anchor Position:</label>
          <div class="anchor-grid">
            <div
              v-for="(pos, index) in anchorPositions"
              :key="index"
              class="anchor-point"
              :class="{ selected: anchorX === pos.x && anchorY === pos.y }"
              @click="setAnchor(pos.x, pos.y)"
              :title="pos.label"
            >
              <div class="anchor-dot"></div>
            </div>
          </div>
          <div class="anchor-description">
            {{ anchorDescription }}
          </div>
        </div>

        <!-- Preview Info -->
        <div class="resize-info">
          <div class="info-row">
            <span>Original:</span>
            <span>{{ currentWidth }} × {{ currentHeight }} px</span>
          </div>
          <div class="info-row">
            <span>New Size:</span>
            <span>{{ newWidth }} × {{ newHeight }} px</span>
          </div>
          <div class="info-row">
            <span>Scale Factor:</span>
            <span>{{ scaleFactor }}</span>
          </div>
          <div class="info-row">
            <span>Method:</span>
            <span>{{ resizeMethod }}</span>
          </div>
        </div>
      </div>

      <!-- Buttons -->
      <div class="dialog-buttons">
        <button class="amiga-button" @click="resize">Resize</button>
        <button class="amiga-button" @click="cancel">Cancel</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

interface ResizeConfig {
  width: number;
  height: number;
  method: 'stretch' | 'crop' | 'expand';
  anchorX: number;
  anchorY: number;
}

const props = defineProps<{
  currentWidth: number;
  currentHeight: number;
}>();

const emit = defineEmits<{
  resize: [config: ResizeConfig];
  cancel: [];
}>();

// State
const newWidth = ref(props.currentWidth);
const newHeight = ref(props.currentHeight);
const lockAspectRatio = ref(true);
const resizeMethod = ref<'stretch' | 'crop' | 'expand'>('expand');
const anchorX = ref(0.5);
const anchorY = ref(0.5);

let aspectRatioValue = props.currentWidth / props.currentHeight;

// Anchor positions
const anchorPositions = [
  { x: 0, y: 0, label: 'Top Left' },
  { x: 0.5, y: 0, label: 'Top Center' },
  { x: 1, y: 0, label: 'Top Right' },
  { x: 0, y: 0.5, label: 'Middle Left' },
  { x: 0.5, y: 0.5, label: 'Center' },
  { x: 1, y: 0.5, label: 'Middle Right' },
  { x: 0, y: 1, label: 'Bottom Left' },
  { x: 0.5, y: 1, label: 'Bottom Center' },
  { x: 1, y: 1, label: 'Bottom Right' }
];

// Computed
const scaleFactor = computed(() => {
  const widthScale = newWidth.value / props.currentWidth;
  const heightScale = newHeight.value / props.currentHeight;

  if (Math.abs(widthScale - heightScale) < 0.01) {
    return `${widthScale.toFixed(2)}x`;
  }

  return `${widthScale.toFixed(2)}x × ${heightScale.toFixed(2)}x`;
});

const anchorDescription = computed(() => {
  const pos = anchorPositions.find(p => p.x === anchorX.value && p.y === anchorY.value);
  return pos ? pos.label : 'Custom';
});

// Watch for aspect ratio lock
let updatingFromAspectRatio = false;

watch(lockAspectRatio, (locked) => {
  if (locked) {
    aspectRatioValue = newWidth.value / newHeight.value;
  }
});

function onWidthChange() {
  if (lockAspectRatio.value && !updatingFromAspectRatio) {
    updatingFromAspectRatio = true;
    newHeight.value = Math.round(newWidth.value / aspectRatioValue);
    updatingFromAspectRatio = false;
  } else if (!lockAspectRatio.value) {
    aspectRatioValue = newWidth.value / newHeight.value;
  }
}

function onHeightChange() {
  if (lockAspectRatio.value && !updatingFromAspectRatio) {
    updatingFromAspectRatio = true;
    newWidth.value = Math.round(newHeight.value * aspectRatioValue);
    updatingFromAspectRatio = false;
  } else if (!lockAspectRatio.value) {
    aspectRatioValue = newWidth.value / newHeight.value;
  }
}

// Methods
function setAnchor(x: number, y: number) {
  anchorX.value = x;
  anchorY.value = y;
}

function resize() {
  if (newWidth.value < 1 || newHeight.value < 1) {
    alert('Canvas size must be at least 1×1 pixels');
    return;
  }

  if (newWidth.value > 4096 || newHeight.value > 4096) {
    alert('Canvas size cannot exceed 4096×4096 pixels');
    return;
  }

  emit('resize', {
    width: newWidth.value,
    height: newHeight.value,
    method: resizeMethod.value,
    anchorX: anchorX.value,
    anchorY: anchorY.value
  });
}

function cancel() {
  emit('cancel');
}
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
  min-width: 500px;
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

.current-size-info {
  background: #888888;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  padding: 8px;
  margin-bottom: 16px;
  font-size: 8px;
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

.method-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.method-option {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px;
  background: #888888;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  cursor: pointer;
}

.method-option:hover {
  background: #999999;
}

.amiga-radio {
  margin-top: 2px;
}

.method-details {
  flex: 1;
}

.method-details strong {
  display: block;
  font-size: 8px;
  margin-bottom: 4px;
}

.method-description {
  font-size: 7px;
  color: #333333;
}

.anchor-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  width: 150px;
  margin-bottom: 8px;
}

.anchor-point {
  aspect-ratio: 1;
  background: #888888;
  border: 2px solid;
  border-color: #000000 #ffffff #ffffff #000000;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.anchor-point:hover {
  background: #999999;
}

.anchor-point.selected {
  background: #0055aa;
  border-color: #ffffff #000000 #000000 #ffffff;
}

.anchor-dot {
  width: 8px;
  height: 8px;
  background: #000000;
  border: 1px solid #ffffff;
}

.anchor-point.selected .anchor-dot {
  background: #ffffff;
  border-color: #000000;
}

.anchor-description {
  font-size: 8px;
  color: #333333;
}

.resize-info {
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
